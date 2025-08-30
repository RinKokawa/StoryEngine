import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Chapter, Volume } from '../../domain/entities/Novel'
import { serviceContainer } from '../container'
import { useNovelStore } from './novelStore'

export const useChapterStore = defineStore('chapter', () => {
  // 状态
  const currentChapter = ref<Chapter | null>(null)
  const content = ref('')
  const hasUnsavedChanges = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const currentChapterId = computed(() => currentChapter.value?.id || null)
  const wordCount = computed(() => content.value.replace(/\s/g, '').length)
  const currentChapterTitle = computed(() => currentChapter.value?.title || '')

  // 获取小说 store
  const novelStore = useNovelStore()

  const volumes = computed(() => novelStore.currentNovel?.volumes || [])
  const allChapters = computed(() => volumes.value.flatMap((v: Volume) => v.chapters))

  // 操作
  const addChapter = async (title?: string, volumeId?: string) => {
    if (!novelStore.currentNovelId) {
      throw new Error('没有选中的小说')
    }

    try {
      loading.value = true
      error.value = null
      
      const chapter = await serviceContainer.chapterService.addChapter(
        novelStore.currentNovelId,
        title,
        volumeId
      )
      
      // 重新加载小说以获取最新的章节列表
      await novelStore.setCurrentNovel(novelStore.currentNovelId)
      
      return chapter
    } catch (err) {
      error.value = err instanceof Error ? err.message : '添加章节失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const switchChapter = async (chapterId: string) => {
    try {
      // 保存当前章节内容
      if (currentChapter.value && hasUnsavedChanges.value) {
        await saveCurrentChapter()
      }

      if (!novelStore.currentNovelId) {
        throw new Error('没有选中的小说')
      }

      loading.value = true
      error.value = null
      
      const chapter = await serviceContainer.chapterService.getChapter(
        novelStore.currentNovelId,
        chapterId
      )
      
      if (chapter) {
        currentChapter.value = chapter
        content.value = chapter.content
        hasUnsavedChanges.value = false
        
        // 保存当前章节ID到 localStorage
        localStorage.setItem('currentChapterId', chapterId)
      }
      
      return chapter
    } catch (err) {
      error.value = err instanceof Error ? err.message : '切换章节失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateChapterContent = (newContent: string) => {
    content.value = newContent
    hasUnsavedChanges.value = true
    
    // 更新当前章节的字数
    if (currentChapter.value) {
      currentChapter.value.wordCount = wordCount.value
    }
  }

  const saveCurrentChapter = async () => {
    if (!currentChapter.value || !novelStore.currentNovelId) {
      return
    }

    try {
      loading.value = true
      error.value = null
      
      await serviceContainer.chapterService.updateChapter(
        novelStore.currentNovelId,
        currentChapter.value.id,
        {
          content: content.value,
          wordCount: wordCount.value
        }
      )
      
      hasUnsavedChanges.value = false
      
      // 更新小说的总字数
      await novelStore.updateWordCount(novelStore.currentNovelId)
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '保存章节失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateChapterTitle = async (chapterId: string, title: string) => {
    if (!novelStore.currentNovelId) {
      throw new Error('没有选中的小说')
    }

    try {
      loading.value = true
      error.value = null
      
      await serviceContainer.chapterService.updateChapter(
        novelStore.currentNovelId,
        chapterId,
        { title }
      )
      
      // 重新加载小说以获取最新的章节信息
      await novelStore.setCurrentNovel(novelStore.currentNovelId)
      
      // 如果是当前章节，更新本地状态
      if (currentChapter.value?.id === chapterId) {
        currentChapter.value.title = title
      }
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新章节标题失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteChapter = async (chapterId: string) => {
    if (!novelStore.currentNovelId) {
      throw new Error('没有选中的小说')
    }

    try {
      loading.value = true
      error.value = null
      
      await serviceContainer.chapterService.deleteChapter(
        novelStore.currentNovelId,
        chapterId
      )
      
      // 如果删除的是当前章节，清空当前章节状态
      if (currentChapter.value?.id === chapterId) {
        currentChapter.value = null
        content.value = ''
        hasUnsavedChanges.value = false
      }
      
      // 重新加载小说以获取最新的章节列表
      await novelStore.setCurrentNovel(novelStore.currentNovelId)
      
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除章节失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const autoSave = async () => {
    if (hasUnsavedChanges.value) {
      await saveCurrentChapter()
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    currentChapter,
    content,
    hasUnsavedChanges,
    loading,
    error,
    
    // 计算属性
    currentChapterId,
    wordCount,
    currentChapterTitle,
    volumes,
    allChapters,
    
    // 操作
    addChapter,
    switchChapter,
    updateChapterContent,
    saveCurrentChapter,
    updateChapterTitle,
    deleteChapter,
    autoSave,
    clearError
  }
})