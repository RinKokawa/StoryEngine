import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },

  // You can expose other APTs you need here.
  // ...
})

// --------- Expose Electron APIs to the Renderer process ---------
contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  openStorageLocation: () => ipcRenderer.invoke('open-storage-location'),
  
  // 文件操作API
  readFile: (fileName: string) => ipcRenderer.invoke('read-file', fileName),
  writeFile: (fileName: string, data: string) => ipcRenderer.invoke('write-file', fileName, data),
  deleteFile: (fileName: string) => ipcRenderer.invoke('delete-file', fileName),
  listFiles: () => ipcRenderer.invoke('list-files'),
  
  // 通义千问API请求
  qwenApiRequest: (requestData: { url: string, apiKey: string, data: any }) => 
    ipcRenderer.invoke('qwen-api-request', requestData)
})

// 标记为Electron环境
contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args)
  }
})
