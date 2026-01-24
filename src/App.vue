<!-- src/App.vue -->
<!--
  🏠 0xNote 主应用组件

  【职责】
  1. 组装标题栏、编辑器、预览面板、状态栏
  2. 处理应用初始化（检查启动参数）
  3. 协调编辑器与 Store 的通信
  4. 实现分栏布局和视图切换
  5. 全局快捷键监听
-->
<script setup lang="ts">
import { getThemeById } from '@/common/editor/themes'
import { MemoEditor, MemoPreview, StatusBar, TitleBar } from '@/components'
import SettingsModal from '@/components/SettingsModal.vue'
import ShortcutsModal from '@/components/ShortcutsModal.vue'
import { useAppStore, useFileStore, useSettingStore } from '@/stores'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

const fileStore = useFileStore()
const appStore = useAppStore()
const settingStore = useSettingStore()

// 编辑器和预览组件引用（用于滚动同步）
const editorRef = ref<InstanceType<typeof MemoEditor> | null>(null)
const previewRef = ref<InstanceType<typeof MemoPreview> | null>(null)

// 是否正在同步滚动（防止循环）
let isSyncingScroll = false

// 搜索结果数量
const searchResultCount = ref(0)

// ========== 分栏调整 ==========

const splitViewRef = ref<HTMLElement | null>(null)
const splitRatio = ref(0.5)
const isResizing = ref(false)

const splitPanelStyles = computed(() => {
  if (appStore.viewMode !== 'split') return {}
  return {
    editor: { flex: splitRatio.value },
    preview: { flex: 1 - splitRatio.value }
  }
})

function startResize() {
  // 仅在桌面端允许调整
  if (window.innerWidth <= 768) return

  isResizing.value = true
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function handleResize(e: MouseEvent) {
  if (!splitViewRef.value) return
  const rect = splitViewRef.value.getBoundingClientRect()
  const offsetX = e.clientX - rect.left
  const newRatio = offsetX / rect.width
  // 限制调整范围 (20% - 80%)
  splitRatio.value = Math.min(Math.max(newRatio, 0.2), 0.8)
}

function stopResize() {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.userSelect = ''
}

// 监听视图模式变化，切换回分栏模式时重置比例
watch(
  () => appStore.viewMode,
  (newMode) => {
    if (newMode === 'split') {
      splitRatio.value = 0.5
    }
  }
)

// ========== 全局快捷键 ==========

/**
 * 全局快捷键处理
 */
function handleGlobalKeydown(event: KeyboardEvent): void {
  const { key, ctrlKey, shiftKey, altKey } = event

  // 只处理 Ctrl 组合键
  if (!ctrlKey) return

  // Ctrl + N: 新建文件
  if (key === 'n' && !shiftKey && !altKey) {
    event.preventDefault()
    fileStore.createNewFile()
    return
  }

  // Ctrl + O: 打开文件
  if (key === 'o' && !shiftKey && !altKey) {
    event.preventDefault()
    fileStore.showOpenFileDialog()
    return
  }

  // Ctrl + Shift + S: 另存为
  if (key === 'S' && shiftKey && !altKey) {
    event.preventDefault()
    fileStore.saveFileAs()
    return
  }

  // Ctrl + P: 切换视图模式
  if (key === 'p' && !shiftKey && !altKey) {
    event.preventDefault()
    appStore.cycleViewMode()
    return
  }

  // Ctrl + Shift + T: 切换主题
  if (key === 'T' && shiftKey && !altKey) {
    event.preventDefault()
    handleToggleTheme()
    return
  }

  // Ctrl + ,: 打开设置
  if (key === ',' && !shiftKey && !altKey) {
    event.preventDefault()
    appStore.openSettings()
    return
  }

  // Ctrl + /: 快捷键帮助
  if (key === '/' && !shiftKey && !altKey) {
    event.preventDefault()
    appStore.openShortcuts()
    return
  }
}

/**
 * 切换主题（复用 TitleBar 的逻辑）
 */
function handleToggleTheme(): void {
  const currentThemeId = settingStore.settings.editorTheme
  const currentTheme = getThemeById(currentThemeId)

  let targetThemeId: string
  if (currentTheme.isDark) {
    targetThemeId = settingStore.settings.preferredLightTheme
  } else {
    targetThemeId = settingStore.settings.preferredDarkTheme
  }

  settingStore.updateSetting('editorTheme', targetThemeId)
  const targetTheme = getThemeById(targetThemeId)
  appStore.setTheme(targetTheme.isDark ? 'dark' : 'light')
}

// ========== 生命周期 ==========

onMounted(async () => {
  // 初始化应用
  let args: string[] = []
  if (window.electron) {
    args = await window.electron.app.getLaunchArgs()
  }
  appStore.initialize(args)

  // 应用主题
  appStore.applyTheme()

  // 检查是否有启动参数（右键打开的文件）
  const launchFilePath = appStore.getLaunchFilePath()
  if (launchFilePath) {
    console.log('[App] 检测到启动文件:', launchFilePath)
    await fileStore.openFile(launchFilePath)
  }

  // 注册全局快捷键监听
  window.addEventListener('keydown', handleGlobalKeydown)

  console.log('[App] 0xNote 启动完成 ✨')
})

onUnmounted(() => {
  // 移除全局快捷键监听
  window.removeEventListener('keydown', handleGlobalKeydown)
})

// ========== 事件处理 ==========

/**
 * 处理编辑器内容变化
 */
function handleContentChange(content: string): void {
  fileStore.updateContent(content)
}

/**
 * 处理 Ctrl+S 保存事件
 */
async function handleSave(): Promise<void> {
  await fileStore.saveFile()
}

/**
 * 处理编辑器滚动事件
 */
function handleEditorScroll(percentage: number): void {
  if (!settingStore.settings.syncScroll) return
  if (isSyncingScroll || !previewRef.value) return

  isSyncingScroll = true
  previewRef.value.scrollToPercentage(percentage)

  // 解锁
  setTimeout(() => {
    isSyncingScroll = false
  }, 100)
}

/**
 * 处理预览滚动事件（用于同步滚动）
 */
function handlePreviewScroll(percentage: number): void {
  if (!settingStore.settings.syncScroll) return
  if (isSyncingScroll || !editorRef.value) return

  isSyncingScroll = true
  editorRef.value.scrollToPercentage(percentage)

  // 解锁
  setTimeout(() => {
    isSyncingScroll = false
  }, 100)
}

/**
 * 处理搜索结果更新
 */
function handleSearchResults(count: number): void {
  searchResultCount.value = count
}
</script>


<template>
  <div class="app-container">
    <!-- 标题栏 -->
    <TitleBar />

    <!-- 主编辑区域 -->
    <main class="main-content">
      <!-- 分栏布局容器 -->
      <div ref="splitViewRef" :class="['split-view', `view-mode-${appStore.viewMode}`]">
        <!-- 编辑器面板 -->
        <div v-show="appStore.isEditorVisible" class="editor-panel" :style="splitPanelStyles.editor">
          <MemoEditor ref="editorRef" :model-value="fileStore.content"
            :readonly="fileStore.fileMetadata?.isReadOnly ?? false" @update:model-value="handleContentChange"
            @save="handleSave" @scroll="handleEditorScroll" @search-results="handleSearchResults" />
        </div>

        <!-- 分隔条 -->
        <div v-if="appStore.viewMode === 'split'" class="split-divider" @mousedown.prevent="startResize" />

        <!-- 预览面板 -->
        <div v-show="appStore.isPreviewVisible" class="preview-panel" :style="splitPanelStyles.preview">
          <MemoPreview ref="previewRef" :content="fileStore.content" :file-path="fileStore.currentFilePath"
            @scroll="handlePreviewScroll" />
        </div>
      </div>
    </main>

    <!-- 状态栏 -->
    <StatusBar :search-result-count="searchResultCount" />

    <!-- 设置模态框 -->
    <SettingsModal v-if="appStore.isSettingsOpen" @close="appStore.closeSettings()" />

    <!-- 快捷键模态框 -->
    <ShortcutsModal v-if="appStore.isShortcutsOpen" @close="appStore.closeShortcuts()" />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-bg-base);
}

