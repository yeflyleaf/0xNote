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
    /** 主题模式 */
    theme?: 'dark' | 'light'
}

const props = withDefaults(defineProps<Props>(), {
    content: '',
    theme: 'dark',
})

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

// 计算属性：当前主题类
const themeClass = computed(() => `theme-${props.theme}`)

// ========== 暴露方法 ==========
defineExpose({
    scrollToPercentage,
})
</script>

<template>
    <div :class="['memo-preview', themeClass]">
        <div ref="previewContainer" class="preview-container markdown-body" @scroll="handleScroll"
            v-html="renderedHtml" />
    </div>
</template>

<style scoped>
.memo-preview {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    background-color: var(--color-bg-editor, #1e1e2e);
    border-radius: 8px;
    overflow: hidden;
}

.preview-container {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 24px;
}

/* ========== Markdown 渲染样式 (暗色主题) ========== */
.markdown-body {
    color: var(--color-text-primary, #cdd6f4);
    font-family: var(--font-sans, 'Inter', sans-serif);
    font-size: 15px;
    line-height: 1.8;
}

/* 标题 */
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
    color: var(--color-text-primary, #cdd6f4);
}

.markdown-body :deep(h1) {
    font-size: 2em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
}

.markdown-body :deep(h2) {
    font-size: 1.5em;
    padding-bottom: 0.3em;
    border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
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

/* 链接 */
.markdown-body :deep(a) {
    color: var(--color-accent, #00ff88);
    text-decoration: none;
    transition: color 0.2s ease;
}

.markdown-body :deep(a:hover) {
    color: #89b4fa;
    text-decoration: underline;
}

/* 代码（行内） */
.markdown-body :deep(code) {
    background: rgba(0, 255, 136, 0.1);
    color: var(--color-accent, #00ff88);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-family: var(--font-mono, 'JetBrains Mono', monospace);
    font-size: 0.9em;
}

/* 代码块 */
.markdown-body :deep(pre) {
    background: rgba(17, 17, 27, 0.8);
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    margin: 16px 0;
    border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
}

.markdown-body :deep(pre code) {
    background: transparent;
    padding: 0;
    font-size: 0.9em;
    line-height: 1.6;
    color: var(--color-text-primary, #cdd6f4);
}

/* 引用 */
.markdown-body :deep(blockquote) {
    margin: 16px 0;
    padding: 12px 20px;
    border-left: 4px solid var(--color-accent, #00ff88);
    background: rgba(0, 255, 136, 0.05);
    border-radius: 0 8px 8px 0;
    color: var(--color-text-secondary, #a6adc8);
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
    color: var(--color-accent, #00ff88);
}

/* 任务列表 */
.markdown-body :deep(input[type='checkbox']) {
    appearance: none;
    width: 16px;
    height: 16px;
    border: 2px solid var(--color-accent, #00ff88);
    border-radius: 4px;
    margin-right: 8px;
    vertical-align: middle;
    cursor: pointer;
    position: relative;
}

.markdown-body :deep(input[type='checkbox']:checked) {
    background: var(--color-accent, #00ff88);
}

.markdown-body :deep(input[type='checkbox']:checked::after) {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #1e1e2e;
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
    border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
}

.markdown-body :deep(th) {
    background: rgba(0, 255, 136, 0.1);
    font-weight: 600;
    text-align: left;
}

.markdown-body :deep(tr:nth-child(even)) {
    background: rgba(255, 255, 255, 0.02);
}

/* 分隔线 */
.markdown-body :deep(hr) {
    height: 1px;
    border: none;
    background: linear-gradient(90deg, transparent, var(--color-accent, #00ff88), transparent);
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
    color: var(--color-text-muted, #6c7086);
    font-style: italic;
    text-align: center;
    padding: 48px 24px;
}

/* ========== 亮色主题 ========== */
.theme-light .preview-container {
    background-color: #ffffff;
}

.theme-light .markdown-body {
    color: #24292f;
}

.theme-light .markdown-body :deep(h1),
.theme-light .markdown-body :deep(h2),
.theme-light .markdown-body :deep(h3),
.theme-light .markdown-body :deep(h4),
.theme-light .markdown-body :deep(h5),
.theme-light .markdown-body :deep(h6) {
    color: #1f2328;
}

.theme-light .markdown-body :deep(code) {
    background: rgba(0, 128, 68, 0.1);
    color: #008044;
}

.theme-light .markdown-body :deep(pre) {
    background: #f6f8fa;
    border-color: #d0d7de;
}

.theme-light .markdown-body :deep(pre code) {
    color: #24292f;
}

.theme-light .markdown-body :deep(blockquote) {
    background: rgba(0, 128, 68, 0.05);
    border-left-color: #008044;
    color: #656d76;
}

.theme-light .markdown-body :deep(a) {
    color: #0969da;
}
</style>
