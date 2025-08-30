import { DailyStats, NovelStats } from '../entities/Stats'

export interface IStatsRepository {
  saveDailyStats(stats: DailyStats): Promise<void>
  getDailyStats(date: string): Promise<DailyStats | null>
  saveNovelStats(stats: NovelStats): Promise<void>
  getNovelStats(novelId: string): Promise<NovelStats | null>
}