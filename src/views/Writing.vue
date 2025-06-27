<template>
  <div class="writing-desktop-layout">
    <!-- 左侧章节导航栏 -->
    <aside class="chapter-sidebar" :class="{ collapsed: sidebarCollapsed }"
      @mouseenter="sidebarCollapsed = false"
      @mouseleave="sidebarCollapsed = true">
      <div class="sidebar-header">
        <span v-if="!sidebarCollapsed" class="sidebar-title">章节目录</span>
      </div>
      <div v-if="!sidebarCollapsed" class="chapter-list">
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
        <button @click="addChapter" class="add-chapter-btn">
          <PlusIcon class="icon" /> 添加章节
        </button>
      </div>
      <div v-else class="sidebar-collapsed-bar"></div>
    </aside>

    <div class="writing-main-area">
      <!-- 顶部操作栏 -->
      <header class="writing-main-header">
        <div class="header-left">
          <button @click="goBack" class="back-btn">
            <ArrowLeftIcon class="icon" />
            <span class="btn-text">返回</span>
          </button>
          <div class="novel-info">
            <h1 class="novel-title">{{ currentNovel?.title || '未命名小说' }}</h1>
            <span class="word-count">{{ wordCount }} 字</span>
          </div>
        </div>
        <div class="header-right">
          <button @click="saveContent" class="save-btn" :disabled="!hasUnsavedChanges">
            <SaveIcon class="icon" />
            <span class="btn-text">{{ hasUnsavedChanges ? '保存' : '已保存' }}</span>
          </button>
          <button @click="togglePreview" class="tool-btn">
            <EyeIcon class="icon" />
            <span class="btn-text">{{ showPreview ? '隐藏预览' : '显示预览' }}</span>
          </button>
          <button @click="exportContent" class="tool-btn">
            <DownloadIcon class="icon" />
            <span class="btn-text">导出</span>
          </button>
          <button @click="toggleFullscreen" class="fullscreen-btn">
            <MaximizeIcon v-if="!isFullscreen" class="icon" />
            <MinimizeIcon v-else class="icon" />
            <span class="btn-text">{{ isFullscreen ? '退出全屏' : '全屏' }}</span>
          </button>
        </div>
      </header>

      <!-- 编辑器主区 -->
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
          <div v-if="showPreview" class="preview-panel">
            <div class="preview-content" v-html="formattedContent"></div>
          </div>
        </div>
      </main>

      <!-- 底部状态栏 -->
      <footer class="writing-status-bar">
        <div>章节：{{ currentChapterTitle }}</div>
        <div>总字数：{{ totalWordCount }}</div>
        <div>今日字数：{{ todayWordCount }}</div>
        <div v-if="hasUnsavedChanges" class="unsaved">有未保存更改</div>
        <div v-else class="saved">已保存</div>
      </footer>
    </div>
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
const currentNovel = ref<Novel | null>(null)
const chapters = ref<Chapter[]>([])
const currentChapter = ref<string>('')
const content = ref('')
const editorRef = ref<HTMLTextAreaElement>()
const hasUnsavedChanges = ref(false)
const isFullscreen = ref(false)
const sidebarCollapsed = ref(true)
const showPreview = ref(false)
const todayWordCount = ref(0)

const wordCount = computed(() => content.value.replace(/\s/g, '').length)
const totalWordCount = computed(() => chapters.value.reduce((total, chapter) => total + chapter.wordCount, 0))
const formattedContent = computed(() => content.value.replace(/\n/g, '<br>').replace(/^(\s{4,}|\t+)(.+)$/gm, '<div class="indent">$2</div>'))
const currentChapterTitle = computed(() => chapters.value.find(c => c.id === currentChapter.value)?.title || '')

onMounted(() => {
  loadCurrentNovel()
  loadTodayStats()
  document.addEventListener('keydown', handleKeyboard)
  setInterval(autoSave, 30000)
})
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboard)
})
watch(content, () => {
  hasUnsavedChanges.value = true
  updateChapterWordCount()
})

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
}
</script>

