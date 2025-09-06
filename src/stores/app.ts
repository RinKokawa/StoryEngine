// 应用全局状态管理

import { defineStore } from 'pinia'
import type { 
  AppStoreState, 
  AppSettings,
  Notification,
  PageName
} from '@/types'
import { storageService } from '@/services/storage'
import { ErrorHandler } from '@/utils/errorHandler'

export const useAppStore = defineStore('app', {
  state: (): AppStoreState => ({
    initialized: false,
    loading: false,
    error: null,
    sidebarCollapsed: true,
    currentPage: 'dashboard',
    notifications: [],
    settings: {
      autoSave: true,
      autoSaveInterval: 30000,
      fontSize: 16,
      lineHeight: 1.5,
      autoIndent: true,
      theme: 'light',
      sidebarCollapsed: true,
      windowSize: 'normal',
      openLastProject: true,
      minimizeToTray: false,
      checkUpdates: true,
      autoBackup: true,
      maxBackups: 10,
      backupInterval: 24
    },
    isElectron: typeof window !== 'undefined' && !!(window as any).electronAPI,
    version: '1.0.0'
  }),

  getters: {
    // 通知相关
    hasNotifications: (state): boolean => state.notifications.length > 0,
    
    unreadNotifications: (state): number => state.notifications.length,
    
    // 主题相关
    isDarkTheme: (state): boolean => {
      if (state.settings.theme === 'dark') return true
      if (state.settings.theme === 'light') return false
      // auto 模式下检查系统主题
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    },

    // 应用状态
    isReady: (state): boolean => state.initialized && !state.loading,
    
    hasError: (state): boolean => state.error !== null
  },

  actions: {
    // 应用初始化
    async initialize(): Promise<void> {
      if (this.initialized) return
      
      this.loading = true
      
      try {
        // 加载设置
        this.settings = await storageService.getSettings()
        this.sidebarCollapsed = this.settings.sidebarCollapsed
        
        // 应用主题
        this.applyTheme()
        
        // 监听系统主题变化
        this.watchSystemTheme()
        
        this.initialized = true
      } catch (error) {
        this.error = '应用初始化失败'
        ErrorHandler.handleError(error, 'initialize')
      } finally {
        this.loading = false
      }
    },

    // 导航
    navigateTo(page: PageName): void {
      this.currentPage = page
    },

    // 侧边栏
    toggleSidebar(): void {
      this.sidebarCollapsed = !this.sidebarCollapsed
      this.updateSettings({ sidebarCollapsed: this.sidebarCollapsed })
    },

    setSidebarCollapsed(collapsed: boolean): void {
      this.sidebarCollapsed = collapsed
      this.updateSettings({ sidebarCollapsed: collapsed })
    },

    // 设置
    async updateSettings(newSettings: Partial<AppSettings>): Promise<void> {
      try {
        this.settings = { ...this.settings, ...newSettings }
        await storageService.saveSettings(this.settings)
        
        // 如果主题设置改变，重新应用主题
        if (newSettings.theme) {
          this.applyTheme()
        }
      } catch (error) {
        this.error = '保存设置失败'
        ErrorHandler.handleError(error, 'updateSettings')
      }
    },

    async resetSettings(): Promise<void> {
      try {
        const defaultSettings: AppSettings = {
          autoSave: true,
          autoSaveInterval: 30000,
          fontSize: 16,
          lineHeight: 1.5,
          autoIndent: true,
          theme: 'light',
          sidebarCollapsed: true,
          windowSize: 'normal',
          openLastProject: true,
          minimizeToTray: false,
          checkUpdates: true,
          autoBackup: true,
          maxBackups: 10,
          backupInterval: 24
        }
        
        this.settings = defaultSettings
        await storageService.saveSettings(defaultSettings)
        this.applyTheme()
      } catch (error) {
        this.error = '重置设置失败'
        ErrorHandler.handleError(error, 'resetSettings')
      }
    },

    // 通知
    showNotification(notification: Omit<Notification, 'id' | 'createdAt'>): void {
      const newNotification: Notification = {
        ...notification,
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date()
      }
      
      this.notifications.push(newNotification)
      
      // 自动移除通知
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          this.removeNotification(newNotification.id)
        }, notification.duration)
      }
    },

    removeNotification(id: string): void {
      this.notifications = this.notifications.filter(n => n.id !== id)
    },

    clearNotifications(): void {
      this.notifications = []
    },

    // 错误处理
    setError(error: string | null): void {
      this.error = error
    },

    clearError(): void {
      this.error = null
    },

    // 主题管理
    applyTheme(): void {
      const body = document.body
      
      // 清除所有主题类
      body.classList.remove('dark-theme', 'auto-theme')
      
      if (this.settings.theme === 'dark') {
        body.classList.add('dark-theme')
      } else if (this.settings.theme === 'auto') {
        body.classList.add('auto-theme')
        // 根据系统主题添加对应类
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          body.classList.add('dark-theme')
        }
      }
      // light 主题不需要添加类
    },

    watchSystemTheme(): void {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleThemeChange = () => {
        if (this.settings.theme === 'auto') {
          this.applyTheme()
        }
      }
      
      // 现代浏览器使用 addEventListener
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleThemeChange)
      } else {
        // 兼容旧浏览器
        mediaQuery.addListener(handleThemeChange)
      }
    },

    // 便捷通知方法
    showSuccess(message: string, title = '成功'): void {
      this.showNotification({
        type: 'success',
        title,
        message,
        duration: 3000
      })
    },

    showError(message: string, title = '错误'): void {
      this.showNotification({
        type: 'error',
        title,
        message,
        duration: 5000
      })
    },

    showWarning(message: string, title = '警告'): void {
      this.showNotification({
        type: 'warning',
        title,
        message,
        duration: 4000
      })
    },

    showInfo(message: string, title = '信息'): void {
      this.showNotification({
        type: 'info',
        title,
        message,
        duration: 3000
      })
    }
  }
})