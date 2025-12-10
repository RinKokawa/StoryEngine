<script setup lang="ts">
const emit = defineEmits<{
  (e: 'close'): void
}>()

const minimize = () => window.ipcRenderer.invoke('window-control', 'minimize')
const maximize = () => window.ipcRenderer.invoke('window-control', 'maximize')
const close = () => emit('close')
</script>

<template>
  <header class="titlebar">
    <div class="left">
      <img class="icon" src="/icon.png" alt="icon" />
      <span class="name">Novel Editor</span>
    </div>
    <div class="controls">
      <button type="button" class="ghost" @click="minimize">—</button>
      <button type="button" class="ghost" @click="maximize">▢</button>
      <button type="button" class="ghost close" @click="close">×</button>
    </div>
  </header>
</template>

<style scoped>
.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0 0 0.5rem;
  background: #f7f8fb;
  user-select: none;
  -webkit-app-region: drag;
  height: 32px;
}

.left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  -webkit-app-region: no-drag;
}

.icon {
  width: 20px;
  height: 20px;
}

.name {
  white-space: nowrap;
}

.controls {
  display: flex;
  align-items: center;
  gap: 0;
  -webkit-app-region: no-drag;
}

.ghost {
  border: none;
  background: transparent;
  border-radius: 0;
  width: 46px;
  height: 32px;
  cursor: pointer;
  font-size: 13px;
  font-family: 'Segoe UI', sans-serif;
  outline: none;
}

.ghost:hover {
  background: #e6e6e6;
}

.ghost.close:hover {
  background: #e81123;
  color: #fff;
}

.ghost:focus-visible {
  outline: none;
  box-shadow: none;
}
</style>
