<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import OutlineModal from './outline_modal.vue'

const props = defineProps<{
  projectPath: string
}>()

const volumes = ref<
  Array<{ id: string; name: string; chapters?: Array<{ id: string; name: string; synopsis: string; content?: string }> }>
>([])
const emit = defineEmits<{
  (e: 'open-chapter', chapter: { id: string; name: string; synopsis: string; content?: string }): void
}>()
const expanded = ref<Set<string>>(new Set())
const selectedChapterId = ref<string | null>(null)

const ensureOutline = async () => {
  if (!props.projectPath) return
  await window.ipcRenderer.invoke('ensure-outline', props.projectPath)
}

const loadVolumes = async () => {
  if (!props.projectPath) {
    volumes.value = []
    return
  }
  try {
    const list = await window.ipcRenderer.invoke('list-outline-structure', props.projectPath)
    volumes.value = Array.isArray(list) ? list : []
  } catch (err) {
    console.error('加载卷信息失败', err)
    volumes.value = []
  }
}

onMounted(() => {
  ensureOutline()
  loadVolumes()
})

watch(
  () => props.projectPath,
  () => {
    ensureOutline()
    loadVolumes()
  },
)

const toggle = (id: string) => {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

const isExpanded = (id: string) => expanded.value.has(id)

const showModal = ref(false)
const modalMode = ref<'volume' | 'chapter'>('volume')
const modalVolumeId = ref<string | null>(null)
const modalTitle = ref('新建卷')
const modalPlaceholder = ref('请输入卷名')
const modalConfirm = ref('创建')

const deleteVolume = async (id: string) => {
  const ok = window.confirm('确定删除该卷及其中的章节吗？')
  if (!ok) return
  try {
    await window.ipcRenderer.invoke('outline:delete-volume', props.projectPath, id)
    volumes.value = volumes.value.filter((v) => v.id !== id)
  } catch (err) {
    console.error('删除卷失败', err)
    window.alert('删除卷失败')
  }
}

const createChapter = async (volumeId: string) => {
  modalMode.value = 'chapter'
  modalVolumeId.value = volumeId
  modalTitle.value = '新建章节'
  modalPlaceholder.value = '请输入章节名'
  modalConfirm.value = '创建章节'
  showModal.value = true
}

const deleteChapter = async (volumeId: string, chapterId: string) => {
  const ok = window.confirm('确定删除该章节吗？')
  if (!ok) return
  try {
    await window.ipcRenderer.invoke('outline:delete-chapter', props.projectPath, volumeId, chapterId)
    volumes.value = volumes.value.map((v) => {
      if (v.id !== volumeId) return v
      const chapters = Array.isArray(v.chapters) ? v.chapters.filter((c) => c.id !== chapterId) : []
      return { ...v, chapters }
    })
  } catch (err) {
    console.error('删除章节失败', err)
    window.alert('删除章节失败')
  }
}

const openCreateVolume = () => {
  modalMode.value = 'volume'
  modalVolumeId.value = null
  modalTitle.value = '新建卷'
  modalPlaceholder.value = '请输入卷名'
  modalConfirm.value = '创建卷'
  showModal.value = true
}

const handleModalSubmit = async (name: string) => {
  if (!name.trim()) return
  if (modalMode.value === 'volume') {
    try {
      const result = await window.ipcRenderer.invoke('outline:create-volume', props.projectPath, name.trim())
      if (result?.id) {
        volumes.value = [
          ...volumes.value,
          { id: result.id as string, name: result.name as string, chapters: [] },
        ]
        expanded.value = new Set(expanded.value).add(result.id as string)
      } else {
        await loadVolumes()
      }
    } catch (err) {
      console.error('创建卷失败', err)
      window.alert('创建卷失败')
    }
  } else if (modalMode.value === 'chapter' && modalVolumeId.value) {
    try {
      const result = await window.ipcRenderer.invoke(
        'outline:create-chapter',
        props.projectPath,
        modalVolumeId.value,
        name.trim(),
      )
      const vols = volumes.value.map((v) => {
        if (v.id !== modalVolumeId.value) return v
        const chapters = Array.isArray(v.chapters) ? [...v.chapters] : []
        chapters.push({ id: result.id as string, name: result.name as string, synopsis: '', content: '' })
        return { ...v, chapters }
      })
      volumes.value = vols
      selectedChapterId.value = result.id as string
      expanded.value = new Set(expanded.value).add(modalVolumeId.value)
    } catch (err) {
      console.error('创建章节失败', err)
      window.alert('创建章节失败')
    }
  }
  showModal.value = false
}

const handleModalClose = () => {
  showModal.value = false
}
const findChapterById = (id: string) => {
  for (const v of volumes.value) {
    if (!v.chapters) continue
    for (const c of v.chapters) {
      if (c.id === id) return c
    }
  }
  return null
}

const selectChapter = async (chapter: { id: string; name: string; synopsis?: string; content?: string }) => {
  selectedChapterId.value = chapter.id
  // 为避免使用旧缓存，重新加载一次卷章节数据后再打开
  await loadVolumes()
  const latest = findChapterById(chapter.id) || chapter
  emit('open-chapter', latest)
}
</script>

<template>
  <div class="outline">
    <div class="header">
      <h4>卷章结构</h4>
      <button type="button" class="ghost" @click="openCreateVolume">+ 新建卷</button>
    </div>
    <div v-if="volumes.length" class="tree">
      <div v-for="v in volumes" :key="v.id" class="tree-item">
        <button type="button" class="tree-node" :class="{ expanded: isExpanded(v.id) }" @click="toggle(v.id)">
          <span class="icons">
            <svg class="chevron" viewBox="0 0 16 16" width="14" height="14" :class="{ expanded: isExpanded(v.id) }">
              <path fill="currentColor" d="M6 4.75a.75.75 0 0 1 1.28-.53l3.25 3.25a.75.75 0 0 1 0 1.06L7.28 11.78a.75.75 0 0 1-1.28-.53V4.75Z" />
            </svg>
            <svg class="folder" viewBox="0 0 16 16" width="14" height="14" :class="{ open: isExpanded(v.id) }">
              <path fill="currentColor" d="M1.75 2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25H7.5L6.25 3.5H1.75z" />
            </svg>
          </span>
          <span class="label">{{ v.name }}</span>
          <span class="badge" v-if="v.chapters?.length">{{ v.chapters.length }}</span>
        </button>
        <div class="actions">
          <button type="button" class="ghost" @click.stop="createChapter(v.id)">+ 章节</button>
          <button type="button" class="ghost danger" @click.stop="deleteVolume(v.id)">删除卷</button>
        </div>
        <div v-if="isExpanded(v.id) && v.chapters?.length" class="chapters">
          <div
            v-for="c in v.chapters"
            :key="c.id"
            class="chapter-row"
            :class="{ active: c.id === selectedChapterId }"
            @click="selectChapter(c)"
          >
            <span class="dot"></span>
            <span class="chapter-name">{{ c.name }}</span>
            <button type="button" class="ghost danger tiny" @click.stop="deleteChapter(v.id, c.id)">删</button>
          </div>
        </div>
        <p v-else-if="isExpanded(v.id)" class="placeholder sub">暂无章节。</p>
      </div>
    </div>
    <p v-else class="placeholder">暂无卷信息。</p>

    <OutlineModal
      v-if="showModal"
      :title="modalTitle"
      :placeholder="modalPlaceholder"
      :confirm-text="modalConfirm"
      @submit="handleModalSubmit"
      @close="handleModalClose"
    />
  </div>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.ghost {
  padding: 0.35rem 0.65rem;
  border: 1px solid #d0d4dd;
  background: #f5f6fa;
  cursor: pointer;
  border-radius: 0;
}

.ghost.danger {
  border-color: #e57373;
  color: #c62828;
}

.ghost.tiny {
  padding: 2px 6px;
  font-size: 12px;
}

.ghost:focus,
.ghost:focus-visible {
  outline: none;
  box-shadow: none;
}

.outline h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.ghost {
  padding: 0.35rem 0.65rem;
  border: 1px solid #d0d4dd;
  background: #f5f6fa;
  cursor: pointer;
  border-radius: 0;
}

.ghost.danger {
  border-color: #e57373;
  color: #c62828;
}

.ghost.tiny {
  padding: 2px 6px;
  font-size: 12px;
}

.ghost:focus,
.ghost:focus-visible {
  outline: none;
  box-shadow: none;
}

.tree {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tree-item {
  border: none;
  background: transparent;
}

.tree-node {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #2c2f36;
  outline: none;
  box-sizing: border-box;
}

.tree-node.expanded {
  background: #f7f9fc;
}

.tree-node:focus,
.tree-node:focus-visible {
  outline: none;
}

.actions {
  display: flex;
  gap: 6px;
  padding: 0 10px 6px;
}

.icons {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #6c7180;
}

.chevron {
  transition: transform 0.15s ease;
}

.chevron.expanded {
  transform: rotate(90deg);
}

.folder {
  color: #f0a500;
}

.folder.open {
  color: #f7b733;
}

.label {
  flex: 1;
  text-align: left;
}

.badge {
  background: #e8ecf5;
  color: #4a5a7d;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 12px;
}

.chapters {
  padding: 6px 12px 10px 28px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chapter-row {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #2c2f36;
  justify-content: space-between;
  padding: 6px 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.chapter-row:hover {
  background: #f0f2f8;
}

.chapter-row.active {
  background: #e3e9f9;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4a5a7d;
  flex-shrink: 0;
}

.placeholder {
  margin: 0;
  color: #6c7180;
}

.placeholder.sub {
  padding: 0 12px 10px;
}
</style>
