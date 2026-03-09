// src/stores/index.ts
/**
 * 🗃️ Store 统一导出
 */

export { useAppStore } from './appStore'
export type { ThemeMode, ViewMode } from './appStore'
export { useFileStore } from './fileStore'
export type { SaveStatus } from './fileStore'
export { useSettingStore } from './settingStore'

