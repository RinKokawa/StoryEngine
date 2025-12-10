<script setup lang="ts">
const props = defineProps<{
  name: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const minimize = () => {
  window.ipcRenderer.invoke('window-control', 'minimize')
}

const maximize = () => {
  window.ipcRenderer.invoke('window-control', 'maximize')
}
</script>

<template>
  <header class="titlebar">
    <div class="left">
      <span class="icon">📘</span>
      <span class="name">{{ props.name }}</span>
    </div>
    <div class="controls">
      <button type="button" class="ghost" @click="minimize">—</button>
      <button type="button" class="ghost" @click="maximize">▢</button>
      <button type="button" class="ghost close" @click="emit('close')">×</button>
    </div>
  </header>
</template>

<style scoped>
.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid #e2e4ea;
  background: #f7f8fb;
  user-select: none;
  -webkit-app-region: drag;
}

.left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.icon {
  font-size: 1.1rem;
}

.name {
  max-width: 360px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  -webkit-app-region: no-drag;
}

.ghost {
  border: 1px solid #d0d4dd;
  background: #fff;
  border-radius: 6px;
  padding: 0.25rem 0.55rem;
  cursor: pointer;
}

.ghost.close {
  color: #d9534f;
  border-color: #e4b5b3;
}
</style>
