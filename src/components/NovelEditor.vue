<template>
  <div class="novel-editor">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <select 
          v-model="selectedProjectId" 
          class="project-selector"
          @change="handleProjectChange"
        >
          <option value="" disabled>选择项目</option>
          <option 
            v-for="project in availableProjects" 
            :key="project.id" 
            :value="project.id"
          >
            {{ project.name }}
          </option>
        </select>
        <span v-if="currentProjectName" class="current-project">
          当前项目：{{ currentProjectName }}
        </span>
      </div>
      <div class="toolbar-right">
        <button @click="saveNovel" class="save-btn" :disabled="saving">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </div>

    <!-- 编辑区域 -->
    <div class="editor-container">
      <textarea
        ref="editor"
        v-model="content"
        class="editor"
        placeholder="开始你的创作之旅..."
        @input="handleContentChange"
        @keydown="handleKeyPress"
        @scroll="handleScroll"
        @contextmenu="handleContextMenu"
        @click="hideContextMenu"
      ></textarea>
      
      <!-- 行号显示 -->
      <div class="line-numbers" ref="lineNumbers">
        <div 
          v-for="n in lineCount" 
          :key="n" 
          class="line-number"
        >
          {{ n }}
        </div>
      </div>
    </div>

    <!-- 右键菜单组件 -->
    <ContextMenu
      :visible="contextMenu.visible"
      :position="{ x: contextMenu.x, y: contextMenu.y }"
      @close="hideContextMenu"
      @copy="copyText"
      @cut="cutText"
      @paste="pasteText"
      @select-all="selectAll"
      @find-replace="findReplace"
      @insert-datetime="insertDateTime"
      @word-count="wordCountDetails"
    />

    <!-- 底部状态栏 -->
    <div class="status-bar">
      <div class="status-left">
        <span>行: {{ currentLine }}</span>
        <span>列: {{ currentColumn }}</span>
        <span>字数: {{ wordCount }}</span>
      </div>
      <div class="status-right">
        <span>最后保存: {{ lastSaveTime }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import ContextMenu from './ContextMenu.vue'
import storageManager from '../utils/storage.js'

export default {
  name: 'NovelEditor',
  components: {
    ContextMenu
  },
  props: {
    currentProject: {
      type: Object,
      default: null
    }
  },
  setup(props, { emit }) {
    const selectedProjectId = ref('')
    const availableProjects = ref([])
    const content = ref('')
    const saving = ref(false)
    const lastSaveTime = ref('从未保存')
    const currentLine = ref(1)
    const currentColumn = ref(1)
    const editor = ref(null)
    const lineNumbers = ref(null)
    const contextMenu = ref({
      visible: false,
      x: 0,
      y: 0
    })

    // 计算当前项目名称
    const currentProjectName = computed(() => {
      if (props.currentProject) {
        return props.currentProject.name
      }
      if (selectedProjectId.value) {
        const project = availableProjects.value.find(p => p.id === selectedProjectId.value)
        return project ? project.name : ''
      }
      return ''
    })

    // 加载可用项目列表
    const loadAvailableProjects = () => {
      availableProjects.value = storageManager.getProjects()
    }

    // 监听传入的当前项目
    watch(() => props.currentProject, (newProject) => {
      if (newProject) {
        selectedProjectId.value = newProject.id
        loadProjectContent(newProject)
      }
    }, { immediate: true })

    // 计算字数（去除空格和换行）
    const wordCount = computed(() => {
      return content.value.replace(/\s/g, '').length
    })

    // 计算行数
    const lineCount = computed(() => {
      return content.value.split('\n').length
    })

    // 处理内容变化
    const handleContentChange = () => {
      updateCursorPosition()
      // 触发自动保存
      autoSaveContent()
    }

    // 处理键盘输入事件
    const handleKeyPress = (event) => {
      // 回车键自动缩进
      if (event.key === 'Enter') {
        event.preventDefault()
        const textarea = editor.value
        const cursorPos = textarea.selectionStart
        const textBeforeCursor = content.value.substring(0, cursorPos)
        const textAfterCursor = content.value.substring(cursorPos)
        
        // 插入换行和缩进
        const indent = '　　' // 两个全角空格作为段落缩进
        content.value = textBeforeCursor + '\n' + indent + textAfterCursor
        
        // 设置光标位置到缩进后
        nextTick(() => {
          const newPosition = cursorPos + 1 + indent.length
          textarea.setSelectionRange(newPosition, newPosition)
        })
      }
    }

    // 初始化内容缩进
    const initializeContent = () => {
      if (content.value === '' || !content.value.startsWith('　　')) {
        content.value = '　　' + content.value
        nextTick(() => {
          if (editor.value) {
            editor.value.setSelectionRange(2, 2) // 光标放在缩进后
          }
        })
      }
    }

    // 处理项目切换
    const handleProjectChange = () => {
      const project = availableProjects.value.find(p => p.id === selectedProjectId.value)
      if (project) {
        emit('project-changed', project)
        loadProjectContent(project)
      }
    }

    // 加载项目内容
    const loadProjectContent = (project) => {
      if (project && project.id) {
        content.value = storageManager.getProjectContent(project.id)
      } else {
        content.value = '　　'
      }
    }

    // 自动保存内容
    const autoSaveContent = (() => {
      let timer = null
      return () => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          if (selectedProjectId.value && content.value.trim()) {
            storageManager.saveProjectContent(selectedProjectId.value, content.value)
            // 更新写作统计
            const wordCount = content.value.replace(/\s/g, '').length
            storageManager.updateTodayWriting(selectedProjectId.value, wordCount)
          }
        }, 2000) // 2秒后自动保存
      }
    })()

    // 更新光标位置
    const updateCursorPosition = () => {
      if (editor.value) {
        const textarea = editor.value
        const cursorPos = textarea.selectionStart
        const textBeforeCursor = content.value.substring(0, cursorPos)
        const lines = textBeforeCursor.split('\n')
        
        currentLine.value = lines.length
        currentColumn.value = lines[lines.length - 1].length + 1
      }
    }

    // 处理滚动同步
    const handleScroll = () => {
      if (editor.value && lineNumbers.value) {
        lineNumbers.value.scrollTop = editor.value.scrollTop
      }
    }

    // 处理右键菜单
    const handleContextMenu = (event) => {
      event.preventDefault()
      contextMenu.value.visible = true
      contextMenu.value.x = event.clientX
      contextMenu.value.y = event.clientY
    }

    // 隐藏右键菜单
    const hideContextMenu = () => {
      contextMenu.value.visible = false
    }

    // 复制文本
    const copyText = async () => {
      if (editor.value) {
        const selectedText = editor.value.value.substring(
          editor.value.selectionStart,
          editor.value.selectionEnd
        )
        if (selectedText) {
          try {
            await navigator.clipboard.writeText(selectedText)
          } catch (err) {
            console.error('复制失败:', err)
          }
        }
      }
      hideContextMenu()
    }

    // 剪切文本
    const cutText = async () => {
      if (editor.value) {
        const start = editor.value.selectionStart
        const end = editor.value.selectionEnd
        const selectedText = editor.value.value.substring(start, end)
        
        if (selectedText) {
          try {
            await navigator.clipboard.writeText(selectedText)
            // 删除选中的文本
            content.value = content.value.substring(0, start) + content.value.substring(end)
            // 设置光标位置
            nextTick(() => {
              editor.value.setSelectionRange(start, start)
              editor.value.focus()
            })
          } catch (err) {
            console.error('剪切失败:', err)
          }
        }
      }
      hideContextMenu()
    }

    // 粘贴文本
    const pasteText = async () => {
      if (editor.value) {
        try {
          const clipboardText = await navigator.clipboard.readText()
          const start = editor.value.selectionStart
          const end = editor.value.selectionEnd
          
          // 在光标位置插入文本
          content.value = content.value.substring(0, start) + clipboardText + content.value.substring(end)
          
          // 设置光标位置到插入文本的末尾
          nextTick(() => {
            const newPosition = start + clipboardText.length
            editor.value.setSelectionRange(newPosition, newPosition)
            editor.value.focus()
          })
        } catch (err) {
          console.error('粘贴失败:', err)
        }
      }
      hideContextMenu()
    }

    // 全选
    const selectAll = () => {
      if (editor.value) {
        editor.value.select()
        editor.value.focus()
      }
      hideContextMenu()
    }

    // 查找替换（简单实现）
    const findReplace = () => {
      const searchText = prompt('请输入要查找的文本:')
      if (searchText) {
        const replaceText = prompt('请输入替换文本（留空则只查找）:')
        if (replaceText !== null) {
          if (replaceText === '') {
            // 只查找
            const index = content.value.indexOf(searchText)
            if (index !== -1) {
              editor.value.setSelectionRange(index, index + searchText.length)
              editor.value.focus()
            } else {
              alert('未找到指定文本')
            }
          } else {
            // 替换所有
            content.value = content.value.replaceAll(searchText, replaceText)
          }
        }
      }
      hideContextMenu()
    }

    // 插入日期时间
    const insertDateTime = () => {
      if (editor.value) {
        const now = new Date()
        const dateTimeString = now.toLocaleString('zh-CN')
        const start = editor.value.selectionStart
        
        // 在光标位置插入日期时间
        content.value = content.value.substring(0, start) + dateTimeString + content.value.substring(start)
        
        // 设置光标位置到插入文本的末尾
        nextTick(() => {
          const newPosition = start + dateTimeString.length
          editor.value.setSelectionRange(newPosition, newPosition)
          editor.value.focus()
        })
      }
      hideContextMenu()
    }

    // 显示字数统计详情
    const wordCountDetails = () => {
      const text = content.value
      const characters = text.length
      const charactersNoSpaces = text.replace(/\s/g, '').length
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      const lines = text.split('\n').length
      const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length
      
      alert(`字数统计详情：
字符数（含空格）: ${characters}
字符数（不含空格）: ${charactersNoSpaces}
词数: ${words}
行数: ${lines}
段落数: ${paragraphs}`)
      
      hideContextMenu()
    }

    // 保存小说
    const saveNovel = async () => {
      if (!selectedProjectId.value) {
        alert('请先选择一个项目')
        return
      }

      saving.value = true
      try {
        // 保存内容到本地存储
        const success = storageManager.saveProjectContent(selectedProjectId.value, content.value)
        
        if (success) {
          // 更新写作统计
          const wordCount = content.value.replace(/\s/g, '').length
          storageManager.updateTodayWriting(selectedProjectId.value, wordCount)
          
          // 更新保存时间
          lastSaveTime.value = new Date().toLocaleString('zh-CN')
          
          console.log('内容已保存')
        } else {
          throw new Error('保存失败')
        }
      } catch (error) {
        console.error('保存失败:', error)
        alert('保存失败，请重试')
      } finally {
        saving.value = false
      }
    }

    // 自动保存功能
    const autoSave = (() => {
      let timer = null
      return () => {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          if (content.value.trim()) {
            saveNovel()
          }
        }, 30000) // 30秒后自动保存
      }
    })()

    // 键盘快捷键
    const handleKeydown = (event) => {
      // 隐藏右键菜单
      if (contextMenu.value.visible) {
        hideContextMenu()
      }
      
      // Ctrl+S 保存
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        saveNovel()
      }
      // Ctrl+F 查找
      else if (event.ctrlKey && event.key === 'f') {
        event.preventDefault()
        findReplace()
      }
    }

    onMounted(() => {
      // 加载可用项目
      loadAvailableProjects()
      
      // 加载当前项目（如果有的话）
      const currentProject = storageManager.getCurrentProject()
      if (currentProject) {
        selectedProjectId.value = currentProject.id
        loadProjectContent(currentProject)
      }
      
      // 添加键盘事件监听
      document.addEventListener('keydown', handleKeydown)
      // 添加点击事件监听，用于隐藏右键菜单
      document.addEventListener('click', hideContextMenu)
      
      // 初始化内容缩进和光标位置
      nextTick(() => {
        initializeContent()
        updateCursorPosition()
      })
    })

    return {
      selectedProjectId,
      availableProjects,
      currentProjectName,
      content,
      saving,
      lastSaveTime,
      currentLine,
      currentColumn,
      wordCount,
      lineCount,
      editor,
      lineNumbers,
      contextMenu,
      handleContentChange,
      handleProjectChange,
      loadProjectContent,
      loadAvailableProjects,
      autoSaveContent,
      handleScroll,
      handleContextMenu,
      hideContextMenu,
      copyText,
      cutText,
      pasteText,
      selectAll,
      findReplace,
      insertDateTime,
      wordCountDetails,
      saveNovel,
      updateCursorPosition,
      handleKeyPress,
      initializeContent
    }
  }
}
</script>

