// src/stores/appStore.ts
/**
 * 🎛️ 应用全局状态 Store
 *
 * 管理应用级别的状态，如主题、启动参数、视图模式等。
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * 主题类型
 */
export type ThemeMode = 'light' | 'dark' | 'system'

/**
 * 视图模式类型
 * - edit: 仅显示编辑器
 * - preview: 仅显示预览
 * - split: 分栏显示（编辑器 + 预览）
 */
export type ViewMode = 'edit' | 'preview' | 'split'

export const useAppStore = defineStore('app', () => {
  // ========== 状态 ==========

  /** 当前主题 */
  const theme = ref<ThemeMode>('dark')

  /** 视图模式 */
  const viewMode = ref<ViewMode>('split')

  /** 应用是否已初始化 */
  const isInitialized = ref(false)

  /** 启动参数（如右键打开时传入的文件路径） */
  const launchArgs = ref<string[]>([])

  /** 侧边栏是否显示 */
  const isSidebarVisible = ref(false)

  /** 是否显示预览面板（兼容旧代码） */
  const isPreviewVisible = computed(() => viewMode.value !== 'edit')

  /** 是否显示编辑器 */
  const isEditorVisible = computed(() => viewMode.value !== 'preview')

  /** 是否显示设置模态框 */
  const isSettingsOpen = ref(false)

  /** 是否显示快捷键设置模态框 */
  const isShortcutsOpen = ref(false)

  // ========== 操作 ==========

  /**
   * 初始化应用
   * @param args 启动参数
   */
  function initialize(args: string[] = []): void {
    launchArgs.value = args
    isInitialized.value = true

    // 从 localStorage 恢复视图模式
    const savedViewMode = localStorage.getItem('0xNote:viewMode') as ViewMode | null
    if (savedViewMode && ['edit', 'preview', 'split'].includes(savedViewMode)) {
      viewMode.value = savedViewMode
    }

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
   * 切换预览面板（兼容旧代码）
   */
  function togglePreview(): void {
    if (viewMode.value === 'split') {
      viewMode.value = 'edit'
    } else if (viewMode.value === 'edit') {
      viewMode.value = 'split'
    } else {
      viewMode.value = 'split'
    }
    localStorage.setItem('0xNote:viewMode', viewMode.value)
  }

  /**
   * 设置视图模式
   */
  function setViewMode(mode: ViewMode): void {
    viewMode.value = mode
    localStorage.setItem('0xNote:viewMode', mode)
  }

  /**
   * 循环切换视图模式
   */
  function cycleViewMode(): void {
    const modes: ViewMode[] = ['split', 'edit', 'preview']
    const currentIndex = modes.indexOf(viewMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    const nextMode = modes[nextIndex]
    if (nextMode) {
      setViewMode(nextMode)
    }
  }

  /**
   * 打开设置
   */
  function openSettings(): void {
    isSettingsOpen.value = true
  }

  /**
   * 关闭设置
   */
  function closeSettings(): void {
    isSettingsOpen.value = false
  }

  /**
   * 打开快捷键
   */
  function openShortcuts(): void {
    isShortcutsOpen.value = true
  }

  /**
   * 关闭快捷键
   */
  function closeShortcuts(): void {
    isShortcutsOpen.value = false
  }

  /**
   * 获取传入的文件路径（从启动参数中提取）
   */
  function getLaunchFilePath(): string | null {
    // 通常第一个参数是可执行文件路径，第二个开始是用户参数
    // 如: ["0xNote.exe", "C:\\Users\\xxx\\note.md"]
    const filePath = launchArgs.value.find((arg) => arg.endsWith('.md'))
    return filePath ?? null
  }

  return {
    // State
    theme,
    viewMode,
    isInitialized,
    launchArgs,
    isSidebarVisible,
    isPreviewVisible,
    isEditorVisible,
    isSettingsOpen,
    isShortcutsOpen,

    // Actions
    initialize,
    toggleTheme,
    setTheme,
    applyTheme,
    toggleSidebar,
    togglePreview,
    setViewMode,
    cycleViewMode,
    openSettings,
    closeSettings,
    openShortcuts,
    closeShortcuts,
    getLaunchFilePath,
  }
})
