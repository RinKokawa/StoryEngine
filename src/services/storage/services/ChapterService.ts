/**
 * 章节服务
 * 处理章节相关的存储操作
 */

import { BaseStorageService } from './BaseStorageService';
import { StorageAdapter } from '../adapters/StorageInterfaces';
import { AppError } from '@/types';

// 章节类型定义
export interface Chapter {
  id: string;
  projectId: string;
  volumeId?: string;
  title: string;
  order: number;
  content: string;
  wordCount: number;
  status: string;
  createdAt: string;
  lastModified: string;
}

export interface CreateChapterData {
  title: string;
  content?: string;
}

export interface UpdateChapterData {
  id: string;
  title?: string;
  content?: string;
  status?: string;
  volumeId?: string;
  order?: number;
}

export class ChapterService extends BaseStorageService {
  /**
   * 构造函数
   * @param adapter 存储适配器
   */
  constructor(adapter: StorageAdapter) {
    super(adapter);
  }

  /**
   * 获取项目的所有章节
   * @param projectId 项目ID
   * @returns 章节列表
   */
  async getProjectChapters(projectId: string): Promise<Chapter[]> {
    const cacheKey = this.getCacheKey('chapters', projectId);
    let chapters = this.getCache<Chapter[]>(cacheKey);
    
    if (!chapters) {
      chapters = await this.readJsonFile(`project_${projectId}_chapters.json`, []);
      this.setCache(cacheKey, chapters);
    }
    
    return chapters.sort((a, b) => a.order - b.order);
  }

  /**
   * 获取卷的所有章节
   * @param projectId 项目ID
   * @param volumeId 卷ID
   * @returns 章节列表
   */
  async getVolumeChapters(projectId: string, volumeId: string): Promise<Chapter[]> {
    const chapters = await this.getProjectChapters(projectId);
    return chapters.filter(c => c.volumeId === volumeId).sort((a, b) => a.order - b.order);
  }

  /**
   * 获取单个章节
   * @param projectId 项目ID
   * @param chapterId 章节ID
   * @returns 章节对象或null
   */
  async getChapter(projectId: string, chapterId: string): Promise<Chapter | null> {
    const chapters = await this.getProjectChapters(projectId);
    return chapters.find(c => c.id === chapterId) || null;
  }

  /**
   * 创建新章节
   * @param projectId 项目ID
   * @param volumeId 卷ID（可选）
   * @param data 章节创建数据
   * @returns 创建的章节
   */
  async createChapter(projectId: string, volumeId: string | undefined, data: CreateChapterData): Promise<Chapter> {
    const chapters = await this.getProjectChapters(projectId);
    const volumeChapters = volumeId ? chapters.filter(c => c.volumeId === volumeId) : chapters.filter(c => !c.volumeId);
    
    const chapter: Chapter = {
      id: `chapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      volumeId,
      title: data.title,
      order: volumeChapters.length + 1,
      content: data.content || '　　',
      wordCount: (data.content || '　　').replace(/\s/g, '').length,
      status: 'draft',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    chapters.push(chapter);
    await this.writeJsonFile(`project_${projectId}_chapters.json`, chapters);
    this.clearCache(`chapters_${projectId}`);
    
    return chapter;
  }

  /**
   * 更新章节
   * @param projectId 项目ID
   * @param data 章节更新数据
   * @returns 更新后的章节
   */
  async updateChapter(projectId: string, data: UpdateChapterData): Promise<Chapter> {
    const chapters = await this.getProjectChapters(projectId);
    const index = chapters.findIndex(c => c.id === data.id);
    
    if (index === -1) {
      throw new AppError('章节不存在');
    }
    
    const updatedChapter = { 
      ...chapters[index], 
      ...data, 
      lastModified: new Date().toISOString() 
    };
    
    // 重新计算字数
    if (data.content !== undefined) {
      updatedChapter.wordCount = data.content.replace(/\s/g, '').length;
    }
    
    chapters[index] = updatedChapter;
    await this.writeJsonFile(`project_${projectId}_chapters.json`, chapters);
    this.clearCache(`chapters_${projectId}`);
    
    return updatedChapter;
  }

  /**
   * 删除章节
   * @param projectId 项目ID
   * @param chapterId 章节ID
   */
  async deleteChapter(projectId: string, chapterId: string): Promise<void> {
    const chapters = await this.getProjectChapters(projectId);
    const filteredChapters = chapters.filter(c => c.id !== chapterId);
    
    await this.writeJsonFile(`project_${projectId}_chapters.json`, filteredChapters);
    this.clearCache(`chapters_${projectId}`);
  }

  /**
   * 重新排序章节
   * @param projectId 项目ID
   * @param chapterIds 章节ID数组，按新顺序排列
   */
  async reorderChapters(projectId: string, chapterIds: string[]): Promise<void> {
    const chapters = await this.getProjectChapters(projectId);
    
    chapterIds.forEach((id, index) => {
      const chapter = chapters.find(c => c.id === id);
      if (chapter) {
        chapter.order = index + 1;
        chapter.lastModified = new Date().toISOString();
      }
    });
    
    await this.writeJsonFile(`project_${projectId}_chapters.json`, chapters);
    this.clearCache(`chapters_${projectId}`);
  }

  /**
   * 获取章节内容
   * @param projectId 项目ID
   * @param chapterId 章节ID
   * @returns 章节内容
   */
  async getChapterContent(projectId: string, chapterId: string): Promise<string> {
    const chapter = await this.getChapter(projectId, chapterId);
    return chapter?.content || '　　';
  }

  /**
   * 保存章节内容
   * @param projectId 项目ID
   * @param chapterId 章节ID
   * @param content 章节内容
   */
  async saveChapterContent(projectId: string, chapterId: string, content: string): Promise<void> {
    await this.updateChapter(projectId, { id: chapterId, content });
  }

  /**
   * 获取当前章节
   * @param projectId 项目ID
   * @returns 当前章节ID或null
   */
  async getCurrentChapter(projectId: string): Promise<string | null> {
    const data = await this.readJsonFile(`project_${projectId}_current.json`, { chapterId: null });
    return data.chapterId;
  }

  /**
   * 设置当前章节
   * @param projectId 项目ID
   * @param chapterId 章节ID或null
   */
  async setCurrentChapter(projectId: string, chapterId: string | null): Promise<void> {
    await this.writeJsonFile(`project_${projectId}_current.json`, { chapterId });
  }

  /**
   * 计算项目总字数
   * @param projectId 项目ID
   * @returns 总字数
   */
  async calculateProjectWordCount(projectId: string): Promise<number> {
    const chapters = await this.getProjectChapters(projectId);
    return chapters.reduce((sum, chapter) => sum + (chapter.wordCount || 0), 0);
  }
}