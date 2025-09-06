// 编辑器状态管理

import { defineStore } from 'pinia'
import type { 
  EditorStoreState, 
  Chapter,
  Volume,
  CreateChapterData,
  UpdateChapterData
} from '@/types'
import { storageService } from '@/services/storage'
import { ErrorHandler } from '@/utils/errorHandler'

import { useProjectStore } from './project'

export const useEditorStore = defineStore('editor', {
  state: (): EditorStoreState => ({
    currentChapter: null,
    content: '',
    isDirty: false,
    autoSaveEnabled: true,
    lastSaved: null,
    cursorPosition: { line: 1, column: 1 },
    selection: null,
    chapters: [],
    volumes: [],
    currentVolume: null,
    searchResults: [],
    isSearching: false
  }),

  getters: {
    // 编辑状态
    hasUnsavedChanges: (state) => state.isDirty,
    
    wordCount: (state) => state.content.replace(/\s/g, '').length,
    
    characterCount: (state) => state.content.length,

    // 章节导航
    previousChapter: (state) => {
      if (!state.currentChapter) return null
      
      const currentIndex = state.chapters.findIndex(c => c.id === state.currentChapter)
      return currentIndex > 0 ? state.chapters[currentIndex - 1] : null
    },

    nextChapter: (state) => {
      if (!state.currentChapter) return null
      
      const currentIndex = state.chapters.findIndex(c => c.id === state.currentChapter)
      return currentIndex < state.chapters.length - 1 ? state.chapters[currentIndex + 1] : null
    },

    chapterProgress: (state) => {
      if (!state.currentChapter || state.chapters.length === 0) return 0
      
      const currentIndex = state.chapters.findIndex(c => c.id === state.currentChapter)
      return currentIndex >= 0 ? ((currentIndex + 1) / state.chapters.length) * 100 : 0
    },

    // 搜索结果
    hasSearchResults: (state) => state.searchResults.length > 0,
    
    searchResultCount: (state) => state.searchResults.length,

    // 章节统计
    getChaptersByVolume: (state) => (volumeId: string): Chapter[] => 
      state.chapters.filter(c => c.volumeId === volumeId).sort((a, b) => a.order - b.order),

    getCurrentChapterData: (state) => {
      if (!state.currentChapter) return null
      return state.chapters.find(c => c.id === state.currentChapter) || null
    }
  },

  actions: {
    // 章节编辑
    async loadChapter(chapterId: string): Promise<void> {
      const projectStore = useProjectStore()
      if (!projectStore.currentProject) {
        throw new Error('没有当前项目')
      }

      try {
        const content = await storageService.getChapterContent(projectStore.currentProject.id, chapterId)
        const chapter = await storageService.getChapter(projectStore.currentProject.id, chapterId)
        
        if (!chapter) {
          throw new Error('章节不存在')
        }

        this.currentChapter = chapterId
        this.content = content
        this.isDirty = false
        this.lastSaved = new Date()
        
        // 设置为当前章节
        await storageService.setCurrentChapter(projectStore.currentProject.id, chapterId)
      } catch (error) {
        ErrorHandler.handleError(error, 'loadChapter')
        throw error
      }
    },

    async saveContent(): Promise<void> {
      const projectStore = useProjectStore()
      if (!projectStore.currentProject || !this.currentChapter) {
        return
      }

      try {
        await storageService.saveChapterContent(
          projectStore.currentProject.id, 
          this.currentChapter, 
          this.content
        )
        
        this.isDirty = false
        this.lastSaved = new Date()
        
        // 更新章节字数
        const chapterIndex = this.chapters.findIndex(c => c.id === this.currentChapter)
        if (chapterIndex !== -1) {
          this.chapters[chapterIndex].wordCount = this.wordCount
          this.chapters[chapterIndex].lastModified = new Date().toISOString()
        }
        
        // 刷新项目数据
        await projectStore.refreshProject(projectStore.currentProject.id)
      } catch (error) {
        ErrorHandler.handleError(error, 'saveContent')
        throw error
      }
    },

    updateContent(content: string): void {
      this.content = content
      this.isDirty = true
    },

    setCurrentChapter(chapter: Chapter | null): void {
      this.currentChapter = chapter?.id || null
      if (chapter) {
        this.currentVolume = this.volumes.find(v => v.id === chapter.volumeId) || null
      }
    },

    // 自动保存
    enableAutoSave(): void {
      this.autoSaveEnabled = true
    },

    disableAutoSave(): void {
      this.autoSaveEnabled = false
    },

    // 搜索
    async searchChapters(query: string): Promise<void> {
      if (!query.trim()) {
        this.clearSearch()
        return
      }

      this.isSearching = true
      
      try {
        const searchTerm = query.toLowerCase()
        this.searchResults = this.chapters.filter(chapter => 
          chapter.title.toLowerCase().includes(searchTerm) ||
          (chapter.content && chapter.content.toLowerCase().includes(searchTerm))
        )
      } catch (error) {
        ErrorHandler.handleError(error, 'searchChapters')
      } finally {
        this.isSearching = false
      }
    },

    clearSearch(): void {
      this.searchResults = []
      this.isSearching = false
    },

    // 编辑器状态
    setCursorPosition(line: number, column: number): void {
      this.cursorPosition = { line, column }
    },

    setSelection(start: number, end: number): void {
      this.selection = { start, end }
    },

    clearSelection(): void {
      this.selection = null
    },

    // 章节管理
    async loadChapters(projectId: string): Promise<void> {
      try {
        this.chapters = await storageService.getProjectChapters(projectId)
        this.volumes = await storageService.getProjectVolumes(projectId)
      } catch (error) {
        ErrorHandler.handleError(error, 'loadChapters')
      }
    },

    async createChapter(volumeId: string | undefined, data: CreateChapterData): Promise<Chapter> {
      const projectStore = useProjectStore()
      if (!projectStore.currentProject) {
        throw new Error('没有当前项目')
      }

      try {
        const chapter = await storageService.createChapter(
          projectStore.currentProject.id, 
          volumeId, 
          data
        )
        
        this.chapters.push(chapter)
        this.chapters.sort((a, b) => a.order - b.order)
        
        return chapter
      } catch (error) {
        ErrorHandler.handleError(error, 'createChapter')
        throw error
      }
    },

    async updateChapter(data: UpdateChapterData): Promise<Chapter> {
      const projectStore = useProjectStore()
      if (!projectStore.currentProject) {
        throw new Error('没有当前项目')
      }

      try {
        const updatedChapter = await storageService.updateChapter(
          projectStore.currentProject.id, 
          data
        )
        
        const index = this.chapters.findIndex(c => c.id === data.id)
        if (index !== -1) {
          this.chapters[index] = updatedChapter
        }
        
        return updatedChapter
      } catch (error) {
        ErrorHandler.handleError(error, 'updateChapter')
        throw error
      }
    },

    async deleteChapter(chapterId: string): Promise<void> {
      const projectStore = useProjectStore()
      if (!projectStore.currentProject) {
        throw new Error('没有当前项目')
      }

      try {
        await storageService.deleteChapter(projectStore.currentProject.id, chapterId)
        
        this.chapters = this.chapters.filter(c => c.id !== chapterId)
        
        // 如果删除的是当前章节，清空当前章节
        if (this.currentChapter === chapterId) {
          this.currentChapter = null
          this.content = ''
          this.isDirty = false
        }
      } catch (error) {
        ErrorHandler.handleError(error, 'deleteChapter')
        throw error
      }
    },

    async reorderChapters(chapterIds: string[]): Promise<void> {
      const projectStore = useProjectStore()
      if (!projectStore.currentProject) {
        throw new Error('没有当前项目')
      }

      try {
        await storageService.reorderChapters(projectStore.currentProject.id, chapterIds)
        
        // 更新本地章节顺序
        const reorderedChapters: Chapter[] = []
        chapterIds.forEach((id, index) => {
          const chapter = this.chapters.find(c => c.id === id)
          if (chapter) {
            chapter.order = index + 1
            reorderedChapters.push(chapter)
          }
        })
        
        this.chapters = reorderedChapters
      } catch (error) {
        ErrorHandler.handleError(error, 'reorderChapters')
        throw error
      }
    },

    // 卷管理
    async createVolume(data: Partial<Volume>): Promise<Volume> {
      const projectStore = useProjectStore()
      if (!projectStore.currentProject) {
        throw new Error('没有当前项目')
      }

      try {
        const volume = await storageService.createVolume(projectStore.currentProject.id, data)
        this.volumes.push(volume)
        this.volumes.sort((a, b) => a.order - b.order)
        
        return volume
      } catch (error) {
        ErrorHandler.handleError(error, 'createVolume')
        throw error
      }
    },

    async updateVolume(data: Partial<Volume>): Promise<Volume> {
      const projectStore = useProjectStore()
      if (!projectStore.currentProject) {
        throw new Error('没有当前项目')
      }

      try {
        const updatedVolume = await storageService.updateVolume(projectStore.currentProject.id, data)
        
        const index = this.volumes.findIndex(v => v.id === data.id)
        if (index !== -1) {
          this.volumes[index] = updatedVolume
        }
        
        return updatedVolume
      } catch (error) {
        ErrorHandler.handleError(error, 'updateVolume')
        throw error
      }
    },

    async deleteVolume(volumeId: string): Promise<void> {
      const projectStore = useProjectStore()
      if (!projectStore.currentProject) {
        throw new Error('没有当前项目')
      }

      try {
        await storageService.deleteVolume(projectStore.currentProject.id, volumeId)
        
        this.volumes = this.volumes.filter(v => v.id !== volumeId)
        this.chapters = this.chapters.filter(c => c.volumeId !== volumeId)
        
        // 如果当前卷被删除，清空当前卷
        if (this.currentVolume?.id === volumeId) {
          this.currentVolume = null
        }
      } catch (error) {
        ErrorHandler.handleError(error, 'deleteVolume')
        throw error
      }
    },

    // 初始化
    async initialize(projectId: string): Promise<void> {
      await this.loadChapters(projectId)
      
      try {
        const currentChapterId = await storageService.getCurrentChapter(projectId)
        if (currentChapterId) {
          await this.loadChapter(currentChapterId)
        }
      } catch (error) {
        ErrorHandler.handleError(error, 'initialize')
      }
    },

    // 清理状态
    reset(): void {
      this.currentChapter = null
      this.content = ''
      this.isDirty = false
      this.lastSaved = null
      this.cursorPosition = { line: 1, column: 1 }
      this.selection = null
      this.chapters = []
      this.volumes = []
      this.currentVolume = null
      this.searchResults = []
      this.isSearching = false
    }
  }
})