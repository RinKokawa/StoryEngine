<template>
  <WritingLayout>
    <div class="writing-desktop-layout">
      <!-- 章节侧边栏 -->
      <ChapterSidebar
        :volumes="volumes"
        :current-chapter-id="currentChapterId"
        :collapsed="sidebarCollapsed"
        @expand="sidebarCollapsed = false"
        @collapse="sidebarCollapsed = true"
        @switch-chapter="handleSwitchChapter"
        @add-chapter="handleAddChapter"
      />

      <div class="writing-main-area">
        <!-- 工具栏 -->
        <WritingToolbar
          :novel-title="currentNovel?.title || '未命名小说'"
          :word-count="wordCount"
          :has-unsaved-changes="hasUnsavedChanges"
          :show-preview="showPreview"
          :is-fullscreen="isFullscreen"
          @go-back="handleGoBack"
          @save="handleSave"
          @toggle-preview="showPreview = !showPreview"
          @export="handleExport"
          @toggle-fullscreen="isFullscreen = !isFullscreen"
        />

        <!-- 编辑器 -->
        <WritingEditor
          v-model:content="content"
          :show-preview="showPreview"
          :is-fullscreen="isFullscreen"
          @keydown="handleEditorKeydown"
          @at-symbol="handleAtSymbol"
          ref="editorRef"
        />

        <!-- 角色建议 -->
        <CharacterSuggestions
          :show="showCharacterSuggestions"
          :characters="filteredCharacters"
          :selected-index="selectedCharacterIndex"
          :position="suggestionPosition"
          @select="handleSelectCharacter"
          @update-selection="selectedCharacterIndex = $event"
        />

        <!-- 状态栏 -->
        <WritingStatusBar
          :current-chapter-title="currentChapterTitle"
          :total-word-count="totalWordCount"
          :today-word-count="todayWordCount"
          :has-unsaved-changes="hasUnsavedChanges"
        />
      </div>
    </div>
  </WritingLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import WritingLayout from '../components/WritingLayout.vue'
import ChapterSidebar from '../components/chapter/ChapterSidebar.vue'
import WritingToolbar from '../components/writing/WritingToolbar.vue'
import WritingEditor from '../components/writing/WritingEditor.vue'
import CharacterSuggestions from '../components/character/CharacterSuggestions.vue'
import WritingStatusBar from '../components/writing/WritingStatusBar.vue'

import { useNovel } from '../application/composables/useNovel'
import { useChapter } from '../application/composables/useChapter'
import { useCharacter } from '../application/composables/useCharacter'
import { useStatsStore } from '../application/stores/statsStore'

import { Character } from '../domain/entities/Character'

const router = useRouter()
const statsStore = useStatsStore()

// 使用组合式函数
const { currentNovel, totalWordCount, initializeCurrentNovel } = useNovel()
const { 
  currentChapter, 
  content, 
  hasUnsavedChanges, 
  wordCount, 
  currentChapterTitle, 
  volumes, 
  addChapter, 
  safeSwitchChapter, 
  saveCurrentChapter, 
  exportContent, 
  handleContentChange 
} = useChapter()
const { 
  loadCharacters, 
  showSuggestions, 
  suggestionPosition, 
  getFilteredSuggestions, 
  showSuggestionsAtCursor, 
  hideSuggestions, 
  selectCharacter, 
  handleKeyNavigation 
} = useCharacter()

// 本地状态
const sidebarCollapsed = ref(true)
const showPreview = ref(false)
const isFullscreen = ref(false)
const editorRef = ref()
const filteredCharacters = ref<Character[]>([])

// 计算属性
const currentChapterId = computed(() => currentChapter.value?.id || null)
const todayWordCount = computed(() => statsStore.todayWordCount)
const showCharacterSuggestions = computed(() => showSuggestions.value)
const selectedCharacterIndex = ref(0)

// 生命周期
onMounted(async () => {
  await initializeCurrentNovel()
  await loadCharacters()
  await statsStore.loadTodayStats()
  
  // 键盘事件监听
  document.addEventListener('keydown', handleGlobalKeyboard)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleGlobalKeyboard)
})

// 事件处理
const handleSwitchChapter = async (chapterId: string) => {
  await safeSwitchChapter(chapterId)
}

const handleAddChapter = async () => {
  const chapter = await addChapter()
  if (chapter) {
    await safeSwitchChapter(chapter.id)
  }
}

const handleSave = async () => {
  await saveCurrentChapter()
}

const handleGoBack = async () => {
  if (hasUnsavedChanges.value) {
    const shouldSave = confirm('有未保存的内容，确定要离开吗？')
    if (shouldSave) {
      await saveCurrentChapter()
    }
  }
  router.push('/')
}

const handleExport = () => {
  exportContent()
}

const handleEditorKeydown = async (event: KeyboardEvent) => {
  // 处理角色建议的键盘导航
  if (handleKeyNavigation(event, filteredCharacters.value, handleSelectCharacter)) {
    return
  }
}

const handleAtSymbol = async (textarea: HTMLTextAreaElement) => {
  showSuggestionsAtCursor(textarea)
  filteredCharacters.value = await getFilteredSuggestions('')
}

const handleSelectCharacter = (character: Character) => {
  if (editorRef.value?.editorRef) {
    selectCharacter(
      character, 
      editorRef.value.editorRef, 
      content.value, 
      handleContentChange
    )
  }
}

const handleGlobalKeyboard = (e: KeyboardEvent) => {
  // Ctrl+S 保存
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    handleSave()
  }
  
  // F11 全屏
  if (e.key === 'F11') {
    e.preventDefault()
    isFullscreen.value = !isFullscreen.value
  }
  
  // Esc 隐藏角色建议
  if (e.key === 'Escape') {
    hideSuggestions()
  }
}
</script>

<style scoped>
.writing-desktop-layout {
  display: flex;
  width: 100%;
  height: 100vh;
  background: var(--main-bg);
}

.writing-main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  overflow: auto;
}
</style>