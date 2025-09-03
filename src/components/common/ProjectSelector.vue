<template>
  <div class="project-selector">
    <select 
      v-model="selectedProject" 
      @change="handleProjectChange"
      class="project-select"
    >
      <option value="">选择项目</option>
      <option 
        v-for="project in projects" 
        :key="project.id" 
        :value="project.id"
      >
        {{ project.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Project {
  id: string
  name: string
}

interface Props {
  projects: Project[]
  modelValue?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', project: Project | null): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedProject = ref(props.modelValue || '')

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  selectedProject.value = newValue || ''
})

// 处理项目变化
const handleProjectChange = () => {
  const project = props.projects.find(p => p.id === selectedProject.value) || null
  emit('update:modelValue', selectedProject.value)
  emit('change', project)
}
</script>

<style scoped>
.project-selector {
  display: inline-block;
}

.project-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 14px;
  min-width: 150px;
  cursor: pointer;
}

.project-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.project-select:hover {
  border-color: #999;
}
</style>