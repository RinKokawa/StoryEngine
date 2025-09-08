/**
 * 数据服务
 * 处理数据导出导入和清理功能
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

export class DataService extends BaseStorageService {
  /**
   * 构造函数
   * @param adapter 存储适配器
   */
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
        const projectId = project.id;
        
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

      return exportData;
    } catch (error) {
      console.error('导出数据失败:', error);
      throw new AppError('导出数据失败', error);
    }
  }

  /**
   * 导入数据
   * @param data 要导入的数据
   */
  async importData(data: string | ExportData): Promise<void> {
    try {
      const importData: ExportData = typeof data === 'string' ? JSON.parse(data) : data;
      
      // 导入设置
      if (importData.settings) {
        await this.writeJsonFile('settings.json', importData.settings);
      }
      
      // 导入项目数据
      if (importData.projects) {
        await this.writeJsonFile('projects.json', importData.projects);
        
        // 导入每个项目的详细数据
        for (const project of importData.projects as any[]) {
          const projectId = project.id;
          
          // 章节数据
          if (importData[`project_${projectId}_chapters`]) {
            await this.writeJsonFile(`project_${projectId}_chapters.json`, importData[`project_${projectId}_chapters`]);
          }
          
          // 卷数据
          if (importData[`project_${projectId}_volumes`]) {
            await this.writeJsonFile(`project_${projectId}_volumes.json`, importData[`project_${projectId}_volumes`]);
          }
          
          // 角色数据
          if (importData[`project_${projectId}_characters`]) {
            await this.writeJsonFile(`project_${projectId}_characters.json`, importData[`project_${projectId}_characters`]);
          }
          
          // 大纲数据
          if (importData[`project_${projectId}_outlines`]) {
            await this.writeJsonFile(`project_${projectId}_outlines.json`, importData[`project_${projectId}_outlines`]);
          }
          
          // 世界设定数据
          if (importData[`project_${projectId}_world_items`]) {
            await this.writeJsonFile(`project_${projectId}_world_items.json`, importData[`project_${projectId}_world_items`]);
          }
          
          // 写作统计数据
          if (importData[`writing_stats_${projectId}`]) {
            await this.writeJsonFile(`writing_stats_${projectId}.json`, importData[`writing_stats_${projectId}`]);
          }
          
          // 章节内容
          const chapters = importData[`project_${projectId}_chapters`] || [];
          for (const chapter of chapters as any[]) {
            const contentKey = `chapter_${projectId}_${chapter.id}`;
            if (importData[contentKey]) {
              await this.writeJsonFile(`${contentKey}.json`, importData[contentKey]);
            }
          }
        }
      }
      
      // 清除所有缓存
      this.clearAllCache();
      
    } catch (error) {
      console.error('导入数据失败:', error);
      throw new AppError('导入数据失败', error);
    }
  }

  /**
   * 清空所有数据
   */
  async clearAll(): Promise<void> {
    try {
      // 获取所有项目
      const projects = await this.readJsonFile('projects.json', []);
      
      // 删除每个项目的相关文件
      for (const project of projects as any[]) {
        const projectId = project.id;
        await this.deleteFileIfExists(`project_${projectId}_chapters.json`);
        await this.deleteFileIfExists(`project_${projectId}_volumes.json`);
        await this.deleteFileIfExists(`project_${projectId}_characters.json`);
        await this.deleteFileIfExists(`project_${projectId}_outlines.json`);
        await this.deleteFileIfExists(`project_${projectId}_world_items.json`);
        await this.deleteFileIfExists(`writing_stats_${projectId}.json`);
        
        // 删除章节内容文件
        const chapters = await this.readJsonFile(`project_${projectId}_chapters.json`, []);
        for (const chapter of chapters as any[]) {
          await this.deleteFileIfExists(`chapter_${projectId}_${chapter.id}.json`);
        }
      }
      
      // 删除主要文件
      await this.deleteFileIfExists('projects.json');
      await this.deleteFileIfExists('settings.json');
      await this.deleteFileIfExists('current_project.json');
      await this.deleteFileIfExists('current_chapter.json');
      
      // 清除所有缓存
      this.clearAllCache();
      
    } catch (error) {
      console.error('清空数据失败:', error);
      throw new AppError('清空数据失败', error);
    }
  }

  /**
   * 删除文件（如果存在）
   * @param filename 文件名
   */
  private async deleteFileIfExists(filename: string): Promise<void> {
    try {
      if (this.adapter.delete) {
        await this.adapter.delete(filename);
      } else if (this.adapter.deleteFile) {
        await this.adapter.deleteFile(filename);
      }
    } catch (error) {
      // 忽略文件不存在的错误
      console.debug(`File ${filename} may not exist, skipping deletion`);
    }
  }

  /**
   * 清除所有缓存
   */
  private clearAllCache(): void {
    this.cache.clear();
  }
}