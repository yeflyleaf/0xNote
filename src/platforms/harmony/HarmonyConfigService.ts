// src/platforms/harmony/HarmonyConfigService.ts
/**
 * ⚙️ 鸿蒙平台配置服务实现（占位符）
 *
 * 【实际迁移时】
 * 使用鸿蒙的 Preferences API 实现：
 * - import { preferences } from '@kit.ArkData'
 * - const dataPreferences = preferences.getPreferencesSync(context, { name: '0xNote' })
 * - dataPreferences.putSync / getSync / deleteSync
 *
 * 【注意事项】
 * 1. Preferences 是键值对存储，适合少量配置
 * 2. 大量数据应使用 RelationalStore（关系型数据库）
 * 3. 需要 ohos.permission.PREFERENCES 权限（通常不需要声明）
 */

import type { AppSettings, IConfigService } from '@/common/types'
import { DEFAULT_SETTINGS } from '@/common/types'

export class HarmonyConfigService implements IConfigService {
    private settings: AppSettings = { ...DEFAULT_SETTINGS }

    async getSettings(): Promise<AppSettings> {
        // TODO: 使用 preferences.getPreferencesSync 实现
        // const dataPreferences = preferences.getPreferencesSync(getContext(), { name: '0xNote' })
        // const fontSize = dataPreferences.getSync('fontSize', DEFAULT_SETTINGS.fontSize)
        console.warn('[HarmonyConfigService] getSettings 未实现')
        return { ...this.settings }
    }

    async saveSettings(settings: AppSettings): Promise<void> {
        // TODO: 使用 preferences.putSync 实现
        // dataPreferences.putSync('fontSize', settings.fontSize)
        // dataPreferences.flush()
        console.warn('[HarmonyConfigService] saveSettings 未实现')
        this.settings = { ...settings }
    }

    async get<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
        console.warn(`[HarmonyConfigService] get(${key}) 未实现`)
        return this.settings[key]
    }

    async set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
        console.warn(`[HarmonyConfigService] set(${key}) 未实现`)
        this.settings[key] = value
    }

    async resetToDefaults(): Promise<void> {
        // TODO: 使用 preferences.clear 实现
        console.warn('[HarmonyConfigService] resetToDefaults 未实现')
        this.settings = { ...DEFAULT_SETTINGS }
    }
}
