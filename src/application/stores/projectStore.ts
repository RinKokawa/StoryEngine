import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface Project {
  id: string
  name: string
  description: string
  createdAt: Date
  updatedAt: Date
  coverImage?: string
  genre?: string
  status: 'planning' | 'writing' | 'completed' | 'paused'
}

export const useProjectStore = defineStore('project', () => {
  // 状态
  const projects = ref<Project[]>([])
  const currentProjectId = ref<string | null>(null)

  // 计算属性
  const currentProject = computed(() => {
    if (!currentProjectId.value) return null
    return projects.value.find(p => p.id === currentProjectId.value) || null
  })

  const hasProjects = computed(() => projects.value.length > 0)

  // 方法
  const createProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    projects.value.push(newProject)
    return newProject
  }

  const updateProject = (id: string, updates: Partial<Project>) => {
    const index = projects.value.findIndex(p => p.id === id)
    if (index !== -1) {
      projects.value[index] = {
        ...projects.value[index],
        ...updates,
        updatedAt: new Date()
      }
    }
  }

  const deleteProject = (id: string) => {
    const index = projects.value.findIndex(p => p.id === id)
    if (index !== -1) {
      projects.value.splice(index, 1)
      if (currentProjectId.value === id) {
        currentProjectId.value = null
      }
    }
  }

  const selectProject = (id: string) => {
    const project = projects.value.find(p => p.id === id)
    if (project) {
      currentProjectId.value = id
    }
  }

  const clearCurrentProject = () => {
    currentProjectId.value = null
  }

  // 初始化示例数据
  const initializeWithSampleData = () => {
    if (projects.value.length === 0) {
      const sampleProjects: Project[] = [
        {
          id: '1',
          name: '星际迷航',
          description: '一个关于星际探索的科幻小说',
          genre: '科幻',
          status: 'writing',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: '2',
          name: '古代传奇',
          description: '一个发生在古代的武侠故事',
          genre: '武侠',
          status: 'planning',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-20')
        }
      ]
      projects.value = sampleProjects
    }
  }

  return {
    // 状态
    projects,
    currentProjectId,
    
    // 计算属性
    currentProject,
    hasProjects,
    
    // 方法
    createProject,
    updateProject,
    deleteProject,
    selectProject,
    clearCurrentProject,
    initializeWithSampleData
  }
})