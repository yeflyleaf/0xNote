// src/platforms/windows/WindowsSystemMenu.ts
/**
 * 🖱️ Windows 平台系统菜单实现
 *
 * 【核心功能】
 * 通过操作 Windows 注册表，实现：
 * 1. 右键空白处 → "新建 Markdown 笔记"
 * 2. 右键 .md 文件 → "使用 0xNote 打开"
 *
 * 【Mock 阶段说明】
 * 当前为 Mock 实现，真实注册表操作将在 Electron 主进程实现。
 *
 * 【鸿蒙迁移指南】
 * 鸿蒙无注册表概念，需要在 module.json5 中配置 abilities 和 skills，
 * 通过 Want 隐式启动来处理 .md 文件类型。
 */

import type { ContextMenuConfig, ISystemMenu, RegistryOperationResult } from '@/common/types'

export class WindowsSystemMenu implements ISystemMenu {
    private readonly LOG_PREFIX = '[WindowsSystemMenu]'
    private isRegistered = false

    async setupContextMenu(config: ContextMenuConfig): Promise<RegistryOperationResult> {
        console.log(`${this.LOG_PREFIX} setupContextMenu 被调用`)
        console.log(`${this.LOG_PREFIX} 注册文件类型: ${config.fileExtensions.join(', ')}`)
        console.log(`${this.LOG_PREFIX} 目录菜单项数: ${config.directoryBackgroundItems.length}`)
        console.log(`${this.LOG_PREFIX} 文件菜单项数: ${config.fileItems.length}`)

        // TODO: 在 Electron 主进程实现以下逻辑：
        // 1. 使用 regedit 库或 child_process 调用 reg.exe
        // 2. 修改 HKEY_CLASSES_ROOT\.md 关联
        // 3. 修改 HKEY_CLASSES_ROOT\Directory\Background\shell 添加菜单项

        this.isRegistered = true
        return {
            success: true,
        }
    }

    async removeContextMenu(): Promise<RegistryOperationResult> {
        console.log(`${this.LOG_PREFIX} removeContextMenu 被调用`)
        // TODO: 实现注册表清理
        this.isRegistered = false
        return { success: true }
    }

    async isContextMenuRegistered(): Promise<boolean> {
        console.log(`${this.LOG_PREFIX} isContextMenuRegistered: ${this.isRegistered}`)
        return this.isRegistered
    }

    getExecutablePath(): string {
        // TODO: 在 Electron 中使用 process.execPath 或 app.getPath('exe')
        console.log(`${this.LOG_PREFIX} getExecutablePath 调用`)
        return 'C:\\Program Files\\0xNote\\0xNote.exe'
    }
}
