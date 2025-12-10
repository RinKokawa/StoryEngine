<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{
  projectPath: string
}>()

const volumes = ref<Array<{ id: string; name: string }>>([])

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
    const list = await window.ipcRenderer.invoke('list-volumes', props.projectPath)
    if (Array.isArray(list)) {
      volumes.value = list
    }
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
      <li v-for="v in volumes" :key="v.id">{{ v.name }}</li>
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

.placeholder {
  margin: 0;
  color: #6c7180;
}
</style>
