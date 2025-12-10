<script setup lang="ts">
const props = withDefaults(defineProps<{
  name?: string
  showIcon?: boolean
  statusText?: string
  statusColor?: string
}>(), {
  name: 'Novel Editor',
  showIcon: true,
  statusText: '',
  statusColor: '#e81123',
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'minimize'): void
  (e: 'maximize'): void
}>()
</script>

<template>
  <header class="titlebar">
    <div class="left">
      <img v-if="props.showIcon" class="icon" src="/icon.png" alt="icon" />
      <span class="name">{{ props.name }}</span>
      <span v-if="props.statusText" class="status" :style="{ color: props.statusColor }">
        | {{ props.statusText }}
      </span>
    </div>
    <div class="controls">
      <button type="button" class="ghost" @click="emit('minimize')">—</button>
      <button type="button" class="ghost" @click="emit('maximize')">▢</button>
      <button type="button" class="ghost close" @click="emit('close')">×</button>
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

.status {
  margin-left: 8px;
  font-weight: 500;
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
