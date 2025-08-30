import { ICharacterRepository } from '../../domain/repositories/ICharacterRepository'
import { Character } from '../../domain/entities/Character'

export class LocalStorageCharacterRepository implements ICharacterRepository {
  private readonly STORAGE_KEY = 'characters'

  async save(character: Character): Promise<void> {
    const characters = await this.findAll()
    const existingIndex = characters.findIndex(c => c.id === character.id)
    
    if (existingIndex >= 0) {
      characters[existingIndex] = character
    } else {
      characters.push(character)
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(characters))
  }

  async findById(id: string): Promise<Character | null> {
    const characters = await this.findAll()
    return characters.find(c => c.id === id) || null
  }

  async findAll(): Promise<Character[]> {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) return []
    
    return JSON.parse(stored).map((character: any) => ({
      ...character,
      createdAt: new Date(character.createdAt),
      updatedAt: new Date(character.updatedAt)
    }))
  }

  async delete(id: string): Promise<void> {
    const characters = await this.findAll()
    const filtered = characters.filter(c => c.id !== id)
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered))
  }

  async search(query: string): Promise<Character[]> {
    const characters = await this.findAll()
    const lowerQuery = query.toLowerCase()
    
    return characters.filter(char => 
      char.name.toLowerCase().includes(lowerQuery) ||
      char.role.toLowerCase().includes(lowerQuery) ||
      char.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }
}