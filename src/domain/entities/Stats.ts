export interface DailyStats {
  date: string
  wordCount: number
  lastLength?: number
}

export interface NovelStats {
  novelId: string
  totalWordCount: number
  chapterCount: number
  lastUpdated: Date
}