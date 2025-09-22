<template>
  <div class="vscode-file-explorer">
    <!-- 标题栏 -->
    <div class="explorer-header">
      <div class="header-title">
        <svg class="folder-icon" viewBox="0 0 16 16" width="16" height="16">
          <path fill="currentColor" d="M1.75 2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H7.5L6.25 3.5H1.75z"/>
        </svg>
        <span>卷章管理</span>
      </div>
      <div class="header-actions">
        <button @click="handleCreateVolume" class="action-btn" title="新建卷" :disabled="isLoading">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path fill="currentColor" d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"/>
          </svg>
        </button>
        <button @click="refreshData" class="action-btn" title="刷新数据" :disabled="isLoading">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path fill="currentColor" d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.38-1.38A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.38 1.38A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z"/>
          </svg>
        </button>
        <button @click="handleRefreshAllWordCounts" class="action-btn" title="更新字数统计" :disabled="isLoading || isProcessing">
          <svg viewBox="0 0 16 16" width="14" height="14">
            <path fill="currentColor" d="M2 3.75C2 2.784 2.784 2 3.75 2h8.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25Zm1.75-.25a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25ZM4.75 6a.75.75 0 0 1 .75-.75h5a.75.75 0 0 1 0 1.5h-5A.75.75 0 0 1 4.75 6ZM5.5 8.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5Z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <span>加载中...</span>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="loadError" class="error-state">
      <svg class="error-icon" viewBox="0 0 16 16" width="16" height="16">
        <path fill="currentColor" d="M2.343 13.657A8 8 0 1 1 13.658 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L6.94 8 4.97 9.97a.749.749 0 0 0 .326 1.275.749.749 0 0 0 .734-.215L8 9.06l1.97 1.97a.749.749 0 0 0 1.275-.326.749.749 0 0 0-.215-.734L9.06 8l1.97-1.97a.749.749 0 0 0-.326-1.275.749.749 0 0 0-.734.215L8 6.94Z"/>
      </svg>
      <span>{{ loadError }}</span>
      <button @click="retryLoad" class="retry-btn">重试</button>
    </div>

    <!-- 文件树 -->
    <div v-else class="file-tree">
      <VolumeSelector
        :volumes="volumes"
        :expanded-volumes="expandedVolumes"
        :is-processing="isProcessing"
        :get-volume-chapters="getVolumeChapters"
        :get-volume-chapter-count="getVolumeChapterCount"
        @toggle-volume="toggleVolume"
        @create-volume="handleCreateVolume"
        @edit-volume="handleEditVolume"
        @delete-volume="handleDeleteVolume"
        @create-chapter="handleCreateChapter"
      >
        <template #chapters="{ volume, chapters, onCreateChapter }">
          <ChapterList
            :chapters="chapters"
            :volumes="volumes"
            :volume-id="volume.id"
            :selected-chapter="selectedChapter"
            :is-processing="isProcessing"
            @select-chapter="handleSelectChapter"
            @create-chapter="onCreateChapter"
            @edit-chapter="handleEditChapter"
            @delete-chapter="handleDeleteChapter"
          />
        </template>
      </VolumeSelector>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useVolumeChapterState } from '../../composables/useVolumeChapterState.js'
import { refreshAllWordCounts, updateChapterWordCount, calculateWordCount } from '../../utils/volumeChapterUtils.js'
import VolumeSelector from './VolumeSelector.vue'
import ChapterList from './ChapterList.vue'

