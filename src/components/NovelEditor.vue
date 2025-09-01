<template>
  <div class="novel-editor">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <input 
          v-model="novelTitle" 
          class="title-input" 
          placeholder="请输入小说标题..."
          @input="handleTitleChange"
        />
      </div>
      <div class="toolbar-right">
        <div class="word-count">
          字数: {{ wordCount }}
        </div>
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
      </div>
      <div class="status-right">
        <span>最后保存: {{ lastSaveTime }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue'
import ContextMenu from './ContextMenu.vue'

export default {
  name: 'NovelEditor',
  components: {
    ContextMenu
  },
  setup() {
    const novelTitle = ref('未命名小说')
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
      // 自动保存（可选）
      // autoSave()
    }

    // 处理标题变化
    const handleTitleChange = () => {
      // 可以在这里添加标题变化的处理逻辑
    }

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
      saving.value = true
      try {
        // 这里可以调用Electron的文件保存API
        // 或者发送到后端保存
        const novelData = {
          title: novelTitle.value,
          content: content.value,
          wordCount: wordCount.value,
          lastModified: new Date().toISOString()
        }
        
        // 模拟保存过程
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // 更新保存时间
        lastSaveTime.value = new Date().toLocaleString('zh-CN')
        
        console.log('小说已保存:', novelData)
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
      // 添加键盘事件监听
      document.addEventListener('keydown', handleKeydown)
      // 添加点击事件监听，用于隐藏右键菜单
      document.addEventListener('click', hideContextMenu)
      
      // 初始化光标位置
      nextTick(() => {
        updateCursorPosition()
      })
    })

    return {
      novelTitle,
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
      handleTitleChange,
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
      updateCursorPosition
    }
  }
}
</script>

<style scoped>
.novel-editor {
  display: flex;
  flex-direction: column;
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
}

.title-input {
  font-size: 18px;
  font-weight: bold;
  border: none;
  outline: none;
  padding: 8px 12px;
  border-radius: 4px;
  background: #f8f9fa;
  min-width: 300px;
  transition: background-color 0.3s;
}

.title-input:focus {
  background: #fff;
  box-shadow: 0 0 0 2px #007bff;
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