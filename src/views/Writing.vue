<template>
  <WritingLayout>
    <div class="writing-desktop-layout">
      <!-- 左侧章节导航栏 -->
      <aside class="chapter-sidebar" :class="{ collapsed: sidebarCollapsed }"
        @mouseenter="sidebarCollapsed = false"
        @mouseleave="handleSidebarLeave">
        <div class="sidebar-header">
          <span v-if="!sidebarCollapsed" class="sidebar-title">章节目录</span>
        </div>
        <div v-if="!sidebarCollapsed" class="chapter-list">
          <!-- 显示卷和章节的层级结构 -->
          <div v-for="volume in volumes" :key="volume.id" class="volume-section">
            <div class="volume-header">
              <span class="volume-title">{{ volume.title }}</span>
              <span class="volume-count">{{ volume.chapters.length }}章</span>
            </div>
            <div class="volume-chapters">
              <div 
                v-for="chapter in volume.chapters" 
                :key="chapter.id"
                class="chapter-item"
                :class="{ active: currentChapter === chapter.id }"
              >
                <template v-if="editingChapterId === chapter.id">
                  <input
                    class="chapter-edit-input"
                    v-model="editingChapterTitle"
                    @keydown.enter="saveChapterTitle(chapter)"
                    @keydown.esc="cancelEditChapter"
                    @blur="saveChapterTitle(chapter)"
                    ref="editInputRef"
                    maxlength="30"
                    :placeholder="chapter.title"
                    autofocus
                  />
                  <button class="chapter-edit-confirm" @mousedown.prevent="saveChapterTitle(chapter)">
                    <CheckIcon class="icon" />
                  </button>
                  <button class="chapter-edit-cancel" @mousedown.prevent="cancelEditChapter">
                    <XIcon class="icon" />
                  </button>
                </template>
                <template v-else>
                  <span class="chapter-title" @dblclick="startEditChapter(chapter)" @click="switchChapter(chapter.id)">
                    {{ chapter.title }}
                  </span>
                  <span class="chapter-words">{{ formatWordCount(chapter.wordCount) }}</span>
                  <button class="chapter-edit-btn" @click.stop="startEditChapter(chapter)">
                    <EditIcon class="icon" />
                  </button>
                </template>
              </div>
            </div>
          </div>

          <!-- 未分类章节 -->
          <div v-if="unassignedChapters.length > 0" class="volume-section">
            <div class="volume-header">
              <span class="volume-title">未分类章节</span>
              <span class="volume-count">{{ unassignedChapters.length }}章</span>
            </div>
            <div class="volume-chapters">
              <div 
                v-for="chapter in unassignedChapters" 
                :key="chapter.id"
                class="chapter-item"
                :class="{ active: currentChapter === chapter.id }"
              >
                <template v-if="editingChapterId === chapter.id">
                  <input
                    class="chapter-edit-input"
                    v-model="editingChapterTitle"
                    @keydown.enter="saveChapterTitle(chapter)"
                    @keydown.esc="cancelEditChapter"
                    @blur="saveChapterTitle(chapter)"
                    ref="editInputRef"
                    maxlength="30"
                    :placeholder="chapter.title"
                    autofocus
                  />
                  <button class="chapter-edit-confirm" @mousedown.prevent="saveChapterTitle(chapter)">
                    <CheckIcon class="icon" />
                  </button>
                  <button class="chapter-edit-cancel" @mousedown.prevent="cancelEditChapter">
                    <XIcon class="icon" />
                  </button>
                </template>
                <template v-else>
                  <span class="chapter-title" @dblclick="startEditChapter(chapter)" @click="switchChapter(chapter.id)">
                    {{ chapter.title }}
                  </span>
                  <span class="chapter-words">{{ formatWordCount(chapter.wordCount) }}</span>
                  <button class="chapter-edit-btn" @click.stop="startEditChapter(chapter)">
                    <EditIcon class="icon" />
                  </button>
                </template>
              </div>
            </div>
          </div>

          <button @click="() => addChapter()" class="add-chapter-btn">
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
  </WritingLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import WritingLayout from '../components/WritingLayout.vue'
