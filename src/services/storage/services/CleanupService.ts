/**
 * 清理服务
 * 专门负责数据清理功能
 */

import { BaseStorageService } from './BaseStorageService';
import { StorageAdapter } from '../adapters/StorageInterfaces';
import { AppError } from '@/types';

export class CleanupService extends BaseStorageService {
  constructor(adapter: StorageAdapter) {
    super(adapter);
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
        await this.clearProject(project.id);
      }
      
      // 删除主要文件
      await this.deleteMainFiles();
      
      // 清除所有缓存
      this.clearCache();
      
    } catch (error) {
      console.error('清空数据失败:', error);
      throw new AppError('清空数据失败', error);
    }
  }

  /**
   * 清理指定项目的数据
   * @param projectId 项目ID
   */
  async clearProject(projectId: string): Promise<void> {
    try {
      const fileTypes = [
        'chapters', 'volumes', 'characters', 'outlines', 'world_items'
      ];

      // 删除项目相关文件
      for (const type of fileTypes) {
        await this.deleteFileIfExists(`project_${projectId}_${type}.json`);
      }

      // 删除写作统计文件
      await this.deleteFileIfExists(`writing_stats_${projectId}.json`);
      
      // 删除章节内容文件
      await this.clearChapterContents(projectId);
      
      // 删除项目封面文件
      await this.clearProjectCoverFiles(projectId);
      
      // 清除相关缓存
      this.clearCache(projectId);
      
    } catch (error) {
      console.error(`清理项目 ${projectId} 数据失败:`, error);
      throw new AppError(`清理项目数据失败: ${projectId}`, error);
    }
  }

  /**
   * 清理章节内容文件
   * @param projectId 项目ID
   */
  private async clearChapterContents(projectId: string): Promise<void> {
    try {
      const chapters = await this.readJsonFile(`project_${projectId}_chapters.json`, []);
      for (const chapter of chapters as any[]) {
        await this.deleteFileIfExists(`chapter_${projectId}_${chapter.id}.json`);
      }
    } catch (error) {
      console.warn(`清理项目 ${projectId} 章节内容时出错:`, error);
    }
  }

  /**
   * 清理项目封面文件
   * @param projectId 项目ID
   */
  private async clearProjectCoverFiles(projectId: string): Promise<void> {
    try {
      // 删除主封面文件
      await this.deleteFileIfExists(`project_${projectId}_cover.txt`);
      
      // 删除备份封面文件（使用通配符模式）
      // 注意：这里需要根据实际存储适配器的能力来实现
      // 如果适配器不支持通配符删除，可能需要列出文件然后逐个删除
    } catch (error) {
      console.warn(`清理项目 ${projectId} 封面文件时出错:`, error);
    }
  }

  /**
   * 删除主要配置文件
   */
  private async deleteMainFiles(): Promise<void> {
    const mainFiles = [
      'projects.json',
      'settings.json', 
      'current_project.json',
      'current_chapter.json'
    ];

    for (const filename of mainFiles) {
      await this.deleteFileIfExists(filename);
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
   * 清理过期的缓存数据
   * @param maxAge 最大缓存时间（毫秒），默认为1小时
   */
  async clearExpiredCache(maxAge: number = 60 * 60 * 1000): Promise<void> {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, value] of this.cache.entries()) {
      if (value && typeof value === 'object' && value.timestamp) {
        if (now - value.timestamp > maxAge) {
          keysToDelete.push(key);
        }
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`清理了 ${keysToDelete.length} 个过期缓存项`);
  }

  /**
   * 清理临时文件
   * 清理以 .tmp 或 .bak 结尾的临时文件
   */
  async clearTempFiles(): Promise<void> {
    try {
      // 这里需要根据存储适配器的能力来实现
      // 如果适配器支持列出文件，可以列出所有文件然后过滤删除
      console.log('清理临时文件功能需要根据存储适配器实现');
    } catch (error) {
      console.warn('清理临时文件时出错:', error);
    }
  }
}