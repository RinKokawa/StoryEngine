import fs from 'node:fs/promises'
import path from 'node:path'

export async function createProjectOnDisk(name: string, location: string) {
  const projectDir = path.join(location, name)
  await fs.mkdir(projectDir, { recursive: true })

  const novelPath = path.join(projectDir, 'novel.json')
  const data = {
    name,
    createdAt: new Date().toISOString(),
    chapters: [],
  }
  await fs.writeFile(novelPath, JSON.stringify(data, null, 2), 'utf-8')

  return { projectPath: projectDir }
}

export async function readProjectCover(projectPath: string) {
  const candidates = ['cover.png', 'cover.jpg', 'cover.jpeg']
  for (const file of candidates) {
    const fullPath = path.join(projectPath, file)
    try {
      const content = await fs.readFile(fullPath)
      const ext = path.extname(fullPath).toLowerCase() === '.png' ? 'png' : 'jpeg'
      const base64 = content.toString('base64')
      return `data:image/${ext};base64,${base64}`
    } catch {
      // ignore and try next
    }
  }
  return null
}
