<template>
  <div class="writing-ide">
    <!-- 顶部工具栏 -->
    <div class="ide-toolbar">
      <div class="toolbar-left">
        <div class="project-info">
          <h2 v-if="currentProject">{{ currentProject.name }}</h2>
          <span v-if="currentChapter" class="chapter-info">
            {{ currentChapter.title || `第${currentChapter.order}章` }}
          </span>
        </div>
      </div>
      
      <div class="toolbar-center">
        <div class="panel-toggles">
          <button 
            @click="togglePanel('left')" 
            class="panel-toggle"
            :class="{ active: panels.left.visible }"
            title="切换左侧面板"
          >
            <span class="icon">📋</span>
            <span>大纲</span>
          </button>
          <button 
            @click="togglePanel('right')" 
            class="panel-toggle"
            :class="{ active: panels.right.visible }"
            title="切换右侧面板"
          >
            <span class="icon">👥</span>
            <span>资料</span>
          </button>
        </div>
      </div>
      
      <div class="toolbar-right">
        <button @click="saveContent" class="save-btn" :disabled="!hasUnsavedChanges">
          <span class="icon">💾</span>
          <span>保存</span>
        </button>
        <button @click="togglePanel('ai')" class="ai-toggle" :class="{ active: panels.ai.visible }">
          <span class="icon">🤖</span>
          <span>AI助手</span>
        </button>
      </div>
    </div>

    <!-- 主工作区 -->
    <div class="ide-workspace">
      <!-- 左侧面板：大纲和章节导航 -->
      <div 
        v-show="panels.left.visible" 
        class="left-panel"
        :style="{ width: panels.left.width + 'px' }"
      >
        <div class="panel-header">
          <div class="panel-tabs">
            <button 
              v-for="tab in leftTabs" 
              :key="tab.id"
              @click="activeLeftTab = tab.id"
              class="tab-btn"
              :class="{ active: activeLeftTab === tab.id }"
            >
              <span class="icon">{{ tab.icon }}</span>
              <span>{{ tab.name }}</span>
            </button>
          </div>
        </div>
        
        <div class="panel-content">
          <!-- 章节导航 -->
          <div v-show="activeLeftTab === 'chapters'" class="chapter-nav">
            <VolumeChapterSelector
              v-if="currentProject"
              :key="'vcs-' + currentProject.id"
              :project-id="currentProject.id"
              :selected-chapter="currentChapter"
              @chapter-selected="handleChapterSelected"
              @chapter-created="handleChapterCreated"
              @chapter-updated="handleChapterUpdated"
              @chapter-deleted="handleChapterDeleted"
              @data-loaded="handleDataLoaded"
            />
          </div>
          
          <!-- 大纲面板 -->
          <div v-show="activeLeftTab === 'outline'" class="outline-panel">
            <OutlineQuickView 
              v-if="currentProject"
              :project-id="currentProject.id"
              :current-chapter="currentChapter"
              @outline-selected="handleOutlineSelected"
            />
          </div>
          
          <!-- 故事线索 -->
          <div v-show="activeLeftTab === 'plot'" class="plot-panel">
            <PlotTracker 
              v-if="currentProject"
              :project-id="currentProject.id"
              :current-chapter="currentChapter"
            />
          </div>
        </div>
      </div>

      <!-- 中央编辑器 -->
      <div class="editor-main" :class="{ 'full-width': !panels.left.visible && !panels.right.visible }">
        <div class="editor-container">
          <EnhancedNovelEditor 
            :current-project="currentProject"
            :current-chapter="currentChapter"
            :context-data="contextData"
            @content-changed="handleContentChanged"
            @mention-trigger="handleMentionTrigger"
            @project-changed="handleProjectChanged"
          />
        </div>
      </div>

      <!-- 右侧面板：人物、世界设定、参考资料 -->
      <div 
        v-show="panels.right.visible" 
        class="right-panel"
        :style="{ width: panels.right.width + 'px' }"
      >
        <div class="panel-header">
          <div class="panel-tabs">
            <button 
              v-for="tab in rightTabs" 
              :key="tab.id"
              @click="activeRightTab = tab.id"
              class="tab-btn"
              :class="{ active: activeRightTab === tab.id }"
            >
              <span class="icon">{{ tab.icon }}</span>
              <span>{{ tab.name }}</span>
            </button>
          </div>
        </div>
        
        <div class="panel-content">
          <!-- 人物快速引用 -->
          <div v-show="activeRightTab === 'characters'" class="characters-panel">
            <CharacterQuickRef 
              v-if="currentProject"
              :project-id="currentProject.id"
              :current-chapter="currentChapter"
              @character-selected="handleCharacterSelected"
            />
          </div>
          
          <!-- 世界设定 -->
          <div v-show="activeRightTab === 'world'" class="world-panel">
            <WorldSettingRef 
              v-if="currentProject"
              :project-id="currentProject.id"
              :current-chapter="currentChapter"
              @setting-selected="handleSettingSelected"
            />
          </div>
          
          <!-- 写作笔记 -->
          <div v-show="activeRightTab === 'notes'" class="notes-panel">
            <WritingNotes 
              v-if="currentProject"
              :project-id="currentProject.id"
              :chapter-id="currentChapter?.id"
            />
          </div>
        </div>
      </div>

      <!-- AI助手面板（浮动） -->
      <div v-if="panels.ai.visible" class="ai-panel-overlay">
        <div class="ai-panel">
          <div class="ai-panel-header">
            <h3>AI写作助手</h3>
            <button @click="togglePanel('ai')" class="close-btn">×</button>
          </div>
          <AiChatPanel
            :current-project="currentProject"
            :current-chapter="currentChapter"
            :context-data="contextData"
          />
        </div>
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="ide-statusbar">
      <div class="status-left">
        <span v-if="currentChapter" class="word-count">
          字数: {{ currentChapter.wordCount || 0 }}
        </span>
        <span v-if="currentProject" class="progress">
          进度: {{ Math.round((currentProject.wordCount / currentProject.targetWords) * 100) }}%
        </span>
      </div>
      
      <div class="status-center">
        <span v-if="lastSaved" class="last-saved">
          最后保存: {{ formatTime(lastSaved) }}
        </span>
      </div>
      
      <div class="status-right">
        <span class="cursor-position">行 {{ cursorPosition.line }}, 列 {{ cursorPosition.column }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, reactive } from 'vue'
