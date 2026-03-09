// src/platforms/windows/WindowsConfigService.ts
/**
 * ⚙️ Windows 平台配置服务实现
 *
 * 使用 localStorage 存储配置
 * 在 Electron 环境中也可以扩展为 electron-store
 */

import type { AppSettings, IConfigService } from '@/common/types'
import { DEFAULT_SETTINGS } from '@/common/types'

const STORAGE_KEY = '0xNote:settings'

export class WindowsConfigService implements IConfigService {
    private settings: AppSettings

    constructor() {
        this.settings = this.loadFromStorage()
    }

    /**
     * 从 localStorage 加载配置
     */
    private loadFromStorage(): AppSettings {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored) as Partial<AppSettings>
                // 合并默认值，确保所有字段都存在
                return { ...DEFAULT_SETTINGS, ...parsed }
            }
        } catch (error) {
            console.warn('[WindowsConfigService] 加载配置失败:', error)
        }
        return { ...DEFAULT_SETTINGS }
    }

    /**
     * 保存到 localStorage
     */
    private saveToStorage(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings))
        } catch (error) {
            console.error('[WindowsConfigService] 保存配置失败:', error)
        }
    }

    async getSettings(): Promise<AppSettings> {
        return { ...this.settings }
    }

    async saveSettings(settings: AppSettings): Promise<void> {
        this.settings = { ...settings }
        this.saveToStorage()
    }

    async get<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
        return this.settings[key]
    }

    async set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
        this.settings[key] = value
        this.saveToStorage()
    }

    async resetToDefaults(): Promise<void> {
        this.settings = { ...DEFAULT_SETTINGS }
        this.saveToStorage()
    }
}
