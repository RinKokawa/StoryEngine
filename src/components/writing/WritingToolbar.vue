<template>
  <header class="writing-main-header">
    <div class="header-left">
      <button @click="$emit('goBack')" class="back-btn">
        <ArrowLeftIcon class="icon" />
        <span class="btn-text">返回</span>
      </button>
      <div class="novel-info">
        <h1 class="novel-title">{{ novelTitle }}</h1>
        <span class="word-count">{{ formatWordCount(wordCount) }} 字</span>
      </div>
    </div>
    <div class="header-right">
      <button @click="$emit('save')" class="save-btn" :disabled="!hasUnsavedChanges">
        <SaveIcon class="icon" />
        <span class="btn-text">{{ hasUnsavedChanges ? '保存' : '已保存' }}</span>
      </button>
      <button @click="$emit('togglePreview')" class="tool-btn">
        <EyeIcon class="icon" />
        <span class="btn-text">{{ showPreview ? '隐藏预览' : '显示预览' }}</span>
      </button>
      <button @click="$emit('export')" class="tool-btn">
        <DownloadIcon class="icon" />
        <span class="btn-text">导出</span>
      </button>
      <button @click="$emit('toggleFullscreen')" class="fullscreen-btn">
        <MaximizeIcon v-if="!isFullscreen" class="icon" />
        <MinimizeIcon v-else class="icon" />
        <span class="btn-text">{{ isFullscreen ? '退出全屏' : '全屏' }}</span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import {
  ArrowLeftIcon,
  SaveIcon,
  MaximizeIcon,
  MinimizeIcon,
  EyeIcon,
  DownloadIcon
} from 'lucide-vue-next'

interface Props {
  novelTitle: string
  wordCount: number
  hasUnsavedChanges: boolean
  showPreview: boolean
  isFullscreen: boolean
}

interface Emits {
  (e: 'goBack'): void
  (e: 'save'): void
  (e: 'togglePreview'): void
  (e: 'export'): void
  (e: 'toggleFullscreen'): void
}

defineProps<Props>()
defineEmits<Emits>()

const formatWordCount = (count: number): string => {
  if (count < 1000) return `${count}`
  if (count < 10000) return `${(count / 1000).toFixed(1)}k`
  return `${(count / 10000).toFixed(1)}w`
}
</script>

<style scoped>
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

.icon {
  width: 1.2rem;
  height: 1.2rem;
}

@media (max-width: 900px) {
  .btn-text {
    display: none;
  }
  .save-btn, .tool-btn, .fullscreen-btn, .back-btn {
    padding-left: 0.7rem;
    padding-right: 0.7rem;
  }
}
</style>