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

export default {
  name: 'NovelEditor',
  setup() {
    const novelTitle = ref('未命名小说')
    const content = ref('')
    const saving = ref(false)
    const lastSaveTime = ref('从未保存')
    const currentLine = ref(1)
    const currentColumn = ref(1)
    const editor = ref(null)
    const lineNumbers = ref(null)

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
      // Ctrl+S 保存
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault()
        saveNovel()
      }
    }

    onMounted(() => {
      // 添加键盘事件监听
      document.addEventListener('keydown', handleKeydown)
      
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
      handleContentChange,
      handleTitleChange,
      handleScroll,
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