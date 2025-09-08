/**
 * 角色服务
 * 处理角色相关的存储操作（兼容现有数据结构）
 */
import { BaseStorageService } from './BaseStorageService'
import type { StorageAdapter } from '../adapters/StorageInterfaces'

export interface Character {
  id: string
  projectId: string
  name: string
  role?: string
  description?: string
  age?: number | string
  gender?: string
  occupation?: string
  appearance?: string
  personality?: string
  background?: string
  avatar?: string
  tags?: string[]
  createdAt: string
  updatedAt?: string
  lastModified: string
}

export type CreateCharacterData = {
  name: string
} & Partial<Omit<Character, 'id' | 'projectId' | 'createdAt' | 'lastModified'>>

export type UpdateCharacterData = {
  id: string
} & Partial<Omit<Character, 'projectId' | 'createdAt'>>

export class CharacterService extends BaseStorageService {
  constructor(adapter: StorageAdapter) {
    super(adapter)
  }

  private file(projectId: string) {
    return `project_${projectId}_characters.json`
  }

  async getProjectCharacters(projectId: string): Promise<Character[]> {
    const cacheKey = this.getCacheKey('characters', projectId)
    let list = this.getCache<Character[]>(cacheKey)
    if (!list) {
      list = await this.readJsonFile(this.file(projectId), [])
      this.setCache(cacheKey, list)
    }
    return list
  }

  async getCharacter(projectId: string, id: string): Promise<Character | null> {
    const list = await this.getProjectCharacters(projectId)
    return list.find(c => c.id === id) || null
  }

  async createCharacter(projectId: string, data: CreateCharacterData): Promise<Character> {
    const list = await this.getProjectCharacters(projectId)
    const now = new Date().toISOString()
    const character: Character = {
      id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectId,
      name: data.name,
      role: data.role || '',
      description: data.description || '',
      age: data.age ?? undefined,
      gender: data.gender ?? undefined,
      occupation: data.occupation ?? undefined,
      appearance: data.appearance ?? undefined,
      personality: data.personality ?? undefined,
      background: data.background ?? undefined,
      avatar: data.avatar ?? undefined,
      tags: data.tags ?? [],
      createdAt: now,
      updatedAt: now,
      lastModified: now
    }
    list.push(character)
    await this.writeJsonFile(this.file(projectId), list)
    this.clearCache(this.getCacheKey('characters', projectId))
    return character
  }

  async updateCharacter(projectId: string, data: UpdateCharacterData): Promise<Character> {
    const list = await this.getProjectCharacters(projectId)
    const idx = list.findIndex(c => c.id === data.id)
    if (idx === -1) throw new Error('角色不存在')
    const now = new Date().toISOString()
    const updated: Character = {
      ...list[idx],
      ...data,
      updatedAt: now,
      lastModified: now
    }
    list[idx] = updated
    await this.writeJsonFile(this.file(projectId), list)
    this.clearCache(this.getCacheKey('characters', projectId))
    return updated
  }

  async deleteCharacter(projectId: string, id: string): Promise<void> {
    const list = await this.getProjectCharacters(projectId)
    const filtered = list.filter(c => c.id !== id)
    await this.writeJsonFile(this.file(projectId), filtered)
    this.clearCache(this.getCacheKey('characters', projectId))
  }
}