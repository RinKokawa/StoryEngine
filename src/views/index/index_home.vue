<script setup lang="ts">
import { onMounted, ref } from 'vue'
import IndexProjectCoverCard from './index_project_cover_card.vue'

type Project = {
  name: string
  path: string
  lastOpened?: number
}

type ProjectWithCover = Project & { cover: string | null }

const STORAGE_KEY = 'novel-recent-projects'
const projects = ref<ProjectWithCover[]>([])
const selectedPath = ref<string | null>(null)

const emit = defineEmits<{
  (e: 'open-project', path: string): void
}>()

const loadProjects = async () => {
  const cached = localStorage.getItem(STORAGE_KEY)
  if (!cached) return
  try {
    const parsed = JSON.parse(cached) as Project[]
    const list: ProjectWithCover[] = []
    for (const item of parsed) {
      const cover = await window.ipcRenderer.invoke('get-project-cover', item.path)
      list.push({ ...item, cover: cover ?? null })
    }
    projects.value = list
  } catch (err) {
    console.error('加载最近项目失败', err)
  }
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
  <section class="content">
    <h3>首页</h3>
    <p>欢迎回来，开始创作你的下一个章节吧。</p>
    <div class="recent" v-if="projects.length">
      <h4>最近项目</h4>
      <div class="grid">
        <IndexProjectCoverCard
          v-for="item in projects"
          :key="item.path"
          :name="item.name"
          :path="item.path"
          :cover="item.cover"
          :last-opened="item.lastOpened"
          :selected="item.path === selectedPath"
          @select="handleSelect"
          @open="handleOpen"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.content {
  width: min(920px, calc(100% - 32px));
  margin: 0 auto;
}

h3 {
  margin: 0 0 0.5rem;
}

p {
  margin: 0;
  color: #6c7180;
}

.recent {
  margin-top: 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}
</style>
