<template>
  <footer class="writing-status-bar">
    <div>章节：{{ currentChapterTitle }}</div>
    <div>总字数：{{ formatWordCount(totalWordCount) }}</div>
    <div>今日字数：{{ todayWordCount }}</div>
    <div v-if="hasUnsavedChanges" class="unsaved">有未保存更改</div>
    <div v-else class="saved">已保存</div>
  </footer>
</template>

<script setup lang="ts">
interface Props {
  currentChapterTitle: string
  totalWordCount: number
  todayWordCount: number
  hasUnsavedChanges: boolean
}

defineProps<Props>()

const formatWordCount = (count: number): string => {
  if (count < 1000) return `${count}字`
  if (count < 10000) return `${(count / 1000).toFixed(1)}千字`
  return `${(count / 10000).toFixed(1)}万字`
}
</script>

<style scoped>
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

.unsaved {
  color: #dc3545;
  font-weight: bold;
}

.saved {
  color: var(--accent);
  font-weight: bold;
}
</style>