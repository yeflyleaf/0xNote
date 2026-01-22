<!-- src/components/TitleBar.vue -->
<!--
  🎯 标题栏组件

  显示文件名、保存状态、视图切换按钮和设置入口
  在 Electron 中可配置为自定义窗口拖拽区域
-->
<script setup lang="ts">
import { getThemeById } from '@/common/editor/themes'
import type { SaveStatus, ViewMode } from '@/stores'
import { useAppStore, useFileStore, useSettingStore } from '@/stores'
import { computed, onMounted, ref } from 'vue'

const fileStore = useFileStore()
const appStore = useAppStore()
const settingStore = useSettingStore()

// 窗口最大化状态
const isMaximized = ref(false)

// 计算属性
const fileName = computed(() => fileStore.currentFileName)
const saveStatus = computed(() => fileStore.saveStatus)
const hasUnsavedChanges = computed(() => fileStore.hasUnsavedChanges)
const currentViewMode = computed(() => appStore.viewMode)

// 状态指示器配置
const statusConfig: Record<SaveStatus, { icon: string; text: string; class: string }> = {
  saved: { icon: '✓', text: '已保存', class: 'status-saved' },
  unsaved: { icon: '●', text: '未保存', class: 'status-unsaved' },
  saving: { icon: '↻', text: '保存中...', class: 'status-saving' },
  error: { icon: '✕', text: '保存失败', class: 'status-error' },
}

// 视图模式配置
const viewModeConfig: Record<ViewMode, { icon: string; title: string }> = {
  split: { icon: '⬚', title: '分栏视图 (当前)' },
  edit: { icon: '✏️', title: '仅编辑器' },
  preview: { icon: '👁️', title: '仅预览' },
}

const currentStatus = computed(() => statusConfig[saveStatus.value])

// ========== 生命周期 ==========

onMounted(async () => {
  // 初始化窗口最大化状态
  if (window.electron?.window) {
    isMaximized.value = await window.electron.window.isMaximized()
    // 监听窗口最大化状态变化
    window.electron.window.onMaximizeChange((maximized: boolean) => {
      isMaximized.value = maximized
    })
  }
})

// ========== 操作方法 ==========

function handleNewFile(): void {
  fileStore.createNewFile()
}

function handleOpenFile(): void {
  fileStore.showOpenFileDialog()
}

function handleSave(): void {
  fileStore.saveFile()
}

function handleSaveAs(): void {
  fileStore.saveFileAs()
}

function handleToggleTheme(): void {
  // 获取当前主题模式
  const currentThemeId = settingStore.settings.editorTheme
  const currentTheme = getThemeById(currentThemeId)

  // 决定目标主题
  let targetThemeId: string
  if (currentTheme.isDark) {
    // 如果当前是深色，切换到偏好的亮色主题
    targetThemeId = settingStore.settings.preferredLightTheme
  } else {
    // 如果当前是亮色，切换到偏好的深色主题
    targetThemeId = settingStore.settings.preferredDarkTheme
  }

  // 更新设置
  settingStore.updateSetting('editorTheme', targetThemeId)

  // 更新系统主题模式
  const targetTheme = getThemeById(targetThemeId)
  appStore.setTheme(targetTheme.isDark ? 'dark' : 'light')
}

function handleOpenSettings(): void {
  appStore.openSettings()
}

// ========== 窗口控制 ==========

function handleMinimize(): void {
  window.electron?.window.minimize()
}

function handleToggleMaximize(): void {
  window.electron?.window.toggleMaximize()
}

function handleClose(): void {
  window.electron?.window.close()
}
</script>