export default {
  name: 'VolumeChapterSelector',
  components: {
    VolumeSelector,
    ChapterList
  },
  props: {
    projectId: {
      type: String,
      required: true
    },
    selectedChapter: {
      type: Object,
      default: null
    }
  },
  emits: ['chapter-selected', 'chapter-created', 'chapter-updated', 'chapter-deleted', 'data-updated'],
  setup(props, { emit }) {
    // 使用状态管理Hook
    const projectIdRef = computed(() => props.projectId)
    const {
      volumes,
      chapters,
      expandedVolumes,
      isLoading,
      isProcessing,
      loadError,
      chaptersByVolume,
      loadData,
      retryLoad,
      refreshData,
      toggleVolume,
      getVolumeChapters,
      getVolumeChapterCount,
      selectChapter,
      createVolume,
      updateVolume,
      deleteVolume,
      createChapter,
      updateChapter,
      deleteChapter
    } = useVolumeChapterState(projectIdRef)

    // 事件处理
    const handleSelectChapter = (chapter) => {
      selectChapter(chapter)
      emit('chapter-selected', chapter)
    }

    const handleCreateVolume = async (volumeData) => {
      try {
        const newVolume = await createVolume(volumeData)
        // 创建成功后立即刷新数据以确保界面更新
        await refreshData()
        emit('data-updated')
        return newVolume
      } catch (error) {
        console.error('创建卷失败:', error)
        alert('创建失败，请重试')
      }
    }

    const handleEditVolume = async (volumeData) => {
      try {
        const updatedVolume = await updateVolume(volumeData)
        // 更新成功后立即刷新数据以确保界面更新
        await refreshData()
        emit('data-updated')
        return updatedVolume
      } catch (error) {
        console.error('更新卷失败:', error)
        alert('更新失败，请重试')
      }
    }

    const handleDeleteVolume = async (volumeId) => {
      try {
        await deleteVolume(volumeId)
        // 删除成功后立即刷新数据以确保界面更新
        await refreshData()
        emit('data-updated')
      } catch (error) {
        console.error('删除卷失败:', error)
        alert('删除失败，请重试')
      }
    }

    const handleCreateChapter = async (volumeId, chapterData) => {
      try {
        const newChapter = await createChapter(volumeId, chapterData)
        // 创建成功后立即刷新数据以确保界面更新
        await refreshData()
        emit('chapter-created', newChapter)
        emit('data-updated')
        return newChapter
      } catch (error) {
        console.error('创建章节失败:', error)
        alert('创建失败，请重试')
      }
    }

    const handleEditChapter = async (chapterData) => {
      try {
        // 如果有内容，计算字数
        if (chapterData.content) {
          chapterData.wordCount = calculateWordCount(chapterData.content)
        }
        
        const updatedChapter = await updateChapter(chapterData)
        // 更新成功后立即刷新数据以确保界面更新
        await refreshData()
        emit('chapter-updated', updatedChapter)
        emit('data-updated')
        return updatedChapter
      } catch (error) {
        console.error('更新章节失败:', error)
        alert('更新失败，请重试')
      }
    }

    const handleDeleteChapter = async (chapterId) => {
      try {
        await deleteChapter(chapterId)
        // 删除成功后立即刷新数据以确保界面更新
        await refreshData()
        emit('chapter-deleted', chapterId)
        emit('data-updated')
      } catch (error) {
        console.error('删除章节失败:', error)
        alert('删除失败，请重试')
      }
    }

    const handleRefreshAllWordCounts = async () => {
      try {
        await refreshAllWordCounts(props.projectId, chapters.value)
        emit('data-updated')
      } catch (error) {
        console.error('批量更新字数失败:', error)
        alert('更新字数失败，请重试')
      }
    }

    // 暴露给父组件的方法
    const updateChapterWordCountMethod = async (chapterId, content) => {
      return await updateChapterWordCount(props.projectId, chapterId, content, chapters.value)
    }

    const refreshAllWordCountsMethod = async () => {
      return await refreshAllWordCounts(props.projectId, chapters.value)
    }

    // 生命周期
    onMounted(() => {
      if (props.projectId) {
        loadData()
      }
    })

    // 暴露方法
    const expose = {
      updateChapterWordCount: updateChapterWordCountMethod,
      refreshAllWordCounts: refreshAllWordCountsMethod,
      loadData,
      calculateWordCount
    }

    // 使用 defineExpose 暴露方法（Vue 3.2+）
    if (typeof defineExpose !== 'undefined') {
      defineExpose(expose)
    }

    return {
      // 状态
      volumes,
      chapters,
      expandedVolumes,
      isLoading,
      isProcessing,
      loadError,
      chaptersByVolume,

      // 方法
      loadData,
      retryLoad,
      refreshData,
      toggleVolume,
      getVolumeChapters,
      getVolumeChapterCount,

      // 事件处理
      handleSelectChapter,
      handleCreateVolume,
      handleEditVolume,
      handleDeleteVolume,
      handleCreateChapter,
      handleEditChapter,
      handleDeleteChapter,
      handleRefreshAllWordCounts,

      // 工具方法
      calculateWordCount,
      updateChapterWordCount: updateChapterWordCountMethod,
      refreshAllWordCounts: refreshAllWordCountsMethod
    }
  }
}
</script>

<style scoped>
@import '../../styles/volumeChapterStyles.css';
</style>