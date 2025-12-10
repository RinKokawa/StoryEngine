<script setup lang="ts">
import { onMounted, ref } from 'vue'
import IndexCreateProject from './index_create_project.vue'
import IndexProjectRowCard from './index_project_row_card.vue'

type Project = {
  name: string
  path: string
  lastOpened: number
  cover?: string | null
}

const STORAGE_KEY = 'novel-recent-projects'
const showCreate = ref(false)
const projects = ref<Project[]>([])
const selectedPath = ref<string | null>(null)

const emit = defineEmits<{
  (e: 'open-project', path: string): void
}>()

const openCreate = () => {
  showCreate.value = true
}

const closeCreate = () => {
  showCreate.value = false
}

const handleCreate = async (payload: { name: string; location: string }) => {
  if (!payload.name.trim() || !payload.location.trim()) {
    window.alert('请输入项目名称和存储位置')
    return
  }

  try {
    const result = await window.ipcRenderer.invoke('create-project', payload)
    if (result?.projectPath) {
      const cover = await window.ipcRenderer.invoke('get-project-cover', result.projectPath)
      projects.value.unshift({
        name: payload.name.trim(),
        path: result.projectPath,
        lastOpened: Date.now(),
        cover: cover ?? null,
      })
      selectedPath.value = result.projectPath
      saveProjects()
    }
    showCreate.value = false
    window.alert('项目创建完成')
  } catch (err) {
    console.error(err)
    window.alert('创建失败，请检查路径或权限')
  }
}

const saveProjects = () => {
  const slim = projects.value.map(({ name, path, lastOpened }) => ({
    name,
    path,
    lastOpened,
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slim))
}

const loadProjects = async () => {
  const cached = localStorage.getItem(STORAGE_KEY)
  if (!cached) return
  try {
    const parsed = JSON.parse(cached) as Array<Partial<Project>>
    if (Array.isArray(parsed)) {
      const normalized: Project[] = []
      for (const item of parsed) {
        if (!item.name || !item.path) continue
        normalized.push({
          name: item.name,
          path: item.path,
          lastOpened: item.lastOpened ?? Date.now(),
          cover: null,
        })
      }
      projects.value = normalized
      await refreshCovers()
    }
  } catch (err) {
    console.error('加载本地项目列表失败', err)
  }
}

const refreshCovers = async () => {
  const updated: Project[] = []
  for (const item of projects.value) {
    const cover = await window.ipcRenderer.invoke('get-project-cover', item.path)
    updated.push({ ...item, cover: cover ?? null })
  }
  projects.value = updated
}

const handleSelect = (path: string) => {
  selectedPath.value = path
}

const handleOpen = (path: string) => {
  selectedPath.value = path
  emit('open-project', path)
}

onMounted(loadProjects)
</script>

<template>
  <div class="projects">
    <div class="top-bar">
      <button type="button" class="secondary">导入项目</button>
      <button type="button" class="primary" @click="openCreate">新建项目</button>
    </div>
    <section class="content">
      <h3>项目</h3>
      <div v-if="projects.length === 0" class="empty">
        目前没有项目，点击“新建项目”或“导入项目”开始吧。
      </div>
      <div v-else class="grid">
        <IndexProjectRowCard
          v-for="item in projects"
          :key="item.path"
          :name="item.name"
          :path="item.path"
          :cover="item.cover ?? undefined"
          :last-opened="item.lastOpened"
          :selected="item.path === selectedPath"
          @select="handleSelect"
          @open="handleOpen"
        />
      </div>
    </section>
    <IndexCreateProject
      v-if="showCreate"
      @close="closeCreate"
      @submit="handleCreate"
    />
  </div>
</template>

<style scoped>
h3 {
  margin: 0 0 0.5rem;
}

.content {
  width: min(1024px, calc(100% - 48px));
  margin: 2.5rem auto 0;
  padding: 0 16px;
  box-sizing: border-box;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 0.75rem;
}

.empty {
  color: #6c7180;
}

.top-bar {
  display: flex;
  gap: 0.75rem;
  position: fixed;
  top: 1rem;
  right: 1rem;
}

.projects {
  padding-top: 3rem;
}

.secondary {
  background-color: transparent;
  border: 1px solid #646cff;
  color: #646cff;
}

.primary {
  padding: 0.55rem 1rem;
  border: 1px solid transparent;
  background: linear-gradient(135deg, #646cff, #8f7dff);
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
}

.primary:hover {
  opacity: 0.92;
}

.secondary:hover {
  color: #535bf2;
}
</style>
