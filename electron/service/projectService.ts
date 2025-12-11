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

async function logChange(
  projectPath: string,
  entry: { action: string; target: string; before?: unknown; after?: unknown },
) {
  try {
    const logDir = path.join(projectPath, 'log')
    await fs.mkdir(logDir, { recursive: true })
    const day = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
    const logPath = path.join(logDir, `${day}.log`)
    const line =
      `[${new Date().toISOString()}] ${entry.action} ${entry.target}\n` +
      `before: ${JSON.stringify(entry.before)}\n` +
      `after: ${JSON.stringify(entry.after)}\n` +
      `---\n`
    await fs.appendFile(logPath, line, 'utf-8')
  } catch {
    // ignore log failures to avoid破坏主流程
  }
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

export async function ensureOutlineFolder(projectPath: string) {
  const target = path.join(projectPath, 'outline')
  await fs.mkdir(target, { recursive: true })
  const outlinePath = path.join(target, 'outline.json')
  try {
    await fs.access(outlinePath)
  } catch {
    const data = { volumes: [] as string[] }
    await fs.writeFile(outlinePath, JSON.stringify(data, null, 2), 'utf-8')
  }
  return target
}

export async function ensureCharactersFolder(projectPath: string) {
  const target = path.join(projectPath, 'characters')
  await fs.mkdir(target, { recursive: true })
  const indexPath = path.join(target, 'index.json')
  try {
    await fs.access(indexPath)
  } catch {
    const data = { characters: [] as unknown[] }
    await fs.writeFile(indexPath, JSON.stringify(data, null, 2), 'utf-8')
  }
  return target
}

function slugify(name: string) {
  const cleaned = name
    .trim()
    // replace whitespace with underscore
    .replace(/\s+/g, '_')
    // remove characters invalid for file names on most platforms
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
  return cleaned || 'character'
}

export async function saveCharacter(
  projectPath: string,
  payload: Record<string, unknown>,
  previousId?: string | null,
) {
  const charactersDir = await ensureCharactersFolder(projectPath)
  const indexPath = path.join(charactersDir, 'index.json')
  const nameRaw = (payload?.name as string | undefined)?.trim() || '未命名角色'
  const id = `character_${slugify(nameRaw)}`

  let beforeData: Record<string, unknown> | null = null
  if (previousId) {
    try {
      const existingRaw = await fs.readFile(path.join(charactersDir, `${previousId}.json`), 'utf-8')
      beforeData = JSON.parse(existingRaw)
    } catch {
      beforeData = null
    }
  } else {
    try {
      const existingRaw = await fs.readFile(path.join(charactersDir, `${id}.json`), 'utf-8')
      beforeData = JSON.parse(existingRaw)
    } catch {
      beforeData = null
    }
  }

  let indexData: { characters: string[] } = { characters: [] }
  try {
    const content = await fs.readFile(indexPath, 'utf-8')
    indexData = JSON.parse(content)
  } catch {
    // ignore, will recreate
  }

  if (!Array.isArray(indexData.characters)) {
    indexData.characters = []
  }
  if (previousId && previousId !== id) {
    indexData.characters = indexData.characters.filter((entry) => entry !== previousId)
    const oldPath = path.join(charactersDir, `${previousId}.json`)
    try {
      await fs.unlink(oldPath)
    } catch {
      // ignore
    }
  }
  if (!indexData.characters.includes(id)) {
    indexData.characters.push(id)
    await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2), 'utf-8')
  }

  const filePath = path.join(charactersDir, `${id}.json`)
  await fs.writeFile(filePath, JSON.stringify({ ...payload, id }, null, 2), 'utf-8')
  await logChange(projectPath, { action: 'save-character', target: id, before: beforeData, after: payload })

  return { id, filePath }
}

export async function listCharacters(projectPath: string) {
  const charactersDir = await ensureCharactersFolder(projectPath)
  const indexPath = path.join(charactersDir, 'index.json')

  let ids: string[] = []
  try {
    const content = await fs.readFile(indexPath, 'utf-8')
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed.characters)) {
      ids = parsed.characters as string[]
    }
  } catch {
    ids = []
  }

  const items = []
  for (const id of ids) {
    try {
      const file = path.join(charactersDir, `${id}.json`)
      const content = await fs.readFile(file, 'utf-8')
      const data = JSON.parse(content)
      items.push({
        id,
        name: data.name ?? id,
        gender: data.gender ?? '',
        avatar: data.avatar ?? null,
      })
    } catch {
      items.push({ id, name: id, gender: '', avatar: null })
    }
  }
  return items
}

