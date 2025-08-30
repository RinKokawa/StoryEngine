import { computed } from 'vue'
import { useNovelStore } from '../stores/novelStore'
import { useChapterStore } from '../stores/chapterStore'
import { useStatsStore } from '../stores/statsStore'

export function useNovel() {
  const novelStore = useNovelStore()
  const chapterStore = useChapterStore()
  const statsStore = useStatsStore()

  // 格式化字数显示
  const formatWordCount = (count: number): string => {
    if (count < 1000) return `${count}字`
    if (count < 10000) return `${(count / 1000).toFixed(1)}千字`
    return `${(count / 10000).toFixed(1)}万字`
  }

  // 格式化日期显示
  const formatDate = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return '今天'
    if (days === 1) return '昨天'
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString()
  }

  // 初始化当前小说
  const initializeCurrentNovel = async () => {
    const novelId = localStorage.getItem('currentNovelId')
    if (novelId) {
      await novelStore.setCurrentNovel(novelId)
      
      // 如果有指定的章节ID，切换到该章节
      const chapterId = localStorage.getItem('currentChapterId')
      if (chapterId && chapterStore.allChapters.some(c => c.id === chapterId)) {
        await chapterStore.switchChapter(chapterId)
        localStorage.removeItem('currentChapterId')
      } else if (chapterStore.allChapters.length > 0) {
        // 默认加载第一章
        await chapterStore.switchChapter(chapterStore.allChapters[0].id)
      }
    }
  }

  // 创建新小说并跳转到写作页面
  const createAndOpenNovel = async (novelData: {
    title: string
    description?: string
    genre?: string
    cover?: string
  }) => {
    const novel = await novelStore.createNovel(novelData)
    await novelStore.setCurrentNovel(novel.id)
    
    // 创建第一章
    if (chapterStore.allChapters.length === 0) {
      await chapterStore.addChapter('第一章')
    }
    
    return novel
  }

  return {
    // Store 状态
    novels: computed(() => novelStore.novels),
    currentNovel: computed(() => novelStore.currentNovel),
    loading: computed(() => novelStore.loading),
    error: computed(() => novelStore.error),
    totalWordCount: computed(() => novelStore.totalWordCount),
    todayWordCount: computed(() => statsStore.todayWordCount),

    // Store 操作
    loadNovels: novelStore.loadNovels,
    createNovel: novelStore.createNovel,
    updateNovel: novelStore.updateNovel,
    deleteNovel: novelStore.deleteNovel,
    setCurrentNovel: novelStore.setCurrentNovel,
    clearError: novelStore.clearError,

    // 工具函数
    formatWordCount,
    formatDate,
    initializeCurrentNovel,
    createAndOpenNovel
  }
}