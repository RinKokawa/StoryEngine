<template>
  <div class="story-editor">
    <div class="editor-header">
      <div class="title-row">
        <div class="title-stack">
          <p class="eyebrow">Editor</p>
          <div class="title-line">
            <h1>{{ projectTitle }}</h1>
            <span class="title-divider">/</span>
            <span class="subtitle-strong">{{ chapterTitle }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button
            @click="toggleSidebar"
            class="sidebar-toggle"
            :title="sidebarVisible ? '隐藏章节面板' : '显示章节面板'">
            <span v-if="sidebarVisible">◀</span>
            <span v-else>▶</span>
          </button>
          <button @click="toggleAiPanel" class="ai-toggle" :class="{ 'active': aiPanelVisible }">
            <span>AI 面板</span>
            <span class="ai-toggle-icon" :class="{ open: aiPanelVisible }">▸</span>
          </button>
        </div>
      </div>
    </div>
    
    <div class="editor-layout">
      <!-- 左侧章节选择器 -->
      <ResizableSidebar 
        v-if="sidebarVisible" 
        position="left"
        :default-width="250"
        :min-width="200"
        :max-width="500"
        title="拖动调整章节面板宽度"
        @resize="width => sidebarWidth = width"
        class="sidebar-container"
      >
        <div class="sidebar">
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
            @data-updated="handleDataUpdated"
          />
        </div>
      </ResizableSidebar>
      
      <!-- 中间编辑器 -->
      <div class="editor-content" :class="{ 'full-width': !sidebarVisible && !aiPanelVisible }">
        <NovelEditor 
          :current-project="currentProject"
          :current-chapter="currentChapter"
          @project-changed="handleProjectChanged"
        />
      </div>
      
      <!-- 右侧AI对话面板 -->
      <div v-if="aiPanelVisible" class="ai-panel-wrapper">
        <div class="resize-handle-left" 
             @mousedown="startAiPanelResize" 
             @dblclick="resetAiPanelWidth"
             title="拖动调整AI助手面板宽度"></div>
        <div class="ai-panel-container" :style="{ width: `${aiPanelWidth}px` }">
          <AiChatPanel
            :current-project="currentProject"
            :current-chapter="currentChapter"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import NovelEditor from '../components/NovelEditor.vue'
import VolumeChapterSelector from '../components/common/VolumeChapterSelector.vue'
import AiChatPanel from '../components/common/AiChatPanel.vue'
import ResizableSidebar from '../components/common/ResizableSidebar.vue'
import { ServiceFactory } from '@/services/storage'

export default {
  name: 'StoryEditor',
  components: {
    NovelEditor,
    VolumeChapterSelector,
    AiChatPanel,
    ResizableSidebar
  },
  setup() {
    const projectService = ServiceFactory.getProjectService()
    const chapterService = ServiceFactory.getChapterService()
    const currentProject = ref(null)
    const currentChapterId = ref(null)
    const chapters = ref([])
    const sidebarVisible = ref(true)
    const aiPanelVisible = ref(false)
    const sidebarWidth = ref(250)
    const aiPanelWidth = ref(320)
    
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

    const projectTitle = computed(() => currentProject.value?.name || '故事编辑')
    const chapterTitle = computed(() => {
      if (!currentChapter.value) return '尚未选择章节'
      return currentChapter.value.title || `第${currentChapter.value.order}章`
    })

    // 加载当前项目
    const loadCurrentProject = async () => {
      isLoading.value = true
      loadError.value = null
      
      try {
        console.log('开始加载当前项目...')
        const project = await projectService.getCurrentProject()
        
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
        const projectChapters = await chapterService.getProjectChapters(currentProject.value.id) || []
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
          const chapterId = await chapterService.getCurrentChapter(currentProject.value.id)
          
          if (chapterId && chapters.value.find(c => c.id === chapterId)) {
            currentChapterId.value = chapterId
            console.log('当前章节加载成功:', chapterId)
          } else {
            // 如果没有设置当前章节，默认选择第一章
            currentChapterId.value = chapters.value[0].id
            await chapterService.setCurrentChapter(currentProject.value.id, chapters.value[0].id)
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
        await projectService.setCurrentProject(project)
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
        await chapterService.setCurrentChapter(currentProject.value.id, chapter.id)
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
          await chapterService.setCurrentChapter(currentProject.value.id, chapter.id)
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
            await chapterService.setCurrentChapter(currentProject.value.id, chapters.value[0].id)
          } else {
            currentChapterId.value = null
          }
        }
      } catch (error) {
        console.error('删除章节失败:', error)
        alert('删除章节失败，请重试')
      }
    }

    // 处理数据更新
    const handleDataUpdated = async () => {
      console.log('VolumeChapterSelector数据已更新，重新加载章节列表')
      
      if (!currentProject.value) return
      
      try {
        // 重新加载章节列表
        await loadChapters()
        
        // 如果当前章节不存在了，选择第一个可用章节
        if (currentChapterId.value && !chapters.value.find(c => c.id === currentChapterId.value)) {
          if (chapters.value.length > 0) {
            currentChapterId.value = chapters.value[0].id
            await chapterService.setCurrentChapter(currentProject.value.id, chapters.value[0].id)
            console.log('当前章节不存在，切换到第一个章节:', chapters.value[0].id)
          } else {
            currentChapterId.value = null
            console.log('无可用章节')
          }
        }
      } catch (error) {
        console.error('处理数据更新事件失败:', error)
      }
    }

    // 切换侧边栏显示状态
    const toggleSidebar = () => {
      sidebarVisible.value = !sidebarVisible.value
    }
    
    // 切换AI面板显示状态
    const toggleAiPanel = () => {
      aiPanelVisible.value = !aiPanelVisible.value
    }
    
    // AI面板宽度调整
    let isAiPanelResizing = false
    let startX = 0
    let startWidth = 0
    
    const startAiPanelResize = (e) => {
      e.preventDefault()
      isAiPanelResizing = true
      startX = e.clientX
      startWidth = aiPanelWidth.value
      
      document.addEventListener('mousemove', handleAiPanelMouseMove)
      document.addEventListener('mouseup', stopAiPanelResize)
      document.body.style.cursor = 'w-resize'
      document.body.style.userSelect = 'none'
      
      console.log('开始调整AI面板宽度')
    }
    
    const handleAiPanelMouseMove = (e) => {
      if (!isAiPanelResizing) return
      
      // 右侧面板：向左拖动增加宽度
      const delta = startX - e.clientX
      let newWidth = startWidth + delta
      
      // 限制最小和最大宽度
      newWidth = Math.max(250, Math.min(600, newWidth))
      
      aiPanelWidth.value = newWidth
      console.log(`调整AI面板宽度: ${newWidth}px`)
    }
    
    const stopAiPanelResize = () => {
      if (!isAiPanelResizing) return
      
      isAiPanelResizing = false
      document.removeEventListener('mousemove', handleAiPanelMouseMove)
      document.removeEventListener('mouseup', stopAiPanelResize)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      
      // 保存当前宽度到本地存储
      try {
        localStorage.setItem('ai-panel-width', aiPanelWidth.value.toString())
      } catch (e) {
        console.warn('无法保存AI面板宽度到本地存储', e)
      }
      
      console.log('结束调整AI面板宽度')
    }
    
    const resetAiPanelWidth = () => {
      aiPanelWidth.value = 320 // 默认宽度
      
      // 更新本地存储
      try {
        localStorage.setItem('ai-panel-width', '320')
      } catch (e) {
        console.warn('无法保存AI面板宽度到本地存储', e)
      }
    }
    
    // 从本地存储加载AI面板宽度
    onMounted(() => {
      try {
        const savedWidth = localStorage.getItem('ai-panel-width')
        if (savedWidth) {
          const parsedWidth = parseInt(savedWidth)
          if (!isNaN(parsedWidth)) {
            aiPanelWidth.value = Math.max(250, Math.min(600, parsedWidth))
          }
        }
      } catch (e) {
        console.warn('无法从本地存储加载AI面板宽度', e)
      }
    })

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
      projectTitle,
      chapterTitle,
      sidebarVisible,
      aiPanelVisible,
      sidebarWidth,
      aiPanelWidth,
      isLoading,
      loadError,
      toggleSidebar,
      toggleAiPanel,
      handleProjectChanged,
      handleChapterSelected,
      handleChapterCreated,
      handleChapterUpdated,
      handleChapterDeleted,
      handleDataUpdated,
      retryLoad,
      startAiPanelResize,
      resetAiPanelWidth
    }
  }
}
</script>

