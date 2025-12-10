<script setup lang="ts">
const props = defineProps<{
  path: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()
</script>

<template>
  <section class="editor">
    <header class="bar">
      <div class="info">
        <h1>编辑器</h1>
        <p v-if="props.path" class="path">当前项目：{{ props.path }}</p>
      </div>
      <button type="button" class="ghost" @click="emit('close')">返回</button>
    </header>
    <div class="placeholder">
      <p>这里将是编辑页面的内容。</p>
    </div>
  </section>
</template>

<style scoped>
.editor {
  padding: 1.5rem;
}

.bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.info h1 {
  margin: 0;
}

.path {
  margin: 0.35rem 0 0;
  color: #6c7180;
}

.ghost {
  border: 1px solid #ccc;
  background: #f5f5f5;
  border-radius: 6px;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
}

.placeholder {
  padding: 1rem;
  border: 1px dashed #d0d4dd;
  border-radius: 8px;
  color: #6c7180;
}
</style>
