// src/platforms/adapter.ts
/**
 * 🌉 平台适配器 (Platform Adapter)
 *
 * 【核心设计思想】
 * 这是整个跨平台架构的"桥梁"。
 * 业务代码通过此 Adapter 获取平台实现，而非直接 import 平台代码。
 *
 * 【工作原理】
 * 1. 检测当前运行平台
 * 2. 返回对应平台的接口实现实例
 */

import type { IConfigService, IFileSystem, ISystemMenu } from '@/common/types'
import { WindowsConfigService, WindowsFileSystem, WindowsSystemMenu } from './windows'

/**
 * 支持的平台枚举
 */
export type Platform = 'windows' | 'web'

/**
 * 平台实现集合
 */
export interface PlatformServices {
    fileSystem: IFileSystem
    systemMenu: ISystemMenu
    configService: IConfigService
}

// 单例实例缓存
let platformServicesInstance: PlatformServices | null = null

/**
 * 检测当前运行平台
 */
export function detectPlatform(): Platform {
    // 检测 Electron 环境
    if (typeof window !== 'undefined' && (window as unknown as { electron?: unknown }).electron) {
        return 'windows'
    }

    // 默认返回 web（开发模式）
    // 注意：在纯 Web 环境下，文件系统等功能受限
    return 'windows' // 开发阶段默认返回 Windows 以便测试
}

/**
 * 获取当前平台的服务实现
 *
 * @returns 平台特定的服务实现集合
 *
 * @example
 * ```ts
 * const { fileSystem } = usePlatformServices()
 * await fileSystem.readFile('/path/to/file.md')
 * ```
 */
export function usePlatformServices(): PlatformServices {
    if (platformServicesInstance) {
        return platformServicesInstance
    }

    const platform = detectPlatform()
    console.log(`[PlatformAdapter] 检测到平台: ${platform}`)

    switch (platform) {
        case 'windows':
            platformServicesInstance = {
                fileSystem: new WindowsFileSystem(),
                systemMenu: new WindowsSystemMenu(),
                configService: new WindowsConfigService(),
            }
            break

        case 'web':
            // Web 模式使用受限的实现
            platformServicesInstance = {
                fileSystem: new WindowsFileSystem(), // 暂用 Mock
                systemMenu: new WindowsSystemMenu(),
                configService: new WindowsConfigService(),
            }
            break

        default:
            throw new Error(`不支持的平台: ${platform}`)
    }

    return platformServicesInstance
}

/**
 * 便捷访问：获取文件系统服务
 */
export function useFileSystem(): IFileSystem {
    return usePlatformServices().fileSystem
}

/**
 * 便捷访问：获取系统菜单服务
 */
export function useSystemMenu(): ISystemMenu {
    return usePlatformServices().systemMenu
}

/**
 * 便捷访问：获取配置服务
 */
export function useConfigService(): IConfigService {
    return usePlatformServices().configService
}