<template>
  <header class="title-bar">
    <!-- 左侧：应用图标和菜单 -->
    <div class="title-bar__left">
      <div class="app-logo">
        <span class="logo-text">0x</span>
        <span class="logo-highlight">Note</span>
      </div>

      <nav class="menu-actions">
        <button class="menu-btn" title="新建 (Ctrl+N)" @click="handleNewFile">
          <span class="icon">📄</span>
        </button>
        <button class="menu-btn" title="打开 (Ctrl+O)" @click="handleOpenFile">
          <span class="icon">📂</span>
        </button>
        <button class="menu-btn" title="保存 (Ctrl+S)" :disabled="!hasUnsavedChanges" @click="handleSave">
          <span class="icon">💾</span>
        </button>
        <button class="menu-btn" title="另存为 (Ctrl+Shift+S)" @click="handleSaveAs">
          <span class="icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path
                d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10.2z" />
              <path d="M17 21v-8H7v8" />
              <path d="M7 3v5h8" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          </span>
        </button>
      </nav>
    </div>

    <!-- 中间：文件名 -->
    <div class="title-bar__center">
      <span class="file-name">{{ fileName }}</span>
      <span v-if="hasUnsavedChanges" class="unsaved-dot">●</span>
    </div>

    <!-- 右侧：视图切换、状态指示器和设置 -->
    <div class="title-bar__right">
      <!-- 视图模式切换 -->
      <div class="view-mode-switcher">
        <button v-for="(config, mode) in viewModeConfig" :key="mode"
          :class="['view-btn', { active: currentViewMode === mode }]" :title="config.title"
          @click="appStore.setViewMode(mode as ViewMode)">
          {{ config.icon }}
        </button>
      </div>

      <div class="divider" />

      <div :class="['save-status', currentStatus.class]">
        <span class="status-icon">{{ currentStatus.icon }}</span>
        <span class="status-text">{{ currentStatus.text }}</span>
      </div>

      <button class="theme-toggle" title="切换主题" @click="handleToggleTheme">
        {{ appStore.theme === 'dark' ? '🌙' : '☀️' }}
      </button>

      <button class="shortcuts-btn" title="快捷键 (Ctrl+/)" @click="appStore.openShortcuts()">⌨️</button>

      <button class="settings-btn" title="设置" @click="handleOpenSettings">⚙️</button>

      <div class="divider" />

      <!-- 窗口控制按钮 -->
      <div class="window-controls">
        <button class="window-btn" title="最小化" @click="handleMinimize">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="2" y="5.5" width="8" height="1" />
          </svg>
        </button>
        <button class="window-btn" :title="isMaximized ? '还原' : '最大化'" @click="handleToggleMaximize">
          <svg v-if="isMaximized" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
            <!-- 还原图标：两个重叠的方框 -->
            <rect x="3.5" y="0.5" width="8" height="8" rx="0.5" stroke-width="1" />
            <rect x="0.5" y="3.5" width="8" height="8" rx="0.5" stroke-width="1" fill="var(--color-bg-base, #1e1e2e)" />
          </svg>
          <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor">
            <!-- 最大化图标：单个方框 -->
            <rect x="1.5" y="1.5" width="9" height="9" rx="0.5" stroke-width="1" />
          </svg>
        </button>
        <button class="window-btn window-btn--close" title="关闭" @click="handleClose">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.2">
            <line x1="2.5" y1="2.5" x2="9.5" y2="9.5" />
            <line x1="9.5" y1="2.5" x2="2.5" y2="9.5" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: linear-gradient(135deg, rgba(30, 30, 46, 0.95), rgba(24, 24, 37, 0.95));
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  user-select: none;
  -webkit-app-region: drag;
  /* Electron 窗口拖拽 */
}

.title-bar__left,
.title-bar__right {
  display: flex;
  align-items: center;
  gap: 12px;
  -webkit-app-region: no-drag;
}

.title-bar__center {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* Logo 样式 */
.app-logo {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.logo-text {
  color: #cdd6f4;
}

.logo-highlight {
  color: #00ff88;
  text-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
}

/* 菜单按钮 */
.menu-actions {
  display: flex;
  gap: 4px;
}

.menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.menu-btn:active {
  transform: scale(0.95);
}

.menu-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.menu-btn .icon {
  font-size: 16px;
}

/* 文件名 */
.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #cdd6f4;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unsaved-dot {
  color: #fab387;
  font-size: 10px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* 视图模式切换器 */
.view-mode-switcher {
  display: flex;
  gap: 2px;
  padding: 2px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
}

.view-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.view-btn.active {
  background: rgba(0, 255, 136, 0.2);
  color: #00ff88;
}

/* 分隔线 */
.divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
}

/* 保存状态 */
.save-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-icon {
  font-size: 10px;
}

.status-saved {
  color: #a6e3a1;
  background: rgba(166, 227, 161, 0.1);
}

.status-unsaved {
  color: #fab387;
  background: rgba(250, 179, 135, 0.1);
}

.status-saving {
  color: #89b4fa;
  background: rgba(137, 180, 250, 0.1);
}

.status-saving .status-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.status-error {
  color: #f38ba8;
  background: rgba(243, 139, 168, 0.1);
}

/* 主题切换按钮 */
.theme-toggle,
.shortcuts-btn,
.settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
}

.theme-toggle:hover,
.shortcuts-btn:hover,
.settings-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(15deg);
}

.shortcuts-btn:hover {
  transform: scale(1.1);
}

.settings-btn:hover {
  transform: rotate(45deg);
}

/* 窗口控制按钮 */
.window-controls {
  display: flex;
  align-items: center;
  gap: 0;
  margin-left: 4px;
}

.window-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 32px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.15s ease;
  color: #cdd6f4;
}

.window-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.window-btn:active {
  background: rgba(255, 255, 255, 0.15);
}

/* 关闭按钮特殊样式 */
.window-btn--close:hover {
  background: #e81123;
  color: white;
}

.window-btn--close:active {
  background: #bf0f1d;
}

.window-btn svg {
  width: 12px;
  height: 12px;
}
</style>