import VolumeChapterSelector from '../components/common/VolumeChapterSelector.vue'
import AiChatPanel from '../components/common/AiChatPanel.vue'
import { storageService } from '@/services/storage'

// 导入新的组件（稍后创建）
// import EnhancedNovelEditor from '../components/EnhancedNovelEditor.vue'
// import OutlineQuickView from '../components/ide/OutlineQuickView.vue'
// import CharacterQuickRef from '../components/ide/CharacterQuickRef.vue'
// import WorldSettingRef from '../components/ide/WorldSettingRef.vue'
// import WritingNotes from '../components/ide/WritingNotes.vue'
// import PlotTracker from '../components/ide/PlotTracker.vue'

export default {
  name: 'StoryEditorIDE',
  components: {
    VolumeChapterSelector,
    AiChatPanel,
    // EnhancedNovelEditor,
    // OutlineQuickView,
    // CharacterQuickRef,
    // WorldSettingRef,
    // WritingNotes,
    // PlotTracker
  },
  setup() {
    // 基础状态
    const currentProject = ref(null)
    const currentChapterId = ref(null)
    const chapters = ref([])
    const hasUnsavedChanges = ref(false)
    const lastSaved = ref(null)
    
    // 面板状态
    const panels = reactive({
      left: { visible: true, width: 300 },
      right: { visible: true, width: 320 },
      ai: { visible: false }
    })
    
    // 活动标签页
    const activeLeftTab = ref('chapters')
    const activeRightTab = ref('characters')
    
    // 光标位置
    const cursorPosition = reactive({ line: 1, column: 1 })
    
    // 左侧面板标签页配置
    const leftTabs = [
      { id: 'chapters', name: '章节', icon: '📚' },
      { id: 'outline', name: '大纲', icon: '📋' },
      { id: 'plot', name: '线索', icon: '🧵' }
    ]
    
    // 右侧面板标签页配置
    const rightTabs = [
      { id: 'characters', name: '人物', icon: '👥' },
      { id: 'world', name: '设定', icon: '🌍' },
      { id: 'notes', name: '笔记', icon: '📝' }
    ]

    // 当前章节
    const currentChapter = computed(() => {
      if (!currentChapterId.value || !chapters.value.length) return null
      return chapters.value.find(c => c.id === currentChapterId.value)
    })

    // 上下文数据（用于AI和智能提示）
    const contextData = computed(() => {
      if (!currentProject.value || !currentChapter.value) return null
      
      return {
        project: currentProject.value,
        chapter: currentChapter.value,
        // 这里可以添加更多上下文信息
        // characters: getRelevantCharacters(),
        // worldSettings: getRelevantSettings(),
        // plotPoints: getRelevantPlotPoints()
      }
    })

    // 面板切换
    const togglePanel = (panelName) => {
      if (panelName === 'left' || panelName === 'right') {
        panels[panelName].visible = !panels[panelName].visible
      } else if (panelName === 'ai') {
        panels.ai.visible = !panels.ai.visible
      }
    }

    // 保存内容
    const saveContent = async () => {
      if (!hasUnsavedChanges.value) return
      
      try {
        // 这里实现保存逻辑
        // await storageService.saveChapterContent(currentChapter.value.id, content)
        hasUnsavedChanges.value = false
        lastSaved.value = new Date()
      } catch (error) {
        console.error('保存失败:', error)
        alert('保存失败，请重试')
      }
    }

    // 处理内容变化
    const handleContentChanged = (content) => {
      hasUnsavedChanges.value = true
      // 可以在这里实现自动保存逻辑
    }

    // 处理提及触发（@人物、#设定等）
    const handleMentionTrigger = (trigger, query) => {
      console.log('提及触发:', trigger, query)
      // 根据触发符返回相应的建议列表
      switch (trigger) {
        case '@':
          return getCharacterSuggestions(query)
        case '#':
          return getWorldSettingSuggestions(query)
        case '/':
          return getOutlineSuggestions(query)
        default:
          return []
      }
    }

    // 获取人物建议
    const getCharacterSuggestions = (query) => {
      // 实现人物搜索逻辑
      return []
    }

    // 获取世界设定建议
    const getWorldSettingSuggestions = (query) => {
      // 实现世界设定搜索逻辑
      return []
    }

    // 获取大纲建议
    const getOutlineSuggestions = (query) => {
      // 实现大纲搜索逻辑
      return []
    }

    // 处理人物选择
    const handleCharacterSelected = (character) => {
      console.log('选择人物:', character)
      // 可以在编辑器中插入人物信息或跳转到相关内容
    }

    // 处理设定选择
    const handleSettingSelected = (setting) => {
      console.log('选择设定:', setting)
      // 可以在编辑器中插入设定信息
    }

    // 处理大纲选择
    const handleOutlineSelected = (outline) => {
      console.log('选择大纲:', outline)
      // 可以跳转到相关章节或插入大纲内容
    }

    // 格式化时间
    const formatTime = (date) => {
      if (!date) return ''
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }

    // 加载当前项目（复用原有逻辑）
    const loadCurrentProject = async () => {
      try {
        const project = await storageService.getCurrentProject()
        if (project) {
          currentProject.value = project
          await loadChapters()
          await loadCurrentChapter()
        }
      } catch (error) {
        console.error('加载项目失败:', error)
      }
    }

    // 加载章节列表
    const loadChapters = async () => {
      if (!currentProject.value) return
      
      try {
        const projectChapters = await storageService.getProjectChapters(currentProject.value.id) || []
        chapters.value = projectChapters
      } catch (error) {
        console.error('加载章节失败:', error)
      }
    }

    // 加载当前章节
    const loadCurrentChapter = async () => {
      if (!currentProject.value || chapters.value.length === 0) return
      
      try {
        const chapterId = await storageService.getCurrentChapter(currentProject.value.id)
        if (chapterId && chapters.value.find(c => c.id === chapterId)) {
          currentChapterId.value = chapterId
        } else {
          currentChapterId.value = chapters.value[0].id
          await storageService.setCurrentChapter(currentProject.value.id, chapters.value[0].id)
        }
      } catch (error) {
        console.error('加载当前章节失败:', error)
      }
    }

    // 处理章节选择
    const handleChapterSelected = async (chapter) => {
      if (!chapter || !currentProject.value) return
      
      try {
        currentChapterId.value = chapter.id
        await storageService.setCurrentChapter(currentProject.value.id, chapter.id)
      } catch (error) {
        console.error('选择章节失败:', error)
      }
    }

    // 处理章节创建
    const handleChapterCreated = async (chapter) => {
      if (!chapter || !currentProject.value) return
      
      try {
        if (!chapters.value.some(c => c.id === chapter.id)) {
          chapters.value.push(chapter)
          currentChapterId.value = chapter.id
          await storageService.setCurrentChapter(currentProject.value.id, chapter.id)
        }
      } catch (error) {
        console.error('创建章节失败:', error)
      }
    }

    // 处理章节更新
    const handleChapterUpdated = (chapter) => {
      if (!chapter) return
      
      const index = chapters.value.findIndex(c => c.id === chapter.id)
      if (index >= 0) {
        chapters.value[index] = chapter
      }
    }

    // 处理章节删除
    const handleChapterDeleted = async (chapterId) => {
      if (!chapterId || !currentProject.value) return
      
      try {
        chapters.value = chapters.value.filter(c => c.id !== chapterId)
        
        if (currentChapterId.value === chapterId) {
          if (chapters.value.length > 0) {
            currentChapterId.value = chapters.value[0].id
            await storageService.setCurrentChapter(currentProject.value.id, chapters.value[0].id)
          } else {
            currentChapterId.value = null
          }
        }
      } catch (error) {
        console.error('删除章节失败:', error)
      }
    }

    // 处理数据加载完成
    const handleDataLoaded = async (data) => {
      if (!currentProject.value || !data.chapters) return
      
      try {
        chapters.value = data.chapters
        
        if (!currentChapterId.value && data.chapters.length > 0) {
          const firstChapter = data.chapters[0]
          currentChapterId.value = firstChapter.id
          await storageService.setCurrentChapter(currentProject.value.id, firstChapter.id)
        }
      } catch (error) {
        console.error('处理数据加载失败:', error)
      }
    }

    // 处理项目变化
    const handleProjectChanged = async (project) => {
      if (!project) return
      
      try {
        currentProject.value = project
        await storageService.setCurrentProject(project)
        await loadChapters()
        await loadCurrentChapter()
      } catch (error) {
        console.error('项目切换失败:', error)
      }
    }

    // 键盘快捷键
    const handleKeydown = (event) => {
      // Ctrl+S 保存
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        saveContent()
      }
      
      // Ctrl+1/2/3 切换面板
      if (event.ctrlKey && ['1', '2', '3'].includes(event.key)) {
        event.preventDefault()
        const panelMap = { '1': 'left', '2': 'ai', '3': 'right' }
        togglePanel(panelMap[event.key])
      }
    }

    onMounted(() => {
      loadCurrentProject()
      document.addEventListener('keydown', handleKeydown)
    })

    return {
      // 状态
      currentProject,
      currentChapter,
      hasUnsavedChanges,
      lastSaved,
      panels,
      activeLeftTab,
      activeRightTab,
      cursorPosition,
      leftTabs,
      rightTabs,
      contextData,
      
      // 方法
      togglePanel,
      saveContent,
      handleContentChanged,
      handleMentionTrigger,
      handleCharacterSelected,
      handleSettingSelected,
      handleOutlineSelected,
      handleChapterSelected,
      handleChapterCreated,
      handleChapterUpdated,
      handleChapterDeleted,
      handleDataLoaded,
      handleProjectChanged,
      formatTime
    }
  }
}
</script>

