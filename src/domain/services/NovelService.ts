import { Novel } from '../entities/Novel'
import { INovelRepository } from '../repositories/INovelRepository'
import { IStatsRepository } from '../repositories/IStatsRepository'

export class NovelService {
  constructor(
    private novelRepository: INovelRepository,
    private statsRepository: IStatsRepository
  ) {}

  async createNovel(novelData: Omit<Novel, 'id' | 'createdAt' | 'lastEdit' | 'wordCount' | 'volumes'>): Promise<Novel> {
    const novel: Novel = {
      ...novelData,
      id: Date.now().toString(),
      wordCount: 0,
      createdAt: new Date(),
      lastEdit: new Date(),
      volumes: []
    }

    await this.novelRepository.save(novel)
    return novel
  }

  async updateNovel(novel: Novel): Promise<void> {
    novel.lastEdit = new Date()
    await this.novelRepository.save(novel)
  }

  async deleteNovel(id: string): Promise<void> {
    await this.novelRepository.delete(id)
  }

  async getAllNovels(): Promise<Novel[]> {
    return await this.novelRepository.findAll()
  }

  async getNovelById(id: string): Promise<Novel | null> {
    return await this.novelRepository.findById(id)
  }

  async updateNovelWordCount(novelId: string): Promise<void> {
    const novel = await this.novelRepository.findById(novelId)
    if (!novel) return

    const totalWordCount = this.calculateTotalWordCount(novel)
    novel.wordCount = totalWordCount
    novel.lastEdit = new Date()
    
    await this.novelRepository.save(novel)
    
    // 更新统计信息
    await this.statsRepository.saveNovelStats({
      novelId,
      totalWordCount,
      chapterCount: this.getTotalChapterCount(novel),
      lastUpdated: new Date()
    })
  }

  private calculateTotalWordCount(novel: Novel): number {
    return novel.volumes
      .flatMap(v => v.chapters)
      .reduce((total, chapter) => total + chapter.wordCount, 0)
  }

  private getTotalChapterCount(novel: Novel): number {
    return novel.volumes
      .reduce((total, volume) => total + volume.chapters.length, 0)
  }
}