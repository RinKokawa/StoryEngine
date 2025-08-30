import { DailyStats } from '../entities/Stats'
import { IStatsRepository } from '../repositories/IStatsRepository'

export class StatsService {
  constructor(private statsRepository: IStatsRepository) {}

  async updateDailyWordCount(increment: number): Promise<void> {
    const today = new Date().toDateString()
    let stats = await this.statsRepository.getDailyStats(today)
    
    if (!stats) {
      stats = {
        date: today,
        wordCount: 0
      }
    }
    
    stats.wordCount += increment
    await this.statsRepository.saveDailyStats(stats)
  }

  async getTodayStats(): Promise<DailyStats> {
    const today = new Date().toDateString()
    const stats = await this.statsRepository.getDailyStats(today)
    
    return stats || {
      date: today,
      wordCount: 0
    }
  }

  async getStatsForDate(date: string): Promise<DailyStats> {
    const stats = await this.statsRepository.getDailyStats(date)
    
    return stats || {
      date,
      wordCount: 0
    }
  }

  async recordContentChange(oldContent: string, newContent: string): Promise<void> {
    const oldLength = oldContent.replace(/\s/g, '').length
    const newLength = newContent.replace(/\s/g, '').length
    
    if (newLength > oldLength) {
      const increment = newLength - oldLength
      await this.updateDailyWordCount(increment)
    }
  }
}