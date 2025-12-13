<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import OutlineModal from './editor_manuscript/outline_modal.vue'

const props = defineProps<{
  projectPath: string
}>()

type Chapter = { id: string; name: string; synopsis?: string; content?: string }
type Volume = { id: string; name: string; chapters?: Chapter[] }

const volumes = ref<Volume[]>([])
const expanded = ref<Set<string>>(new Set())
const loading = ref(false)
const error = ref<string | null>(null)

const showModal = ref(false)
const modalMode = ref<'volume' | 'chapter'>('volume')
const modalVolumeId = ref<string | null>(null)
const modalTitle = ref('新增卷')
const modalPlaceholder = ref('请输入卷名')
const modalConfirm = ref('创建')

const totalVolumes = computed(() => volumes.value.length)
const totalChapters = computed(() =>
  volumes.value.reduce((sum, v) => sum + (Array.isArray(v.chapters) ? v.chapters.length : 0), 0),
)

const ensureOutline = async () => {
  if (!props.projectPath) return
  await window.ipcRenderer.invoke('ensure-outline', props.projectPath)
}

const loadVolumes = async () => {
  if (!props.projectPath) {
    volumes.value = []
    return
  }
  loading.value = true
  error.value = null
  try {
    const list = await window.ipcRenderer.invoke('list-outline-structure', props.projectPath)
    volumes.value = Array.isArray(list) ? list : []
  } catch (err) {
    console.error('加载大纲失败', err)
    error.value = '无法读取大纲结构'
    volumes.value = []
  } finally {
    loading.value = false
  }
}

const refresh = async () => {
  await ensureOutline()
  await loadVolumes()
}

onMounted(refresh)

watch(
  () => props.projectPath,
  () => refresh(),
)