<style>
:root,
[data-theme='modern'] {
  --writing-bg: linear-gradient(135deg, #f8fafc 0%, #e9ecef 100%);
  --writing-header-bg: #fff;
  --writing-sidebar-bg: #f4f6fa;
  --writing-card-bg: #fff;
  --writing-border: #dee2e6;
  --writing-accent: #667eea;
  --writing-title: #2c3e50;
  --writing-subtitle: #7f8c8d;
  --writing-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
[data-theme='cyber'] {
  --writing-bg: linear-gradient(120deg, #0f2027 0%, #2c5364 100%);
  --writing-header-bg: rgba(20,20,40,0.95);
  --writing-sidebar-bg: #181828;
  --writing-card-bg: rgba(30,30,60,0.95);
  --writing-border: #00fff7;
  --writing-accent: #ff00cc;
  --writing-title: #00fff7;
  --writing-subtitle: #ff00cc;
  --writing-shadow: 0 0 16px #00fff7, 0 2px 8px rgba(0,0,0,0.3);
}
[data-theme='glass'] {
  --writing-bg: linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%);
  --writing-header-bg: rgba(255,255,255,0.7);
  --writing-sidebar-bg: rgba(255,255,255,0.5);
  --writing-card-bg: rgba(255,255,255,0.5);
  --writing-border: #b0c4de;
  --writing-accent: #66a6ff;
  --writing-title: #3a3a3a;
  --writing-subtitle: #6c757d;
  --writing-shadow: 0 8px 32px 0 rgba(31,38,135,0.18);
}

body, html, #app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  background: var(--writing-bg);
}

.writing-desktop-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  background: var(--writing-bg);
}
.chapter-sidebar {
  width: 260px;
  background: var(--writing-sidebar-bg);
  box-shadow: 2px 0 12px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 2.5rem 0 2rem 0;
  border-right: 2px solid var(--writing-border);
  z-index: 10;
  transition: width 0.22s cubic-bezier(.4,2,.6,1);
}
.chapter-sidebar.collapsed {
  width: 16px;
  min-width: 16px;
  padding: 2.5rem 0 2rem 0;
}
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0 1.2rem 1.2rem 1.2rem;
}
.sidebar-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--writing-accent);
  letter-spacing: 1px;
}
.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 1.2rem;
}
.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem 1.1rem;
  border-radius: 0.8rem;
  cursor: pointer;
  color: var(--writing-title);
  background: none;
  border: none;
  transition: background 0.18s, color 0.18s;
}
.chapter-item.active, .chapter-item:hover {
  background: var(--writing-accent);
  color: #fff;
}
.add-chapter-btn {
  margin-top: 1.2rem;
  padding: 0.6rem 1.2rem;
  border-radius: 0.8rem;
  border: none;
  background: var(--writing-accent);
  color: #fff;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.18s;
}
.add-chapter-btn:hover {
  background: var(--writing-title);
}

.writing-main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow: auto;
}
.writing-main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2.2rem 3vw 1.2rem 3vw;
  background: var(--writing-header-bg);
  border-bottom: 2px solid var(--writing-border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  position: sticky;
  top: 0;
  z-index: 2;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}
.novel-info {
  display: flex;
  align-items: baseline;
  gap: 1.2rem;
}
.novel-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--writing-title);
  letter-spacing: 1px;
}
.word-count {
  color: var(--writing-accent);
  font-size: 1.1rem;
}
.header-right {
  display: flex;
  gap: 1.2rem;
}
.save-btn, .tool-btn, .fullscreen-btn, .back-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.7rem 1.5rem;
  border: none;
  border-radius: 1rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  background: var(--writing-accent);
  color: #fff;
  box-shadow: var(--writing-shadow);
  transition: background 0.18s, color 0.18s;
}
.save-btn[disabled] {
  background: #b0b0b0;
  color: #fff;
  cursor: not-allowed;
}
.save-btn:hover:not([disabled]), .tool-btn:hover, .fullscreen-btn:hover, .back-btn:hover {
  background: var(--writing-title);
  color: #fff;
}

.editor-main {
  flex: 1;
  display: flex;
  align-items: stretch;
  background: var(--writing-bg);
  transition: background 0.5s;
}
.editor-container {
  flex: 1;
  display: flex;
  position: relative;
  height: 100%;
}
.editor {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 480px;
  font-size: 1.15rem;
  font-family: 'JetBrains Mono', 'Fira Mono', 'Consolas', 'Menlo', 'monospace', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif;
  padding: 2.2rem 2.5rem;
  border: none;
  outline: none;
  background: var(--writing-card-bg);
  color: var(--writing-title);
  border-radius: 1.5rem;
  box-shadow: var(--writing-shadow);
  resize: none;
  transition: background 0.3s, color 0.3s;
}
.preview-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 48%;
  height: 100%;
  background: var(--writing-card-bg);
  border-radius: 1.5rem;
  box-shadow: var(--writing-shadow);
  padding: 2.2rem 2.5rem;
  overflow-y: auto;
  z-index: 2;
  border-left: 2px solid var(--writing-border);
}
.preview-content {
  color: var(--writing-title);
  font-size: 1.1rem;
  line-height: 1.8;
}

.writing-status-bar {
  display: flex;
  align-items: center;
  gap: 2.5rem;
  padding: 1rem 2.5rem;
  background: var(--writing-header-bg);
  border-top: 2px solid var(--writing-border);
  color: var(--writing-subtitle);
  font-size: 1rem;
  min-height: 48px;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.04);
}
.writing-status-bar .unsaved {
  color: #dc3545;
  font-weight: bold;
}
.writing-status-bar .saved {
  color: var(--writing-accent);
  font-weight: bold;
}
.icon {
  width: 1.2rem;
  height: 1.2rem;
}

@media (max-width: 900px) {
  .writing-main-header .btn-text {
    display: none;
  }
  .writing-main-header button {
    padding-left: 0.7rem;
    padding-right: 0.7rem;
  }
}

/* 收起时显示竖条 */
.sidebar-collapsed-bar {
  width: 6px;
  height: 100%;
  background: var(--writing-accent);
  border-radius: 3px;
  margin: 0 auto;
}
</style> 