export async function readCharacter(projectPath: string, id: string) {
  const charactersDir = await ensureCharactersFolder(projectPath)
  const file = path.join(charactersDir, `${id}.json`)
  const content = await fs.readFile(file, 'utf-8')
  return JSON.parse(content)
}

export async function listVolumes(projectPath: string) {
  const outlineDir = await ensureOutlineFolder(projectPath)
  const outlinePath = path.join(outlineDir, 'outline.json')

  let volumeIds: string[] = []
  try {
    const content = await fs.readFile(outlinePath, 'utf-8')
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed.volumes)) {
      volumeIds = parsed.volumes as string[]
    }
  } catch {
    volumeIds = []
  }

  const items = []
  for (const id of volumeIds) {
    const filePath = path.join(outlineDir, `${id}.json`)
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      const data = JSON.parse(content)
      items.push({ id, name: data.volume_name ?? id })
    } catch {
      items.push({ id, name: id })
    }
  }
  return items
}

export async function listOutlineStructure(projectPath: string) {
  const outlineDir = await ensureOutlineFolder(projectPath)
  const outlinePath = path.join(outlineDir, 'outline.json')

  let volumeIds: string[] = []
  try {
    const content = await fs.readFile(outlinePath, 'utf-8')
    const parsed = JSON.parse(content)
    if (Array.isArray(parsed.volumes)) {
      volumeIds = parsed.volumes as string[]
    }
  } catch {
    volumeIds = []
  }

  const volumes = []
  for (const id of volumeIds) {
    const volumeFile = path.join(outlineDir, `${id}.json`)
    let volumeData: { volume_name?: string; chapter_list?: string[] } = {}
    try {
      const content = await fs.readFile(volumeFile, 'utf-8')
      volumeData = JSON.parse(content)
    } catch {
      volumeData = { volume_name: id, chapter_list: [] }
      await fs.writeFile(volumeFile, JSON.stringify(volumeData, null, 2), 'utf-8')
    }

    const chapters: Array<{ id: string; name: string; synopsis: string; content?: string }> = []
    const list = Array.isArray(volumeData.chapter_list) ? volumeData.chapter_list : []
    for (const chId of list) {
      const chapterPath = path.join(outlineDir, `${chId}.json`)
      let chapterData: { chapter_name?: string; synopsis?: string; content?: string } = {}
      try {
        const content = await fs.readFile(chapterPath, 'utf-8')
        chapterData = JSON.parse(content)
      } catch {
        chapterData = { chapter_name: chId, synopsis: '', content: '' }
        await fs.writeFile(chapterPath, JSON.stringify(chapterData, null, 2), 'utf-8')
      }
      chapters.push({
        id: chId,
        name: chapterData.chapter_name ?? chId,
        synopsis: chapterData.synopsis ?? '',
        content: chapterData.content ?? '',
      })
    }

    volumes.push({
      id,
      name: volumeData.volume_name ?? id,
      chapters,
    })
  }

  return volumes
}

export async function saveChapterContent(
  projectPath: string,
  chapterId: string,
  data: { chapter_name?: string; synopsis?: string; content?: string },
) {
  const outlineDir = await ensureOutlineFolder(projectPath)
  const chapterPath = path.join(outlineDir, `${chapterId}.json`)
  let existing: Record<string, unknown> = {}
  try {
    const raw = await fs.readFile(chapterPath, 'utf-8')
    existing = JSON.parse(raw)
  } catch {
    existing = {}
  }

  const merged = {
    ...existing,
    chapter_name: data.chapter_name ?? (existing.chapter_name as string) ?? chapterId,
    synopsis: data.synopsis ?? (existing.synopsis as string) ?? '',
    content: data.content ?? (existing.content as string) ?? '',
  }

  await fs.writeFile(chapterPath, JSON.stringify(merged, null, 2), 'utf-8')
  await logChange(projectPath, { action: 'save-chapter', target: chapterId, before: existing, after: merged })
  return merged
}
