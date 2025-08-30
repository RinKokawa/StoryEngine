export interface Novel {
  id: string
  title: string
  description?: string
  genre?: string
  cover?: string
  wordCount: number
  lastEdit: Date
  createdAt: Date
  volumes: Volume[]
}

export interface Volume {
  id: string
  title: string
  description?: string
  chapters: Chapter[]
  createdAt: Date
}

export interface Chapter {
  id: string
  title: string
  content: string
  number: string
  volumeId?: string
  wordCount: number
  lastEdit: Date
  createdAt: Date
}