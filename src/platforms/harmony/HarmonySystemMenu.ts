// src/platforms/harmony/HarmonySystemMenu.ts
/**
 * 📋 鸿蒙平台系统菜单实现（占位符）
 *
 * 【实际迁移时】
 * 鸿蒙应用使用不同的菜单机制：
 * - 长按菜单使用 bindContextMenu
 * - 分享功能使用 UIAbility 的 share
 * - 没有传统的"右键菜单"概念
 *
 * 【迁移策略】
 * 考虑使用 ActionSheet 或 BottomSheet 替代传统菜单
 */

import type { ContextMenuConfig, ISystemMenu, RegistryOperationResult } from '@/common/types'

export class HarmonySystemMenu implements ISystemMenu {
    async setupContextMenu(config: ContextMenuConfig): Promise<RegistryOperationResult> {
        // 鸿蒙不支持系统级右键菜单
        // 使用 bindContextMenu 在应用内实现
        console.warn('[HarmonySystemMenu] 鸿蒙平台不支持系统级右键菜单')
        return {
            success: true, // 返回成功，因为在鸿蒙上不需要注册
            error: undefined,
        }
    }

    async removeContextMenu(): Promise<RegistryOperationResult> {
        console.warn('[HarmonySystemMenu] 鸿蒙平台不支持系统级右键菜单')
        return {
            success: true,
            error: undefined,
        }
    }

    async isContextMenuRegistered(): Promise<boolean> {
        // 鸿蒙始终返回 true（因为不需要注册）
        return true
    }

    getExecutablePath(): string {
        // 鸿蒙没有传统意义的可执行文件路径
        // 返回应用包名或空字符串
        return ''
    }
}
