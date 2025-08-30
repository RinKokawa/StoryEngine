<template>
  <aside class="chapter-sidebar" :class="{ collapsed: collapsed }"
    @mouseenter="$emit('expand')"
    @mouseleave="handleMouseLeave">
    <div class="sidebar-header">
      <span v-if="!collapsed" class="sidebar-title">章节目录</span>
    </div>
    <div v-if="!collapsed" class="chapter-list">
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
            :class="{ active: currentChapterId === chapter.id }"
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
              <span class="chapter-title" @dblclick="startEditChapter(chapter)" @click="$emit('switchChapter', chapter.id)">
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

      <button @click="$emit('addChapter')" class="add-chapter-btn">
        <PlusIcon class="icon" /> 添加章节
      </button>
    </div>
    <div v-else class="sidebar-collapsed-bar"></div>
  </aside>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Chapter, Volume } from '../../domain/entities/Novel'
import { useChapter } from '../../application/composables/useChapter'
import {
  PlusIcon,
  EditIcon,
  CheckIcon,
  XIcon
} from 'lucide-vue-next'

interface Props {
  volumes: Volume[]
  currentChapterId: string | null
  collapsed: boolean
}

interface Emits {
  (e: 'expand'): void
  (e: 'collapse'): void
  (e: 'switchChapter', chapterId: string): void
  (e: 'addChapter'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const { updateChapterTitle } = useChapter()

const editingChapterId = ref<string | null>(null)
const editingChapterTitle = ref('')
const editInputRef = ref<HTMLInputElement>()

const formatWordCount = (count: number): string => {
  if (count < 1000) return `${count}字`
  if (count < 10000) return `${(count / 1000).toFixed(1)}千字`
  return `${(count / 10000).toFixed(1)}万字`
}

const startEditChapter = (chapter: Chapter) => {
  editingChapterId.value = chapter.id
  editingChapterTitle.value = chapter.title
  emit('expand') // 确保侧边栏展开以便编辑
  nextTick(() => {
    editInputRef.value?.focus()
  })
}

const saveChapterTitle = async (chapter: Chapter) => {
  const newTitle = editingChapterTitle.value.trim()
  if (newTitle && newTitle !== chapter.title) {
    try {
      await updateChapterTitle(chapter.id, newTitle)
    } catch (error) {
      console.error('更新章节标题失败:', error)
    }
  }
  editingChapterId.value = null
}

const cancelEditChapter = () => {
  editingChapterId.value = null
}

const handleMouseLeave = () => {
  // 如果正在编辑章节标题，不要收缩侧边栏
  if (editingChapterId.value) {
    return
  }
  emit('collapse')
}
</script>

<style scoped>
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

.chapter-title {
  flex: 1;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chapter-words {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-left: 0.5rem;
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
  min-width: 120px;
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
}

.chapter-edit-confirm:hover {
  background: #4caf50;
  color: #fff;
}

.chapter-edit-cancel:hover {
  background: #dc3545;
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

.sidebar-collapsed-bar {
  width: 6px;
  height: 100%;
  background: var(--accent);
  border-radius: 3px;
  margin: 0 auto;
}

.icon {
  width: 1rem;
  height: 1rem;
}
</style>