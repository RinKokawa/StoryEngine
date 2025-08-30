import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useChapterStore } from '../stores/chapterStore'
import { useStatsStore } from '../stores/statsStore'

export function useChapter() {
  const chapterStore = useChapterStore()
  const statsStore = useStatsStore()
  
  // 自动保存定时器
  const autoSaveTimer = ref<number | null>(null)

  // 启动自动保存
  const startAutoSave = (interval: number = 30000) => {
    if (autoSaveTimer.value) {
      clearInterval(autoSaveTimer.value)
    }
    
    autoSaveTimer.value = window.setInterval(() => {
      chapterStore.autoSave()
    }, interval)
  }

  // 停止自动保存
  const stopAutoSave = () => {
    if (autoSaveTimer.value) {
      clearInterval(autoSaveTimer.value)
      autoSaveTimer.value = null
    }
  }

  // 处理内容变更
  const handleContentChange = async (newContent: string) => {
    const oldContent = chapterStore.content
    chapterStore.updateChapterContent(newContent)
    
    // 记录字数变化到统计
    await statsStore.recordContentChange(oldContent, newContent)
  }

  // 安全的章节切换（会提示保存未保存的内容）
  const safeSwitchChapter = async (chapterId: string): Promise<boolean> => {
    if (chapterStore.hasUnsavedChanges) {
      const shouldSave = confirm('当前章节有未保存的内容，是否保存？')
      if (shouldSave) {
        await chapterStore.saveCurrentChapter()
      }
    }
    
    try {
      await chapterStore.switchChapter(chapterId)
      return true
    } catch (error) {
      console.error('切换章节失败:', error)
      return false
    }
  }

  // 导出内容
  const exportContent = () => {
    if (!chapterStore.volumes.length) return

    let allContent = ''
    
    chapterStore.volumes.forEach((volume, volumeIndex) => {
      if (volumeIndex > 0) {
        allContent += '\n\n=== ' + volume.title + ' ===\n\n'
      }
      
      volume.chapters.forEach((chapter, chapterIndex) => {
        if (chapterIndex > 0) {
          allContent += '\n\n---\n\n'
        }
        allContent += `${chapter.title}\n\n${chapter.content}`
      })
    })
    
    const blob = new Blob([allContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `小说内容.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 生命周期管理
  onMounted(() => {
    startAutoSave()
  })

  onUnmounted(() => {
    stopAutoSave()
  })

  return {
    // Store 状态
    currentChapter: computed(() => chapterStore.currentChapter),
    content: computed(() => chapterStore.content),
    hasUnsavedChanges: computed(() => chapterStore.hasUnsavedChanges),
    loading: computed(() => chapterStore.loading),
    error: computed(() => chapterStore.error),
    wordCount: computed(() => chapterStore.wordCount),
    currentChapterTitle: computed(() => chapterStore.currentChapterTitle),
    volumes: computed(() => chapterStore.volumes),
    allChapters: computed(() => chapterStore.allChapters),

    // Store 操作
    addChapter: chapterStore.addChapter,
    switchChapter: chapterStore.switchChapter,
    saveCurrentChapter: chapterStore.saveCurrentChapter,
    updateChapterTitle: chapterStore.updateChapterTitle,
    deleteChapter: chapterStore.deleteChapter,
    clearError: chapterStore.clearError,

    // 增强功能
    handleContentChange,
    safeSwitchChapter,
    exportContent,
    startAutoSave,
    stopAutoSave
  }
}