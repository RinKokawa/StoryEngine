/**
 * 统计服务
 * 处理写作统计相关的存储操作
 */

import { BaseStorageService } from './BaseStorageService';
import { StorageAdapter } from '../adapters/StorageInterfaces';
import type { WritingStats } from '@/types/project';

export class StatsService extends BaseStorageService {
  /**
   * 构造函数
   * @param adapter 存储适配器
   */
  constructor(adapter: StorageAdapter) {
    super(adapter);
  }

  /**
   * 获取项目写作统计
   * @param projectId 项目ID
   * @returns 写作统计数据
   */
  async getWritingStats(projectId: string): Promise<WritingStats | null> {
    const cacheKey = this.getCacheKey('writing_stats', projectId);
    let stats = this.getCache<WritingStats>(cacheKey);
    
    if (!stats) {
      stats = await this.readJsonFile(`writing_stats_${projectId}.json`, null);
      if (stats) {
        this.setCache(cacheKey, stats);
      }
    }
    
    return stats;
  }

  /**
   * 保存项目写作统计
   * @param projectId 项目ID
   * @param stats 写作统计数据
   */
  async saveWritingStats(projectId: string, stats: WritingStats): Promise<void> {
    await this.writeJsonFile(`writing_stats_${projectId}.json`, stats);
    
    // 更新缓存
    const cacheKey = this.getCacheKey('writing_stats', projectId);
    this.setCache(cacheKey, stats);
  }

  /**
   * 更新今日写作字数
   * @param projectId 项目ID
   * @param wordCount 新增字数
   */
  async updateTodayWords(projectId: string, wordCount: number): Promise<void> {
    const stats = await this.getWritingStats(projectId) || this.createDefaultStats(projectId);
    const today = new Date().toISOString().split('T')[0];
    
    // 更新今日字数
    stats.dailyWords[today] = (stats.dailyWords[today] || 0) + wordCount;
    stats.todayWords = stats.dailyWords[today];
    stats.totalWords += wordCount;
    stats.lastWriteDate = new Date().toISOString();
    
    // 计算本周字数
    stats.weekWords = this.calculateWeekWords(stats.dailyWords);
    
    await this.saveWritingStats(projectId, stats);
  }

  /**
   * 创建默认统计数据
   * @param projectId 项目ID
   * @returns 默认统计数据
   */
  private createDefaultStats(projectId: string): WritingStats {
    return {
      projectId,
      dailyWords: {},
      totalWords: 0,
      todayWords: 0,
      weekWords: 0,
      lastWriteDate: null
    };
  }

  /**
   * 计算本周写作字数
   * @param dailyWords 每日字数记录
   * @returns 本周总字数
   */
  private calculateWeekWords(dailyWords: Record<string, number>): number {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // 本周开始（周日）
    
    let weekWords = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      weekWords += dailyWords[dateStr] || 0;
    }
    
    return weekWords;
  }

  /**
   * 重置项目统计数据
   * @param projectId 项目ID
   */
  async resetStats(projectId: string): Promise<void> {
    const stats = this.createDefaultStats(projectId);
    await this.saveWritingStats(projectId, stats);
  }

  /**
   * 删除项目统计数据
   * @param projectId 项目ID
   */
  async deleteStats(projectId: string): Promise<void> {
    const filename = `writing_stats_${projectId}.json`;
    
    try {
      if (this.adapter.delete) {
        await this.adapter.delete(filename);
      } else if (this.adapter.deleteFile) {
        await this.adapter.deleteFile(filename);
      }
    } catch (error) {
      console.error(`Failed to delete stats file ${filename}:`, error);
    }
    
    // 清除缓存
    const cacheKey = this.getCacheKey('writing_stats', projectId);
    this.clearCache(cacheKey);
  }
}