<style scoped>
.story-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fb;
}

.editor-header {
  background: white;
  padding: 16px 24px;
  border-bottom: 1px solid #e6e8ec;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: space-between;
}

.title-stack {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.title-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.title-line h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1f2a44;
}

.title-divider {
  color: #cbd5e1;
  font-weight: 600;
}

.subtitle-strong {
  font-size: 16px;
  color: #4b5563;
  font-weight: 600;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 12px;
  color: #667085;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f4f6fb;
  border: 1px solid #dfe3e8;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #52607a;
  transition: all 0.3s;
}

.ai-toggle:hover, .ai-toggle.active {
  background: #e9efff;
  border-color: #4063ff;
  color: #1f2a44;
}

.sidebar-toggle {
  width: 36px;
  height: 36px;
  border: 1px solid #dfe3e8;
  background: #f8fafc;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #52607a;
  transition: all 0.3s;
}

.sidebar-toggle:hover {
  background: #e9edf5;
  border-color: #4063ff;
  color: #1f2a44;
}

.ai-toggle-icon {
  transition: transform 0.2s ease;
}

.ai-toggle-icon.open {
  transform: rotate(90deg);
}

.editor-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar-container {
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.sidebar {
  height: 100%;
  background: #f8f9fa;
  padding: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  background: white;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 0;
}

.sidebar-header h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.project-info {
  font-size: 14px;
  color: #007bff;
  font-weight: 500;
}

.sidebar > div:not(.sidebar-header) {
  padding: 16px;
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
  min-width: 0; /* 防止内容溢出 */
}

.ai-panel-wrapper {
  position: relative;
  display: flex;
  flex-shrink: 0;
}

.resize-handle-left {
  position: absolute;
  left: 0;
  top: 0;
  width: 6px;
  height: 100%;
  background-color: transparent;
  cursor: w-resize;
  z-index: 100;
  transition: background-color 0.2s;
}

.resize-handle-left:hover {
  background-color: rgba(0, 123, 255, 0.2);
}

.resize-handle-left:active {
  background-color: rgba(0, 123, 255, 0.4);
}

.ai-panel-container {
  flex-shrink: 0;
  border-left: 1px solid #e0e0e0;
  overflow: hidden;
  height: 100%;
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
  
  .sidebar-container {
    width: 100% !important;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .ai-panel-container {
    width: 100% !important;
    height: 300px;
    border-left: none;
    border-top: 1px solid #e0e0e0;
  }
  
  .editor-content {
    flex: 1;
  }
  
  .resize-handle {
    display: none;
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