import {
  ArrowLeftIcon,
  SaveIcon,
  MaximizeIcon,
  MinimizeIcon,
  PlusIcon,
  EyeIcon,
  DownloadIcon,
  EditIcon,
  CheckIcon,
  XIcon
} from 'lucide-vue-next'

interface Chapter {
  id: string
  title: string
  content: string
  number: string
  volumeId?: string
  wordCount: number
  lastEdit: Date
  createdAt: Date
}

interface Volume {
  id: string
  title: string
  description?: string
  chapters: Chapter[]
  createdAt: Date
}

interface Novel {
  id: string
  title: string
  description?: string
  genre?: string
  cover?: string
  wordCount: number
  lastEdit: Date
  createdAt: Date
  volumes: Volume[]
}

const router = useRouter()
const currentNovel = ref<Novel | null>(null)
const volumes = ref<Volume[]>([])
const currentChapter = ref<string>('')
const content = ref('')
const editorRef = ref<HTMLTextAreaElement>()
const hasUnsavedChanges = ref(false)
const isFullscreen = ref(false)
const sidebarCollapsed = ref(true)
const showPreview = ref(false)
const todayWordCount = ref(0)
const editingChapterId = ref<string | null>(null)
const editingChapterTitle = ref('')
const editInputRef = ref<HTMLInputElement>()

const wordCount = computed(() => content.value.replace(/\s/g, '').length)
const totalWordCount = computed(() => {
  const allChapters = volumes.value.flatMap(v => v.chapters)
  return allChapters.reduce((total, chapter) => total + chapter.wordCount, 0)
})
const formattedContent = computed(() => content.value.replace(/\n/g, '<br>').replace(/^(\s{4,}|\t+)(.+)$/gm, '<div class="indent">$2</div>'))
const currentChapterTitle = computed(() => {
  const allChapters = volumes.value.flatMap(v => v.chapters)
  return allChapters.find(c => c.id === currentChapter.value)?.title || ''
})
const unassignedChapters = computed(() => {
  const allChapters = volumes.value.flatMap(v => v.chapters)
  return allChapters.filter(c => !c.volumeId)
})

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
  // 从小说数据中加载卷和章节
  if (currentNovel.value && currentNovel.value.volumes) {
    volumes.value = currentNovel.value.volumes.map((v: any) => ({
      ...v,
      createdAt: new Date(v.createdAt),
      chapters: v.chapters ? v.chapters.map((c: any) => ({
        ...c,
        lastEdit: new Date(c.lastEdit),
        createdAt: new Date(c.createdAt)
      })) : []
    }))
  }
  
  // 如果没有章节，创建默认的第一章
  const allChapters = volumes.value.flatMap(v => v.chapters)
  if (allChapters.length === 0) {
    addChapter('第一章')
  } else {
    // 检查是否有指定的章节ID
    const targetChapterId = localStorage.getItem('currentChapterId')
    if (targetChapterId) {
      const targetChapter = allChapters.find(c => c.id === targetChapterId)
      if (targetChapter) {
        switchChapter(targetChapter.id)
        localStorage.removeItem('currentChapterId') // 清除，避免影响后续操作
        return
      }
    }
    // 默认加载第一章内容
    switchChapter(allChapters[0].id)
  }
}

const addChapter = (title?: string) => {
  const newChapter: Chapter = {
    id: Date.now().toString(),
    title: title || `第${volumes.value.flatMap(v => v.chapters).length + 1}章`,
    content: '',
    number: generateChapterNumber(),
    wordCount: 0,
    lastEdit: new Date(),
    createdAt: new Date()
  }
  
  // 添加到第一个卷，如果没有卷则创建默认卷
  if (volumes.value.length === 0) {
    const defaultVolume: Volume = {
      id: Date.now().toString(),
      title: '第一卷',
      chapters: [newChapter],
      createdAt: new Date()
    }
    volumes.value.push(defaultVolume)
  } else {
    volumes.value[0].chapters.push(newChapter)
  }
  
  saveNovel()
  switchChapter(newChapter.id)
}

const switchChapter = (chapterId: string) => {
  // 保存当前章节内容
  if (currentChapter.value) {
    saveCurrentChapter()
  }
  
  currentChapter.value = chapterId
  const allChapters = volumes.value.flatMap(v => v.chapters)
  const chapter = allChapters.find(c => c.id === chapterId)
  if (chapter) {
    content.value = chapter.content
    hasUnsavedChanges.value = false
  }
}

