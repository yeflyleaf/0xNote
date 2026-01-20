// src/types/electron.d.ts
/**
 * Electron API 类型声明
 *
 * 扩展 Window 接口，添加 electron 属性
 */

import type { FileMetadata, FileOperationResult } from '@/common/types'

export interface ElectronAPI {
    fs: {
        readFile: (filePath: string) => Promise<FileOperationResult<string>>
        writeFile: (filePath: string, content: string) => Promise<FileOperationResult>
        exists: (filePath: string) => Promise<boolean>
        getMetadata: (filePath: string) => Promise<FileOperationResult<FileMetadata>>
    }
    dialog: {
        openFile: () => Promise<FileOperationResult<string>>
        saveFile: (defaultFileName: string) => Promise<FileOperationResult<string>>
    }
    app: {
        getLaunchArgs: () => Promise<string[]>
    }
}

declare global {
    interface Window {
        electron?: ElectronAPI
    }
}

export { }

