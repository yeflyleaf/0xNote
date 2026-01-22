// electron/preload.ts
/**
 * 🌉 Electron Preload 脚本
 *
 * 安全地暴露主进程 API 给渲染进程
 * 使用 contextBridge 确保安全隔离
 */

import { contextBridge, ipcRenderer } from 'electron'

/**
 * 暴露给渲染进程的 API
 */
const electronAPI = {
    // ========== 文件系统 ==========
    fs: {
        readFile: (filePath: string) => ipcRenderer.invoke('fs:readFile', filePath),
        writeFile: (filePath: string, content: string) =>
            ipcRenderer.invoke('fs:writeFile', filePath, content),
        exists: (filePath: string) => ipcRenderer.invoke('fs:exists', filePath),
        getMetadata: (filePath: string) => ipcRenderer.invoke('fs:getMetadata', filePath),
        watchFile: (filePath: string) => ipcRenderer.invoke('fs:watchFile', filePath),
        unwatchFile: (filePath: string) => ipcRenderer.invoke('fs:unwatchFile', filePath),
        onFileChanged: (callback: (filePath: string, content: string) => void) => {
            ipcRenderer.on('file:changed', (_event, data) => callback(data.filePath, data.content))
        },
    },

    // ========== 对话框 ==========
    dialog: {
        openFile: () => ipcRenderer.invoke('dialog:openFile'),
        saveFile: (defaultFileName: string) => ipcRenderer.invoke('dialog:saveFile', defaultFileName),
    },

    // ========== 应用 ==========
    app: {
        getLaunchArgs: () => ipcRenderer.invoke('app:getLaunchArgs'),
    },

    // ========== 窗口控制 ==========
    window: {
        minimize: () => ipcRenderer.invoke('window:minimize'),
        toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
        close: () => ipcRenderer.invoke('window:close'),
        isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
        onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
            ipcRenderer.on('window:maximizeChanged', (_event, isMaximized) => callback(isMaximized))
        },
    },
}

// 暴露到 window.electron
contextBridge.exposeInMainWorld('electron', electronAPI)

// 类型声明（供渲染进程使用）
export type ElectronAPI = typeof electronAPI
