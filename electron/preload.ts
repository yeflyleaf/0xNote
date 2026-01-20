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
}

// 暴露到 window.electron
contextBridge.exposeInMainWorld('electron', electronAPI)

// 类型声明（供渲染进程使用）
export type ElectronAPI = typeof electronAPI
