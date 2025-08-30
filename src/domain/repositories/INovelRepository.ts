import { Novel } from '../entities/Novel'

export interface INovelRepository {
  save(novel: Novel): Promise<void>
  findById(id: string): Promise<Novel | null>
  findAll(): Promise<Novel[]>
  delete(id: string): Promise<void>
  updateWordCount(id: string, wordCount: number): Promise<void>
}