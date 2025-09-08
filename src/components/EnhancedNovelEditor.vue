<template>
  <div class="enhanced-novel-editor">
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <ProjectSelector 
          v-model="selectedProjectId"
          :projects="projects"
          @change="handleProjectChange"
        />
      </div>
      
      <div class="toolbar-center">
        <div class="chapter-info" v-if="currentChapter">
          <span class="chapter-title">{{ currentChapter.title || `第${currentChapter.order}章` }}</span>
          <span class="word-count">{{ wordCount }} 字</span>
        </div>
      </div>
      
      <div class="toolbar-right">
        <button @click="saveContent" class="save-btn" :disabled="!hasUnsavedChanges">
          <span class="icon">💾</span>
          <span>保存</span>
        </button>
      </div>
    </div>

    <div class="editor-container">
      <div class="editor-wrapper">
        <!-- 行号显示 -->
        <div class="line-numbers" ref="lineNumbers">
          <div 
            v-for="lineNum in totalLines" 
            :key="lineNum"
            class="line-number"
            :class="{ active: lineNum === currentLine }"
          >
            {{ lineNum }}
          </div>
        </div>

        <!-- 主编辑区域 -->
        <div class="editor-main">
          <textarea
            ref="editorTextarea"
            v-model="content"
            class="editor-textarea"
            :placeholder="placeholder"
            @input="handleInput"
            @keydown="handleKeydown"
            @keyup="handleKeyup"
            @scroll="handleScroll"
            @click="updateCursorPosition"
            @contextmenu="handleContextMenu"
            spellcheck="false"
          ></textarea>

          <!-- 智能提示下拉框 -->
          <div 
            v-if="showSuggestions && suggestions.length > 0"
            class="suggestions-dropdown"
            :style="suggestionStyle"
          >
            <div 
              v-for="(suggestion, index) in suggestions" 
              :key="suggestion.id || index"
              class="suggestion-item"
              :class="{ active: index === selectedSuggestionIndex }"
              @click="applySuggestion(suggestion)"
              @mouseenter="selectedSuggestionIndex = index"
            >
              <div class="suggestion-icon">{{ suggestion.icon || '📝' }}</div>
              <div class="suggestion-content">
                <div class="suggestion-title">{{ suggestion.title || suggestion.name }}</div>
                <div class="suggestion-desc">{{ suggestion.description || suggestion.type }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右键菜单 -->
      <div 
        v-if="showContextMenu"
        class="context-menu"
        :style="contextMenuStyle"
        @click.stop
      >
        <div class="menu-item" @click="handleMenuAction('copy')">
          <span class="menu-icon">📋</span>
          <span>复制</span>
          <span class="menu-shortcut">Ctrl+C</span>
        </div>
        <div class="menu-item" @click="handleMenuAction('cut')">
          <span class="menu-icon">✂️</span>
          <span>剪切</span>
          <span class="menu-shortcut">Ctrl+X</span>
        </div>
        <div class="menu-item" @click="handleMenuAction('paste')">
          <span class="menu-icon">📄</span>
          <span>粘贴</span>
          <span class="menu-shortcut">Ctrl+V</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="handleMenuAction('selectAll')">
          <span class="menu-icon">🔘</span>
          <span>全选</span>
          <span class="menu-shortcut">Ctrl+A</span>
        </div>
        <div class="menu-divider"></div>
        <div class="menu-item" @click="handleMenuAction('insertDateTime')">
          <span class="menu-icon">📅</span>
          <span>插入日期时间</span>
        </div>
        <div class="menu-item" @click="handleMenuAction('wordCount')">
          <span class="menu-icon">🔢</span>
          <span>字数统计</span>
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="editor-statusbar">
      <div class="status-left">
        <span class="cursor-info">行 {{ currentLine }}, 列 {{ currentColumn }}</span>
        <span class="word-count-info">字数: {{ wordCount }}</span>
      </div>
      
      <div class="status-center">
        <span v-if="lastSaved" class="last-saved">
          最后保存: {{ formatTime(lastSaved) }}
        </span>
        <span v-if="autoSaveEnabled" class="auto-save-indicator">
          自动保存已启用
        </span>
      </div>
      
      <div class="status-right">
        <span class="encoding">UTF-8</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import ProjectSelector from './common/ProjectSelector.vue'
import { storageService } from '@/services/storage'

export default {
  name: 'EnhancedNovelEditor',
  components: {
    ProjectSelector
  },
  props: {
    currentProject: {
      type: Object,
      default: null
    },
    currentChapter: {
      type: Object,
      default: null
    },
    contextData: {
      type: Object,
      default: null
    }
  },
  emits: ['content-changed', 'mention-trigger', 'project-changed'],
  setup(props, { emit }) {
    // 基础状态
    const content = ref('')
    const hasUnsavedChanges = ref(false)
    const lastSaved = ref(null)
    const autoSaveEnabled = ref(true)
    const autoSaveTimer = ref(null)
    
    // 编辑器引用
    const editorTextarea = ref(null)
    const lineNumbers = ref(null)
    
    // 光标和选择状态
    const currentLine = ref(1)
    const currentColumn = ref(1)
    const selectionStart = ref(0)
    const selectionEnd = ref(0)
    
    // 智能提示状态
    const showSuggestions = ref(false)
    const suggestions = ref([])
    const selectedSuggestionIndex = ref(0)
    const suggestionTrigger = ref('')
    const suggestionQuery = ref('')
    const suggestionPosition = ref({ x: 0, y: 0 })
    
    // 右键菜单状态
    const showContextMenu = ref(false)
    const contextMenuPosition = ref({ x: 0, y: 0 })
    
    // 项目相关
    const projects = ref([])
    const selectedProjectId = ref('')

    // 计算属性
    const wordCount = computed(() => {
      return content.value.replace(/\s/g, '').length
    })

    const totalLines = computed(() => {
      return content.value.split('\n').length
    })

    const placeholder = computed(() => {
      if (props.currentChapter) {
        return `开始编写《${props.currentChapter.title || `第${props.currentChapter.order}章`}》...`
      }
      return '开始你的创作之旅...'
    })

    const suggestionStyle = computed(() => ({
      left: suggestionPosition.value.x + 'px',
      top: suggestionPosition.value.y + 'px'
    }))

    const contextMenuStyle = computed(() => ({
      left: contextMenuPosition.value.x + 'px',
      top: contextMenuPosition.value.y + 'px'
    }))

    // 处理输入
    const handleInput = (event) => {
      hasUnsavedChanges.value = true
      emit('content-changed', content.value)
      
      // 检查智能提示触发
      checkMentionTrigger(event)
      
      // 重置自动保存定时器
      if (autoSaveEnabled.value) {
        clearTimeout(autoSaveTimer.value)
        autoSaveTimer.value = setTimeout(autoSave, 2000)
      }
      
      // 更新行号显示
      nextTick(() => {
        updateLineNumbers()
      })
    }

    // 检查提及触发
    const checkMentionTrigger = (event) => {
      const textarea = event.target
      const cursorPos = textarea.selectionStart
      const textBeforeCursor = content.value.substring(0, cursorPos)
      
      // 检查是否输入了触发字符
      const triggers = ['@', '#', '/']
      let triggerFound = null
      let queryStart = -1
      
      for (const trigger of triggers) {
        const lastTriggerIndex = textBeforeCursor.lastIndexOf(trigger)
        if (lastTriggerIndex !== -1) {
          const textAfterTrigger = textBeforeCursor.substring(lastTriggerIndex + 1)
          // 检查触发字符后是否只有字母、数字或空格，且没有换行
          if (/^[\w\s]*$/.test(textAfterTrigger) && !textAfterTrigger.includes('\n')) {
            if (!triggerFound || lastTriggerIndex > queryStart) {
              triggerFound = trigger
              queryStart = lastTriggerIndex
            }
          }
        }
      }
      
      if (triggerFound && queryStart !== -1) {
        const query = textBeforeCursor.substring(queryStart + 1)
        suggestionTrigger.value = triggerFound
        suggestionQuery.value = query
        
        // 获取建议列表
        getSuggestions(triggerFound, query)
        
        // 计算提示框位置
        updateSuggestionPosition(textarea, queryStart)
        
        showSuggestions.value = true
        selectedSuggestionIndex.value = 0
      } else {
        hideSuggestions()
      }
    }

    // 获取建议列表
    const getSuggestions = async (trigger, query) => {
      try {
        const result = emit('mention-trigger', trigger, query)
        if (result && Array.isArray(result)) {
          suggestions.value = result
        } else {
          // 默认建议
          suggestions.value = getDefaultSuggestions(trigger, query)
        }
      } catch (error) {
        console.error('获取建议失败:', error)
        suggestions.value = []
      }
    }

    // 获取默认建议
    const getDefaultSuggestions = (trigger, query) => {
      const mockSuggestions = {
        '@': [
          { id: '1', name: '主角', type: '主要人物', icon: '👤' },
          { id: '2', name: '反派', type: '反面人物', icon: '😈' },
          { id: '3', name: '配角', type: '次要人物', icon: '👥' }
        ],
        '#': [
          { id: '1', title: '魔法世界', description: '世界设定', icon: '✨' },
          { id: '2', title: '古代王朝', description: '历史背景', icon: '🏛️' },
          { id: '3', title: '未来科技', description: '科幻设定', icon: '🚀' }
        ],
        '/': [
          { id: '1', title: '第一章大纲', description: '故事开端', icon: '📋' },
          { id: '2', title: '冲突设置', description: '情节转折', icon: '⚡' },
          { id: '3', title: '结局构思', description: '故事结尾', icon: '🎯' }
        ]
      }
      
      const items = mockSuggestions[trigger] || []
      if (!query) return items
      
      return items.filter(item => {
        const searchText = (item.name || item.title || '').toLowerCase()
        return searchText.includes(query.toLowerCase())
      })
    }

    // 更新建议框位置
    const updateSuggestionPosition = (textarea, triggerPos) => {
      const rect = textarea.getBoundingClientRect()
      const textBeforeTrigger = content.value.substring(0, triggerPos)
      const lines = textBeforeTrigger.split('\n')
      const currentLineText = lines[lines.length - 1]
      
      // 简单估算位置（实际项目中可能需要更精确的计算）
      const lineHeight = 24
      const charWidth = 8
      
      suggestionPosition.value = {
        x: rect.left + (currentLineText.length * charWidth),
        y: rect.top + ((lines.length - 1) * lineHeight) + lineHeight
      }
    }

    // 应用建议
    const applySuggestion = (suggestion) => {
      const textarea = editorTextarea.value
      const cursorPos = textarea.selectionStart
      const textBeforeCursor = content.value.substring(0, cursorPos)
      const textAfterCursor = content.value.substring(cursorPos)
      
      // 找到触发字符的位置
      const triggerIndex = textBeforeCursor.lastIndexOf(suggestionTrigger.value)
      if (triggerIndex !== -1) {
        const beforeTrigger = content.value.substring(0, triggerIndex)
        const suggestionText = suggestion.name || suggestion.title
        const newContent = beforeTrigger + suggestionTrigger.value + suggestionText + textAfterCursor
        
        content.value = newContent
        
        // 设置新的光标位置
        nextTick(() => {
          const newCursorPos = triggerIndex + suggestionTrigger.value.length + suggestionText.length
          textarea.setSelectionRange(newCursorPos, newCursorPos)
          textarea.focus()
        })
      }
      
      hideSuggestions()
    }

    // 隐藏建议
    const hideSuggestions = () => {
      showSuggestions.value = false
      suggestions.value = []
      selectedSuggestionIndex.value = 0
    }

    // 处理键盘事件
    const handleKeydown = (event) => {
      // 处理建议选择
      if (showSuggestions.value && suggestions.value.length > 0) {
        switch (event.key) {
          case 'ArrowDown':
            event.preventDefault()
            selectedSuggestionIndex.value = Math.min(
              selectedSuggestionIndex.value + 1,
              suggestions.value.length - 1
            )
            break
          case 'ArrowUp':
            event.preventDefault()
            selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, 0)
            break
          case 'Enter':
          case 'Tab':
            event.preventDefault()
            if (suggestions.value[selectedSuggestionIndex.value]) {
              applySuggestion(suggestions.value[selectedSuggestionIndex.value])
            }
            break
          case 'Escape':
            event.preventDefault()
            hideSuggestions()
            break
        }
        return
      }

      // 处理快捷键
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault()
            saveContent()
            break
          case 'f':
            event.preventDefault()
            // 可以实现查找功能
            break
        }
      }

      // 处理自动缩进
      if (event.key === 'Enter') {
        handleAutoIndent(event)
      }
    }

    // 处理自动缩进
    const handleAutoIndent = (event) => {
      const textarea = event.target
      const cursorPos = textarea.selectionStart
      const textBeforeCursor = content.value.substring(0, cursorPos)
      const lines = textBeforeCursor.split('\n')
      const currentLine = lines[lines.length - 1]
      
      // 如果当前行为空或只有空白字符，插入段首缩进
      if (currentLine.trim() === '') {
        event.preventDefault()
        const indent = '\n　　' // 全角空格缩进
        const newContent = content.value.substring(0, cursorPos) + indent + content.value.substring(cursorPos)
        content.value = newContent
        
        nextTick(() => {
          textarea.setSelectionRange(cursorPos + indent.length, cursorPos + indent.length)
        })
      }
    }

    // 处理键盘抬起事件
    const handleKeyup = (event) => {
      updateCursorPosition()
    }

    // 更新光标位置
    const updateCursorPosition = () => {
      const textarea = editorTextarea.value
      if (!textarea) return
      
      const cursorPos = textarea.selectionStart
      const textBeforeCursor = content.value.substring(0, cursorPos)
      const lines = textBeforeCursor.split('\n')
      
      currentLine.value = lines.length
      currentColumn.value = lines[lines.length - 1].length + 1
      selectionStart.value = textarea.selectionStart
      selectionEnd.value = textarea.selectionEnd
    }

    // 处理滚动同步
    const handleScroll = () => {
      if (lineNumbers.value && editorTextarea.value) {
        lineNumbers.value.scrollTop = editorTextarea.value.scrollTop
      }
    }

    // 更新行号
    const updateLineNumbers = () => {
      // 行号会通过计算属性自动更新
    }

    // 处理右键菜单
    const handleContextMenu = (event) => {
      event.preventDefault()
      contextMenuPosition.value = {
        x: event.clientX,
        y: event.clientY
      }
      showContextMenu.value = true
    }

    // 处理菜单操作
    const handleMenuAction = async (action) => {
      const textarea = editorTextarea.value
      showContextMenu.value = false
      
      switch (action) {
        case 'copy':
          if (textarea.selectionStart !== textarea.selectionEnd) {
            await navigator.clipboard.writeText(
              content.value.substring(textarea.selectionStart, textarea.selectionEnd)
            )
          }
          break
        case 'cut':
          if (textarea.selectionStart !== textarea.selectionEnd) {
            const selectedText = content.value.substring(textarea.selectionStart, textarea.selectionEnd)
            await navigator.clipboard.writeText(selectedText)
            const newContent = content.value.substring(0, textarea.selectionStart) + 
                             content.value.substring(textarea.selectionEnd)
            content.value = newContent
          }
          break
        case 'paste':
          try {
            const clipboardText = await navigator.clipboard.readText()
            const newContent = content.value.substring(0, textarea.selectionStart) + 
                             clipboardText + 
                             content.value.substring(textarea.selectionEnd)
            content.value = newContent
          } catch (error) {
            console.error('粘贴失败:', error)
          }
          break
        case 'selectAll':
          textarea.select()
          break
        case 'insertDateTime':
          const dateTime = new Date().toLocaleString('zh-CN')
          const newContent = content.value.substring(0, textarea.selectionStart) + 
                           dateTime + 
                           content.value.substring(textarea.selectionEnd)
          content.value = newContent
          break
        case 'wordCount':
          alert(`当前字数: ${wordCount.value}`)
          break
      }
    }

    // 保存内容
    const saveContent = async () => {
      if (!props.currentChapter || !hasUnsavedChanges.value) return
      
      try {
        await storageService.saveChapterContent(props.currentChapter.id, content.value)
        hasUnsavedChanges.value = false
        lastSaved.value = new Date()
        console.log('内容保存成功')
      } catch (error) {
        console.error('保存失败:', error)
        alert('保存失败，请重试')
      }
    }

    // 自动保存
    const autoSave = async () => {
      if (hasUnsavedChanges.value && props.currentChapter) {
        await saveContent()
      }
    }

    // 处理项目变化
    const handleProjectChange = (project) => {
      emit('project-changed', project)
    }

    // 格式化时间
    const formatTime = (date) => {
      if (!date) return ''
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }

    // 点击外部隐藏菜单
    const handleClickOutside = (event) => {
      if (showContextMenu.value) {
        showContextMenu.value = false
      }
      if (showSuggestions.value) {
        hideSuggestions()
      }
    }

    // 加载章节内容
    const loadChapterContent = async () => {
      if (!props.currentChapter) {
        content.value = ''
        return
      }
      
      try {
        const chapterContent = await storageService.getChapterContent(props.currentChapter.id)
        content.value = chapterContent || ''
        hasUnsavedChanges.value = false
      } catch (error) {
        console.error('加载章节内容失败:', error)
        content.value = ''
      }
    }

    // 监听章节变化
    watch(() => props.currentChapter, () => {
      loadChapterContent()
    }, { immediate: true })

    // 监听项目变化
    watch(() => props.currentProject, (newProject) => {
      if (newProject) {
        selectedProjectId.value = newProject.id
      }
    }, { immediate: true })

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
      loadChapterContent()
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      if (autoSaveTimer.value) {
        clearTimeout(autoSaveTimer.value)
      }
    })

    return {
      // 状态
      content,
      hasUnsavedChanges,
      lastSaved,
      autoSaveEnabled,
      currentLine,
      currentColumn,
      wordCount,
      totalLines,
      placeholder,
      projects,
      selectedProjectId,
      
      // 智能提示
      showSuggestions,
      suggestions,
      selectedSuggestionIndex,
      suggestionStyle,
      
      // 右键菜单
      showContextMenu,
      contextMenuStyle,
      
      // 引用
      editorTextarea,
      lineNumbers,
      
      // 方法
      handleInput,
      handleKeydown,
      handleKeyup,
      handleScroll,
      handleContextMenu,
      handleMenuAction,
      updateCursorPosition,
      applySuggestion,
      saveContent,
      handleProjectChange,
      formatTime
    }
  }
}
</script>

