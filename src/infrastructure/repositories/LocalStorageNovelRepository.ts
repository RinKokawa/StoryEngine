import { INovelRepository } from '../../domain/repositories/INovelRepository'
import { Novel } from '../../domain/entities/Novel'

export class LocalStorageNovelRepository implements INovelRepository {
  private readonly STORAGE_KEY = 'novels'

  async save(novel: Novel): Promise<void> {
    const novels = await this.findAll()
    const existingIndex = novels.findIndex(n => n.id === novel.id)
    
    if (existingIndex >= 0) {
      novels[existingIndex] = novel
    } else {
      novels.push(novel)
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(novels))
  }

  async findById(id: string): Promise<Novel | null> {
    const novels = await this.findAll()
    return novels.find(n => n.id === id) || null
  }

  async findAll(): Promise<Novel[]> {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) return []
    
    return JSON.parse(stored).map((novel: any) => ({
      ...novel,
      lastEdit: new Date(novel.lastEdit),
      createdAt: new Date(novel.createdAt),
      volumes: novel.volumes?.map((v: any) => ({
        ...v,
        createdAt: new Date(v.createdAt),
        chapters: v.chapters?.map((c: any) => ({
          ...c,
          lastEdit: new Date(c.lastEdit),
          createdAt: new Date(c.createdAt)
        })) || []
      })) || []
    }))
  }

  async delete(id: string): Promise<void> {
    const novels = await this.findAll()
    const filtered = novels.filter(n => n.id !== id)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
  }

  async updateWordCount(id: string, wordCount: number): Promise<void> {
    const novel = await this.findById(id)
    if (novel) {
      novel.wordCount = wordCount
      novel.lastEdit = new Date()
      await this.save(novel)
    }
  }
}