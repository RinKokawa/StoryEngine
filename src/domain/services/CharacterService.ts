import { Character } from '../entities/Character'
import { ICharacterRepository } from '../repositories/ICharacterRepository'

export class CharacterService {
  constructor(private characterRepository: ICharacterRepository) {}

  async createCharacter(characterData: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>): Promise<Character> {
    const character: Character = {
      ...characterData,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await this.characterRepository.save(character)
    return character
  }

  async updateCharacter(id: string, updates: Partial<Omit<Character, 'id' | 'createdAt'>>): Promise<void> {
    const character = await this.characterRepository.findById(id)
    if (!character) throw new Error('Character not found')

    Object.assign(character, updates, { updatedAt: new Date() })
    await this.characterRepository.save(character)
  }

  async deleteCharacter(id: string): Promise<void> {
    await this.characterRepository.delete(id)
  }

  async getAllCharacters(): Promise<Character[]> {
    return await this.characterRepository.findAll()
  }

  async getCharacterById(id: string): Promise<Character | null> {
    return await this.characterRepository.findById(id)
  }

  async searchCharacters(query: string): Promise<Character[]> {
    if (!query.trim()) {
      return await this.getAllCharacters()
    }
    return await this.characterRepository.search(query)
  }

  async getCharacterSuggestions(query: string): Promise<Character[]> {
    const characters = await this.searchCharacters(query)
    // 按相关性排序：名字匹配优先，然后是角色，最后是标签
    return characters.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase())
      const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase())
      
      if (aNameMatch && !bNameMatch) return -1
      if (!aNameMatch && bNameMatch) return 1
      
      const aRoleMatch = a.role.toLowerCase().includes(query.toLowerCase())
      const bRoleMatch = b.role.toLowerCase().includes(query.toLowerCase())
      
      if (aRoleMatch && !bRoleMatch) return -1
      if (!aRoleMatch && bRoleMatch) return 1
      
      return 0
    })
  }
}