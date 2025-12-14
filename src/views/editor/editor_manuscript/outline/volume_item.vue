<script setup lang="ts">
import ChapterItem from './chapter_item.vue'
import type { Chapter, Volume } from './types'

const props = defineProps<{
  volume: Volume
  expanded: boolean
  selectedChapterId: string | null
}>()

const emit = defineEmits<{
  (e: 'toggle', volumeId: string): void
  (e: 'create-chapter', volumeId: string): void
  (e: 'delete-volume', volumeId: string): void
  (e: 'delete-chapter', payload: { volumeId: string; chapterId: string }): void
  (e: 'select-chapter', chapter: Chapter): void
}>()

const handleToggle = () => emit('toggle', props.volume.id)
const handleCreateChapter = () => emit('create-chapter', props.volume.id)
const handleDeleteVolume = () => emit('delete-volume', props.volume.id)
const handleSelectChapter = (chapter: Chapter) => emit('select-chapter', chapter)
const handleDeleteChapter = (chapter: Chapter) =>
  emit('delete-chapter', { volumeId: props.volume.id, chapterId: chapter.id })
</script>

<template>
  <div class="tree-item">
    <div class="volume-row">
      <button type="button" class="tree-node" :class="{ expanded }" @click="handleToggle">
        <span class="icons">
          <svg class="chevron" viewBox="0 0 16 16" width="14" height="14" :class="{ expanded }">
            <path fill="currentColor" d="M6 4.75a.75.75 0 0 1 1.28-.53l3.25 3.25a.75.75 0 0 1 0 1.06L7.28 11.78a.75.75 0 0 1-1.28-.53V4.75Z" />
          </svg>
          <svg class="folder" viewBox="0 0 16 16" width="14" height="14" :class="{ open: expanded }">
            <path fill="currentColor" d="M1.75 2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H7.5L6.25 3.5H1.75z" />
          </svg>
        </span>
        <span class="label">{{ volume.name }}</span>
        <span class="badge" v-if="volume.chapters?.length">{{ volume.chapters.length }}</span>
      </button>
      <div class="actions">
        <button type="button" class="ghost" @click.stop="handleCreateChapter">+ 章节</button>
        <button type="button" class="ghost danger" @click.stop="handleDeleteVolume">删卷</button>
      </div>
    </div>
    <div v-if="expanded && volume.chapters?.length" class="chapters">
      <ChapterItem
        v-for="c in volume.chapters"
        :key="c.id"
        :chapter="c"
        :active="c.id === selectedChapterId"
        @select="handleSelectChapter"
        @delete="handleDeleteChapter"
      />
    </div>
    <p v-else-if="expanded" class="placeholder sub">暂无章节。</p>
  </div>
</template>

<style scoped>
.tree-item {
  border: none;
  background: transparent;
}

.volume-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #2c2f36;
  outline: none;
  box-sizing: border-box;
}

.tree-node.expanded {
  background: #f7f9fc;
}

.tree-node:focus,
.tree-node:focus-visible {
  outline: none;
}

.actions {
  display: inline-flex;
  flex-shrink: 0;
  gap: 6px;
}

.icons {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #6c7180;
}

.chevron {
  transition: transform 0.15s ease;
}

.chevron.expanded {
  transform: rotate(90deg);
}

.folder {
  color: #f0a500;
}

.folder.open {
  color: #f7b733;
}

.label {
  flex: 1;
  text-align: left;
}

.badge {
  background: #e8ecf5;
  color: #4a5a7d;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 12px;
}

.chapters {
  padding: 6px 12px 10px 28px;
  display: flex;
  flex-direction: column;
  gap: 6px;
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

.ghost:focus,
.ghost:focus-visible {
  outline: none;
  box-shadow: none;
}

.placeholder {
  margin: 0;
  color: #6c7180;
}

.placeholder.sub {
  padding: 0 12px 10px;
}
</style>
