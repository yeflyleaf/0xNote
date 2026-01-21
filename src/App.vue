<!-- src/App.vue -->
<!--
  🏠 0xNote 主应用组件

  【职责】
  1. 组装标题栏、编辑器、预览面板、状态栏
  2. 处理应用初始化（检查启动参数）
  3. 协调编辑器与 Store 的通信
  4. 实现分栏布局和视图切换
-->
<script setup lang="ts">
import { MemoEditor, MemoPreview, StatusBar, TitleBar } from '@/components'
import SettingsModal from '@/components/SettingsModal.vue'
import { useAppStore, useFileStore, useSettingStore } from '@/stores'
import { onMounted, ref } from 'vue'

const fileStore = useFileStore()
const appStore = useAppStore()
const settingStore = useSettingStore()

// 编辑器和预览组件引用（用于滚动同步）
const editorRef = ref<InstanceType<typeof MemoEditor> | null>(null)
const previewRef = ref<InstanceType<typeof MemoPreview> | null>(null)

// 是否正在同步滚动（防止循环）
let isSyncingScroll = false

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

  console.log('[App] 0xNote 启动完成 ✨')
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
</script>

<template>
  <div class="app-container">
    <!-- 标题栏 -->
    <TitleBar />

    <!-- 主编辑区域 -->
    <main class="main-content">
      <!-- 分栏布局容器 -->
      <div :class="['split-view', `view-mode-${appStore.viewMode}`]">
        <!-- 编辑器面板 -->
        <div v-show="appStore.isEditorVisible" class="editor-panel">
          <MemoEditor ref="editorRef" :model-value="fileStore.content"
            :readonly="fileStore.fileMetadata?.isReadOnly ?? false" @update:model-value="handleContentChange"
            @save="handleSave" @scroll="handleEditorScroll" />
        </div>

        <!-- 分隔条 -->
        <div v-if="appStore.viewMode === 'split'" class="split-divider" />

        <!-- 预览面板 -->
        <div v-show="appStore.isPreviewVisible" class="preview-panel">
          <MemoPreview ref="previewRef" :content="fileStore.content" @scroll="handlePreviewScroll" />
        </div>
      </div>
    </main>

    <!-- 状态栏 -->
    <StatusBar />

    <!-- 设置模态框 -->
    <SettingsModal v-if="appStore.isSettingsOpen" @close="appStore.closeSettings()" />
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
  gap: 16px;
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
.split-divider {
  width: 1px;
  background: linear-gradient(180deg,
      transparent 0%,
      var(--color-border, rgba(255, 255, 255, 0.1)) 20%,
      var(--color-accent, #00ff88) 50%,
      var(--color-border, rgba(255, 255, 255, 0.1)) 80%,
      transparent 100%);
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.split-divider:hover {
  opacity: 1;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .split-view {
    flex-direction: column;
    gap: 8px;
  }

  .split-divider {
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg,
        transparent 0%,
        var(--color-accent, #00ff88) 50%,
        transparent 100%);
  }
}
</style>