const toggle = (id: string) => {
  const next = new Set(expanded.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  expanded.value = next
}

const isExpanded = (id: string) => expanded.value.has(id)

const openCreateVolume = () => {
  modalMode.value = 'volume'
  modalVolumeId.value = null
  modalTitle.value = '新增卷'
  modalPlaceholder.value = '请输入卷名'
  modalConfirm.value = '创建卷'
  showModal.value = true
}

const openCreateChapter = (volumeId: string) => {
  modalMode.value = 'chapter'
  modalVolumeId.value = volumeId
  modalTitle.value = '新增章节'
  modalPlaceholder.value = '请输入章节名'
  modalConfirm.value = '创建章节'
  showModal.value = true
}

const handleModalSubmit = async (name: string) => {
  if (!name.trim()) return
  if (modalMode.value === 'volume') {
    try {
      const result = await window.ipcRenderer.invoke('outline:create-volume', props.projectPath, name.trim())
      if (result?.id) {
        volumes.value = [...volumes.value, { id: result.id as string, name: result.name as string, chapters: [] }]
        expanded.value = new Set(expanded.value).add(result.id as string)
      } else {
        await refresh()
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
      volumes.value = volumes.value.map((v) => {
        if (v.id !== modalVolumeId.value) return v
        const chapters = Array.isArray(v.chapters) ? [...v.chapters] : []
        chapters.push({ id: result.id as string, name: result.name as string, synopsis: '', content: '' })
        return { ...v, chapters }
      })
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

const deleteVolume = async (id: string) => {
  const ok = window.confirm('确认删除该卷以及其中的所有章节吗？')
  if (!ok) return
  try {
    await window.ipcRenderer.invoke('outline:delete-volume', props.projectPath, id)
    volumes.value = volumes.value.filter((v) => v.id !== id)
  } catch (err) {
    console.error('删除卷失败', err)
    window.alert('删除卷失败')
  }
}

const deleteChapter = async (volumeId: string, chapterId: string) => {
  const ok = window.confirm('确认删除该章节吗？')
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
</script>

<template>
  <section class="outline-page">
    <header class="head">
      <div>
        <h3>大纲</h3>
        <p class="hint">初始化并管理卷与章节结构，支持快速创建、刷新与清理。</p>
      </div>
      <div class="head-actions">
        <span class="stat">卷：{{ totalVolumes }}</span>
        <span class="stat">章：{{ totalChapters }}</span>
        <button type="button" class="ghost" :disabled="loading" @click="refresh">
          {{ loading ? '刷新中...' : '刷新' }}
        </button>
        <button type="button" class="primary" :disabled="loading" @click="openCreateVolume">+ 新建卷</button>
      </div>
    </header>

    <div class="panel">
      <p v-if="error" class="placeholder">{{ error }}</p>
      <p v-else-if="loading" class="placeholder">加载中...</p>
      <p v-else-if="!volumes.length" class="placeholder">暂无大纲数据，点击“新建卷”开始。</p>

      <div v-else class="tree">
        <div v-for="v in volumes" :key="v.id" class="tree-item">
          <div class="tree-head">
            <button type="button" class="tree-node" :class="{ expanded: isExpanded(v.id) }" @click="toggle(v.id)">
              <svg class="chevron" viewBox="0 0 16 16" width="14" height="14" :class="{ expanded: isExpanded(v.id) }">
                <path
                  fill="currentColor"
                  d="M6 4.75a.75.75 0 0 1 1.28-.53l3.25 3.25a.75.75 0 0 1 0 1.06L7.28 11.78a.75.75 0 0 1-1.28-.53V4.75Z"
                />
              </svg>
              <span class="label">{{ v.name }}</span>
              <span class="badge" v-if="v.chapters?.length">{{ v.chapters.length }}</span>
            </button>
            <div class="actions">
              <button type="button" class="ghost" @click.stop="openCreateChapter(v.id)">+ 章节</button>
              <button type="button" class="ghost danger" @click.stop="deleteVolume(v.id)">删除卷</button>
            </div>
          </div>

          <div v-if="isExpanded(v.id) && v.chapters?.length" class="chapters">
            <div v-for="c in v.chapters" :key="c.id" class="chapter-row">
              <span class="dot"></span>
              <div class="chapter-meta">
                <span class="chapter-name">{{ c.name }}</span>
                <small class="chapter-id">{{ c.id }}</small>
              </div>
              <button type="button" class="ghost danger tiny" @click.stop="deleteChapter(v.id, c.id)">删除</button>
            </div>
          </div>
          <p v-else-if="isExpanded(v.id)" class="placeholder sub">暂无章节</p>
        </div>
      </div>
    </div>

    <OutlineModal
      v-if="showModal"
      :title="modalTitle"
      :placeholder="modalPlaceholder"
      :confirm-text="modalConfirm"
      @submit="handleModalSubmit"
      @close="handleModalClose"
    />
  </section>
</template>

<style scoped>
.outline-page {
  color: #2c2f36;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.head h3 {
  margin: 0 0 0.15rem;
}

.hint {
  margin: 0;
  color: #6c7180;
  font-size: 0.95rem;
}

.head-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat {
  color: #4a5a7d;
}

.ghost,
.primary {
  padding: 0.35rem 0.65rem;
  border: 1px solid #d0d4dd;
  background: #f5f6fa;
  cursor: pointer;
  border-radius: 0;
}

.primary {
  border-color: #646cff;
  background: #646cff;
  color: #fff;
}

.ghost:focus,
.ghost:focus-visible,
.primary:focus,
.primary:focus-visible {
  outline: none;
  box-shadow: none;
}

.panel {
  border: 1px solid #d0d4dd;
  background: #fff;
  padding: 0.75rem;
}

.placeholder {
  margin: 0;
  color: #6c7180;
  padding: 0.25rem 0;
}

.placeholder.sub {
  padding: 0.35rem 0.75rem;
}

.tree {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tree-item {
  border-bottom: 1px solid #e5e7ec;
  padding-bottom: 8px;
}

.tree-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.tree-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.tree-node {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: #2c2f36;
  outline: none;
}

.tree-node.expanded {
  color: #1e2a4a;
}

.chevron {
  color: #6c7180;
  transition: transform 0.15s ease;
}

.chevron.expanded {
  transform: rotate(90deg);
}

.label {
  font-weight: 600;
}

.badge {
  background: #e8ecf5;
  color: #4a5a7d;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 6px;
}

.ghost.danger {
  border-color: #e57373;
  color: #c62828;
}

.ghost.tiny {
  padding: 2px 6px;
  font-size: 12px;
}

.chapters {
  padding: 4px 0 0 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chapter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #f7f9fc;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4a5a7d;
  flex-shrink: 0;
}

.chapter-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.chapter-name {
  font-weight: 600;
}

.chapter-id {
  color: #6c7180;
  font-size: 12px;
}

@media (max-width: 960px) {
  .head-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
