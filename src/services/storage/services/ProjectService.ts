/**
 * 项目服务
 * 处理项目相关的存储操作
 */

import { BaseStorageService } from './BaseStorageService';
import { StorageAdapter } from '../adapters/StorageInterfaces';
import { AppError } from '@/types';
import type { 
  Project, 
  CreateProjectData, 
  UpdateProjectData
} from '@/types/project';

// 重新导出类型以保持兼容性
export type { Project, CreateProjectData, UpdateProjectData };

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

    // 处理封面：若传入 DataURL，则写入持久化两份（主文件 + 时间戳备份）
    if (data.coverDataUrl) {
      try {
        const mainCoverFile = `project_${project.id}_cover.txt`;
        const backupCoverFile = `project_${project.id}_cover_${Date.now()}.bak.txt`;
        await this.adapter.write(mainCoverFile, data.coverDataUrl);
        await this.adapter.write(backupCoverFile, data.coverDataUrl);
        project.cover = data.coverDataUrl;
        project.coverFile = mainCoverFile;
      } catch (err) {
        console.warn('保存封面失败，但不阻塞项目创建:', err);
      }
    }
    
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

    const updated: Project = { ...project, ...data, lastModified: new Date().toISOString() };

    // 如有新的封面 DataURL，写入持久化并更新元数据
    if (data.coverDataUrl) {
      try {
        const mainCoverFile = `project_${project.id}_cover.txt`;
        const backupCoverFile = `project_${project.id}_cover_${Date.now()}.bak.txt`;
        await this.adapter.write(mainCoverFile, data.coverDataUrl);
        await this.adapter.write(backupCoverFile, data.coverDataUrl);
        updated.cover = data.coverDataUrl;
        updated.coverFile = mainCoverFile;
      } catch (err) {
        console.warn('更新封面失败，保持原封面:', err);
      }
    }

    await this.saveProject(updated);
    return updated;
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