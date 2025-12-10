<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  name: string
  path: string
  cover?: string | null
  lastOpened?: number
}>()

const lastOpenedText = computed(() => {
  if (!props.lastOpened) return ''
  try {
    return new Date(props.lastOpened).toLocaleString()
  } catch {
    return ''
  }
})
</script>

<template>
  <article class="card">
    <div class="cover" :class="{ fallback: !props.cover }">
      <img v-if="props.cover" :src="props.cover" :alt="props.name" />
      <span v-else>{{ props.name.charAt(0) || '📖' }}</span>
    </div>
    <div class="meta">
      <div class="row">
        <h4>{{ props.name }}</h4>
        <button type="button" class="ghost">⋯</button>
      </div>
      <p class="path">{{ props.path }}</p>
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
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem;
}

.cover {
  width: 120px;
  height: 90px;
  background: linear-gradient(135deg, #f0f2ff, #e5e9ff);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  overflow: hidden;
}

.cover.fallback span {
  font-size: 1.8rem;
  color: #646cff;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.meta {
  min-width: 0;
  flex: 1;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

h4 {
  margin: 0;
}

.path {
  margin: 0.35rem 0 0;
  color: #6c7180;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  margin: 0.2rem 0 0;
  color: #8a8f9c;
  font-size: 0.85rem;
}

.ghost {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.25rem;
  line-height: 1;
  padding: 0.2rem;
}
</style>
