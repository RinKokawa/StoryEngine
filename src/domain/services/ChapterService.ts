import { Chapter, Novel, Volume } from '../entities/Novel'
import { INovelRepository } from '../repositories/INovelRepository'

export class ChapterService {
  constructor(private novelRepository: INovelRepository) {}

  async addChapter(novelId: string, title?: string, volumeId?: string): Promise<Chapter> {
    const novel = await this.novelRepository.findById(novelId)
    if (!novel) throw new Error('Novel not found')

    // 找到目标卷，如果没有则创建默认卷
    let targetVolume: Volume
    if (volumeId) {
      targetVolume = novel.volumes.find(v => v.id === volumeId)!
      if (!targetVolume) throw new Error('Volume not found')
    } else {
      if (novel.volumes.length === 0) {
        targetVolume = {
          id: Date.now().toString(),
          title: '第一卷',
          chapters: [],
          createdAt: new Date()
        }
        novel.volumes.push(targetVolume)
      } else {
        targetVolume = novel.volumes[0]
      }
    }

    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: title || `第${targetVolume.chapters.length + 1}章`,
      content: '',
      number: `第${targetVolume.chapters.length + 1}章`,
      volumeId: targetVolume.id,
      wordCount: 0,
      lastEdit: new Date(),
      createdAt: new Date()
    }

    targetVolume.chapters.push(newChapter)
    this.regenerateChapterNumbers(targetVolume)
    
    await this.novelRepository.save(novel)
    return newChapter
  }

  async updateChapter(novelId: string, chapterId: string, updates: Partial<Chapter>): Promise<void> {
    const novel = await this.novelRepository.findById(novelId)
    if (!novel) throw new Error('Novel not found')

    const chapter = this.findChapterInNovel(novel, chapterId)
    if (!chapter) throw new Error('Chapter not found')

    Object.assign(chapter, updates, { lastEdit: new Date() })
    
    // 如果更新了内容，重新计算字数
    if (updates.content !== undefined) {
      chapter.wordCount = this.calculateWordCount(updates.content)
    }

    await this.novelRepository.save(novel)
  }

  async deleteChapter(novelId: string, chapterId: string): Promise<void> {
    const novel = await this.novelRepository.findById(novelId)
    if (!novel) throw new Error('Novel not found')

    for (const volume of novel.volumes) {
      const chapterIndex = volume.chapters.findIndex(c => c.id === chapterId)
      if (chapterIndex >= 0) {
        volume.chapters.splice(chapterIndex, 1)
        this.regenerateChapterNumbers(volume)
        await this.novelRepository.save(novel)
        return
      }
    }

    throw new Error('Chapter not found')
  }

  async getChapter(novelId: string, chapterId: string): Promise<Chapter | null> {
    const novel = await this.novelRepository.findById(novelId)
    if (!novel) return null

    return this.findChapterInNovel(novel, chapterId)
  }

  private findChapterInNovel(novel: Novel, chapterId: string): Chapter | null {
    for (const volume of novel.volumes) {
      const chapter = volume.chapters.find(c => c.id === chapterId)
      if (chapter) return chapter
    }
    return null
  }

  private regenerateChapterNumbers(volume: Volume): void {
    volume.chapters.forEach((chapter, index) => {
      chapter.number = `第${index + 1}章`
      // 如果章节标题是默认格式，也更新标题
      if (chapter.title.match(/^第\d+章$/)) {
        chapter.title = `第${index + 1}章`
      }
    })
  }

  private calculateWordCount(content: string): number {
    return content.replace(/\s/g, '').length
  }
}