<!-- src/App.vue -->
<!--
  🏠 0xNote 主应用组件

  【职责】
  1. 组装标题栏、编辑器、状态栏
  2. 处理应用初始化（检查启动参数）
  3. 协调编辑器与 Store 的通信
-->
<script setup lang="ts">
import { MemoEditor, StatusBar, TitleBar } from '@/components'
import { useAppStore, useFileStore } from '@/stores'
import { onMounted } from 'vue'

const fileStore = useFileStore()
const appStore = useAppStore()

// ========== 生命周期 ==========

onMounted(async () => {
  // 初始化应用
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
</script>

<template>
  <div class="app-container">
    <!-- 标题栏 -->
    <TitleBar />

    <!-- 主编辑区域 -->
    <main class="main-content">
      <MemoEditor
        :model-value="fileStore.content"
        :readonly="fileStore.fileMetadata?.isReadOnly ?? false"
        @update:model-value="handleContentChange"
        @save="handleSave"
      />
    </main>

    <!-- 状态栏 -->
    <StatusBar />
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
</style>
