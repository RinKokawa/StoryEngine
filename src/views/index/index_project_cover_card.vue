<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
  path: string
  cover?: string | null
  lastOpened?: number
  selected?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', path: string): void
  (e: 'open', path: string): void
}>()

const lastOpenedText = computed(() => {
  if (!props.lastOpened) return ''
  try {
    return new Date(props.lastOpened).toLocaleString()
  } catch {
    return ''
  }
})

const onClick = () => emit('select', props.path)
const onDblClick = () => emit('open', props.path)
</script>

<template>
  <article
    class="card"
    :class="{ selected: props.selected }"
    @click="onClick"
    @dblclick.stop="onDblClick"
  >
    <div class="cover" :class="{ fallback: !props.cover }">
      <img v-if="props.cover" :src="props.cover" :alt="props.name" />
      <span v-else>{{ props.name.charAt(0) || '📖' }}</span>
    </div>
    <div class="meta">
      <h4>{{ props.name }}</h4>
      <p v-if="lastOpenedText" class="time">最近打开：{{ lastOpenedText }}</p>
    </div>
  </article>
</template>

<style scoped>
.card {
  border: 1px solid #e2e4ea;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0.35rem;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
  border-color: #c5c9d5;
}

.card.selected {
  box-shadow: 0 0 0 2px #646cff66, 0 6px 18px rgba(0, 0, 0, 0.12);
  border-color: #646cff;
}

.cover {
  width: 100%;
  aspect-ratio: 16 / 9;
  background: linear-gradient(135deg, #f0f2ff, #e5e9ff);
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover.fallback span {
  font-size: 2rem;
  color: #646cff;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.meta {
  padding: 0.65rem 0.65rem 0.75rem;
  min-width: 0;
}

h4 {
  margin: 0 0 0.35rem;
}

.time {
  margin: 0;
  color: #8a8f9c;
  font-size: 0.85rem;
}
</style>
