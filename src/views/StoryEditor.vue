<template>
  <div class="story-editor">
    <div class="editor-header">
      <div class="title-section">
        <div class="title-row">
          <button @click="toggleSidebar" class="sidebar-toggle" :title="sidebarVisible ? '隐藏章节面板' : '显示章节面板'">
            <span v-if="sidebarVisible">◀</span>
            <span v-else>▶</span>
          </button>
          <h1>故事编辑</h1>
        </div>
        <div v-if="currentProject" class="subtitle">
          {{ currentProject.name }}
          <span v-if="currentChapter" class="chapter-info">
            - {{ currentChapter.title || `第${currentChapter.order}章` }}
          </span>
        </div>
      </div>
    </div>
    
    <div class="editor-layout">
      <!-- 左侧章节选择器 -->
      <div v-if="sidebarVisible" class="sidebar">
        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>
        <div v-else-if="loadError" class="error-state">
          <p>{{ loadError }}</p>
          <button @click="retryLoad" class="retry-btn">重试</button>
        </div>
        <VolumeChapterSelector
          v-else-if="currentProject"
          :key="'vcs-' + currentProject.id"
          :project-id="currentProject.id"
          :selected-chapter="currentChapter"
          @chapter-selected="handleChapterSelected"
          @chapter-created="handleChapterCreated"
          @chapter-updated="handleChapterUpdated"
          @chapter-deleted="handleChapterDeleted"
        />
      </div>
      
      <!-- 右侧编辑器 -->
      <div class="editor-content" :class="{ 'full-width': !sidebarVisible }">
        <NovelEditor 
          :current-project="currentProject"
          :current-chapter="currentChapter"
          @project-changed="handleProjectChanged"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import NovelEditor from '../components/NovelEditor.vue'
import VolumeChapterSelector from '../components/common/VolumeChapterSelector.vue'
import storageManager from '../utils/storage.js'

