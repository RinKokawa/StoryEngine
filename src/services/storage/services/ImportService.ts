/**
 * 导入服务
 * 专门负责数据导入功能
 */

import { BaseStorageService } from './BaseStorageService';
import { StorageAdapter } from '../adapters/StorageInterfaces';
import { AppError } from '@/types';
import type { ExportData } from './ExportService';

export class ImportService extends BaseStorageService {
  constructor(adapter: StorageAdapter) {
    super(adapter);
  }

  /**
   * 导入数据
   * @param data 要导入的数据
   * @param options 导入选项
   */
  async importData(data: string | ExportData, options: ImportOptions = {}): Promise<void> {
    try {
      const importData: ExportData = typeof data === 'string' ? JSON.parse(data) : data;
      
      // 验证数据格式
      this.validateImportData(importData);
      
      // 导入设置
      if (importData.settings && !options.skipSettings) {
        await this.writeJsonFile('settings.json', importData.settings);
      }
      
      // 导入项目数据
      if (importData.projects && importData.projects.length > 0) {
        await this.importProjects(importData, options);
      }
      
      // 清除所有缓存
      this.clearCache();
      
    } catch (error) {
      console.error('导入数据失败:', error);
      throw new AppError('导入数据失败', error);
    }
  }

  /**
   * 导入项目数据
   * @param importData 导入数据
   * @param options 导入选项
   */
  private async importProjects(importData: ExportData, options: ImportOptions): Promise<void> {
    let existingProjects: any[] = await this.readJsonFile('projects.json', []);
    
    for (const project of importData.projects as any[]) {
      const projectId = project.id;
      
      // 检查是否覆盖现有项目
      if (options.overwriteExisting || !this.projectExists(existingProjects, projectId)) {
        // 更新或添加项目
        existingProjects = this.updateProjectList(existingProjects, project);
        
        // 导入项目详细数据
        await this.importProjectDetails(projectId, importData);
      }
    }
    
    await this.writeJsonFile('projects.json', existingProjects);
  }

  /**
   * 导入项目详细数据
   * @param projectId 项目ID
   * @param importData 导入数据
   */
  private async importProjectDetails(projectId: string, importData: ExportData): Promise<void> {
    const dataTypes = [
      'chapters', 'volumes', 'characters', 'outlines', 'world_items'
    ];

    // 导入各类型数据
    for (const type of dataTypes) {
      const key = `project_${projectId}_${type}`;
      if (importData[key]) {
        await this.writeJsonFile(`${key}.json`, importData[key]);
      }
    }

    // 导入写作统计数据
    const statsKey = `writing_stats_${projectId}`;
    if (importData[statsKey]) {
      await this.writeJsonFile(`${statsKey}.json`, importData[statsKey]);
    }

    // 导入章节内容
    const chapters = importData[`project_${projectId}_chapters`] || [];
    for (const chapter of chapters as any[]) {
      const contentKey = `chapter_${projectId}_${chapter.id}`;
      if (importData[contentKey]) {
        await this.writeJsonFile(`${contentKey}.json`, importData[contentKey]);
      }
    }
  }

  /**
   * 验证导入数据格式
   * @param data 导入数据
   */
  private validateImportData(data: ExportData): void {
    if (!data.version) {
      throw new AppError('无效的导入数据：缺少版本信息');
    }
    
    if (!data.exportDate) {
      throw new AppError('无效的导入数据：缺少导出日期');
    }
    
    if (!Array.isArray(data.projects)) {
      throw new AppError('无效的导入数据：项目数据格式错误');
    }
  }

  /**
   * 检查项目是否存在
   * @param projects 现有项目列表
   * @param projectId 项目ID
   * @returns 是否存在
   */
  private projectExists(projects: any[], projectId: string): boolean {
    return projects.some(p => p.id === projectId);
  }

  /**
   * 更新项目列表
   * @param existingProjects 现有项目列表
   * @param newProject 新项目
   * @returns 更新后的项目列表
   */
  private updateProjectList(existingProjects: any[], newProject: any): any[] {
    const index = existingProjects.findIndex(p => p.id === newProject.id);
    if (index >= 0) {
      existingProjects[index] = { ...newProject, lastModified: new Date().toISOString() };
    } else {
      existingProjects.push({ ...newProject, lastModified: new Date().toISOString() });
    }
    return existingProjects;
  }
}

export interface ImportOptions {
  /** 是否覆盖现有项目 */
  overwriteExisting?: boolean;
  /** 是否跳过设置导入 */
  skipSettings?: boolean;
  /** 是否仅导入指定项目 */
  projectIds?: string[];
}