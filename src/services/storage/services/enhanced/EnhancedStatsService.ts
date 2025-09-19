/**
 * 增强版统计服务
 * 使用新的日期工具模块，提供更丰富的统计功能
 */

import { EnhancedBaseStorageService } from '../base/EnhancedBaseStorageService';
import { StorageAdapter } from '../../adapters/StorageInterfaces';
import { WritingDateUtils, DateUtils } from '@/utils/dateUtils';
import { AppError } from '@/types';

export interface WritingStats {
  projectId: string;
  dailyWords: Record<string, number>;
  totalWords: number;
  todayWords: number;
  weekWords: number;
  monthWords: number;
  yearWords: number;
  lastWriteDate: string | null;
  streak: number;
  averageDailyWords: number;
  createdAt: string;
  lastModified: string;
}

export interface WritingGoal {
  id: string;
  projectId: string;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'total';
  target: number;
  current: number;
  deadline?: string;
  isActive: boolean;
  createdAt: string;
  lastModified: string;
}

export interface StatsAnalysis {
  totalWords: number;
  averageDaily: number;
  mostProductiveDay: { date: string; words: number } | null;
  currentStreak: number;
  longestStreak: number;
  writingDays: number;
  totalDays: number;
  consistency: number; // 0-100
  weeklyTrend: number[]; // 最近几周的字数
  monthlyTrend: number[]; // 最近几个月的字数
}

export class EnhancedStatsService extends EnhancedBaseStorageService {
  constructor(adapter: StorageAdapter) {
    super(adapter);
  }

  /**
   * 获取项目写作统计
   */
  async getWritingStats(projectId: string): Promise<WritingStats | null> {
    const cacheKey = this.getCacheKey('writing_stats', projectId);
    let stats = this.getCache<WritingStats>(cacheKey);
    
    if (!stats) {
      stats = await this.readJsonFile(`writing_stats_${projectId}.json`, null);
      if (stats) {
        // 重新计算所有统计数据以确保准确性
        stats = this.recalculateStats(stats);
        this.setCache(cacheKey, stats);
      }
    }
    
    return stats;
  }

  /**
   * 保存项目写作统计
   */
  async saveWritingStats(projectId: string, stats: WritingStats): Promise<void> {
    // 确保统计数据是最新的
    const updatedStats = this.recalculateStats(stats);
    
    await this.writeJsonFile(`writing_stats_${projectId}.json`, updatedStats);
    
    const cacheKey = this.getCacheKey('writing_stats', projectId);
    this.setCache(cacheKey, updatedStats);
  }

  /**
   * 更新今日写作字数
   */
  async updateTodayWords(projectId: string, wordCount: number): Promise<WritingStats> {
    let stats = await this.getWritingStats(projectId);
    
    if (!stats) {
      stats = this.createDefaultStats(projectId);
    }

    const today = DateUtils.getTodayString();
    
    // 更新今日字数
    const previousTodayWords = stats.dailyWords[today] || 0;
    stats.dailyWords[today] = (stats.dailyWords[today] || 0) + wordCount;
    
    // 更新总字数
    stats.totalWords += wordCount;
    stats.lastWriteDate = new Date().toISOString();
    stats.lastModified = new Date().toISOString();
    
    // 重新计算所有统计数据
    stats = this.recalculateStats(stats);
    
    await this.saveWritingStats(projectId, stats);
    return stats;
  }

  /**
   * 设置特定日期的字数
   */
  async setDayWords(projectId: string, date: string, wordCount: number): Promise<WritingStats> {
    let stats = await this.getWritingStats(projectId);
    
    if (!stats) {
      stats = this.createDefaultStats(projectId);
    }

    const previousWords = stats.dailyWords[date] || 0;
    stats.dailyWords[date] = wordCount;
    
    // 调整总字数
    stats.totalWords = stats.totalWords - previousWords + wordCount;
    stats.lastModified = new Date().toISOString();
    
    // 重新计算统计数据
    stats = this.recalculateStats(stats);
    
    await this.saveWritingStats(projectId, stats);
    return stats;
  }

  /**
   * 获取详细的统计分析
   */
  async getStatsAnalysis(projectId: string): Promise<StatsAnalysis> {
    const stats = await this.getWritingStats(projectId);
    
    if (!stats) {
      return this.createEmptyAnalysis();
    }

    const mostProductiveDays = WritingDateUtils.getMostActiveWritingDays(stats.dailyWords, 1);
    const mostProductiveDay = mostProductiveDays.length > 0 ? mostProductiveDays[0] : null;
    
    // 计算写作天数和总天数
    const writingDays = Object.values(stats.dailyWords).filter(words => words > 0).length;
    const firstWriteDate = Object.keys(stats.dailyWords).sort()[0];
    const totalDays = firstWriteDate ? 
      DateUtils.getDaysBetween(DateUtils.fromDateString(firstWriteDate), new Date()) + 1 : 0;
    
    // 计算一致性（写作天数占总天数的百分比）
    const consistency = totalDays > 0 ? Math.round((writingDays / totalDays) * 100) : 0;

    return {
      totalWords: stats.totalWords,
      averageDaily: stats.averageDailyWords,
      mostProductiveDay,
      currentStreak: stats.streak,
      longestStreak: this.calculateLongestStreak(stats.dailyWords),
      writingDays,
      totalDays,
      consistency,
      weeklyTrend: this.calculateWeeklyTrend(stats.dailyWords),
      monthlyTrend: this.calculateMonthlyTrend(stats.dailyWords)
    };
  }