<style scoped>
.writing-ide {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 顶部工具栏 */
.ide-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  background: #ffffff;
  border-bottom: 1px solid #e1e4e8;
  padding: 0 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.toolbar-left .project-info h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #24292e;
}

.toolbar-left .chapter-info {
  font-size: 14px;
  color: #586069;
  margin-left: 8px;
}

.toolbar-center .panel-toggles {
  display: flex;
  gap: 4px;
}

.panel-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #d1d5da;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #586069;
  transition: all 0.2s;
}

.panel-toggle:hover {
  background: #f6f8fa;
  border-color: #0366d6;
}

.panel-toggle.active {
  background: #0366d6;
  border-color: #0366d6;
  color: white;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.save-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #28a745;
  border: none;
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: #218838;
}

.save-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.ai-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid #d1d5da;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #586069;
  transition: all 0.2s;
}

.ai-toggle:hover {
  background: #f6f8fa;
  border-color: #0366d6;
}

.ai-toggle.active {
  background: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

/* 主工作区 */
.ide-workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 左侧面板 */
.left-panel {
  background: #ffffff;
  border-right: 1px solid #e1e4e8;
  display: flex;
  flex-direction: column;
  min-width: 250px;
  max-width: 500px;
}

/* 右侧面板 */
.right-panel {
  background: #ffffff;
  border-left: 1px solid #e1e4e8;
  display: flex;
  flex-direction: column;
  min-width: 280px;
  max-width: 500px;
}

/* 面板头部 */
.panel-header {
  border-bottom: 1px solid #e1e4e8;
  background: #f6f8fa;
}

.panel-tabs {
  display: flex;
}

.tab-btn {
  flex: 1;
  padding: 12px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: 14px;
  color: #586069;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tab-btn:hover {
  background: #e1e4e8;
}

.tab-btn.active {
  color: #0366d6;
  border-bottom-color: #0366d6;
  background: #ffffff;
}

/* 面板内容 */
.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 中央编辑器 */
.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #ffffff;
}

