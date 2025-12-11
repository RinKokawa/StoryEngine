<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import Titlebar from '../components/titlebar.vue'

const props = defineProps<{
  projectName: string
  item: {
    id?: string
    title?: string
    content?: string
  }
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const close = () => emit('close')

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    e.preventDefault()
    e.stopPropagation()
    close()
  }
}

onMounted(() => window.addEventListener('keydown', onKey, true))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey, true))
</script>

<template>
  <div class="viewer">
    <Titlebar
      :name="`${projectName} | 世界观`"
      :status-text="item.title || item.id || '条目'"
      :status-color="'#4a5a7d'"
      @close="close"
      @minimize="() => {}"
      @maximize="() => {}"
    />
    <div class="content">
      <h3>{{ item.title || item.id }}</h3>
      <p class="muted">双击打开的世界观条目</p>
      <pre class="body">{{ item.content }}</pre>
    </div>
  </div>
</template>

<style scoped>
.viewer {
  position: fixed;
  inset: 0;
  background: #f5f6fa;
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.content {
  padding: 1rem 1.5rem;
  color: #2c2f36;
}

h3 {
  margin: 0 0 0.25rem;
}

.muted {
  margin: 0 0 0.65rem;
  color: #6c7180;
}

.body {
  background: #fff;
  border: 1px solid #d0d4dd;
  padding: 0.75rem;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}
</style>
