<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

type Note = {
  id: string
  title: string
  content: string
  updatedAt: string
}

const props = defineProps<{
  projectPath: string
}>()

const notes = ref<Note[]>([])
const selectedId = ref<string | null>(null)
const titleInput = ref('')
const contentInput = ref('')
const keyword = ref('')
const loading = ref(false)
const saving = ref(false)

const filteredNotes = computed(() => {
  const k = keyword.value.trim().toLowerCase()
  if (!k) return notes.value
  return notes.value.filter(
    (n) => n.title.toLowerCase().includes(k) || n.content.toLowerCase().includes(k),
  )
})

const resetForm = () => {
  selectedId.value = null
  titleInput.value = ''
  contentInput.value = ''
}

const hydrateSelection = () => {
  if (!notes.value.length) {
    resetForm()
    return
  }
  const existing = notes.value.find((n) => n.id === selectedId.value) ?? notes.value[0]
  selectedId.value = existing.id
  titleInput.value = existing.title
  contentInput.value = existing.content
}

const load = async () => {
  notes.value = []
  resetForm()
  if (!props.projectPath) return
  loading.value = true
  try {
    const list = await window.ipcRenderer.invoke('notes:list', props.projectPath)
    if (Array.isArray(list)) {
      notes.value = list
      hydrateSelection()
    }
  } catch (err) {
    console.error('加载笔记失败', err)
  } finally {
    loading.value = false
  }
}

const select = (id: string) => {
  const note = notes.value.find((n) => n.id === id)
  if (!note) return
  selectedId.value = id
  titleInput.value = note.title
  contentInput.value = note.content
}

const saveNote = async () => {
  if (!props.projectPath) {
    window.alert('缺少项目路径，无法保存笔记')
    return
  }
  saving.value = true
  try {
    const payload = {
      id: selectedId.value || undefined,
      title: titleInput.value.trim() || '未命名笔记',
      content: contentInput.value,
    }
    const saved = await window.ipcRenderer.invoke('notes:save', props.projectPath, payload)
    const exists = notes.value.find((n) => n.id === saved.id)
    if (exists) {
      notes.value = notes.value.map((n) => (n.id === saved.id ? saved : n))
    } else {
      notes.value = [saved, ...notes.value]
    }
    select(saved.id)
  } catch (err) {
    console.error('保存笔记失败', err)
    window.alert('保存笔记失败，请检查路径或权限')
  } finally {
    saving.value = false
  }
}

const deleteNote = async (id: string) => {
  if (!props.projectPath) {
    window.alert('缺少项目路径，无法删除笔记')
    return
  }
  const ok = window.confirm('确定删除该笔记吗？')
  if (!ok) return
  try {
    await window.ipcRenderer.invoke('notes:delete', props.projectPath, id)
    notes.value = notes.value.filter((n) => n.id !== id)
    if (selectedId.value === id) {
      hydrateSelection()
    }
  } catch (err) {
    console.error('删除笔记失败', err)
    window.alert('删除笔记失败，请检查路径或权限')
  }
}

onMounted(load)

watch(
  () => props.projectPath,
  () => {
    load()
  },
)
</script>

<template>
  <section class="notes">
    <header class="head">
      <div>
        <h3>灵感笔记</h3>
        <p class="hint">快速记下灵感；数据保存在项目目录的 notes 文件夹。</p>
      </div>
      <div class="actions">
        <input v-model="keyword" class="search" type="text" placeholder="搜索标题或内容" />
        <button type="button" class="ghost" @click="resetForm">新建</button>
        <button type="button" class="primary" :disabled="saving" @click="saveNote">
          {{ saving ? '保存中...' : '保存' }}
        </button>
      </div>
    </header>

    <div class="layout">
      <aside class="list">
        <p v-if="loading" class="placeholder">加载中...</p>
        <p v-else-if="!filteredNotes.length" class="placeholder">暂无笔记，点击右上角“新建”。</p>
        <ul v-else>
          <li
            v-for="note in filteredNotes"
            :key="note.id"
            :class="{ active: note.id === selectedId }"
            @click="select(note.id)"
          >
            <div class="title">{{ note.title || '未命名笔记' }}</div>
            <div class="meta">{{ new Date(note.updatedAt).toLocaleString() }}</div>
            <button class="delete" type="button" @click.stop="deleteNote(note.id)">删</button>
          </li>
        </ul>
      </aside>

      <div class="editor">
        <label class="field">
          标题
          <input v-model="titleInput" type="text" placeholder="输入标题" />
        </label>
        <label class="field">
          内容
          <textarea v-model="contentInput" placeholder="记录灵感、片段或待办"></textarea>
        </label>
      </div>
    </div>
  </section>
</template>

<style scoped>
.notes {
  color: #2c2f36;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: 100%;
}

.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

h3 {
  margin: 0 0 0.1rem;
}

.hint {
  margin: 0;
  color: #6c7180;
  font-size: 0.95rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.search {
  padding: 0.45rem 0.55rem;
  border: 1px solid #d0d4dd;
  border-radius: 0;
  min-width: 180px;
}

.search:focus,
.search:focus-visible {
  outline: none;
  box-shadow: none;
  border-color: #646cff;
}

.ghost {
  padding: 0.45rem 0.75rem;
  border: 1px solid #d0d4dd;
  background: #f5f6fa;
  cursor: pointer;
  border-radius: 0;
}

.primary {
  padding: 0.45rem 0.85rem;
  border: 1px solid #646cff;
  background: #646cff;
  color: #fff;
  cursor: pointer;
  border-radius: 0;
}

.ghost:focus,
.ghost:focus-visible,
.primary:focus,
.primary:focus-visible {
  outline: none;
  box-shadow: none;
}

.layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 0.75rem;
  height: calc(100vh - 200px);
  min-height: 320px;
}

.list {
  border: 1px solid #e5e7ec;
  background: #fff;
  padding: 0.5rem;
  overflow: auto;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

li {
  border: 1px solid #e5e7ec;
  padding: 0.5rem;
  cursor: pointer;
  position: relative;
  transition: background 0.15s ease, border-color 0.15s ease;
}

li:hover {
  background: #f5f7fb;
}

li.active {
  background: #e8ecf9;
  border-color: #c3cbe8;
}

.title {
  font-weight: 600;
  margin-bottom: 2px;
}

.meta {
  color: #6c7180;
  font-size: 12px;
}

.delete {
  position: absolute;
  top: 6px;
  right: 6px;
  border: none;
  background: transparent;
  color: #c62828;
  cursor: pointer;
  padding: 2px 4px;
}

.delete:focus,
.delete:focus-visible {
  outline: none;
  box-shadow: none;
}

.editor {
  border: 1px solid #e5e7ec;
  background: #fff;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: #2c2f36;
}

.field input,
.field textarea {
  border: 1px solid #d0d4dd;
  padding: 0.55rem;
  border-radius: 0;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.field textarea {
  min-height: 320px;
  resize: vertical;
}

.field input:focus,
.field textarea:focus,
.field input:focus-visible,
.field textarea:focus-visible {
  outline: none;
  box-shadow: none;
  border-color: #646cff;
}

.placeholder {
  margin: 0;
  color: #6c7180;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
    height: auto;
  }
  .editor .field textarea {
    min-height: 200px;
  }
}
</style>
