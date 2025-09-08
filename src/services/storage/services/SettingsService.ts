/**
 * 设置服务
 * 处理应用设置相关的存储操作
 */

import { BaseStorageService } from './BaseStorageService';
import { StorageAdapter } from '../adapters/StorageInterfaces';

// 应用设置类型定义
export interface AppSettings {
  autoSave: boolean;
  autoSaveInterval: number;
  fontSize: number;
  lineHeight: number;
  autoIndent: boolean;
  theme: string;
  sidebarCollapsed: boolean;
  windowSize: string;
  openLastProject: boolean;
  minimizeToTray: boolean;
  checkUpdates: boolean;
  autoBackup?: boolean;
  maxBackups?: number;
  backupInterval?: number;
}

export class SettingsService extends BaseStorageService {
  /**
   * 构造函数
   * @param adapter 存储适配器
   */
  constructor(adapter: StorageAdapter) {
    super(adapter);
  }

  /**
   * 获取应用设置
   * @returns 应用设置
   */
  async getSettings(): Promise<AppSettings> {
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
    };
    
    const cacheKey = this.getCacheKey('settings');
    let settings = this.getCache<AppSettings>(cacheKey);
    
    if (!settings) {
      settings = await this.readJsonFile('settings.json', defaultSettings);
      this.setCache(cacheKey, settings);
    }
    
    return settings;
  }

  /**
   * 保存应用设置
   * @param settings 应用设置
   */
  async saveSettings(settings: AppSettings): Promise<void> {
    await this.writeJsonFile('settings.json', settings);
    this.clearCache('settings');
  }

  /**
   * 重置应用设置为默认值
   * @returns 默认设置
   */
  async resetSettings(): Promise<AppSettings> {
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
    };
    
    await this.saveSettings(defaultSettings);
    return defaultSettings;
  }

  /**
   * 应用主题设置
   * @param theme 主题名称
   */
  applyTheme(theme: string): void {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }
}