const saveCurrentChapter = () => {
  const allChapters = volumes.value.flatMap(v => v.chapters)
  const chapter = allChapters.find(c => c.id === currentChapter.value)
  if (chapter) {
    chapter.content = content.value
    chapter.wordCount = wordCount.value
    chapter.lastEdit = new Date()
  }
}

const saveContent = () => {
  saveCurrentChapter()
  saveNovel()
  updateNovelStats()
  hasUnsavedChanges.value = false
}

const saveNovel = () => {
  if (!currentNovel.value) return
  
  currentNovel.value.volumes = volumes.value
  currentNovel.value.lastEdit = new Date()
  
  const stored = localStorage.getItem('novels')
  const novels = stored ? JSON.parse(stored) : []
  const novelIndex = novels.findIndex((n: any) => n.id === currentNovel.value!.id)
  
  if (novelIndex !== -1) {
    novels[novelIndex] = currentNovel.value
  }
  
  localStorage.setItem('novels', JSON.stringify(novels))
}

const updateNovelStats = () => {
  if (!currentNovel.value) return
  
  currentNovel.value.wordCount = totalWordCount.value
  currentNovel.value.lastEdit = new Date()
  
  const novels = JSON.parse(localStorage.getItem('novels') || '[]')
  const novelIndex = novels.findIndex((n: Novel) => n.id === currentNovel.value!.id)
  
  if (novelIndex >= 0) {
    novels[novelIndex] = currentNovel.value
    localStorage.setItem('novels', JSON.stringify(novels))
  }
}

const updateChapterWordCount = () => {
  const allChapters = volumes.value.flatMap(v => v.chapters)
  const chapter = allChapters.find(c => c.id === currentChapter.value)
  if (chapter) {
    chapter.wordCount = wordCount.value
  }
}

const generateChapterNumber = (): string => {
  const allChapters = volumes.value.flatMap(v => v.chapters)
  return `第${allChapters.length + 1}章`
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
  const allChapters = volumes.value.flatMap(v => v.chapters)
  const sortedChapters = allChapters.sort((a, b) => {
    const aNum = parseInt(a.number.match(/\d+/)?.[0] || '0')
    const bNum = parseInt(b.number.match(/\d+/)?.[0] || '0')
    return aNum - bNum
  })
  
  const allContent = sortedChapters
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

function startEditChapter(chapter: Chapter) {
  editingChapterId.value = chapter.id
  editingChapterTitle.value = chapter.title
  // 确保侧边栏展开以便编辑
  sidebarCollapsed.value = false
  nextTick(() => {
    editInputRef.value?.focus()
  })
}

function saveChapterTitle(chapter: Chapter) {
  const newTitle = editingChapterTitle.value.trim()
  if (newTitle && newTitle !== chapter.title) {
    chapter.title = newTitle
    saveNovel()
  }
  editingChapterId.value = null
  // 编辑结束后，允许侧边栏正常收缩
}

function cancelEditChapter() {
  editingChapterId.value = null
  // 取消编辑后，允许侧边栏正常收缩
}

function handleSidebarLeave() {
  // 如果正在编辑章节标题，不要收缩侧边栏
  if (editingChapterId.value) {
    return
  }
  sidebarCollapsed.value = true
}

const formatWordCount = (count: number): string => {
  if (count < 1000) return `${count}字`
  if (count < 10000) return `${(count / 1000).toFixed(1)}千字`
  return `${(count / 10000).toFixed(1)}万字`
}
</script>

<style scoped>
.writing-desktop-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  background: var(--main-bg);
}

.chapter-sidebar {
  width: 260px;
  background: var(--sidebar-bg);
  box-shadow: 2px 0 12px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 2.5rem 0 2rem 0;
  border-right: 2px solid var(--border);
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
  color: var(--accent);
  letter-spacing: 1px;
}

.chapter-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 1.2rem;
}

.volume-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.volume-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.volume-title {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--title-color);
  letter-spacing: 0.5px;
}

