// src/common/types/config.ts
/**
 * ⚙️ 配置服务抽象层接口定义
 *
 * 【为什么需要这个接口？】
 * 为了实现配置存储的跨平台兼容：
 * - Windows: 使用 localStorage 或 electron-store
 * - HarmonyOS: 使用 Preferences API
 *
 * 业务层只依赖此 Interface，平台层负责具体实现。
 */

/**
 * 应用配置
 */
export interface AppSettings {
    /** 字体大小 (12-24px) */
    fontSize: number
    /** 字体家族 */
    fontFamily: string
    /** 主题模式 */
    theme: 'light' | 'dark' | 'system'
    /** 是否自动保存 */
    autoSave: boolean
    /** 自动保存延迟（毫秒） */
    autoSaveDelay: number
    /** 显示行号 */
    showLineNumbers: boolean
    /** Tab 大小 */
    tabSize: number
    /** 预览同步滚动 */
    syncScroll: boolean
}

/**
 * 默认配置
 */
export const DEFAULT_SETTINGS: AppSettings = {
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    theme: 'dark',
    autoSave: true,
    autoSaveDelay: 1000,
    showLineNumbers: true,
    tabSize: 4,
    syncScroll: true,
}

/**
 * IConfigService 接口
 * 定义配置读写的契约，平台实现层必须遵循此接口
 */
export interface IConfigService {
    /**
     * 获取完整配置
     */
    getSettings(): Promise<AppSettings>

    /**
     * 保存完整配置
     * @param settings 配置对象
     */
    saveSettings(settings: AppSettings): Promise<void>

    /**
     * 获取单个配置项
     * @param key 配置键名
     */
    get<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]>

    /**
     * 设置单个配置项
     * @param key 配置键名
     * @param value 配置值
     */
    set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void>

    /**
     * 重置为默认配置
     */
    resetToDefaults(): Promise<void>
}
