<script setup lang="ts">
import type { Chapter } from './types'

const props = defineProps<{
  chapter: Chapter
  active: boolean
}>()

const emit = defineEmits<{
  (e: 'select', chapter: Chapter): void
  (e: 'delete', chapter: Chapter): void
}>()

const handleSelect = () => emit('select', props.chapter)
const handleDelete = () => emit('delete', props.chapter)
</script>

<template>
  <div class="chapter-row" :class="{ active: active }" @click="handleSelect">
    <span class="dot"></span>
    <span class="chapter-name">{{ chapter.name }}</span>
    <button type="button" class="ghost danger tiny" @click.stop="handleDelete">删</button>
  </div>
</template>

<style scoped>
.chapter-row {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #2c2f36;
  justify-content: space-between;
  padding: 6px 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.chapter-row:hover {
  background: #f0f2f8;
}

.chapter-row.active {
  background: #e3e9f9;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4a5a7d;
  flex-shrink: 0;
}

.ghost {
  padding: 0.35rem 0.65rem;
  border: 1px solid #d0d4dd;
  background: #f5f6fa;
  cursor: pointer;
  border-radius: 0;
}

.ghost.danger {
  border-color: #e57373;
  color: #c62828;
}

.ghost.tiny {
  padding: 2px 6px;
  font-size: 12px;
}

.ghost:focus,
.ghost:focus-visible {
  outline: none;
  box-shadow: none;
}
</style>