export default {
  name: 'StoryEditor',
  components: {
    NovelEditor,
    VolumeChapterSelector
  },
  setup() {
    const currentProject = ref(null)
    const currentChapterId = ref(null)
    const chapters = ref([])
    const sidebarVisible = ref(true)
    
    // 加载状态
    const isLoading = ref(false)
    const loadError = ref(null)
    const loadAttempts = ref(0)
    const maxLoadAttempts = 3

    // 当前章节
    const currentChapter = computed(() => {
      if (!currentChapterId.value || !chapters.value.length) return null
      return chapters.value.find(c => c.id === currentChapterId.value)
    })

    // 加载当前项目
    const loadCurrentProject = async () => {
      isLoading.value = true
      loadError.value = null
      
      try {
        console.log('开始加载当前项目...')
        const project = await storageManager.getCurrentProject()
        
        if (project) {
          console.log('当前项目加载成功:', project.name)
          currentProject.value = project
          await loadChapters()
          await loadCurrentChapter()
        } else {
          console.warn('未找到当前项目')
        }
        
        // 重置加载尝试次数
        loadAttempts.value = 0
      } catch (error) {
        console.error('加载当前项目失败:', error)
        loadError.value = '加载项目失败，请重试'
        
        // 增加加载尝试次数
        loadAttempts.value++
        
        // 如果尝试次数小于最大尝试次数，自动重试
        if (loadAttempts.value < maxLoadAttempts) {
          console.log(`自动重试加载 (${loadAttempts.value}/${maxLoadAttempts})...`)
          setTimeout(() => {
            loadCurrentProject()
          }, 1000) // 1秒后重试
        }
      } finally {
        isLoading.value = false
      }
    }

    // 手动重试加载
    const retryLoad = () => {
      loadAttempts.value = 0
      loadCurrentProject()
    }

    // 加载章节列表
    const loadChapters = async () => {
      if (!currentProject.value) return
      
      try {
        console.log('开始加载章节列表...')
        const projectChapters = await storageManager.getProjectChapters(currentProject.value.id) || []
        chapters.value = projectChapters
        console.log(`成功加载${projectChapters.length}个章节`)
      } catch (error) {
        console.error('加载章节列表失败:', error)
        throw error // 向上传递错误
      }
    }

    // 加载当前编辑的章节
    const loadCurrentChapter = async () => {
      if (!currentProject.value) return
      
      try {
        if (chapters.value.length > 0) {
          console.log('开始加载当前章节...')
          const chapterId = await storageManager.getCurrentChapter(currentProject.value.id)
          
          if (chapterId && chapters.value.find(c => c.id === chapterId)) {
            currentChapterId.value = chapterId
            console.log('当前章节加载成功:', chapterId)
          } else {
            // 如果没有设置当前章节，默认选择第一章
            currentChapterId.value = chapters.value[0].id
            await storageManager.setCurrentChapter(currentProject.value.id, chapters.value[0].id)
            console.log('设置默认章节:', chapters.value[0].id)
          }
        } else {
          // 如果没有章节，清空当前章节ID
          currentChapterId.value = null
          console.log('无可用章节')
        }
      } catch (error) {
        console.error('加载当前章节失败:', error)
        throw error // 向上传递错误
      }
    }

    // 处理项目切换
    const handleProjectChanged = async (project) => {
      if (!project) return
      
      isLoading.value = true
      loadError.value = null
      
      try {
        console.log('项目切换:', project.name)
        currentProject.value = project
        await storageManager.setCurrentProject(project)
        await loadChapters()
        await loadCurrentChapter()
      } catch (error) {
        console.error('项目切换失败:', error)
        loadError.value = '项目切换失败，请重试'
      } finally {
        isLoading.value = false
      }
    }

    // 处理章节选择
    const handleChapterSelected = async (chapter) => {
      if (!chapter || !currentProject.value) return
      
      try {
        console.log('选择章节:', chapter.title || chapter.id)
        currentChapterId.value = chapter.id
        await storageManager.setCurrentChapter(currentProject.value.id, chapter.id)
      } catch (error) {
        console.error('选择章节失败:', error)
        alert('选择章节失败，请重试')
      }
    }

    // 处理章节创建
    const handleChapterCreated = async (chapter) => {
      if (!chapter || !currentProject.value) return
      
      try {
        console.log('创建章节:', chapter.title || chapter.id)
        
        // 检查是否已存在相同ID的章节（防止重复添加）
        if (!chapters.value.some(c => c.id === chapter.id)) {
          chapters.value.push(chapter)
          currentChapterId.value = chapter.id
          await storageManager.setCurrentChapter(currentProject.value.id, chapter.id)
        } else {
          console.warn('章节已存在，避免重复添加:', chapter.id)
        }
      } catch (error) {
        console.error('创建章节失败:', error)
        alert('创建章节失败，请重试')
      }
    }

    // 处理章节更新
    const handleChapterUpdated = (chapter) => {
      if (!chapter) return
      
      try {
        console.log('更新章节:', chapter.title || chapter.id)
        const index = chapters.value.findIndex(c => c.id === chapter.id)
        if (index >= 0) {
          chapters.value[index] = chapter
        }
      } catch (error) {
        console.error('更新章节失败:', error)
        alert('更新章节失败，请重试')
      }
    }

    // 处理章节删除
    const handleChapterDeleted = async (chapterId) => {
      if (!chapterId || !currentProject.value) return
      
      try {
        console.log('删除章节:', chapterId)
        chapters.value = chapters.value.filter(c => c.id !== chapterId)
        
        // 如果删除的是当前章节，切换到第一章
        if (currentChapterId.value === chapterId) {
          if (chapters.value.length > 0) {
            currentChapterId.value = chapters.value[0].id
            await storageManager.setCurrentChapter(currentProject.value.id, chapters.value[0].id)
          } else {
            currentChapterId.value = null
          }
        }
      } catch (error) {
        console.error('删除章节失败:', error)
        alert('删除章节失败，请重试')
      }
    }

    // 切换侧边栏显示状态
    const toggleSidebar = () => {
      sidebarVisible.value = !sidebarVisible.value
    }

    // 监听项目变化，确保组件重新渲染
    watch(() => currentProject.value, (newProject) => {
      if (newProject) {
        console.log('项目变化触发重新渲染:', newProject.name)
      }
    })

    onMounted(() => {
      loadCurrentProject()
    })

    return {
      currentProject,
      currentChapterId,
      currentChapter,
      sidebarVisible,
      isLoading,
      loadError,
      toggleSidebar,
      handleProjectChanged,
      handleChapterSelected,
      handleChapterCreated,
      handleChapterUpdated,
      handleChapterDeleted,
      retryLoad
    }
  }
}
</script>

<style scoped>
.story-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.editor-header {
  background: white;
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sidebar-toggle {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
  transition: all 0.3s;
}

.sidebar-toggle:hover {
  background: #f8f9fa;
  border-color: #007bff;
  color: #007bff;
}

.title-section h1 {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.subtitle {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.chapter-info {
  color: #007bff;
}

.editor-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 300px;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  padding: 16px;
  overflow-y: auto;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.editor-content.full-width {
  width: 100%;
}

/* 加载状态和错误状态 */
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  height: 100%;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(0, 123, 255, 0.1);
  border-radius: 50%;
  border-top-color: #007bff;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state p {
  color: #dc3545;
  margin-bottom: 16px;
}

.retry-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #0056b3;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-layout {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .editor-content {
    flex: 1;
  }
}

/* 滚动条样式 */
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.sidebar::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>