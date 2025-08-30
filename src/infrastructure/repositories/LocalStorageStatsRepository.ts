import { IStatsRepository } from '../../domain/repositories/IStatsRepository'
import { DailyStats, NovelStats } from '../../domain/entities/Stats'

export class LocalStorageStatsRepository implements IStatsRepository {
  async saveDailyStats(stats: DailyStats): Promise<void> {
    const key = `dailyStats_${stats.date}`
    localStorage.setItem(key, JSON.stringify(stats))
  }

  async getDailyStats(date: string): Promise<DailyStats | null> {
    const key = `dailyStats_${date}`
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : null
  }

  async saveNovelStats(stats: NovelStats): Promise<void> {
    const key = `novelStats_${stats.novelId}`
    localStorage.setItem(key, JSON.stringify({
      ...stats,
      lastUpdated: stats.lastUpdated.toISOString()
    }))
  }

  async getNovelStats(novelId: string): Promise<NovelStats | null> {
    const key = `novelStats_${novelId}`
    const stored = localStorage.getItem(key)
    if (!stored) return null
    
    const parsed = JSON.parse(stored)
    return {
      ...parsed,
      lastUpdated: new Date(parsed.lastUpdated)
    }
  }
}