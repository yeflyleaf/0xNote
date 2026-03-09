// src/stores/settingStore.ts
/**
 * ⚙️ 设置状态管理 Store
 *
 * 【设计原则】
 * 此 Store 依赖于 IConfigService 接口，而非具体实现类。
 * 这确保了设置存储逻辑与平台实现完全解耦。
 *
 * 【鸿蒙迁移指南】
 * 迁移时此文件无需任何修改！
 * 只需确保平台适配器返回正确的 HarmonyConfigService 实例即可。
 */

import type { AppSettings } from '@/common/types'
import { DEFAULT_SETTINGS } from '@/common/types'
import { useConfigService } from '@/platforms/adapter'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingStore = defineStore('settings', () => {
    // ========== 状态 ==========

    /** 当前设置 */
    const settings = ref<AppSettings>({ ...DEFAULT_SETTINGS })

    /** 是否已加载 */
    const isLoaded = ref(false)

    /** 是否正在保存 */
    const isSaving = ref(false)

    // ========== 初始化 ==========

    /**
     * 加载设置
     */
    async function loadSettings(): Promise<void> {
        try {
            const configService = useConfigService()
            const loaded = await configService.getSettings()
            settings.value = loaded
            isLoaded.value = true
            console.log('[SettingStore] 设置已加载:', loaded)
        } catch (error) {
            console.error('[SettingStore] 加载设置失败:', error)
            settings.value = { ...DEFAULT_SETTINGS }
            isLoaded.value = true
        }
    }

    /**
     * 保存设置
     */
    async function saveSettings(): Promise<boolean> {
        try {
            isSaving.value = true
            const configService = useConfigService()
            await configService.saveSettings(settings.value)
            console.log('[SettingStore] 设置已保存')
            return true
        } catch (error) {
            console.error('[SettingStore] 保存设置失败:', error)
            return false
        } finally {
            isSaving.value = false
        }
    }

    /**
     * 更新单个设置项
     */
    async function updateSetting<K extends keyof AppSettings>(
        key: K,
        value: AppSettings[K],
    ): Promise<void> {
        settings.value[key] = value
        await saveSettings()
    }

    /**
     * 重置为默认设置
     */
    async function resetToDefaults(): Promise<void> {
        settings.value = { ...DEFAULT_SETTINGS }
        await saveSettings()
    }

    // ========== 便捷 Getters ==========

    /** 获取字体大小 */
    function getFontSize(): number {
        return settings.value.fontSize
    }

    /** 获取字体家族 */
    function getFontFamily(): string {
        return settings.value.fontFamily
    }

    /** 获取主题 */
    function getTheme(): AppSettings['theme'] {
        return settings.value.theme
    }

    /** 是否自动保存 */
    function isAutoSaveEnabled(): boolean {
        return settings.value.autoSave
    }

    // ========== 生成编辑器样式 ==========

    /**
     * 生成编辑器的 CSS 变量
     */
    function getEditorStyles(): Record<string, string> {
        return {
            '--editor-font-size': `${settings.value.fontSize}px`,
            '--editor-font-family': settings.value.fontFamily,
            '--editor-tab-size': `${settings.value.tabSize}`,
        }
    }

    return {
        // State
        settings,
        isLoaded,
        isSaving,

        // Actions
        loadSettings,
        saveSettings,
        updateSetting,
        resetToDefaults,

        // Getters
        getFontSize,
        getFontFamily,
        getTheme,
        isAutoSaveEnabled,
        getEditorStyles,
    }
})
