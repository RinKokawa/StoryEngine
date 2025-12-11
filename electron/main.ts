import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import { createProjectOnDisk, readProjectCover, ensureCharactersFolder, saveCharacter, listCharacters, readCharacter, ensureOutlineFolder, listVolumes, listOutlineStructure, saveChapterContent, createVolume, deleteVolume, createChapter, deleteChapter, ensureWorldviewsIndex, readWorldviewItem, listNotes, saveNote, deleteNote, saveEnvKey, readEnvKey } from './service/projectService'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

// 确保缓存/数据目录可写，避免权限错误
const userDataPath = path.join(app.getPath('userData'), 'NovelEditor')
app.setPath('userData', userDataPath)
app.setPath('cache', path.join(userDataPath, 'Cache'))

ipcMain.handle('select-directory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
  })
  if (canceled || filePaths.length === 0) {
    return null
  }
  return filePaths[0]
})

ipcMain.handle('create-project', async (_event, payload: { name?: string; location?: string }) => {
  const name = payload?.name?.trim()
  const location = payload?.location?.trim()

  if (!name || !location) {
    throw new Error('name and location are required')
  }

  return createProjectOnDisk(name, location)
})

ipcMain.handle('get-project-cover', async (_event, projectPath: string) => {
  if (!projectPath) return null
  return readProjectCover(projectPath)
})

ipcMain.handle('ensure-characters-folder', async (_event, projectPath: string) => {
  if (!projectPath) return null
  return ensureCharactersFolder(projectPath)
})

ipcMain.handle('save-character', async (_event, projectPath: string, payload: Record<string, unknown>, previousId?: string | null) => {
  if (!projectPath) throw new Error('projectPath is required')
  return saveCharacter(projectPath, payload, previousId)
})

ipcMain.handle('list-characters', async (_event, projectPath: string) => {
  if (!projectPath) throw new Error('projectPath is required')
  return listCharacters(projectPath)
})

ipcMain.handle('read-character', async (_event, projectPath: string, id: string) => {
  if (!projectPath) throw new Error('projectPath is required')
  if (!id) throw new Error('id is required')
  return readCharacter(projectPath, id)
})

ipcMain.handle('ensure-outline', async (_event, projectPath: string) => {
  if (!projectPath) return null
  return ensureOutlineFolder(projectPath)
})

ipcMain.handle('list-volumes', async (_event, projectPath: string) => {
  if (!projectPath) throw new Error('projectPath is required')
  return listVolumes(projectPath)
})

ipcMain.handle('list-outline-structure', async (_event, projectPath: string) => {
  if (!projectPath) throw new Error('projectPath is required')
  return listOutlineStructure(projectPath)
})

ipcMain.handle('save-chapter-content', async (_event, projectPath: string, chapterId: string, data: Record<string, unknown>) => {
  if (!projectPath) throw new Error('projectPath is required')
  if (!chapterId) throw new Error('chapterId is required')
  return saveChapterContent(projectPath, chapterId, data)
})

ipcMain.handle('fs:read-file', async (_event, filePath: string) => {
  if (!filePath) throw new Error('filePath is required')
  return fs.readFile(filePath, 'utf-8')
})

ipcMain.handle('fs:list-dir', async (_event, dirPath: string) => {
  if (!dirPath) throw new Error('dirPath is required')
  return fs.readdir(dirPath)
})

ipcMain.handle('outline:create-volume', async (_event, projectPath: string, name: string) => {
  if (!projectPath) throw new Error('projectPath is required')
  return createVolume(projectPath, name)
})

ipcMain.handle('outline:delete-volume', async (_event, projectPath: string, volumeId: string) => {
  if (!projectPath) throw new Error('projectPath is required')
  return deleteVolume(projectPath, volumeId)
})

ipcMain.handle('outline:create-chapter', async (_event, projectPath: string, volumeId: string, name: string) => {
  if (!projectPath) throw new Error('projectPath is required')
  return createChapter(projectPath, volumeId, name)
})

ipcMain.handle('outline:delete-chapter', async (_event, projectPath: string, volumeId: string, chapterId: string) => {
  if (!projectPath) throw new Error('projectPath is required')
  return deleteChapter(projectPath, volumeId, chapterId)
})

ipcMain.handle('worldview:ensure-index', async (_event, projectPath: string) => {
  if (!projectPath) throw new Error('projectPath is required')
  return ensureWorldviewsIndex(projectPath)
})

ipcMain.handle('worldview:read-item', async (_event, projectPath: string, id: string) => {
  if (!projectPath) throw new Error('projectPath is required')
  if (!id) throw new Error('id is required')
  return readWorldviewItem(projectPath, id)
})

ipcMain.handle('notes:list', async (_event, projectPath: string) => {
  if (!projectPath) throw new Error('projectPath is required')
  return listNotes(projectPath)
})

ipcMain.handle('notes:save', async (_event, projectPath: string, payload: { id?: string; title?: string; content?: string }) => {
  if (!projectPath) throw new Error('projectPath is required')
  return saveNote(projectPath, payload)
})

ipcMain.handle('notes:delete', async (_event, projectPath: string, id: string) => {
  if (!projectPath) throw new Error('projectPath is required')
  if (!id) throw new Error('id is required')
  return deleteNote(projectPath, id)
})

ipcMain.handle('settings:save-qwen-key', async (_event, key: string) => {
  if (!key) throw new Error('key is required')
  const userData = app.getPath('userData')
  return saveEnvKey(userData, 'QWEN_API_KEY', key)
})

async function callQwen(messages: Array<{ role: string; content: string }>) {
  const apiKey = await readEnvKey(app.getPath('userData'), 'QWEN_API_KEY')
  if (!apiKey) {
    throw new Error('未配置 QWEN_API_KEY，请先在设置中保存')
  }

  const resp = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      messages,
    }),
  })

  const data = await resp.json()
  if (!resp.ok) {
    const message = data?.error?.message || resp.statusText
    throw new Error(`Qwen 接口错误: ${message}`)
  }

  const content =
    data?.choices?.[0]?.message?.content ||
    data?.output_text ||
    ''

  return { content }
}

ipcMain.handle('ai:chat', async (_event, payload: { messages: Array<{ role: string; content: string }> }) => {
  if (!payload?.messages?.length) throw new Error('messages is required')
  return callQwen(payload.messages)
})

ipcMain.handle('shell:open-external', async (_event, url: string) => {
  if (!url) return
  const { shell } = await import('electron')
  return shell.openExternal(url)
})

ipcMain.handle('select-avatar-image', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
    ],
  })
  if (canceled || filePaths.length === 0) return null
  const filePath = filePaths[0]
  try {
    const content = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const mime =
      ext === '.png'
        ? 'image/png'
        : ext === '.gif'
          ? 'image/gif'
          : ext === '.webp'
            ? 'image/webp'
            : 'image/jpeg'

    const dataUrl = `data:${mime};base64,${content.toString('base64')}`
    return { dataUrl, filePath }
  } catch {
    return null
  }
})

ipcMain.handle('window-control', (event, action: 'minimize' | 'maximize' | 'close') => {
  const currentWin = BrowserWindow.fromWebContents(event.sender)
  if (!currentWin) return
  if (action === 'minimize') {
    currentWin.minimize()
  } else if (action === 'maximize') {
    if (currentWin.isMaximized()) {
      currentWin.unmaximize()
    } else {
      currentWin.maximize()
    }
  } else if (action === 'close') {
    currentWin.close()
  }
})

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    minWidth: 960,
    minHeight: 540,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
