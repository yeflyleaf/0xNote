<!-- src/components/StatusBar.vue -->
<!--
  📊 底部状态栏组件

  显示字符数、行数、光标位置等信息
-->
<script setup lang="ts">
import { useFileStore } from '@/stores';
import { computed } from 'vue';

defineProps<{
  /** 搜索结果数量 */
  searchResultCount?: number
}>()

const fileStore = useFileStore()

// 计算统计信息
const stats = computed(() => {
  const content = fileStore.content
  const lines = content.split('\n').length
  const chars = content.length
  const words = content.trim() ? content.trim().split(/\s+/).length : 0

  return {
    lines,
    chars,
    words,
  }
})

// 格式化时间
const lastSavedTime = computed(() => {
  if (!fileStore.lastSavedAt) return null
  const date = new Date(fileStore.lastSavedAt)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
})
</script>

<template>
  <footer class="status-bar">
    <div class="status-bar__left">
      <span class="stat-item">
        <span class="stat-label">行</span>
        <span class="stat-value">{{ stats.lines }}</span>
      </span>
      <span class="divider" />
      <span class="stat-item">
        <span class="stat-label">字符</span>
        <span class="stat-value">{{ stats.chars }}</span>
      </span>
      <span class="divider" />
      <span class="stat-item">
        <span class="stat-label">词</span>
        <span class="stat-value">{{ stats.words }}</span>
      </span>
    </div>

    <div class="status-bar__right">
      <span v-if="searchResultCount && searchResultCount > 0" class="search-results">
        找到 {{ searchResultCount }} 个结果
      </span>
      <span class="divider" v-if="searchResultCount && searchResultCount > 0" />
      <span v-if="lastSavedTime" class="last-saved"> 上次保存: {{ lastSavedTime }} </span>
      <span class="language-badge">Markdown</span>
    </div>
  </footer>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
  padding: 0 16px;
  background: rgba(24, 24, 37, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  font-size: 12px;
  color: #6c7086;
}

.status-bar__left,
.status-bar__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-label {
  color: #6c7086;
}

.stat-value {
  color: #a6adc8;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.divider {
  width: 1px;
  height: 12px;
  background: rgba(255, 255, 255, 0.1);
}

.last-saved {
  color: #6c7086;
}

.language-badge {
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(0, 255, 136, 0.1);
  color: #00ff88;
  font-weight: 500;
}

.search-results {
  color: #fab387;
  /* 使用醒目的颜色，如橙色 */
  font-weight: 500;
}
</style>
