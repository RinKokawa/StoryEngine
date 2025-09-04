import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'

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

function createWindow() {
  win = new BrowserWindow({
    title: 'StoryEngine',
    icon: path.join(process.env.VITE_PUBLIC, 'icon.png'),
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

// --------- IPC handlers ---------
// 打开外部链接
ipcMain.handle('open-external', async (_event, url: string) => {
  try {
    await shell.openExternal(url)
    return { success: true }
  } catch (error) {
    console.error('Failed to open external URL:', error)
    return { success: false, error: (error as Error).message }
  }
})

// 获取应用数据目录
function getAppDataPath() {
  return path.join(app.getPath('userData'), 'StoryEngine')
}

// 确保应用数据目录存在
async function ensureAppDataDir() {
  const appDataPath = getAppDataPath()
  try {
    await fs.access(appDataPath)
  } catch {
    await fs.mkdir(appDataPath, { recursive: true })
  }
  return appDataPath
}

// 打开存储位置
ipcMain.handle('open-storage-location', async () => {
  try {
    const appDataPath = await ensureAppDataDir()
    await shell.openPath(appDataPath)
    return { success: true, path: appDataPath }
  } catch (error) {
    console.error('Failed to open storage location:', error)
    return { success: false, error: (error as Error).message }
  }
})

// 读取文件
ipcMain.handle('read-file', async (_event, fileName: string) => {
  try {
    const appDataPath = await ensureAppDataDir()
    const filePath = path.join(appDataPath, fileName)
    const data = await fs.readFile(filePath, 'utf-8')
    return { success: true, data }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { success: true, data: null } // 文件不存在
    }
    console.error('Failed to read file:', error)
    return { success: false, error: (error as Error).message }
  }
})

// 写入文件
ipcMain.handle('write-file', async (_event, fileName: string, data: string) => {
  try {
    const appDataPath = await ensureAppDataDir()
    const filePath = path.join(appDataPath, fileName)
    await fs.writeFile(filePath, data, 'utf-8')
    return { success: true }
  } catch (error) {
    console.error('Failed to write file:', error)
    return { success: false, error: (error as Error).message }
  }
})

// 删除文件
ipcMain.handle('delete-file', async (_event, fileName: string) => {
  try {
    const appDataPath = await ensureAppDataDir()
    const filePath = path.join(appDataPath, fileName)
    await fs.unlink(filePath)
    return { success: true }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { success: true } // 文件不存在，视为删除成功
    }
    console.error('Failed to delete file:', error)
    return { success: false, error: (error as Error).message }
  }
})

// 列出文件
ipcMain.handle('list-files', async () => {
  try {
    const appDataPath = await ensureAppDataDir()
    const files = await fs.readdir(appDataPath)
    return { success: true, files }
  } catch (error) {
    console.error('Failed to list files:', error)
    return { success: false, error: (error as Error).message }
  }
})
