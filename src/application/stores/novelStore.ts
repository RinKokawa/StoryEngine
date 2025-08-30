import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Novel } from '../../domain/entities/Novel'
import { serviceContainer } from '../container'

export const useNovelStore = defineStore('novel', () => {
  // 状态
  const novels = ref<Novel[]>([])
  const currentNovel = ref<Novel | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const currentNovelId = computed(() => currentNovel.value?.id || null)
  const totalWordCount = computed(() => {
    if (!currentNovel.value) return 0
    return currentNovel.value.volumes
      .flatMap(v => v.chapters)
      .reduce((total, chapter) => total + chapter.wordCount, 0)
  })

  // 操作
  const loadNovels = async () => {
    try {
      loading.value = true
      error.value = null
      novels.value = await serviceContainer.novelService.getAllNovels()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载小说列表失败'
    } finally {
      loading.value = false
    }
  }

  const createNovel = async (novelData: {
    title: string
    description?: string
    genre?: string
    cover?: string
  }) => {
    try {
      loading.value = true
      error.value = null
      const novel = await serviceContainer.novelService.createNovel(novelData)
      novels.value.unshift(novel)
      return novel
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建小说失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateNovel = async (novel: Novel) => {
    try {
      loading.value = true
      error.value = null
      await serviceContainer.novelService.updateNovel(novel)
      
      // 更新本地状态
      const index = novels.value.findIndex(n => n.id === novel.id)
      if (index >= 0) {
        novels.value[index] = novel
      }
      
      if (currentNovel.value?.id === novel.id) {
        currentNovel.value = novel
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新小说失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteNovel = async (id: string) => {
    try {
      loading.value = true
      error.value = null
      await serviceContainer.novelService.deleteNovel(id)
      
      // 更新本地状态
      novels.value = novels.value.filter(n => n.id !== id)
      if (currentNovel.value?.id === id) {
        currentNovel.value = null
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除小说失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const setCurrentNovel = async (id: string) => {
    try {
      loading.value = true
      error.value = null
      const novel = await serviceContainer.novelService.getNovelById(id)
      currentNovel.value = novel
      
      // 同时保存到 localStorage 以便页面刷新后恢复
      if (novel) {
        localStorage.setItem('currentNovelId', id)
      }
      
      return novel
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载小说失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateWordCount = async (novelId: string) => {
    try {
      await serviceContainer.novelService.updateNovelWordCount(novelId)
      
      // 重新加载当前小说以获取最新的字数统计
      if (currentNovel.value?.id === novelId) {
        await setCurrentNovel(novelId)
      }
      
      // 更新小说列表中的字数
      await loadNovels()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新字数统计失败'
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    novels,
    currentNovel,
    loading,
    error,
    
    // 计算属性
    currentNovelId,
    totalWordCount,
    
    // 操作
    loadNovels,
    createNovel,
    updateNovel,
    deleteNovel,
    setCurrentNovel,
    updateWordCount,
    clearError
  }
})