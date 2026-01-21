/// <reference types="vite/client" />

import type { FileMetadata, FileOperationResult } from '@/common/types'

interface ElectronAPI {
    fs: {
        readFile: (filePath: string) => Promise<FileOperationResult<string>>
        writeFile: (filePath: string, content: string) => Promise<FileOperationResult>
        exists: (filePath: string) => Promise<boolean>
        getMetadata: (filePath: string) => Promise<FileOperationResult<FileMetadata>>
        watchFile: (filePath: string) => Promise<FileOperationResult<void>>
        unwatchFile: (filePath: string) => Promise<FileOperationResult<void>>
        onFileChanged: (callback: (filePath: string, content: string) => void) => void
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
