/**
 * 项目服务
 * 处理项目相关的存储操作
 */

import { BaseStorageService } from './BaseStorageService';
import { StorageAdapter } from '../adapters/StorageInterfaces';
import { AppError } from '@/types';

// 项目类型定义
export interface Project {
  id: string;
  name: string;
  type: string;
  description: string;
  targetWords: number;
  wordCount: number;
  status: string;
  createdAt: string;
  lastModified: string;
  settings: {
    autoSave: boolean;
    autoSaveInterval: number;
    fontSize: number;
    lineHeight: number;
    autoIndent: boolean;
  };
  chapters?: number;
}

export interface CreateProjectData {
  name: string;
  type: string;
  description?: string;
  targetWords: number;
}

export interface UpdateProjectData {
  id: string;
  name?: string;
  type?: string;
  description?: string;
  targetWords?: number;
  status?: string;
  wordCount?: number;
  chapters?: number;
}

export class ProjectService extends BaseStorageService {
  /**
   * 构造函数
   * @param adapter 存储适配器
   */
  constructor(adapter: StorageAdapter) {
    super(adapter);
  }

  /**
   * 获取所有项目
   * @returns 项目列表
   */
  async getProjects(): Promise<Project[]> {
    const cacheKey = this.getCacheKey('projects');
    let projects = this.getCache<Project[]>(cacheKey);
    
    if (!projects) {
      projects = await this.readJsonFile('projects.json', []);
      this.setCache(cacheKey, projects);
    }
    
    return projects;
  }

  /**
   * 获取单个项目
   * @param id 项目ID
   * @returns 项目对象或null
   */
  async getProject(id: string): Promise<Project | null> {
    const projects = await this.getProjects();
    return projects.find(p => p.id === id) || null;
  }

  /**
   * 保存项目
   * @param project 项目对象
   */
  async saveProject(project: Project): Promise<void> {
    const projects = await this.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    
    if (index >= 0) {
      projects[index] = { ...project, lastModified: new Date().toISOString() };
    } else {
      projects.push({ ...project, lastModified: new Date().toISOString() });
    }
    
    await this.writeJsonFile('projects.json', projects);
    this.clearCache('projects');
  }

  /**
   * 创建新项目
   * @param data 项目创建数据
   * @returns 创建的项目
   */
  async createProject(data: CreateProjectData): Promise<Project> {
    const project: Project = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      type: data.type,
      description: data.description || '',
      targetWords: data.targetWords,
      wordCount: 0,
      status: 'draft',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      settings: {
        autoSave: true,
        autoSaveInterval: 30000,
        fontSize: 16,
        lineHeight: 1.5,
        autoIndent: true
      }
    };
    
    await this.saveProject(project);
    return project;
  }

  /**
   * 更新项目
   * @param data 项目更新数据
   * @returns 更新后的项目
   */
  async updateProject(data: UpdateProjectData): Promise<Project> {
    const project = await this.getProject(data.id);
    if (!project) {
      throw new AppError('项目不存在');
    }
    
    const updatedProject = { ...project, ...data, lastModified: new Date().toISOString() };
    await this.saveProject(updatedProject);
    return updatedProject;
  }

  /**
   * 删除项目
   * @param id 项目ID
   */
  async deleteProject(id: string): Promise<void> {
    const projects = await this.getProjects();
    const filteredProjects = projects.filter(p => p.id !== id);
    
    await this.writeJsonFile('projects.json', filteredProjects);
    
    // 删除相关文件
    try {
      await this.adapter.delete(`project_${id}_chapters.json`);
      await this.adapter.delete(`project_${id}_volumes.json`);
      await this.adapter.delete(`project_${id}_characters.json`);
      await this.adapter.delete(`project_${id}_world.json`);
      await this.adapter.delete(`project_${id}_outlines.json`);
      await this.adapter.delete(`project_${id}_stats.json`);
      await this.adapter.delete(`project_${id}_current.json`);
    } catch (error) {
      console.warn('Failed to delete some project files:', error);
    }
    
    this.clearCache();
  }

  /**
   * 获取当前项目
   * @returns 当前项目或null
   */
  async getCurrentProject(): Promise<Project | null> {
    const data = await this.readJsonFile('current_project.json', null);
    return data;
  }

  /**
   * 设置当前项目
   * @param project 项目对象或null
   */
  async setCurrentProject(project: Project | null): Promise<void> {
    await this.writeJsonFile('current_project.json', project);
    this.clearCache('current_project');
  }

  /**
   * 更新项目字数统计
   * @param projectId 项目ID
   * @param wordCount 字数
   */
  async updateProjectWordCount(projectId: string, wordCount: number): Promise<void> {
    const project = await this.getProject(projectId);
    if (project) {
      project.wordCount = wordCount;
      await this.saveProject(project);
    }
  }
}