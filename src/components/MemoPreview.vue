<!-- src/components/MemoPreview.vue -->
<!--
  👁️ Markdown 实时预览组件

  【设计原则】
  1. 接收 Markdown 字符串，输出安全的 HTML
  2. 使用 DOMPurify 防止 XSS 攻击
  3. 支持暗色模式，与编辑器风格一致
  4. 使用 debounce 优化渲染性能

  【鸿蒙迁移指南】
  迁移时替换此组件为鸿蒙原生 RichText 组件，
  保持 content Props 接口不变。
-->
<script setup lang="ts">
import { generatePreviewCssVars, getThemeById } from '@/common/editor/themes'
import { useSettingStore } from '@/stores'
import DOMPurify from 'dompurify'
import { debounce } from 'lodash-es'
import MarkdownIt from 'markdown-it'
import { computed, ref, watch } from 'vue'

/**
 * Props 类型定义
 */
interface Props {
  /** Markdown 内容 */
  content: string
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
})

// ========== Store ==========
const settingStore = useSettingStore()

/**
 * Emits 定义
 */
const emit = defineEmits<{
  /** 滚动事件（用于同步滚动） */
  scroll: [scrollTop: number, scrollHeight: number]
}>()

// ========== Markdown 解析器配置 ==========

/** Markdown-it 实例 */
const md = new MarkdownIt({
  html: true, // 允许 HTML 标签
  linkify: true, // 自动识别链接
  typographer: true, // 启用排版优化
  breaks: true, // 将换行符转换为 <br>
  highlight: (code: string, lang: string): string => {
    // 简单的代码高亮（使用 CSS 类）
    const escapedCode = md.utils.escapeHtml(code)
    return `<pre class="hljs"><code class="language-${lang}">${escapedCode}</code></pre>`
  },
})

// ========== 响应式状态 ==========

/** 渲染后的 HTML */
const renderedHtml = ref<string>('')

/** 预览容器引用 */
const previewContainer = ref<HTMLDivElement | null>(null)

// ========== 计算属性 ==========

/** 当前主题 */
const currentTheme = computed(() => {
  return getThemeById(settingStore.settings.editorTheme)
})

/** 当前主题是否为暗色 */
const isDarkTheme = computed(() => currentTheme.value.isDark)

/** 预览区域的动态样式（包含主题 CSS 变量） */
const previewStyles = computed(() => {
  const cssVars = generatePreviewCssVars(settingStore.settings.editorTheme)
  return {
    ...cssVars,
    fontSize: `${settingStore.settings.fontSize}px`,
    fontFamily: settingStore.settings.fontFamily,
  }
})

// ========== 渲染逻辑 ==========

/**
 * 渲染 Markdown 为安全的 HTML
 */
function renderMarkdown(content: string): string {
  if (!content.trim()) {
    return '<p class="empty-hint">暂无内容，开始书写吧...</p>'
  }

  // 1. 将 Markdown 转换为 HTML
  const rawHtml = md.render(content)

  // 2. 使用 DOMPurify 消毒，防止 XSS
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'], // 允许 target 属性
    ADD_TAGS: ['iframe'], // 可选：允许嵌入视频
  })

  return cleanHtml
}

/**
 * 防抖渲染函数（避免频繁更新 DOM）
 */
const debouncedRender = debounce((content: string) => {
  renderedHtml.value = renderMarkdown(content)
}, 150)

// 监听内容变化
watch(
  () => props.content,
  (newContent) => {
    debouncedRender(newContent)
  },
  { immediate: true },
)

// ========== 滚动同步 ==========

/**
 * 处理滚动事件
 */
function handleScroll(): void {
  if (!previewContainer.value) return

  const { scrollTop, scrollHeight } = previewContainer.value
  emit('scroll', scrollTop, scrollHeight)
}

/**
 * 滚动到指定位置（供外部调用）
 * @param percentage 滚动百分比 (0-1)
 */
function scrollToPercentage(percentage: number): void {
  if (!previewContainer.value) return

  const { scrollHeight, clientHeight } = previewContainer.value
  const maxScroll = scrollHeight - clientHeight
  previewContainer.value.scrollTop = maxScroll * percentage
}

// ========== 暴露方法 ==========
defineExpose({
  scrollToPercentage,
})
</script>

<template>
  <div :class="['memo-preview', { 'theme-dark': isDarkTheme, 'theme-light': !isDarkTheme }]" :style="previewStyles">
    <div ref="previewContainer" class="preview-container markdown-body" @scroll="handleScroll" v-html="renderedHtml" />
  </div>
</template>

<style scoped>
.memo-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--preview-bg, #1e1e2e);
  border-radius: 8px;
  overflow: hidden;
  transition: background-color 1s ease;
}

.preview-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
}

