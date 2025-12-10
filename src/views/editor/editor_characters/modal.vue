<script setup lang="ts">
import Titlebar from '../../components/titlebar.vue'

const props = defineProps<{
  projectName: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const close = () => emit('close')
const minimize = () => window.ipcRenderer.invoke('window-control', 'minimize')
const maximize = () => window.ipcRenderer.invoke('window-control', 'maximize')
</script>

<template>
  <div class="window">
    <Titlebar
      :name="`${props.projectName} | 创建角色`"
      @close="close"
      @minimize="minimize"
      @maximize="maximize"
    />
    <div class="content">
      <p class="placeholder">这里将填写角色信息（待实现）。</p>
    </div>
  </div>
</template>

<style scoped>
.window {
  position: fixed;
  inset: 0;
  background: #f5f6fa;
  z-index: 40;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.titlebar {
  height: 32px;
}

.content {
  flex: 1;
  padding: 1rem 1.5rem;
  color: #2c2f36;
}

.placeholder {
  margin: 0;
  color: #6c7180;
}
</style>
