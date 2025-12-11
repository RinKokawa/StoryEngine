<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import WorldviewItem from './editor_worldview_item.vue'

const props = defineProps<{
  projectPath: string
}>()

const items = ref<string[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const currentItem = ref<any | null>(null)
const showItem = ref(false)

const loadWorldviews = async () => {
  items.value = []
  error.value = null
  if (!props.projectPath) return
  loading.value = true
  try {
    const res = await window.ipcRenderer.invoke('worldview:ensure-index', props.projectPath)
    if (res?.items && Array.isArray(res.items)) {
      items.value = res.items as string[]
    }
  } catch (err) {
    console.error('加载世界观失败', err)
    error.value = '无法读取世界观索引'
  } finally {
    loading.value = false
  }
}

onMounted(loadWorldviews)
watch(
  () => props.projectPath,
  () => loadWorldviews(),
)

const openItem = async (id: string) => {
  if (!props.projectPath) return
  showItem.value = true
  currentItem.value = { id, title: id, content: '加载中...' }
  try {
    const data = await window.ipcRenderer.invoke('worldview:read-item', props.projectPath, id)
    currentItem.value = data
  } catch (err) {
    console.error('读取条目失败', err)
    currentItem.value = { id, title: id, content: '读取失败' }
  }
}

const closeItem = () => {
  showItem.value = false
  currentItem.value = null
}
</script>

<template>
  <section class="worldview">
    <header class="head">
      <h3>世界观</h3>
      <p class="hint">进入时会确保 worldviews/index.json 存在，并加载其中的条目。</p>
    </header>
    <div class="body">
      <p v-if="error" class="placeholder">{{ error }}</p>
      <p v-else-if="loading" class="placeholder">加载中...</p>
      <ul v-else class="list">
        <li v-for="item in items" :key="item" @dblclick.stop.prevent="openItem(item)">{{ item }}</li>
      </ul>
    </div>
    <WorldviewItem
      v-if="showItem && currentItem"
      :item="currentItem"
      :project-name="projectPath?.split(/[\\\\/]/).filter(Boolean).at(-1) || '项目'"
      @close="closeItem"
    />
  </section>
</template>

<style scoped>
.worldview {
  color: #2c2f36;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.head h3 {
  margin: 0 0 0.1rem;
}

.hint {
  margin: 0;
  color: #6c7180;
  font-size: 0.95rem;
}

.body {
  border: 1px dashed #d0d4dd;
  padding: 1rem;
  background: #fff;
  min-height: 240px;
}

.placeholder {
  margin: 0;
  color: #6c7180;
}

.list {
  margin: 0;
  padding-left: 1.2rem;
}
</style>
