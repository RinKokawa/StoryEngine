<template>
  <div class="writing-container">
    <!-- 顶部工具栏 -->
    <header class="writing-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn">
          <ArrowLeftIcon class="icon" />
          返回
        </button>
        <div class="novel-info">
          <h1 class="novel-title">{{ currentNovel?.title || '未命名小说' }}</h1>
          <span class="word-count">{{ wordCount }} 字</span>
        </div>
      </div>
      <div class="header-right">
        <button @click="saveContent" class="save-btn" :disabled="!hasUnsavedChanges">
          <SaveIcon class="icon" />
          {{ hasUnsavedChanges ? '保存' : '已保存' }}
        </button>
        <button @click="toggleFullscreen" class="fullscreen-btn">
          <MaximizeIcon v-if="!isFullscreen" class="icon" />
          <MinimizeIcon v-else class="icon" />
        </button>
      </div>
    </header>

    <!-- 编辑器区域 -->
    <main class="editor-main" :class="{ fullscreen: isFullscreen }">
      <div class="editor-container">
        <textarea
          ref="editorRef"
          v-model="content"
          @input="onContentChange"
          @scroll="syncScroll"
          class="editor"
          placeholder="开始你的创作..."
          spellcheck="false"
        ></textarea>
        
        <!-- 预览面板（可选） -->
        <div v-if="showPreview" class="preview-panel">
          <div class="preview-content" v-html="formattedContent"></div>
        </div>
      </div>
    </main>

    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <button @click="toggleSidebar" class="toggle-btn">
          <ChevronLeftIcon v-if="!sidebarCollapsed" class="icon" />
          <ChevronRightIcon v-else class="icon" />
        </button>
      </div>
      
      <div v-if="!sidebarCollapsed" class="sidebar-content">
        <!-- 章节列表 -->
        <div class="sidebar-section">
          <h3>章节目录</h3>
          <div class="chapter-list">
            <div 
              v-for="chapter in chapters" 
              :key="chapter.id"
              class="chapter-item"
              :class="{ active: currentChapter === chapter.id }"
              @click="switchChapter(chapter.id)"
            >
              <span class="chapter-title">{{ chapter.title }}</span>
              <span class="chapter-words">{{ chapter.wordCount }}字</span>
            </div>
            <button @click="() => addChapter()" class="add-chapter-btn">
              <PlusIcon class="icon" />
              添加章节
            </button>
          </div>
        </div>

        <!-- 写作统计 -->
        <div class="sidebar-section">
          <h3>写作统计</h3>
          <div class="writing-stats">
            <div class="stat-item">
              <span class="stat-label">今日字数</span>
              <span class="stat-value">{{ todayWordCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">总字数</span>
              <span class="stat-value">{{ totalWordCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">章节数</span>
              <span class="stat-value">{{ chapters.length }}</span>
            </div>
          </div>
        </div>

        <!-- 快速工具 -->
        <div class="sidebar-section">
          <h3>工具</h3>
          <div class="tools">
            <button @click="togglePreview" class="tool-btn">
              <EyeIcon class="icon" />
              {{ showPreview ? '隐藏预览' : '显示预览' }}
            </button>
            <button @click="exportContent" class="tool-btn">
              <DownloadIcon class="icon" />
              导出
            </button>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowLeftIcon,
  SaveIcon,
  MaximizeIcon,
  MinimizeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  EyeIcon,
  DownloadIcon
} from 'lucide-vue-next'

interface Novel {
  id: string
  title: string
  description?: string
  genre?: string
  wordCount: number
  lastEdit: Date
  createdAt: Date
}

interface Chapter {
  id: string
  title: string
  content: string
  wordCount: number
  order: number
}

const router = useRouter()

// 响应式数据
const currentNovel = ref<Novel | null>(null)
const chapters = ref<Chapter[]>([])
const currentChapter = ref<string>('')
const content = ref('')
const editorRef = ref<HTMLTextAreaElement>()
const hasUnsavedChanges = ref(false)
const isFullscreen = ref(false)
const sidebarCollapsed = ref(false)
const showPreview = ref(false)
const todayWordCount = ref(0)

// 计算属性
const wordCount = computed(() => {
  return content.value.replace(/\s/g, '').length
})

const totalWordCount = computed(() => {
  return chapters.value.reduce((total, chapter) => total + chapter.wordCount, 0)
})

const formattedContent = computed(() => {
  return content.value
    .replace(/\n/g, '<br>')
    .replace(/^(\s{4,}|\t+)(.+)$/gm, '<div class="indent">$2</div>')
})

// 生命周期
onMounted(() => {
  loadCurrentNovel()
  loadTodayStats()
  
  // 监听键盘快捷键
  document.addEventListener('keydown', handleKeyboard)
  
  // 自动保存
  setInterval(autoSave, 30000) // 每30秒自动保存
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboard)
})

// 监听内容变化
watch(content, () => {
  hasUnsavedChanges.value = true
  updateChapterWordCount()
})

// 方法
const loadCurrentNovel = () => {
  const novelId = localStorage.getItem('currentNovelId')
  if (!novelId) {
    router.push('/')
    return
  }

  const novels = JSON.parse(localStorage.getItem('novels') || '[]')
  currentNovel.value = novels.find((n: Novel) => n.id === novelId)
  
  if (!currentNovel.value) {
    router.push('/')
    return
  }

  loadChapters(novelId)
}

const loadChapters = (novelId: string) => {
  const stored = localStorage.getItem(`chapters_${novelId}`)
  if (stored) {
    chapters.value = JSON.parse(stored)
  }
  
  if (chapters.value.length === 0) {
    // 创建第一章
    addChapter('第一章')
  } else {
    // 加载第一章内容
    switchChapter(chapters.value[0].id)
  }
}

const addChapter = (title?: string) => {
  const newChapter: Chapter = {
    id: Date.now().toString(),
    title: title || `第${chapters.value.length + 1}章`,
    content: '',
    wordCount: 0,
    order: chapters.value.length
  }
  
  chapters.value.push(newChapter)
  saveChapters()
  switchChapter(newChapter.id)
}

const switchChapter = (chapterId: string) => {
  // 保存当前章节内容
  if (currentChapter.value) {
    saveCurrentChapter()
  }
  
  currentChapter.value = chapterId
  const chapter = chapters.value.find(c => c.id === chapterId)
  if (chapter) {
    content.value = chapter.content
    hasUnsavedChanges.value = false
  }
}

const saveCurrentChapter = () => {
  const chapter = chapters.value.find(c => c.id === currentChapter.value)
  if (chapter) {
    chapter.content = content.value
    chapter.wordCount = wordCount.value
  }
}

const saveContent = () => {
  saveCurrentChapter()
  saveChapters()
  updateNovelStats()
  hasUnsavedChanges.value = false
}

const saveChapters = () => {
  if (currentNovel.value) {
    localStorage.setItem(`chapters_${currentNovel.value.id}`, JSON.stringify(chapters.value))
  }
}

const updateNovelStats = () => {
  if (!currentNovel.value) return
  
  const novels = JSON.parse(localStorage.getItem('novels') || '[]')
  const novelIndex = novels.findIndex((n: Novel) => n.id === currentNovel.value!.id)
  
  if (novelIndex >= 0) {
    novels[novelIndex].wordCount = totalWordCount.value
    novels[novelIndex].lastEdit = new Date()
    localStorage.setItem('novels', JSON.stringify(novels))
    currentNovel.value = novels[novelIndex]
  }
}

const updateChapterWordCount = () => {
  const chapter = chapters.value.find(c => c.id === currentChapter.value)
  if (chapter) {
    chapter.wordCount = wordCount.value
  }
}

const autoSave = () => {
  if (hasUnsavedChanges.value) {
    saveContent()
  }
}

const goBack = () => {
  if (hasUnsavedChanges.value) {
    if (confirm('有未保存的内容，确定要离开吗？')) {
      saveContent()
      router.push('/')
    }
  } else {
    router.push('/')
  }
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

const exportContent = () => {
  const allContent = chapters.value
    .sort((a, b) => a.order - b.order)
    .map(chapter => `${chapter.title}\n\n${chapter.content}`)
    .join('\n\n---\n\n')
  
  const blob = new Blob([allContent], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${currentNovel.value?.title || '小说'}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

const loadTodayStats = () => {
  const today = new Date().toDateString()
  const stored = localStorage.getItem(`dailyStats_${today}`)
  if (stored) {
    const stats = JSON.parse(stored)
    todayWordCount.value = stats.wordCount || 0
  }
}

const onContentChange = () => {
  // 更新今日字数统计
  const today = new Date().toDateString()
  const stored = localStorage.getItem(`dailyStats_${today}`)
  const stats = stored ? JSON.parse(stored) : { wordCount: 0 }
  
  // 简单的字数增量统计
  if (content.value.length > (stats.lastLength || 0)) {
    const increment = content.value.length - (stats.lastLength || 0)
    stats.wordCount = (stats.wordCount || 0) + increment
    todayWordCount.value = stats.wordCount
  }
  
  stats.lastLength = content.value.length
  localStorage.setItem(`dailyStats_${today}`, JSON.stringify(stats))
}

const syncScroll = () => {
  // 同步滚动预览面板
  if (showPreview.value && editorRef.value) {
    // TODO: 实现预览面板同步滚动
  }
}

const handleKeyboard = (e: KeyboardEvent) => {
  // Ctrl+S 保存
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    saveContent()
  }
  
  // F11 全屏
  if (e.key === 'F11') {
    e.preventDefault()
    toggleFullscreen()
  }
  
  // Ctrl+B 切换侧边栏
  if (e.ctrlKey && e.key === 'b') {
    e.preventDefault()
    toggleSidebar()
  }
}
</script>

<style scoped>
.writing-container {
  display: flex;
  height: 100vh;
  flex-direction: column;
  background: #fafafa;
}

.writing-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: none;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f8f9fa;
}

.novel-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.novel-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.word-count {
  font-size: 0.875rem;
  color: #6c757d;
}

.header-right {
  display: flex;
  gap: 0.75rem;
}

.save-btn,
.fullscreen-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
}

.save-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.fullscreen-btn {
  background: #f8f9fa;
  color: #495057;
  border: 1px solid #dee2e6;
}

.fullscreen-btn:hover {
  background: #e9ecef;
}

.editor-main {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-main.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: white;
}

.editor-container {
  flex: 1;
  display: flex;
  position: relative;
}

.editor {
  flex: 1;
  border: none;
  outline: none;
  padding: 3rem;
  font-family: 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 1.2rem;
  line-height: 2;
  color: #2c3e50;
  background: white;
  resize: none;
  max-width: none;
}

.editor:focus {
  background: #fff;
}

.preview-panel {
  flex: 1;
  padding: 3rem;
  background: #f8f9fa;
  border-left: 1px solid #dee2e6;
  overflow-y: auto;
  max-width: none;
}

.preview-content {
  font-family: 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: 1.1rem;
  line-height: 1.8;
  color: #2c3e50;
}

.sidebar {
  width: 350px;
  background: white;
  border-left: 1px solid #dee2e6;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.sidebar.collapsed {
  width: 50px;
}

.sidebar-header {
  padding: 1rem;
  border-bottom: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-start;
}

.toggle-btn {
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.toggle-btn:hover {
  background: #f8f9fa;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.sidebar-section {
  margin-bottom: 2rem;
}

.sidebar-section h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.chapter-item:hover {
  background: #f8f9fa;
}

.chapter-item.active {
  background: #e3f2fd;
  color: #1976d2;
}

.chapter-title {
  font-weight: 500;
}

.chapter-words {
  font-size: 0.75rem;
  color: #6c757d;
}

.add-chapter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px dashed #ced4da;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  color: #6c757d;
  transition: all 0.2s;
}

.add-chapter-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.writing-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 0.875rem;
  color: #6c757d;
}

.stat-value {
  font-weight: 600;
  color: #2c3e50;
}

.tools {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  color: #495057;
  transition: all 0.2s;
  text-align: left;
}

.tool-btn:hover {
  background: #f8f9fa;
}

.icon {
  width: 1rem;
  height: 1rem;
}

.indent {
  padding-left: 2rem;
}
</style> 