.volume-count {
  color: var(--accent);
  font-size: 0.9rem;
}

.volume-chapters {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding-left: 1rem;
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.7rem 1.1rem;
  border-radius: 0.8rem;
  cursor: pointer;
  color: var(--title-color);
  background: none;
  border: none;
  transition: background 0.18s, color 0.18s;
  position: relative;
}

.chapter-item.active, .chapter-item:hover {
  background: var(--accent);
  color: #fff;
}

.add-chapter-btn {
  margin-top: 1.2rem;
  padding: 0.6rem 1.2rem;
  border-radius: 0.8rem;
  border: none;
  background: var(--accent);
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
  background: var(--title-color);
}

.chapter-title {
  flex: 1;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-edit-btn {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  margin-left: 0.5rem;
  padding: 0.2rem 0.3rem;
  border-radius: 0.5rem;
  transition: background 0.15s;
}

.chapter-edit-btn:hover {
  background: var(--accent);
  color: #fff;
}

.chapter-edit-input {
  flex: 1;
  font-size: 1rem;
  border: 1.5px solid var(--accent);
  border-radius: 0.5rem;
  padding: 0.3rem 0.7rem;
  outline: none;
  color: var(--title-color);
  background: var(--card-bg);
  margin-right: 0.5rem;
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
  background: var(--header-bg);
  border-bottom: 2px solid var(--border);
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
  color: var(--title-color);
  letter-spacing: 1px;
}

.word-count {
  color: var(--accent);
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
  background: var(--accent);
  color: #fff;
  box-shadow: var(--card-shadow);
  transition: background 0.18s, color 0.18s;
}

.save-btn[disabled] {
  background: #b0b0b0;
  color: #fff;
  cursor: not-allowed;
}

.save-btn:hover:not([disabled]), .tool-btn:hover, .fullscreen-btn:hover, .back-btn:hover {
  background: var(--title-color);
  color: #fff;
}

.editor-main {
  flex: 1;
  display: flex;
  align-items: stretch;
  background: var(--main-bg);
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
  background: var(--card-bg);
  color: var(--title-color);
  border-radius: 1.5rem;
  box-shadow: var(--card-shadow);
  resize: none;
  transition: background 0.3s, color 0.3s;
}

.preview-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 48%;
  height: 100%;
  background: var(--card-bg);
  border-radius: 1.5rem;
  box-shadow: var(--card-shadow);
  padding: 2.2rem 2.5rem;
  overflow-y: auto;
  z-index: 2;
  border-left: 2px solid var(--border);
}

.preview-content {
  color: var(--title-color);
  font-size: 1.1rem;
  line-height: 1.8;
}

.writing-status-bar {
  display: flex;
  align-items: center;
  gap: 2.5rem;
  padding: 1rem 2.5rem;
  background: var(--header-bg);
  border-top: 2px solid var(--border);
  color: var(--subtitle-color);
  font-size: 1rem;
  min-height: 48px;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.04);
}

.writing-status-bar .unsaved {
  color: #dc3545;
  font-weight: bold;
}

.writing-status-bar .saved {
  color: var(--accent);
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
  background: var(--accent);
  border-radius: 3px;
  margin: 0 auto;
}

.chapter-edit-confirm, .chapter-edit-cancel {
  background: none;
  border: none;
  color: var(--accent);
  cursor: pointer;
  margin-left: 0.2rem;
  padding: 0.3rem 0.4rem;
  border-radius: 0.5rem;
  transition: background 0.15s;
  min-width: 24px;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.chapter-edit-confirm:hover {
  background: #4caf50;
  color: #fff;
}

.chapter-edit-cancel:hover {
  background: #dc3545;
  color: #fff;
}

/* 编辑模式下的特殊样式 */
.chapter-item:has(.chapter-edit-input) {
  background: var(--card-bg);
  border: 1px solid var(--accent);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.chapter-edit-input {
  flex: 1;
  font-size: 1rem;
  border: 1.5px solid var(--accent);
  border-radius: 0.5rem;
  padding: 0.3rem 0.7rem;
  outline: none;
  color: var(--title-color);
  background: var(--card-bg);
  margin-right: 0.5rem;
  min-width: 120px;
}
</style> 