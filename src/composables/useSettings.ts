import { reactive, ref } from 'vue'
import { ServiceFactory } from '@/services/storage/ServiceFactory'
import type { AppSettings } from '@/services/storage/services/SettingsService'

export function useSettings() {
  const settings = reactive<AppSettings>({
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
  })

  const saveStatus = ref<'idle' | 'saving' | 'saved'>('idle')
  const original = ref<AppSettings | null>(null)
  const settingsService = ServiceFactory.getSettingsService()

  const load = async () => {
    const s = await settingsService.getSettings()
    Object.assign(settings, s)
    original.value = { ...s }
  }

  const applyTheme = () => {
    settingsService.applyTheme(settings.theme)
  }

  const save = async () => {
    saveStatus.value = 'saving'
    try {
      await settingsService.saveSettings(settings)
      original.value = { ...settings }
      applyTheme()
      saveStatus.value = 'saved'
      setTimeout(() => (saveStatus.value = 'idle'), 1500)
    } catch (e) {
      saveStatus.value = 'idle'
      throw e
    }
  }

  const reset = async () => {
    const defaults = await settingsService.resetSettings()
    Object.assign(settings, defaults)
    applyTheme()
  }

  return {
    settings,
    saveStatus,
    load,
    save,
    reset,
    applyTheme
  }
}