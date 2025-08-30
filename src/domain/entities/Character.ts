export interface Character {
  id: string
  name: string
  role: string
  avatar?: string
  description: string
  tags: string[]
  age?: number
  gender: string
  createdAt: Date
  updatedAt: Date
}