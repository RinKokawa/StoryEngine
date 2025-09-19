/**
 * 导出服务
 * 专门负责数据导出功能
 */

import { BaseStorageService } from './BaseStorageService';
import { StorageAdapter } from '../adapters/StorageInterfaces';
import { AppError } from '@/types';

export interface ExportData {
  version: string;
  exportDate: string;
  projects: any[];
  settings: any;
  [key: string]: any;
}

export class ExportService extends BaseStorageService {
  constructor(adapter: StorageAdapter) {
    super(adapter);
  }

  /**
   * 导出所有数据
   * @returns 导出的数据对象
   */
  async exportData(): Promise<ExportData | null> {
    try {
      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        projects: [],
        settings: {}
      };

      // 导出项目数据
      const projects = await this.readJsonFile('projects.json', []);
      exportData.projects = projects;

      // 导出设置
      const settings = await this.readJsonFile('settings.json', {});
      exportData.settings = settings;

      // 导出每个项目的详细数据
      for (const project of projects as any[]) {
        await this.exportProjectData(project.id, exportData);
      }

      return exportData;
    } catch (error) {
      console.error('导出数据失败:', error);
      throw new AppError('导出数据失败', error);
    }
  }

  /**
   * 导出单个项目的数据
   * @param projectId 项目ID
   * @param exportData 导出数据对象
   */
  private async exportProjectData(projectId: string, exportData: ExportData): Promise<void> {
    // 章节数据
    const chapters = await this.readJsonFile(`project_${projectId}_chapters.json`, []);
    exportData[`project_${projectId}_chapters`] = chapters;
    
    // 卷数据
    const volumes = await this.readJsonFile(`project_${projectId}_volumes.json`, []);
    exportData[`project_${projectId}_volumes`] = volumes;
    
    // 角色数据
    const characters = await this.readJsonFile(`project_${projectId}_characters.json`, []);
    exportData[`project_${projectId}_characters`] = characters;
    
    // 大纲数据
    const outlines = await this.readJsonFile(`project_${projectId}_outlines.json`, []);
    exportData[`project_${projectId}_outlines`] = outlines;
    
    // 世界设定数据
    const worldItems = await this.readJsonFile(`project_${projectId}_world_items.json`, []);
    exportData[`project_${projectId}_world_items`] = worldItems;
    
    // 写作统计数据
    const stats = await this.readJsonFile(`writing_stats_${projectId}.json`, null);
    if (stats) {
      exportData[`writing_stats_${projectId}`] = stats;
    }
    
    // 章节内容
    for (const chapter of chapters as any[]) {
      const content = await this.readJsonFile(`chapter_${projectId}_${chapter.id}.json`, '');
      if (content) {
        exportData[`chapter_${projectId}_${chapter.id}`] = content;
      }
    }
  }

  /**
   * 导出特定项目的数据
   * @param projectId 项目ID
   * @returns 项目导出数据
   */
  async exportProjectOnly(projectId: string): Promise<ExportData | null> {
    try {
      const exportData: ExportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        projects: [],
        settings: {}
      };

      // 获取项目信息
      const projects = await this.readJsonFile('projects.json', []);
      const project = (projects as any[]).find(p => p.id === projectId);
      if (!project) {
        throw new AppError('项目不存在');
      }

      exportData.projects = [project];
      await this.exportProjectData(projectId, exportData);

      return exportData;
    } catch (error) {
      console.error('导出项目数据失败:', error);
      throw new AppError('导出项目数据失败', error);
    }
  }
}