<style scoped>
.novel-editor {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100vh;
  background: #f5f5f5;
  font-family: 'Microsoft YaHei', sans-serif;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.toolbar-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
}

.project-selector {
  font-size: 16px;
  font-weight: 500;
  border: 1px solid #ddd;
  outline: none;
  padding: 8px 12px;
  border-radius: 4px;
  background: #f8f9fa;
  min-width: 200px;
  transition: all 0.3s;
}

.project-selector:focus {
  background: #fff;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.current-project {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.word-count {
  font-size: 14px;
  color: #666;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
}

.save-btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.save-btn:hover:not(:disabled) {
  background: #0056b3;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.editor-container {
  flex: 1;
  display: flex;
  position: relative;
  background: #fff;
  margin: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  overflow: hidden;
}

.line-numbers {
  width: 60px;
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
  padding: 20px 0;
  overflow: hidden;
  user-select: none;
}

.line-number {
  height: 24px;
  line-height: 24px;
  text-align: center;
  font-size: 12px;
  color: #999;
  font-family: 'Consolas', 'Monaco', monospace;
}

.editor {
  flex: 1;
  border: none;
  outline: none;
  padding: 20px;
  font-size: 16px;
  line-height: 24px;
  font-family: 'Microsoft YaHei', sans-serif;
  resize: none;
  background: transparent;
}

.editor::placeholder {
  color: #ccc;
  font-style: italic;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
  color: #666;
}

.status-left {
  display: flex;
  gap: 20px;
}



/* 滚动条样式 */
.editor::-webkit-scrollbar {
  width: 8px;
}

.editor::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.editor::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.editor::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }
  
  .toolbar-right {
    justify-content: space-between;
  }
  
  .title-input {
    min-width: auto;
    width: 100%;
  }
  
  .editor-container {
    margin: 10px;
  }
  
  .line-numbers {
    width: 40px;
  }
  
  .editor {
    padding: 15px;
    font-size: 14px;
  }
}
</style>