<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: { name: string; location: string }): void
  (e: 'pickLocation'): void
}>()

const name = ref('')
const location = ref('')

const submit = () => {
  emit('submit', { name: name.value.trim(), location: location.value.trim() })
}

const pickLocation = async () => {
  const selected = await window.ipcRenderer.invoke('select-directory')
  if (selected) {
    location.value = selected
  }
  emit('pickLocation')
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="dialog">
      <header>
        <h3>新建项目</h3>
        <button type="button" class="ghost" @click="emit('close')">×</button>
      </header>
      <div class="field">
        <label for="project-name">项目名称</label>
        <input id="project-name" v-model="name" type="text" placeholder="我的小说" />
      </div>
      <div class="field">
        <label for="project-path">存储位置</label>
        <div class="input-row">
          <input
            id="project-path"
            v-model="location"
            type="text"
            placeholder="请选择保存路径"
          />
          <button type="button" class="ghost" @click="pickLocation">📁</button>
        </div>
      </div>
      <div class="actions">
        <button type="button" class="secondary" @click="emit('close')">取消</button>
        <button type="button" class="primary" @click="submit">创建</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.dialog {
  width: min(520px, calc(100% - 40px));
  background: #fff;
  border-radius: 14px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
  box-sizing: border-box;
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

h3 {
  margin: 0;
}

.ghost {
  border: none;
  background: transparent;
  font-size: 1.25rem;
  cursor: pointer;
  line-height: 1;
  padding: 0.35rem 0.5rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 0.9rem;
}

.input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

label {
  font-weight: 600;
}

input {
  padding: 0.55rem 0.75rem;
  border: 1px solid #d0d4dd;
  border-radius: 8px;
  font-size: 0.95rem;
  box-sizing: border-box;
  flex: 1;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.secondary {
  background-color: transparent;
  border: 1px solid #646cff;
  color: #646cff;
  padding: 0.55rem 1rem;
  border-radius: 8px;
  cursor: pointer;
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
</style>
