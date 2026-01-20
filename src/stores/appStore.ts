// src/stores/appStore.ts
/**
 * 🎛️ 应用全局状态 Store
 *
 * 管理应用级别的状态，如主题、启动参数等。
 */

import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 主题类型
 */
export type ThemeMode = 'light' | 'dark' | 'system'

export const useAppStore = defineStore('app', () => {
    // ========== 状态 ==========

    /** 当前主题 */
    const theme = ref<ThemeMode>('dark')

    /** 应用是否已初始化 */
    const isInitialized = ref(false)

    /** 启动参数（如右键打开时传入的文件路径） */
    const launchArgs = ref<string[]>([])

    /** 侧边栏是否显示 */
    const isSidebarVisible = ref(false)

    /** 是否显示预览面板 */
    const isPreviewVisible = ref(true)

    // ========== 操作 ==========

    /**
     * 初始化应用
     * @param args 启动参数
     */
    function initialize(args: string[] = []): void {
        launchArgs.value = args
        isInitialized.value = true
        console.log('[AppStore] 应用初始化完成，启动参数:', args)
    }

    /**
     * 切换主题
     */
    function toggleTheme(): void {
        theme.value = theme.value === 'dark' ? 'light' : 'dark'
        applyTheme()
    }

    /**
     * 设置主题
     */
    function setTheme(mode: ThemeMode): void {
        theme.value = mode
        applyTheme()
    }

    /**
     * 应用主题到 DOM
     * 注意：此处使用 classList 操作是必要的（控制根元素主题），
     * 但业务组件不应直接操作 DOM
     */
    function applyTheme(): void {
        const root = document.documentElement
        if (theme.value === 'dark') {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
    }

    /**
     * 切换侧边栏
     */
    function toggleSidebar(): void {
        isSidebarVisible.value = !isSidebarVisible.value
    }

    /**
     * 切换预览面板
     */
    function togglePreview(): void {
        isPreviewVisible.value = !isPreviewVisible.value
    }

    /**
     * 获取传入的文件路径（从启动参数中提取）
     */
    function getLaunchFilePath(): string | null {
        // 通常第一个参数是可执行文件路径，第二个开始是用户参数
        // 如: ["0xNote.exe", "C:\Users\xxx\note.md"]
        const filePath = launchArgs.value.find((arg) => arg.endsWith('.md'))
        return filePath ?? null
    }

    return {
        // State
        theme,
        isInitialized,
        launchArgs,
        isSidebarVisible,
        isPreviewVisible,

        // Actions
        initialize,
        toggleTheme,
        setTheme,
        applyTheme,
        toggleSidebar,
        togglePreview,
        getLaunchFilePath,
    }
})
