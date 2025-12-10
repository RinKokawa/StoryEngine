<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  projectPath: string
}>()

const volumes = ref<Array<{ id: string; name: string; chapters?: Array<{ id: string; name: string; synopsis: string }> }>>([])

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
</script>

<template>
  <div class="outline">
    <h4>卷章结构</h4>
    <ul v-if="volumes.length">
      <li v-for="v in volumes" :key="v.id">
        <div class="volume-name">{{ v.name }}</div>
        <ul v-if="v.chapters?.length" class="chapters">
          <li v-for="c in v.chapters" :key="c.id">
            <span class="chapter-name">{{ c.name }}</span>
          </li>
        </ul>
        <p v-else class="placeholder">暂无章节。</p>
      </li>
    </ul>
    <p v-else class="placeholder">暂无卷信息。</p>
  </div>
</template>

<style scoped>
.outline h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.outline ul {
  margin: 0;
  padding-left: 1.1rem;
  color: #2c2f36;
}

.volume-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.chapters {
  padding-left: 1rem;
  margin: 0.1rem 0 0.35rem;
  color: #2c2f36;
}

.chapter-name {
  display: inline-block;
}

.placeholder {
  margin: 0;
  color: #6c7180;
}
</style>
