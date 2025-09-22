import { ref, computed, watch } from 'vue'
import { ServiceFactory } from '../services/storage/index.ts'

/**
 * 卷章管理状态管理Hook
 */
export function useVolumeChapterState(projectId) {
  // 响应式数据
  const volumes = ref([])
  const chapters = ref([])
  const expandedVolumes = ref(new Set())
  const isLoading = ref(false)
  const isProcessing = ref(false)
  const loadError = ref(null)
  const selectedChapter = ref(null)

  // 计算属性
  const chaptersByVolume = computed(() => {
    const map = new Map()
    chapters.value.forEach(chapter => {
      const volumeId = chapter.volumeId
      if (!map.has(volumeId)) {
        map.set(volumeId, [])
      }
      map.get(volumeId).push(chapter)
    })
    return map
  })

  // 数据加载
  const loadData = async () => {
    if (!projectId.value) return

    isLoading.value = true
    loadError.value = null

    try {
      // 加载卷数据
      let volumesData
      try {
        const volumeService = ServiceFactory.getVolumeService()
        volumesData = await volumeService.getProjectVolumes(projectId.value)
      } catch (error) {
        console.error('加载卷数据失败:', error)
        volumesData = []
      }

      volumes.value = volumesData || []

      // 加载章节数据
      let chaptersData
      try {
        const chapterService = ServiceFactory.getChapterService()
        chaptersData = await chapterService.getProjectChapters(projectId.value)
      } catch (error) {
        console.error('加载章节数据失败:', error)
        chaptersData = []
      }

      chapters.value = chaptersData || []

      // 默认展开第一卷
      if (volumes.value.length > 0 && expandedVolumes.value.size === 0) {
        expandedVolumes.value.add(volumes.value[0].id)
      }

    } catch (error) {
      console.error('加载数据失败:', error)
      loadError.value = '加载数据失败，请重试'
    } finally {
      isLoading.value = false
    }
  }

  const retryLoad = () => {
    loadData()
  }

  const refreshData = () => {
    loadData()
  }

  // 卷操作
  const toggleVolume = (volumeId) => {
    if (expandedVolumes.value.has(volumeId)) {
      expandedVolumes.value.delete(volumeId)
    } else {
      expandedVolumes.value.add(volumeId)
    }
  }

  const getVolumeChapters = (volumeId) => {
    return chaptersByVolume.value.get(volumeId) || []
  }

  const getVolumeChapterCount = (volumeId) => {
    const count = getVolumeChapters(volumeId).length
    return count > 0 ? count : ''
  }

  // 章节选择
  const selectChapter = (chapter) => {
    selectedChapter.value = chapter
  }

  // 卷管理
  const createVolume = async (volumeData) => {
    isProcessing.value = true
    try {
      const volumeService = ServiceFactory.getVolumeService()
      const newVolume = await volumeService.createVolume(projectId.value, volumeData)
      if (newVolume && !volumes.value.some(v => v.id === newVolume.id)) {
        volumes.value.push(newVolume)
        expandedVolumes.value.add(newVolume.id)
      }
      return newVolume
    } catch (error) {
      console.error('创建卷失败:', error)
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  const updateVolume = async (volumeData) => {
    isProcessing.value = true
    try {
      const volumeService = ServiceFactory.getVolumeService()
      await volumeService.updateVolume(projectId.value, volumeData)
      
      const index = volumes.value.findIndex(v => v.id === volumeData.id)
      if (index !== -1) {
        volumes.value[index] = volumeData
      }
      return volumeData
    } catch (error) {
      console.error('更新卷失败:', error)
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  const deleteVolume = async (volumeId) => {
    try {
      const volumeService = ServiceFactory.getVolumeService()
      await volumeService.deleteVolume(projectId.value, volumeId)
      volumes.value = volumes.value.filter(v => v.id !== volumeId)
      chapters.value = chapters.value.filter(c => c.volumeId !== volumeId)
      expandedVolumes.value.delete(volumeId)
    } catch (error) {
      console.error('删除卷失败:', error)
      throw error
    }
  }

  // 章节管理
  const createChapter = async (volumeId, chapterData) => {
    isProcessing.value = true
    try {
      const newChapterData = {
        ...chapterData,
        wordCount: 0,
        content: '',
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
      
      const chapterService = ServiceFactory.getChapterService()
      const newChapter = await chapterService.createChapter(
        projectId.value, 
        volumeId, 
        newChapterData
      )
      if (newChapter && !chapters.value.some(c => c.id === newChapter.id)) {
        chapters.value.push(newChapter)
      }
      return newChapter
    } catch (error) {
      console.error('创建章节失败:', error)
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  const updateChapter = async (chapterData) => {
    isProcessing.value = true
    try {
      const updatedChapter = {
        ...chapterData,
        lastModified: new Date().toISOString()
      }
      
      const chapterService = ServiceFactory.getChapterService()
      await chapterService.updateChapter(projectId.value, updatedChapter)
      
      const index = chapters.value.findIndex(c => c.id === chapterData.id)
      if (index !== -1) {
        chapters.value[index] = updatedChapter
      }
      return updatedChapter
    } catch (error) {
      console.error('更新章节失败:', error)
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  const deleteChapter = async (chapterId) => {
    try {
      const chapterService = ServiceFactory.getChapterService()
      await chapterService.deleteChapter(projectId.value, chapterId)
      chapters.value = chapters.value.filter(c => c.id !== chapterId)
    } catch (error) {
      console.error('删除章节失败:', error)
      throw error
    }
  }

  // 监听项目变化
  watch(projectId, () => {
    if (projectId.value) {
      loadData()
    }
  }, { immediate: true })

  return {
    // 状态
    volumes,
    chapters,
    expandedVolumes,
    isLoading,
    isProcessing,
    loadError,
    selectedChapter,
    chaptersByVolume,

    // 方法
    loadData,
    retryLoad,
    refreshData,
    toggleVolume,
    getVolumeChapters,
    getVolumeChapterCount,
    selectChapter,

    // 卷管理
    createVolume,
    updateVolume,
    deleteVolume,

    // 章节管理
    createChapter,
    updateChapter,
    deleteChapter
  }
}