.main-content {
  flex: 1;
  min-height: 0;
  display: flex;
  padding: 0 16px 16px;
}

/* ========== 分栏布局 ========== */
.split-view {
  display: flex;
  flex: 1;
  /* gap: 16px; 移除固定间距，由分隔条控制 */
  min-height: 0;
}

.editor-panel,
.preview-panel {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
}

/* 视图模式：仅编辑 */
.view-mode-edit .editor-panel {
  flex: 1;
}

.view-mode-edit .preview-panel {
  display: none;
}

/* 视图模式：仅预览 */
.view-mode-preview .editor-panel {
  display: none;
}

.view-mode-preview .preview-panel {
  flex: 1;
}

/* 视图模式：分栏 */
.view-mode-split .editor-panel,
.view-mode-split .preview-panel {
  flex: 1;
}

/* 分隔条 */
/* 分隔条 */
.split-divider {
  width: 16px;
  /* 增加点击区域 */
  display: flex;
  justify-content: center;
  cursor: col-resize;
  flex-shrink: 0;
  z-index: 10;
}

.split-divider::after {
  content: '';
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg,
      transparent 0%,
      var(--color-border, rgba(255, 255, 255, 0.1)) 20%,
      var(--color-accent, #00ff88) 50%,
      var(--color-border, rgba(255, 255, 255, 0.1)) 80%,
      transparent 100%);
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.split-divider:hover::after,
.split-divider:active::after {
  opacity: 1;
  background: linear-gradient(180deg,
      transparent 0%,
      var(--color-accent, #00ff88) 20%,
      var(--color-accent, #00ff88) 80%,
      transparent 100%);
  box-shadow: 0 0 4px var(--color-accent, #00ff88);
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .split-view {
    flex-direction: column;
    gap: 8px;
  }

  .split-divider {
    width: 100%;
    height: 16px;
    cursor: row-resize;
    flex-direction: column;
    justify-content: center;
  }

  .split-divider::after {
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg,
        transparent 0%,
        var(--color-accent, #00ff88) 50%,
        transparent 100%);
  }
}
</style>
