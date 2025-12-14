<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import CharacterPicker from '../editor_characters/character_picker.vue'

const props = defineProps<{
  projectPath: string
  chapter: { id: string; name: string; synopsis?: string; content?: string } | null
}>()

const emit = defineEmits<{
  (e: 'updated', chapter: { id: string; name: string; synopsis?: string; content?: string }): void
  (e: 'content-change', content: string): void
}>()

const content = ref('')
const synopsis = ref('')
const characters = ref<Array<{ id: string; name: string; gender?: string; avatar?: string | null }>>([])
const showPicker = ref(false)
const pickerActiveIndex = ref(0)
const mentionStart = ref<number | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const pickerRef = ref<HTMLElement | null>(null)

watch(
  () => props.chapter,
  (val) => {
    content.value = val?.content ?? ''
    synopsis.value = val?.synopsis ?? ''
  },
  { immediate: true },
)

watch(
  content,
  (val) => emit('content-change', val),
  { immediate: true },
)

const dirty = computed(() => {
  if (!props.chapter) return false
  return content.value !== (props.chapter.content ?? '') || synopsis.value !== (props.chapter.synopsis ?? '')
})

const wordCount = computed(() => {
  return content.value.length
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

const onKey = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    if (!props.chapter) return
    e.preventDefault()
    e.stopPropagation()
    if (dirty.value && !saving.value) {
      saveContent()
    }
  }
}

const loadCharacters = async () => {
  if (!props.projectPath) {
    characters.value = []
    return
  }
  try {
    const list = await window.ipcRenderer.invoke('list-characters', props.projectPath)
    if (Array.isArray(list)) {
      characters.value = list
    }
  } catch (err) {
    console.error('加载角色列表失败', err)
  }
}

watch(
  () => props.projectPath,
  () => loadCharacters(),
  { immediate: true },
)

watch(
  () => props.chapter?.id,
  () => closePicker(),
)

const closePicker = () => {
  showPicker.value = false
  mentionStart.value = null
}

const openPickerAtCaret = (e: KeyboardEvent) => {
  if (!characters.value.length) return
  const target = e.target as HTMLTextAreaElement | null
  if (!target) return
  mentionStart.value = target.selectionStart ?? 0
  pickerActiveIndex.value = 0
  showPicker.value = true
}

const applyCharacter = async (idx: number) => {
  const item = characters.value[idx]
  if (!item) {
    closePicker()
    return
  }
  const start = mentionStart.value ?? textareaRef.value?.selectionStart ?? 0
  const removeLen = content.value[start] === '@' ? 1 : 0
  const before = content.value.slice(0, start)
  const after = content.value.slice(start + removeLen)
  const insertion = item.name
  content.value = `${before}${insertion}${after}`
  const pos = before.length + insertion.length
  await nextTick()
  if (textareaRef.value) {
    textareaRef.value.focus()
    textareaRef.value.setSelectionRange(pos, pos)
  }
  closePicker()
}

const handlePickerHover = (idx: number) => {
  pickerActiveIndex.value = idx
}

const handleTextareaKeydown = (e: KeyboardEvent) => {
  if (e.key === '@') {
    openPickerAtCaret(e)
    return
  }
  if (!showPicker.value) return
  if (e.key === 'Escape') {
    closePicker()
    return
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (characters.value.length) {
      pickerActiveIndex.value = (pickerActiveIndex.value + 1) % characters.value.length
    }
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (characters.value.length) {
      pickerActiveIndex.value =
        (pickerActiveIndex.value - 1 + characters.value.length) % characters.value.length
    }
    return
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    applyCharacter(pickerActiveIndex.value)
  }
}

const handleClickOutside = (e: MouseEvent) => {
  if (!showPicker.value) return
  const target = e.target as Node | null
  if (!target) return
  if (pickerRef.value?.contains(target)) return
  if (textareaRef.value?.contains(target as Node)) return
  closePicker()
}

onMounted(() => {
  window.addEventListener('keydown', onKey, true)
  document.addEventListener('mousedown', handleClickOutside)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey, true)
  document.removeEventListener('mousedown', handleClickOutside)
})
</script>

<template>
  <div class="manuscript-body">
    <h4>正文内容</h4>
    <div v-if="chapter" class="body-wrapper">
      <h5 class="chapter-title">{{ chapter.name }}</h5>
      <label class="synopsis">
        简介：
        <input v-model="synopsis" type="text" placeholder="简介" />
      </label>
      <div class="editor-area">
        <textarea
          ref="textareaRef"
          v-model="content"
          placeholder="章节内容"
          @keydown="handleTextareaKeydown"
        />
        <div v-if="showPicker && characters.length" class="picker-pop" ref="pickerRef">
          <CharacterPicker
            :characters="characters"
            :active-index="pickerActiveIndex"
            @hover="handlePickerHover"
            @select="applyCharacter"
          />
        </div>
      </div>
      <div class="actions">
        <span class="count">字数：{{ wordCount }}</span>
        <button type="button" class="primary" :disabled="!dirty || saving" @click="saveContent">
          {{ saving ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </div>
    <p v-else class="placeholder">请选择左侧的章节以查看正文。</p>
  </div>
</template>

<style scoped>
.manuscript-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.manuscript-body h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.body-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-height: 0;
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
  min-height: 0;
  flex: 1;
  resize: none;
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

.editor-area {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.picker-pop {
  position: absolute;
  left: 0;
  bottom: 8px;
  z-index: 10;
}

.actions {
  margin-top: 0.5rem;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.75rem;
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

.count {
  color: #4a5a7d;
}

.placeholder {
  margin: 0;
  color: #6c7180;
}
</style>
