<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import OutlineModal from './outline_modal.vue'
import OutlineVolumeItem from './outline/volume_item.vue'
import type { Chapter, Volume } from './outline/types'

const props = defineProps<{
  projectPath: string
}>()

const volumes = ref<Array<Volume>>([])
const synopsis = ref('')
const synopsisSaving = ref(false)
const emit = defineEmits<{
  (e: 'open-chapter', chapter: Chapter): void
}>()
const expanded = ref<Set<string>>(new Set())
const selectedChapterId = ref<string | null>(null)

const ensureOutline = async () => {
  if (!props.projectPath) return
  await window.ipcRenderer.invoke('ensure-outline', props.projectPath)
}

const loadSynopsis = async () => {
  if (!props.projectPath) {
    synopsis.value = ''
    return
  }
  try {
    const meta = await window.ipcRenderer.invoke('project:read-meta', props.projectPath)
    synopsis.value = meta?.synopsis ?? ''
  } catch (err) {
    console.error('读取作品简介失败', err)
    synopsis.value = ''
  }
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
  loadSynopsis()
})

watch(
  () => props.projectPath,
  () => {
    ensureOutline()
    loadVolumes()
    loadSynopsis()
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
  const ok = window.confirm('确定删除该卷及其下的章节吗？')
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

const deleteChapter = async ({ volumeId, chapterId }: { volumeId: string; chapterId: string }) => {
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

const saveSynopsis = async () => {
  if (!props.projectPath) return
  synopsisSaving.value = true
  try {
    await window.ipcRenderer.invoke('project:save-synopsis', props.projectPath, synopsis.value)
  } catch (err) {
    console.error('保存作品简介失败', err)
    window.alert('保存作品简介失败')
  } finally {
    synopsisSaving.value = false
  }
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
const findChapterById = (id: string): Chapter | null => {
  for (const v of volumes.value) {
    if (!v.chapters) continue
    for (const c of v.chapters) {
      if (c.id === id) return c
    }
  }
  return null
}

const selectChapter = async (chapter: Chapter) => {
  selectedChapterId.value = chapter.id
  // 缓存为了防止使用陈旧数据，重新加载一次卷章节数据后再打开
  await loadVolumes()
  const latest = findChapterById(chapter.id) || chapter
  emit('open-chapter', latest)
}
</script>

<template>
  <div class="outline">
    <div class="intro-card">
      <div class="intro-header">
        <h4>作品简介</h4>
        <div class="intro-actions">
          <span class="muted" v-if="synopsisSaving">保存中…</span>
          <button type="button" class="ghost primary" :disabled="synopsisSaving" @click="saveSynopsis">
            {{ synopsisSaving ? '保存中' : '保存简介' }}
          </button>
        </div>
      </div>
      <textarea
        v-model="synopsis"
        class="intro-input"
        rows="3"
        placeholder="简要描述作品背景、主线或氛围，便于创作时参考"
      />
    </div>
    <div class="header">
      <h4>卷章节结构</h4>
      <button type="button" class="ghost" @click="openCreateVolume">+ 新建卷</button>
    </div>
    <div v-if="volumes.length" class="tree">
      <OutlineVolumeItem
        v-for="v in volumes"
        :key="v.id"
        :volume="v"
        :expanded="isExpanded(v.id)"
        :selected-chapter-id="selectedChapterId"
        @toggle="toggle"
        @create-chapter="createChapter"
        @delete-volume="deleteVolume"
        @delete-chapter="deleteChapter"
        @select-chapter="selectChapter"
      />
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

.ghost:focus,
.ghost:focus-visible {
  outline: none;
  box-shadow: none;
}

.outline h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.intro-card {
  border: 1px solid #e1e4ec;
  background: #f9fafc;
  padding: 12px;
  margin-bottom: 12px;
}

.intro-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.intro-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.intro-input {
  width: 100%;
  min-height: 80px;
  resize: vertical;
  padding: 8px 10px;
  border: 1px solid #d0d4dd;
  background: #fff;
  box-sizing: border-box;
  color: #2c2f36;
}

.intro-input:focus,
.intro-input:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(74, 90, 125, 0.15);
}

.muted {
  color: #6c7180;
  font-size: 12px;
}

.ghost.primary {
  border-color: #4a5a7d;
  color: #2c2f36;
  background: #e8ecf5;
}

.tree {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.placeholder {
  margin: 0;
  color: #6c7180;
}
</style>
