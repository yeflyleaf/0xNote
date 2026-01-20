// src/common/types/system-menu.ts
/**
 * 🖱️ 系统菜单抽象层接口定义
 *
 * 【为什么需要这个接口？】
 * 右键菜单的实现在不同平台差异巨大：
 * - Windows: 需要操作注册表 (HKEY_CLASSES_ROOT)
 * - HarmonyOS: 使用 AbilityStage 和 Intent 机制
 *
 * 通过接口抽象，业务层只关心"配置菜单"这个行为，不关心具体实现。
 */

/**
 * 右键菜单项配置
 */
export interface ContextMenuItem {
    /** 菜单项唯一标识 */
    id: string
    /** 显示的菜单文本 */
    label: string
    /** 菜单图标路径（可选） */
    icon?: string
    /** 点击后执行的命令/动作 */
    action: string
}

/**
 * 右键菜单配置
 */
export interface ContextMenuConfig {
    /** 文件类型关联（如 .md） */
    fileExtensions: string[]
    /** 目录背景右键菜单项（右键空白处） */
    directoryBackgroundItems: ContextMenuItem[]
    /** 文件右键菜单项（右键 .md 文件） */
    fileItems: ContextMenuItem[]
}

/**
 * 注册表操作结果
 */
export interface RegistryOperationResult {
    /** 操作是否成功 */
    success: boolean
    /** 错误信息 */
    error?: string
    /** 是否需要管理员权限 */
    requiresAdmin?: boolean
}

/**
 * ISystemMenu 接口
 * 定义系统右键菜单的配置契约
 */
export interface ISystemMenu {
    /**
     * 配置右键菜单
     * @param config 菜单配置
     * @returns 操作结果
     */
    setupContextMenu(config: ContextMenuConfig): Promise<RegistryOperationResult>

    /**
     * 移除右键菜单
     * @returns 操作结果
     */
    removeContextMenu(): Promise<RegistryOperationResult>

    /**
     * 检查是否已注册右键菜单
     */
    isContextMenuRegistered(): Promise<boolean>

    /**
     * 获取当前应用的可执行文件路径
     */
    getExecutablePath(): string
}