  /**
   * 获取写作目标
   */
  async getWritingGoals(projectId: string): Promise<WritingGoal[]> {
    const cacheKey = this.getCacheKey('writing_goals', projectId);
    let goals = this.getCache<WritingGoal[]>(cacheKey);
    
    if (!goals) {
      goals = await this.readJsonFile(`writing_goals_${projectId}.json`, []);
      this.setCache(cacheKey, goals);
    }
    
    return goals;
  }

  /**
   * 创建写作目标
   */
  async createWritingGoal(projectId: string, goalData: Partial<WritingGoal>): Promise<WritingGoal> {
    const goals = await this.getWritingGoals(projectId);
    
    const goal: WritingGoal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      type: goalData.type || 'daily',
      target: goalData.target || 1000,
      current: 0,
      deadline: goalData.deadline,
      isActive: goalData.isActive !== false,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      ...goalData
    };
    
    goals.push(goal);
    await this.writeJsonFile(`writing_goals_${projectId}.json`, goals);
    this.clearCache(`writing_goals_${projectId}`);
    
    return goal;
  }

  /**
   * 更新写作目标进度
   */
  async updateGoalProgress(projectId: string): Promise<void> {
    const goals = await this.getWritingGoals(projectId);
    const stats = await this.getWritingStats(projectId);
    
    if (!stats) return;

    let hasUpdates = false;
    
    for (const goal of goals) {
      if (!goal.isActive) continue;
      
      let newCurrent = 0;
      
      switch (goal.type) {
        case 'daily':
          newCurrent = stats.todayWords;
          break;
        case 'weekly':
          newCurrent = stats.weekWords;
          break;
        case 'monthly':
          newCurrent = stats.monthWords;
          break;
        case 'yearly':
          newCurrent = stats.yearWords;
          break;
        case 'total':
          newCurrent = stats.totalWords;
          break;
      }
      
      if (goal.current !== newCurrent) {
        goal.current = newCurrent;
        goal.lastModified = new Date().toISOString();
        hasUpdates = true;
      }
    }
    
    if (hasUpdates) {
      await this.writeJsonFile(`writing_goals_${projectId}.json`, goals);
      this.clearCache(`writing_goals_${projectId}`);
    }
  }

  /**
   * 重置项目统计数据
   */
  async resetStats(projectId: string): Promise<void> {
    const stats = this.createDefaultStats(projectId);
    await this.saveWritingStats(projectId, stats);
  }

  /**
   * 删除项目统计数据
   */
  async deleteStats(projectId: string): Promise<void> {
    await this.deleteFile(`writing_stats_${projectId}.json`);
    await this.deleteFile(`writing_goals_${projectId}.json`);
    
    this.clearCache(`writing_stats_${projectId}`);
    this.clearCache(`writing_goals_${projectId}`);
  }

  /**
   * 创建默认统计数据
   */
  private createDefaultStats(projectId: string): WritingStats {
    return {
      projectId,
      dailyWords: {},
      totalWords: 0,
      todayWords: 0,
      weekWords: 0,
      monthWords: 0,
      yearWords: 0,
      lastWriteDate: null,
      streak: 0,
      averageDailyWords: 0,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
  }

  /**
   * 重新计算所有统计数据
   */
  private recalculateStats(stats: WritingStats): WritingStats {
    const today = DateUtils.getTodayString();
    
    // 重新计算各时间段字数
    stats.todayWords = stats.dailyWords[today] || 0;
    stats.weekWords = WritingDateUtils.calculateWeekWords(stats.dailyWords);
    stats.monthWords = WritingDateUtils.calculateMonthWords(stats.dailyWords);
    stats.yearWords = WritingDateUtils.calculateYearWords(stats.dailyWords);
    
    // 重新计算总字数
    stats.totalWords = Object.values(stats.dailyWords).reduce((sum, words) => sum + words, 0);
    
    // 重新计算连续天数
    stats.streak = WritingDateUtils.getWritingStreak(stats.dailyWords);
    
    // 重新计算平均每日字数
    stats.averageDailyWords = WritingDateUtils.calculateAverageDailyWords(stats.dailyWords);
    
    return stats;
  }

  /**
   * 计算最长连续写作天数
   */
  private calculateLongestStreak(dailyWords: Record<string, number>): number {
    const dates = Object.keys(dailyWords).sort();
    let longestStreak = 0;
    let currentStreak = 0;
    
    for (let i = 0; i < dates.length; i++) {
      const words = dailyWords[dates[i]];
      
      if (words > 0) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return longestStreak;
  }

  /**
   * 计算最近几周的趋势
   */
  private calculateWeeklyTrend(dailyWords: Record<string, number>, weeks: number = 8): number[] {
    const trend: number[] = [];
    const today = new Date();
    
    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekWords = WritingDateUtils.calculateWordsInRange(
        dailyWords, 
        { start: weekStart, end: weekEnd }
      );
      
      trend.push(weekWords);
    }
    
    return trend;
  }

  /**
   * 计算最近几个月的趋势
   */
  private calculateMonthlyTrend(dailyWords: Record<string, number>, months: number = 6): number[] {
    const trend: number[] = [];
    const today = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);
      
      const monthWords = WritingDateUtils.calculateWordsInRange(
        dailyWords, 
        { start: monthStart, end: monthEnd }
      );
      
      trend.push(monthWords);
    }
    
    return trend;
  }

  /**
   * 创建空的分析数据
   */
  private createEmptyAnalysis(): StatsAnalysis {
    return {
      totalWords: 0,
      averageDaily: 0,
      mostProductiveDay: null,
      currentStreak: 0,
      longestStreak: 0,
      writingDays: 0,
      totalDays: 0,
      consistency: 0,
      weeklyTrend: [],
      monthlyTrend: []
    };
  }
}