/* ========== Markdown 渲染样式（使用 CSS 变量） ========== */
.markdown-body {
  color: var(--preview-text, #cdd6f4);
  font-family: var(--font-sans, 'Inter', sans-serif);
  line-height: 1.8;
  transition: color 1s ease;
}

/* 标题 - 使用主题色 */
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: var(--preview-heading, #89b4fa);
}

.markdown-body :deep(h1) {
  font-size: 2em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--preview-border, rgba(255, 255, 255, 0.1));
}

.markdown-body :deep(h2) {
  font-size: 1.5em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid var(--preview-border, rgba(255, 255, 255, 0.1));
}

.markdown-body :deep(h3) {
  font-size: 1.25em;
}

.markdown-body :deep(h4) {
  font-size: 1em;
}

/* 段落 */
.markdown-body :deep(p) {
  margin-top: 0;
  margin-bottom: 16px;
}

/* 粗体 */
.markdown-body :deep(strong) {
  color: var(--preview-bold, #fab387);
  font-weight: 700;
}

/* 斜体 */
.markdown-body :deep(em) {
  color: var(--preview-italic, #94e2d5);
  font-style: italic;
}

/* 链接 */
.markdown-body :deep(a) {
  color: var(--preview-link, #89dceb);
  text-decoration: none;
  transition:
    color 0.2s ease,
    opacity 0.2s ease;
}

.markdown-body :deep(a:hover) {
  opacity: 0.8;
  text-decoration: underline;
}

/* 代码（行内） */
.markdown-body :deep(code) {
  background: var(--preview-code-bg, rgba(250, 179, 135, 0.1));
  color: var(--preview-code, #fab387);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: var(--font-mono, 'JetBrains Mono', monospace);
  font-size: 0.9em;
}

/* 代码块 */
.markdown-body :deep(pre) {
  background: var(--preview-code-bg, rgba(17, 17, 27, 0.8));
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
  margin: 16px 0;
  border: 1px solid var(--preview-border, rgba(255, 255, 255, 0.1));
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
  font-size: 0.9em;
  line-height: 1.6;
  color: var(--preview-text, #cdd6f4);
}

/* 引用 */
.markdown-body :deep(blockquote) {
  margin: 16px 0;
  padding: 12px 20px;
  border-left: 4px solid var(--preview-accent, #00ff88);
  background: var(--preview-quote-bg, rgba(0, 255, 136, 0.05));
  border-radius: 0 8px 8px 0;
  color: var(--preview-quote, #a6e3a1);
}

.markdown-body :deep(blockquote p:last-child) {
  margin-bottom: 0;
}

/* 列表 */
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin: 16px 0;
  padding-left: 2em;
}

.markdown-body :deep(li) {
  margin: 4px 0;
}

.markdown-body :deep(li::marker) {
  color: var(--preview-accent, #00ff88);
}

/* 任务列表 */
.markdown-body :deep(input[type='checkbox']) {
  appearance: none;
  width: 16px;
  height: 16px;
  border: 2px solid var(--preview-accent, #00ff88);
  border-radius: 4px;
  margin-right: 8px;
  vertical-align: middle;
  cursor: pointer;
  position: relative;
}

.markdown-body :deep(input[type='checkbox']:checked) {
  background: var(--preview-accent, #00ff88);
}

.markdown-body :deep(input[type='checkbox']:checked::after) {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--preview-bg, #1e1e2e);
  font-size: 12px;
  font-weight: bold;
}

/* 表格 */
.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 16px 0;
}

.markdown-body :deep(th),
.markdown-body :deep(td) {
  padding: 12px;
  border: 1px solid var(--preview-border, rgba(255, 255, 255, 0.1));
}

.markdown-body :deep(th) {
  background: var(--preview-accent-dim, rgba(0, 255, 136, 0.1));
  font-weight: 600;
  text-align: left;
}

.theme-dark .markdown-body :deep(tr:nth-child(even)) {
  background: rgba(255, 255, 255, 0.02);
}

.theme-light .markdown-body :deep(tr:nth-child(even)) {
  background: rgba(0, 0, 0, 0.02);
}

/* 分隔线 */
.markdown-body :deep(hr) {
  height: 1px;
  border: none;
  background: linear-gradient(90deg, transparent, var(--preview-accent, #00ff88), transparent);
  margin: 24px 0;
}

/* 图片 */
.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 16px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 空内容提示 */
.markdown-body :deep(.empty-hint) {
  color: var(--preview-text-muted, #6c7086);
  font-style: italic;
  text-align: center;
  padding: 48px 24px;
}

/* ========== 删除线 ========== */
.markdown-body :deep(del) {
  color: var(--preview-text-muted, #6c7086);
  text-decoration: line-through;
}
</style>
