// 存储适配器实现

import type { StorageAdapter } from '@/types'

// 文件存储适配器 (Electron 环境)
export class FileStorageAdapter implements StorageAdapter {
  private electronAPI: any

  constructor() {
    this.electronAPI = (window as any).electronAPI
    if (!this.electronAPI) {
      throw new Error('Electron API not available')
    }
  }

  // 新接口方法
  async read(path: string): Promise<string> {
    try {
      const result = await this.electronAPI.readFile(path)
      if (!result.success) {
        throw new Error(result.error || 'Failed to read file')
      }
      return result.data
    } catch (error) {
      console.error('Failed to read file:', error)
      throw error
    }
  }

  async write(path: string, data: string): Promise<void> {
    try {
      const result = await this.electronAPI.writeFile(path, data)
      if (!result.success) {
        throw new Error(result.error || 'Failed to write file')
      }
    } catch (error) {
      console.error('Failed to write file:', error)
      throw error
    }
  }

  async delete(path: string): Promise<void> {
    try {
      const result = await this.electronAPI.deleteFile(path)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete file')
      }
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw error
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      const result = await this.electronAPI.readFile(path)
      return result.success
    } catch (error) {
      return false
    }
  }

  async list(path: string = ''): Promise<string[]> {
    try {
      const result = await this.electronAPI.listFiles(path)
      return result.success ? result.files : []
    } catch (error) {
      console.error('Failed to list files:', error)
      return []
    }
  }

  async mkdir(path: string): Promise<void> {
    try {
      const result = await this.electronAPI.createDirectory(path)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create directory')
      }
    } catch (error) {
      console.error('Failed to create directory:', error)
      throw error
    }
  }

  // 兼容旧接口的方法
  async readFile(filename: string): Promise<string | null> {
    try {
      return await this.read(filename)
    } catch (error) {
      return null
    }
  }

  async writeFile(filename: string, data: string): Promise<void> {
    return this.write(filename, data)
  }

  async deleteFile(filename: string): Promise<void> {
    return this.delete(filename)
  }

  async listFiles(): Promise<string[]> {
    return this.list()
  }
}

// 本地存储适配器 (浏览器环境)
export class LocalStorageAdapter implements StorageAdapter {
  private prefix = 'storyengine_'

  // 新接口方法
  async read(path: string): Promise<string> {
    try {
      const key = this.prefix + path
      const data = localStorage.getItem(key)
      if (data === null) {
        throw new Error(`File not found: ${path}`)
      }
      return data
    } catch (error) {
      console.error('Failed to read from localStorage:', error)
      throw error
    }
  }

  async write(path: string, data: string): Promise<void> {
    try {
      const key = this.prefix + path
      localStorage.setItem(key, data)
    } catch (error) {
      console.error('Failed to write to localStorage:', error)
      throw error
    }
  }

  async delete(path: string): Promise<void> {
    try {
      const key = this.prefix + path
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Failed to delete from localStorage:', error)
      throw error
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      const key = this.prefix + path
      return localStorage.getItem(key) !== null
    } catch (error) {
      return false
    }
  }

  async list(path: string = ''): Promise<string[]> {
    try {
      const files: string[] = []
      const searchPrefix = this.prefix + path
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(searchPrefix)) {
          files.push(key.substring(this.prefix.length))
        }
      }
      return files
    } catch (error) {
      console.error('Failed to list localStorage keys:', error)
      return []
    }
  }

  async mkdir(path: string): Promise<void> {
    // localStorage 不需要创建目录，这是一个空操作
    return Promise.resolve()
  }

  // 兼容旧接口的方法
  async readFile(filename: string): Promise<string | null> {
    try {
      return await this.read(filename)
    } catch (error) {
      return null
    }
  }

  async writeFile(filename: string, data: string): Promise<void> {
    return this.write(filename, data)
  }

  async deleteFile(filename: string): Promise<void> {
    return this.delete(filename)
  }

  async listFiles(): Promise<string[]> {
    return this.list()
  }
}

// 创建适配器工厂函数
export function createStorageAdapter(): StorageAdapter {
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI
  
  if (isElectron) {
    return new FileStorageAdapter()
  } else {
    return new LocalStorageAdapter()
  }
}