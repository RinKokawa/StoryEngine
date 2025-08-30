import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Character } from '../../domain/entities/Character'
import { serviceContainer } from '../container'

export const useCharacterStore = defineStore('character', () => {
  // 状态
  const characters = ref<Character[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const characterCount = computed(() => characters.value.length)

  // 操作
  const loadCharacters = async () => {
    try {
      loading.value = true
      error.value = null
      characters.value = await serviceContainer.characterService.getAllCharacters()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '加载角色列表失败'
    } finally {
      loading.value = false
    }
  }

  const createCharacter = async (characterData: {
    name: string
    role: string
    avatar?: string
    description: string
    tags: string[]
    age?: number
    gender: string
  }) => {
    try {
      loading.value = true
      error.value = null
      const character = await serviceContainer.characterService.createCharacter(characterData)
      characters.value.push(character)
      return character
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建角色失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateCharacter = async (id: string, updates: Partial<Omit<Character, 'id' | 'createdAt'>>) => {
    try {
      loading.value = true
      error.value = null
      await serviceContainer.characterService.updateCharacter(id, updates)
      
      // 更新本地状态
      const index = characters.value.findIndex(c => c.id === id)
      if (index >= 0) {
        Object.assign(characters.value[index], updates, { updatedAt: new Date() })
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新角色失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteCharacter = async (id: string) => {
    try {
      loading.value = true
      error.value = null
      await serviceContainer.characterService.deleteCharacter(id)
      
      // 更新本地状态
      characters.value = characters.value.filter(c => c.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除角色失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  const searchCharacters = async (query: string): Promise<Character[]> => {
    try {
      return await serviceContainer.characterService.searchCharacters(query)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '搜索角色失败'
      return []
    }
  }

  const getCharacterSuggestions = async (query: string): Promise<Character[]> => {
    try {
      return await serviceContainer.characterService.getCharacterSuggestions(query)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取角色建议失败'
      return []
    }
  }

  const getCharacterById = async (id: string): Promise<Character | null> => {
    try {
      return await serviceContainer.characterService.getCharacterById(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取角色信息失败'
      return null
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    characters,
    loading,
    error,
    
    // 计算属性
    characterCount,
    
    // 操作
    loadCharacters,
    createCharacter,
    updateCharacter,
    deleteCharacter,
    searchCharacters,
    getCharacterSuggestions,
    getCharacterById,
    clearError
  }
})