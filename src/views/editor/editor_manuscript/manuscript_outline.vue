<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

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
</script>

<template>
  <div class="outline">
    <h4>卷章结构</h4>
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
        <div v-if="isExpanded(v.id) && v.chapters?.length" class="chapters">
          <button
            v-for="c in v.chapters"
            :key="c.id"
            type="button"
            class="chapter-row"
            @click="emit('open-chapter', c)"
          >
            <span class="dot"></span>
            <span class="chapter-name">{{ c.name }}</span>
          </button>
        </div>
        <p v-else-if="isExpanded(v.id)" class="placeholder sub">暂无章节。</p>
      </div>
    </div>
    <p v-else class="placeholder">暂无卷信息。</p>
  </div>
</template>

<style scoped>
.outline h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
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
