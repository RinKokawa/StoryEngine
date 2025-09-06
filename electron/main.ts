import { app, BrowserWindow, ipcMain, shell } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'
import https from 'node:https'
import { IncomingMessage } from 'node:http'

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

// 处理通义千问API请求
ipcMain.handle('qwen-api-request', async (_event, requestData: { url: string, apiKey: string, data: any }) => {
  console.log('收到通义千问API请求')
  
  return new Promise((resolve, reject) => {
    try {
      const { url, apiKey, data } = requestData
      
      // 将请求数据转换为JSON字符串
      const postData = JSON.stringify(data)
      
      // 解析URL
      const urlObj = new URL(url)
      
      // 设置请求选项
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(postData),
          'X-DashScope-SSE': 'disable'
        }
      }
      
      console.log('发送请求到:', urlObj.hostname + urlObj.pathname)
      
      // 创建请求
      const req = https.request(options, (res: IncomingMessage) => {
        let responseData = ''
        
        // 接收数据
        res.on('data', (chunk) => {
          responseData += chunk
        })
        
        // 请求完成
        res.on('end', () => {
          console.log('API请求完成，状态码:', res.statusCode)
          
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsedData = JSON.parse(responseData)
              resolve(parsedData)
            } catch (error) {
              console.error('解析API响应失败:', error)
              reject({ error: '解析API响应失败' })
            }
          } else {
            console.error('API请求失败，状态码:', res.statusCode)
            try {
              const errorData = JSON.parse(responseData)
              reject({ 
                error: `API请求失败 (${res.statusCode}): ${errorData.message || '未知错误'}`,
                statusCode: res.statusCode,
                data: errorData
              })
            } catch (e) {
              reject({ 
                error: `API请求失败 (${res.statusCode}): ${responseData || '未知错误'}`,
                statusCode: res.statusCode
              })
            }
          }
        })
      })
      
      // 错误处理
      req.on('error', (error) => {
        console.error('API请求网络错误:', error)
        reject({ error: `网络请求错误: ${error.message}` })
      })
      
      // 设置超时
      req.setTimeout(60000, () => {
        req.destroy()
        reject({ error: '请求超时，请检查网络连接' })
      })
      
      // 发送请求数据
      req.write(postData)
      req.end()
      
    } catch (error) {
      console.error('处理API请求时发生错误:', error)
      reject({ error: `请求处理错误: ${(error as Error).message}` })
    }
  })
})
