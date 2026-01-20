<!-- src/components/TitleBar.vue -->
<!--
  🎯 标题栏组件

  显示文件名、保存状态、视图切换按钮和设置入口
  在 Electron 中可配置为自定义窗口拖拽区域
-->
<script setup lang="ts">
import type { SaveStatus, ViewMode } from '@/stores'
import { useAppStore, useFileStore } from '@/stores'
import { computed } from 'vue'

const fileStore = useFileStore()
const appStore = useAppStore()

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

// 操作方法
function handleNewFile(): void {
  fileStore.createNewFile()
}

function handleOpenFile(): void {
  fileStore.showOpenFileDialog()
}

function handleSave(): void {
  fileStore.saveFile()
}

function handleToggleTheme(): void {
  appStore.toggleTheme()
}

function handleCycleViewMode(): void {
  appStore.cycleViewMode()
}

function handleOpenSettings(): void {
  appStore.openSettings()
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

      <button class="settings-btn" title="设置" @click="handleOpenSettings">⚙️</button>
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
.settings-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(15deg);
}

.settings-btn:hover {
  transform: rotate(45deg);
}
</style>
