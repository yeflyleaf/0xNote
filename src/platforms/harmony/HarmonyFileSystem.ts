// src/platforms/harmony/HarmonyFileSystem.ts
/**
 * 📁 鸿蒙平台文件系统实现（占位符）
 *
 * 【实际迁移时】
 * 使用 ArkTS 的 fileIO 模块实现：
 * - import fileIO from '@ohos.file.fs'
 * - 使用 fileIO.open / fileIO.read / fileIO.write 等 API
 *
 * 【注意事项】
 * 1. 鸿蒙的文件路径格式与 Windows 不同
 * 2. 需要在 module.json5 中声明文件访问权限
 * 3. 沙箱路径使用 getContext().filesDir 获取
 */

import type { FileMetadata, FileOperationResult, IFileSystem } from '@/common/types'

export class HarmonyFileSystem implements IFileSystem {
    async readFile(filePath: string): Promise<FileOperationResult<string>> {
        // TODO: 使用 fileIO.readText 实现
        // const file = fileIO.openSync(filePath, fileIO.OpenMode.READ_ONLY)
        // const content = fileIO.readTextSync(file.fd)
        // fileIO.closeSync(file)
        console.warn('[HarmonyFileSystem] readFile 未实现')
        return {
            success: false,
            error: '鸿蒙平台文件系统尚未实现',
        }
    }

    async writeFile(filePath: string, content: string): Promise<FileOperationResult> {
        // TODO: 使用 fileIO.write 实现
        console.warn('[HarmonyFileSystem] writeFile 未实现')
        return {
            success: false,
            error: '鸿蒙平台文件系统尚未实现',
        }
    }

    async createFile(directoryPath: string, fileName?: string): Promise<FileOperationResult<string>> {
        console.warn('[HarmonyFileSystem] createFile 未实现')
        return {
            success: false,
            error: '鸿蒙平台文件系统尚未实现',
        }
    }

    async getFileMetadata(filePath: string): Promise<FileOperationResult<FileMetadata>> {
        // TODO: 使用 fileIO.stat 实现
        console.warn('[HarmonyFileSystem] getFileMetadata 未实现')
        return {
            success: false,
            error: '鸿蒙平台文件系统尚未实现',
        }
    }

    async exists(filePath: string): Promise<boolean> {
        // TODO: 使用 fileIO.access 实现
        console.warn('[HarmonyFileSystem] exists 未实现')
        return false
    }

    async showOpenDialog(): Promise<FileOperationResult<string>> {
        // TODO: 使用 FilePicker 实现
        // import { picker } from '@kit.CoreFileKit'
        // const documentPicker = new picker.DocumentViewPicker()
        console.warn('[HarmonyFileSystem] showOpenDialog 未实现')
        return {
            success: false,
            error: '鸿蒙平台文件选择器尚未实现',
        }
    }

    async showSaveDialog(defaultFileName: string): Promise<FileOperationResult<string>> {
        // TODO: 使用 SaveFilePicker 实现
        console.warn('[HarmonyFileSystem] showSaveDialog 未实现')
        return {
            success: false,
            error: '鸿蒙平台文件保存对话框尚未实现',
        }
    }
}
