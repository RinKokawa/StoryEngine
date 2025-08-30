import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DailyStats } from '../../domain/entities/Stats'
import { serviceContainer } from '../container'

export const useStatsStore = defineStore('stats', () => {
  // 状态
  const todayStats = ref<DailyStats>({ date: new Date().toDateString(), wordCount: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const todayWordCount = computed(() => todayStats.value.wordCount)

  // 操作
  const loadTodayStats = async () => {
    try {
      loading.value = true
      error.value = null
      todayStats.value = await serviceContainer.statsService.getTodayStats()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载今日统计失败'
    } finally {
      loading.value = false
    }
  }

  const recordContentChange = async (oldContent: string, newContent: string) => {
    try {
      await serviceContainer.statsService.recordContentChange(oldContent, newContent)
      // 重新加载今日统计
      await loadTodayStats()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '记录内容变更失败'
    }
  }

  const updateDailyWordCount = async (increment: number) => {
    try {
      await serviceContainer.statsService.updateDailyWordCount(increment)
      // 更新本地状态
      todayStats.value.wordCount += increment
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新今日字数失败'
    }
  }

  const getStatsForDate = async (date: string): Promise<DailyStats> => {
    try {
      return await serviceContainer.statsService.getStatsForDate(date)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取指定日期统计失败'
      return { date, wordCount: 0 }
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    todayStats,
    loading,
    error,
    
    // 计算属性
    todayWordCount,
    
    // 操作
    loadTodayStats,
    recordContentChange,
    updateDailyWordCount,
    getStatsForDate,
    clearError
  }
})