<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

const props = defineProps<{
  projectPath: string
}>()

type WorldviewIndexItem = { id: string; label: string }

const items = ref<WorldviewIndexItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const currentItem = ref<any | null>(null)
const activeId = ref<string | null>(null)
const itemCount = computed(() => items.value.length)

const loadWorldviews = async () => {
  items.value = []
  error.value = null
  if (!props.projectPath) return
  loading.value = true
  try {
    const res = await window.ipcRenderer.invoke('worldview:ensure-index', props.projectPath)
    if (!res?.items || !Array.isArray(res.items)) {
      items.value = []
      return
    }
    const normalized: WorldviewIndexItem[] = []
    for (const entry of res.items) {
      if (typeof entry === 'string') {
        normalized.push({ id: entry, label: entry })
        continue
      }
      if (entry && typeof entry === 'object') {
        const record = entry as Record<string, unknown>
        const explicitId = typeof record.id === 'string' ? record.id : null
        const explicitLabel =
          typeof record.label === 'string'
            ? record.label
            : typeof record.name === 'string'
              ? record.name
              : typeof record.title === 'string'
                ? record.title
                : null
        if (explicitId) {
          normalized.push({ id: explicitId, label: explicitLabel || explicitId })
          continue
        }
        const key = Object.keys(record)[0]
        if (key) {
          const value = record[key]
          normalized.push({ id: key, label: typeof value === 'string' ? value : key })
        }
      }
    }
    items.value = normalized
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

const openItem = async (entry: WorldviewIndexItem) => {
  if (!props.projectPath) return
  activeId.value = entry.id
  currentItem.value = { id: entry.id, title: entry.label || entry.id, content: '加载中...' }
  try {
    const data = await window.ipcRenderer.invoke('worldview:read-item', props.projectPath, entry.id)
    const resolvedTitle =
      data?.title && data.title !== entry.id
        ? data.title
        : entry.label || entry.id
    currentItem.value = { ...data, title: resolvedTitle }
  } catch (err) {
    console.error('读取条目失败', err)
    currentItem.value = { id: entry.id, title: entry.label || entry.id, content: '读取失败' }
  }
}

const closeItem = () => {
  activeId.value = null
  currentItem.value = null
}

watch(
  () => items.value,
  (val) => {
    if (val.length && !activeId.value) {
      openItem(val[0])
    } else if (!val.length) {
      closeItem()
    }
  },
  { deep: true },
)

</script>

<template>
  <section class="worldview">
    <header class="head">
      <h3>世界观</h3>
      <p class="hint">进入时会确保 worldviews/index.json 存在，并加载其中的条目。</p>
      <div class="head-actions">
        <span class="count" v-if="!loading">{{ itemCount }} 条</span>
        <button type="button" class="ghost" :disabled="loading" @click="loadWorldviews">
          {{ loading ? '刷新中...' : '刷新' }}
        </button>
      </div>
    </header>
    <div class="layout">
      <aside class="nav">
        <p v-if="error" class="placeholder">{{ error }}</p>
        <p v-else-if="loading" class="placeholder">加载中...</p>
        <p v-else-if="!items.length" class="placeholder">暂无条目，请先在项目 worldviews 目录添加 index 与条目。</p>
        <ul v-else class="list">
          <li
            v-for="item in items"
            :key="item.id"
            :class="{ active: activeId === item.id }"
            tabindex="0"
            role="button"
            @dblclick.stop.prevent="openItem(item)"
            @keydown.enter.stop.prevent="openItem(item)"
            @click.stop.prevent="openItem(item)"
          >
            <span class="label">{{ item.label || item.id }}</span>
            <small class="sub">{{ item.id }}</small>
          </li>
        </ul>
      </aside>
      <section class="detail">
        <template v-if="currentItem">
          <div class="detail-head">
            <div>
              <h3 class="detail-title">{{ currentItem.title || currentItem.id }}</h3>
              <p class="detail-sub">{{ currentItem.id }}</p>
            </div>
            <button type="button" class="ghost" @click="closeItem">清空</button>
          </div>
          <pre class="body">{{ currentItem.content || '暂无内容' }}</pre>
        </template>
        <p v-else class="placeholder">请选择左侧条目查看详情。</p>
      </section>
    </div>
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

.head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.head-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.count {
  color: #4a5a7d;
}

.placeholder {
  margin: 0;
  color: #6c7180;
  padding: 0.25rem 0;
}

.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 0.75rem;
  align-items: start;
}

.nav {
  border: 1px solid #d0d4dd;
  background: #f9fafc;
  min-height: 280px;
  padding: 0.5rem 0;
}

.list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
}

.list li {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 0.65rem 0.9rem;
  border-bottom: 1px solid #e5e7ec;
  cursor: pointer;
  outline: none;
}

.list li:last-child {
  border-bottom: none;
}

.list li:hover,
.list li:focus-visible,
.list li.active {
  background: #e9f3ff;
}

.label {
  font-weight: 600;
  color: #2c2f36;
}

.sub {
  color: #6c7180;
  font-size: 12px;
}

.detail {
  border: 1px solid #d0d4dd;
  background: #fff;
  min-height: 280px;
  padding: 0.85rem;
}

.detail-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  gap: 0.75rem;
}

.detail-title {
  margin: 0 0 0.1rem;
}

.detail-sub {
  margin: 0;
  color: #6c7180;
  font-size: 13px;
}

.body {
  background: #f9fafc;
  border: 1px solid #e5e7ec;
  padding: 0.75rem;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  min-height: 200px;
}

@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .nav {
    min-height: 0;
  }
}
</style>
