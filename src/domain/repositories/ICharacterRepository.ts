import { Character } from '../entities/Character'

export interface ICharacterRepository {
  save(character: Character): Promise<void>
  findById(id: string): Promise<Character | null>
  findAll(): Promise<Character[]>
  delete(id: string): Promise<void>
  search(query: string): Promise<Character[]>
}