.editor-main.full-width {
  margin: 0;
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

/* AI面板覆盖层 */
.ai-panel-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 400px;
  background: rgba(0,0,0,0.1);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}

.ai-panel {
  width: 380px;
  background: #ffffff;
  border-left: 1px solid #e1e4e8;
  box-shadow: -2px 0 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}

.ai-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e1e4e8;
  background: #f6f8fa;
}

.ai-panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #24292e;
}

.close-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  color: #586069;
  border-radius: 4px;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #e1e4e8;
}

/* 底部状态栏 */
.ide-statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 24px;
  background: #0366d6;
  color: white;
  padding: 0 16px;
  font-size: 12px;
}

.status-left, .status-center, .status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .left-panel, .right-panel {
    min-width: 200px;
  }
  
  .ai-panel-overlay {
    width: 100%;
    background: rgba(0,0,0,0.5);
  }
  
  .ai-panel {
    width: 100%;
    max-width: 400px;
  }
}

@media (max-width: 768px) {
  .ide-toolbar {
    flex-direction: column;
    height: auto;
    padding: 8px;
  }
  
  .toolbar-center {
    margin: 8px 0;
  }
  
  .left-panel, .right-panel {
    position: absolute;
    top: 0;
    bottom: 0;
    z-index: 100;
    box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  }
  
  .left-panel {
    left: 0;
  }
  
  .right-panel {
    right: 0;
  }
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>