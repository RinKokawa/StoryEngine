<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from 'vue'
import EditorTitlebar from './editor/editor_titlebar.vue'

const props = defineProps<{
  path: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const close = () => emit('close')

const displayName = computed(() => {
  if (!props.path) return '未命名项目'
  const segments = props.path.split(/[\\/]/).filter(Boolean)
  return segments[segments.length - 1] || '未命名项目'
})

const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    close()
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <section class="editor">
    <EditorTitlebar :name="displayName" @close="close" />
    <div class="placeholder">
      <p>这里将是编辑页面的内容。</p>
    </div>
  </section>
</template>

<style scoped>
.editor {
  padding: 0;
}

.placeholder {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e4ea;
  color: #6c7180;
}
</style>
