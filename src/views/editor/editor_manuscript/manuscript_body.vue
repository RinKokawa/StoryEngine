<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps<{
  projectPath: string
  chapter: { id: string; name: string; synopsis?: string; content?: string } | null
}>()

const emit = defineEmits<{
  (e: 'updated', chapter: { id: string; name: string; synopsis?: string; content?: string }): void
}>()

const content = ref('')
const synopsis = ref('')

watch(
  () => props.chapter,
  (val) => {
    content.value = val?.content ?? ''
    synopsis.value = val?.synopsis ?? ''
  },
  { immediate: true },
)

const dirty = computed(() => {
  if (!props.chapter) return false
  return content.value !== (props.chapter.content ?? '') || synopsis.value !== (props.chapter.synopsis ?? '')
})

const saving = ref(false)

const saveContent = async () => {
  if (!props.projectPath || !props.chapter) return
  saving.value = true
  try {
    const updated = await window.ipcRenderer.invoke(
      'save-chapter-content',
      props.projectPath,
      props.chapter.id,
      { content: content.value, synopsis: synopsis.value, chapter_name: props.chapter.name },
    )
    emit('updated', { ...props.chapter, ...updated })
  } catch (err) {
    console.error('保存章节失败', err)
    window.alert('保存章节失败，请检查路径或权限')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="manuscript-body">
    <h4>正文内容</h4>
    <div v-if="chapter">
      <h5 class="chapter-title">{{ chapter.name }}</h5>
      <label class="synopsis">
        简介：
        <input v-model="synopsis" type="text" placeholder="简介" />
      </label>
      <textarea v-model="content" placeholder="章节内容" />
      <div class="actions">
        <button type="button" class="primary" :disabled="!dirty || saving" @click="saveContent">
          {{ saving ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </div>
    <p v-else class="placeholder">请选择左侧的章节以查看正文。</p>
  </div>
</template>

<style scoped>
.manuscript-body h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.chapter-title {
  margin: 0 0 0.35rem;
}

.synopsis {
  margin: 0 0 0.35rem;
  color: #2c2f36;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.synopsis input {
  flex: 1;
  padding: 0.45rem 0.55rem;
  border: 1px solid #d0d4dd;
  border-radius: 0;
  font-size: 0.95rem;
}

.synopsis input:focus,
.synopsis input:focus-visible {
  outline: none;
  box-shadow: none;
  border-color: #646cff;
}

.manuscript-body textarea {
  width: 100%;
  height: 100%;
  min-height: 240px;
  resize: vertical;
  border: 1px solid #d0d4dd;
  padding: 0.65rem;
  font-size: 0.95rem;
  box-sizing: border-box;
  background: #fff;
}

.manuscript-body textarea:focus,
.manuscript-body textarea:focus-visible {
  outline: none;
  box-shadow: none;
  border-color: #646cff;
}

.actions {
  margin-top: 0.5rem;
  display: flex;
  justify-content: flex-end;
}

.primary {
  padding: 0.45rem 0.85rem;
  border: 1px solid #646cff;
  background: #646cff;
  color: #fff;
  cursor: pointer;
  border-radius: 0;
}

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.primary:focus,
.primary:focus-visible {
  outline: none;
  box-shadow: none;
}

.placeholder {
  margin: 0;
  color: #6c7180;
}
</style>
