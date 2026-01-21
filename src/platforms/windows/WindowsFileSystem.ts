// src/platforms/windows/WindowsFileSystem.ts
/**
 * 📂 Windows 平台文件系统实现
 *
 * 通过 Electron IPC 调用主进程的 Node.js fs 模块
 *
 * 【鸿蒙迁移指南】
 * 迁移时只需创建 HarmonyFileSystem implements IFileSystem，
 * 内部使用 @ohos.file.fs 模块实现相同接口即可。
 */

import type { FileMetadata, FileOperationResult, IFileSystem } from '@/common/types'

/**
 * Windows 文件系统实现类
 */
export class WindowsFileSystem implements IFileSystem {
    private readonly LOG_PREFIX = '[WindowsFileSystem]'
    private fileChangeListeners = new Map<string, (content: string) => void>()

    constructor() {
        // 监听主进程的文件变化事件
        if (typeof window !== 'undefined' && window.electron) {
            window.electron.fs.onFileChanged((path, content) => {
                const callback = this.fileChangeListeners.get(path)
                if (callback) {
                    console.log(`${this.LOG_PREFIX} 外部文件变化: ${path}`)
                    callback(content)
                }
            })
        }
    }

    /**
     * 检查 Electron API 是否可用
     */
    private get electronAPI() {
        return window.electron
    }

    private get isElectronEnv(): boolean {
        return !!this.electronAPI
    }

    async readFile(filePath: string): Promise<FileOperationResult<string>> {
        console.log(`${this.LOG_PREFIX} readFile: ${filePath}`)

        if (this.isElectronEnv) {
            return await this.electronAPI!.fs.readFile(filePath)
        }

        // Web 模式 Mock
        return {
            success: true,
            data: `# 欢迎使用 0xNote\n\n这是一个演示内容。在 Electron 环境中将加载真实文件。\n\n## 功能特性\n\n- 🎨 专业级代码高亮\n- ⚡ 极速启动\n- 💾 智能自动保存\n\n\`\`\`javascript\nconst greeting = 'Hello, 0xNote!';\nconsole.log(greeting);\n\`\`\`\n`,
        }
    }

    async writeFile(filePath: string, content: string): Promise<FileOperationResult> {
        console.log(`${this.LOG_PREFIX} writeFile: ${filePath}`)
        console.log(`${this.LOG_PREFIX} 内容长度: ${content.length} 字符`)

        if (this.isElectronEnv) {
            return await this.electronAPI!.fs.writeFile(filePath, content)
        }

        // Web 模式 Mock
        console.log(`${this.LOG_PREFIX} [Mock] 保存成功`)
        return { success: true }
    }

    async createFile(directoryPath: string, fileName?: string): Promise<FileOperationResult<string>> {
        const finalFileName = fileName ?? `untitled_${Date.now()}.md`
        const fullPath = `${directoryPath}\\${finalFileName}`
        console.log(`${this.LOG_PREFIX} createFile: ${fullPath}`)

        if (this.isElectronEnv) {
            const result = await this.electronAPI!.fs.writeFile(fullPath, '')
            if (result.success) {
                return { success: true, data: fullPath }
            }
            return { success: false, error: result.error }
        }

        return {
            success: true,
            data: fullPath,
        }
    }

    async getFileMetadata(filePath: string): Promise<FileOperationResult<FileMetadata>> {
        console.log(`${this.LOG_PREFIX} getFileMetadata: ${filePath}`)

        if (this.isElectronEnv) {
            return await this.electronAPI!.fs.getMetadata(filePath)
        }

        // Web 模式 Mock
        return {
            success: true,
            data: {
                fileName: filePath.split(/[/\\]/).pop() ?? 'unknown.md',
                filePath,
                size: 0,
                lastModified: Date.now(),
                isReadOnly: false,
            },
        }
    }

    async exists(filePath: string): Promise<boolean> {
        console.log(`${this.LOG_PREFIX} exists: ${filePath}`)

        if (this.isElectronEnv) {
            return await this.electronAPI!.fs.exists(filePath)
        }

        return false
    }

    async showOpenDialog(): Promise<FileOperationResult<string>> {
        console.log(`${this.LOG_PREFIX} showOpenDialog 调用`)

        if (this.isElectronEnv) {
            return await this.electronAPI!.dialog.openFile()
        }

        return {
            success: false,
            error: 'Web 模式下无法打开文件选择对话框',
        }
    }

    async showSaveDialog(defaultFileName: string): Promise<FileOperationResult<string>> {
        console.log(`${this.LOG_PREFIX} showSaveDialog: ${defaultFileName}`)

        if (this.isElectronEnv) {
            return await this.electronAPI!.dialog.saveFile(defaultFileName)
        }

        return {
            success: false,
            error: 'Web 模式下无法打开保存对话框',
        }
    }

    async watchFile(filePath: string, callback: (content: string) => void): Promise<void> {
        console.log(`${this.LOG_PREFIX} watchFile: ${filePath}`)
        if (this.isElectronEnv) {
            this.fileChangeListeners.set(filePath, callback)
            await this.electronAPI!.fs.watchFile(filePath)
        }
    }

    async unwatchFile(filePath: string): Promise<void> {
        console.log(`${this.LOG_PREFIX} unwatchFile: ${filePath}`)
        if (this.isElectronEnv) {
            this.fileChangeListeners.delete(filePath)
            await this.electronAPI!.fs.unwatchFile(filePath)
        }
    }
}
