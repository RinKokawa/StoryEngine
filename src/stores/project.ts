// 项目状态管理

import { defineStore } from 'pinia'
import type { 
  ProjectStoreState, 
  Project,
  CreateProjectData,
  UpdateProjectData
} from '@/types'
import { ServiceFactory } from '@/services/storage'
import { ErrorHandler } from '@/utils/errorHandler'
import { AppError } from '@/types'

export const useProjectStore = defineStore('project', {
  state: (): ProjectStoreState => ({
    projects: [],
    currentProject: null,
    loading: false,
    error: null,
    lastUpdated: null
  }),

  getters: {
    // 项目统计
    totalProjects: (state) => state.projects.length,
    
    activeProjects: (state) => 
      state.projects.filter(p => p.status === 'writing').length,
    
    completedProjects: (state) => 
      state.projects.filter(p => p.status === 'completed').length,
    
    totalWordCount: (state) => 
      state.projects.reduce((sum, p) => sum + p.wordCount, 0),

    // 项目查找
    getProjectById: (state) => (id: string): Project | undefined => 
      state.projects.find(p => p.id === id),
    
    getProjectsByStatus: (state) => (status: string): Project[] => 
      state.projects.filter(p => p.status === status),
    
    getProjectsByType: (state) => (type: string): Project[] => 
      state.projects.filter(p => p.type === type),

    // 当前项目相关
    hasCurrentProject: (state) => state.currentProject !== null,
    
    currentProjectProgress: (state) => {
      if (!state.currentProject || state.currentProject.targetWords === 0) return 0
      return Math.min(100, (state.currentProject.wordCount / state.currentProject.targetWords) * 100)
    }
  },

  actions: {
    // 项目管理
    async loadProjects(): Promise<void> {
      this.loading = true
      this.error = null
      
      try {
        const projectService = ServiceFactory.getProjectService()
        this.projects = await projectService.getProjects()
        this.lastUpdated = new Date()
      } catch (error) {
        this.error = '加载项目失败'
        ErrorHandler.handleError(error, 'loadProjects')
      } finally {
        this.loading = false
      }
    },

    async createProject(data: CreateProjectData): Promise<Project> {
      this.loading = true
      this.error = null
      
      try {
        if (!data.name || !data.type || !data.targetWords) {
          throw new AppError('缺少必需字段')
        }
        
        const projectService = ServiceFactory.getProjectService()
        const project = await projectService.createProject(data)
        this.projects.push(project)
        this.lastUpdated = new Date()
        
        return project
      } catch (error) {
        this.error = '创建项目失败'
        ErrorHandler.handleError(error, 'createProject')
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateProject(data: UpdateProjectData): Promise<Project> {
      this.loading = true
      this.error = null
      
      try {
        const projectService = ServiceFactory.getProjectService()
        const updatedProject = await projectService.updateProject(data)
        
        const index = this.projects.findIndex(p => p.id === data.id)
        if (index !== -1) {
          this.projects[index] = updatedProject
        }
        
        // 如果更新的是当前项目，也要更新当前项目状态
        if (this.currentProject?.id === data.id) {
          this.currentProject = updatedProject
        }
        
        this.lastUpdated = new Date()
        return updatedProject
      } catch (error) {
        this.error = '更新项目失败'
        ErrorHandler.handleError(error, 'updateProject')
        throw error
      } finally {
        this.loading = false
      }
    },

    async deleteProject(id: string): Promise<void> {
      this.loading = true
      this.error = null
      
      try {
        const projectService = ServiceFactory.getProjectService()
        await projectService.deleteProject(id)
        
        this.projects = this.projects.filter(p => p.id !== id)
        
        // 如果删除的是当前项目，清空当前项目
        if (this.currentProject?.id === id) {
          this.currentProject = null
          await projectService.setCurrentProject(null)
        }
        
        this.lastUpdated = new Date()
      } catch (error) {
        this.error = '删除项目失败'
        ErrorHandler.handleError(error, 'deleteProject')
        throw error
      } finally {
        this.loading = false
      }
    },

    async setCurrentProject(project: Project | null): Promise<void> {
      try {
        const projectService = ServiceFactory.getProjectService()
        this.currentProject = project
        await projectService.setCurrentProject(project)
      } catch (error) {
        this.error = '设置当前项目失败'
        ErrorHandler.handleError(error, 'setCurrentProject')
        throw error
      }
    },

    async refreshProject(id: string): Promise<void> {
      try {
        const projectService = ServiceFactory.getProjectService()
        const project = await projectService.getProject(id)
        if (project) {
          const index = this.projects.findIndex(p => p.id === id)
          if (index !== -1) {
            this.projects[index] = project
          }
          
          if (this.currentProject?.id === id) {
            this.currentProject = project
          }
        }
      } catch (error) {
        ErrorHandler.handleError(error, 'refreshProject')
      }
    },

    // 初始化
    async initialize(): Promise<void> {
      await this.loadProjects()
      
      try {
        const projectService = ServiceFactory.getProjectService()
        this.currentProject = await projectService.getCurrentProject()
      } catch (error) {
        ErrorHandler.handleError(error, 'initialize')
      }
    },

    // 清除错误
    clearError(): void {
      this.error = null
    }
  }
})