<style scoped>
.enhanced-novel-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid #e1e4e8;
  background: #f6f8fa;
  min-height: 48px;
}

.toolbar-center .chapter-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chapter-title {
  font-weight: 600;
  color: #24292e;
}

.word-count {
  font-size: 14px;
  color: #586069;
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

.editor-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.editor-wrapper {
  display: flex;
  height: 100%;
}

.line-numbers {
  width: 60px;
  background: #f6f8fa;
  border-right: 1px solid #e1e4e8;
  overflow: hidden;
  user-select: none;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 24px;
  color: #8b949e;
  padding: 12px 8px;
}

.line-number {
  text-align: right;
  height: 24px;
  padding-right: 8px;
}

.line-number.active {
  color: #24292e;
  font-weight: 600;
}

.editor-main {
  flex: 1;
  position: relative;
}

.editor-textarea {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 12px 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 24px;
  color: #24292e;
  background: transparent;
  box-sizing: border-box;
}

.editor-textarea::placeholder {
  color: #8b949e;
  font-style: italic;
}

/* 智能提示下拉框 */
.suggestions-dropdown {
  position: fixed;
  background: white;
  border: 1px solid #d1d5da;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  min-width: 200px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.suggestion-item:hover,
.suggestion-item.active {
  background: #f6f8fa;
}

.suggestion-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.suggestion-content {
  flex: 1;
}

.suggestion-title {
  font-weight: 500;
  color: #24292e;
  font-size: 14px;
}

.suggestion-desc {
  font-size: 12px;
  color: #586069;
}

/* 右键菜单 */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #d1d5da;
  border-radius: 6px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 1000;
  min-width: 180px;
  padding: 4px 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  color: #24292e;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f6f8fa;
}

.menu-icon {
  width: 16px;
  text-align: center;
}

.menu-shortcut {
  margin-left: auto;
  font-size: 12px;
  color: #8b949e;
}

.menu-divider {
  height: 1px;
  background: #e1e4e8;
  margin: 4px 0;
}

/* 状态栏 */
.editor-statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 24px;
  background: #0366d6;
  color: white;
  padding: 0 16px;
  font-size: 12px;
}

.status-left,
.status-center,
.status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.cursor-info,
.word-count-info {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.auto-save-indicator {
  color: #28a745;
}

/* 滚动条样式 */
.editor-textarea::-webkit-scrollbar,
.line-numbers::-webkit-scrollbar,
.suggestions-dropdown::-webkit-scrollbar {
  width: 8px;
}

.editor-textarea::-webkit-scrollbar-track,
.line-numbers::-webkit-scrollbar-track,
.suggestions-dropdown::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.editor-textarea::-webkit-scrollbar-thumb,
.line-numbers::-webkit-scrollbar-thumb,
.suggestions-dropdown::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.editor-textarea::-webkit-scrollbar-thumb:hover,
.line-numbers::-webkit-scrollbar-thumb:hover,
.suggestions-dropdown::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>