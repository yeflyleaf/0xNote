<!-- src/components/MemoEditor.vue -->
<!--
  📝 核心 Markdown 编辑器组件

  【设计原则】
  1. 组件只负责 UI 渲染和用户交互
  2. 不直接进行文件 I/O，通过 emit 将内容变化传出
  3. 对外暴露统一的 Props 和 Events，内部实现细节黑盒化
  4. 实时响应 settingStore 中的配置变化（字体、行号等）

  【鸿蒙迁移指南】
  迁移时替换此组件为鸿蒙原生 TextArea + RichText 组件即可，
  保持 modelValue 双向绑定接口不变，外部逻辑无需修改。
-->
<script setup lang="ts">
import { createCompleteTheme, getThemeById } from '@/common/editor/themes'
import { useSettingStore } from '@/stores'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { bracketMatching, indentUnit } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import {
  getSearchQuery,
  highlightSelectionMatches,
  openSearchPanel,
  search,
  searchKeymap
} from '@codemirror/search'
import { Compartment, EditorState, type Extension } from '@codemirror/state'
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'

/**
 * Props 类型定义
 */
interface Props {
  /** 编辑器内容（双向绑定） */
  modelValue: string
  /** 是否只读 */
  readonly?: boolean
  /** 占位符文本 */
  placeholder?: string
  /** 是否自动聚焦 */
  autofocus?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  readonly: false,
  placeholder: '开始书写你的 Markdown...',
  autofocus: true,
})

/**
 * Emits 定义
 */
const emit = defineEmits<{
  /** 内容更新事件 */
  'update:modelValue': [value: string]
  /** 编辑器就绪事件 */
  ready: [view: EditorView]
  /** 保存事件 (Ctrl+S) */
  save: []
  /** 滚动事件 */
  scroll: [percentage: number]
  /** 搜索结果更新事件 */
  'search-results': [count: number]
}>()



// ========== Store ==========
const settingStore = useSettingStore()

// ========== 编辑器实例 ==========

/** 编辑器容器 DOM 引用 */
const editorContainer = ref<HTMLDivElement | null>(null)

/** 编辑器视图实例 */
const editorView = shallowRef<EditorView | null>(null)

/** 只读模式隔间（用于动态切换） */
const readOnlyCompartment = new Compartment()

/** 行号显示隔间（用于动态切换） */
const lineNumbersCompartment = new Compartment()

/** 主题样式隔间（用于动态切换主题、字体等） */
const themeCompartment = new Compartment()

/** Tab 大小隔间（用于动态切换） */
const tabSizeCompartment = new Compartment()

/** 是否正在内部更新（防止循环更新） */
let isInternalUpdate = false

// ========== 计算属性 ==========

/** 当前主题的背景色 */
const editorBackground = computed(() => {
  const theme = getThemeById(settingStore.settings.editorTheme)
  return theme.colors.background
})

// ========== Markdown 格式化辅助函数 ==========

/**
 * 用指定的标记包裹选中的文本
 * @param view 编辑器视图
 * @param prefix 前缀标记
 * @param suffix 后缀标记（默认与前缀相同）
 */
function wrapSelection(view: EditorView, prefix: string, suffix: string = prefix): boolean {
  const { from, to } = view.state.selection.main
  const selectedText = view.state.sliceDoc(from, to)

  // 如果没有选中文本，插入标记并将光标放在中间
  if (from === to) {
    const insertText = prefix + suffix
    view.dispatch({
      changes: { from, to, insert: insertText },
      selection: { anchor: from + prefix.length },
    })
    return true
  }

  // 包裹选中的文本
  const newText = prefix + selectedText + suffix
  view.dispatch({
    changes: { from, to, insert: newText },
    selection: { anchor: from + prefix.length, head: from + prefix.length + selectedText.length },
  })
  return true
}

/**
 * 插入链接格式
 */
function insertLink(view: EditorView): boolean {
  const { from, to } = view.state.selection.main
  const selectedText = view.state.sliceDoc(from, to) || '链接文本'

  const linkText = `[${selectedText}](url)`
  view.dispatch({
    changes: { from, to, insert: linkText },
    // 选中 url 部分便于用户替换
    selection: { anchor: from + selectedText.length + 3, head: from + selectedText.length + 6 },
  })
  return true
}

/**
 * 插入图片格式
 */
function insertImage(view: EditorView): boolean {
  const { from, to } = view.state.selection.main
  const selectedText = view.state.sliceDoc(from, to) || '图片描述'

  const imageText = `![${selectedText}](url)`
  view.dispatch({
    changes: { from, to, insert: imageText },
    // 选中 url 部分便于用户替换
    selection: { anchor: from + selectedText.length + 4, head: from + selectedText.length + 7 },
  })
  return true
}

/**
 * 插入代码块
 */
function insertCodeBlock(view: EditorView): boolean {
  const { from, to } = view.state.selection.main
  const selectedText = view.state.sliceDoc(from, to)

  // 如果有选中的文本，包裹在代码块中
  const codeBlockText = selectedText
    ? '```\n' + selectedText + '\n```'
    : '```\n\n```'

  view.dispatch({
    changes: { from, to, insert: codeBlockText },
    // 光标放在语言标识符后面或代码块内
    selection: { anchor: selectedText ? from + 4 : from + 4 },
  })
  return true
}

// ========== 编辑器配置 ==========

/**
 * 创建编辑器扩展配置
 */
function createExtensions() {
  const settings = settingStore.settings

  return [
    // 界面文本汉化
    EditorState.phrases.of({
      // 搜索面板
      'Find': '查找',
      'Replace': '替换',
      'next': '下一个',
      'previous': '上一个',
      'all': '全部',
      'match case': '区分大小写',
      'by word': '全字匹配',
      'regexp': '正则表达式',
      'replace': '替换',
      'replace all': '全部替换',
      'close': '关闭',

      // 跳转行面板 (Alt+G)
      'Go to line': '跳转到行',
      'go': '跳转',
    }),

    // 行号（可动态切换）
    lineNumbersCompartment.of(settings.showLineNumbers ? lineNumbers() : []),

    // 历史记录（撤销/重做）
    history(),

    // 高亮当前行
    highlightActiveLine(),
    highlightActiveLineGutter(),

    // 括号匹配
    bracketMatching(),

    // Markdown 语言支持 + 代码块语法高亮
    markdown({
      base: markdownLanguage,
      codeLanguages: languages,
    }),

    // 自动换行
    EditorView.lineWrapping,

    // 搜索功能
    search({
      top: true, // 搜索面板在顶部
    }),
    highlightSelectionMatches(), // 高亮匹配的选中文本

    // 完整主题（包含编辑器样式和语法高亮）
    themeCompartment.of(
      createCompleteTheme(settings.editorTheme, settings.fontSize, settings.fontFamily),
    ),

    // 只读模式（可动态切换）
    readOnlyCompartment.of(EditorState.readOnly.of(props.readonly)),

    // Tab 大小配置（可动态切换）
    tabSizeCompartment.of(createTabSizeExtension(settings.tabSize)),

    // 快捷键
    keymap.of([
      // ========== 自定义快捷键 (优先匹配) ==========

      // Ctrl+S 保存
      {
        key: 'Mod-s',
        run: () => {
          emit('save')
          return true
        },
      },

      // ========== Markdown 格式化快捷键 ==========

      // Ctrl+B: 粗体
      {
        key: 'Mod-b',
        run: (view) => wrapSelection(view, '**'),
      },

      // Ctrl+I: 斜体
      {
        key: 'Mod-i',
        run: (view) => wrapSelection(view, '*'),
      },

      // Ctrl+Shift+X: 删除线
      {
        key: 'Mod-Shift-x',
        run: (view) => wrapSelection(view, '~~'),
      },

      // Ctrl+`: 行内代码
      {
        key: 'Mod-`',
        run: (view) => wrapSelection(view, '`'),
      },

      // Ctrl+Shift+K: 代码块
      {
        key: 'Mod-Shift-k',
        run: (view) => insertCodeBlock(view),
      },

      // Ctrl+K: 插入链接
      {
        key: 'Mod-k',
        run: (view) => insertLink(view),
      },

      // Ctrl+Shift+I: 插入图片
      {
        key: 'Mod-Shift-i',
        run: (view) => insertImage(view),
      },

      // Ctrl+H: 打开替换面板 (search 扩展自带，但我们覆盖确保生效)
      {
        key: 'Mod-h',
        run: (view) => {
          openSearchPanel(view)
          return true
        },
      },

      // Tab 缩进 / Shift+Tab 减少缩进
      indentWithTab,

      // ========== 默认快捷键 ==========
      ...defaultKeymap,
      ...historyKeymap,
      ...searchKeymap, // 搜索快捷键 (Ctrl+F, Ctrl+G, etc.)
    ]),

    // 内容变化监听
    EditorView.updateListener.of((update) => {
      if (update.docChanged && !isInternalUpdate) {
        const newContent = update.state.doc.toString()
        emit('update:modelValue', newContent)
      }

      // 计算搜索结果数量
      const query = getSearchQuery(update.state)
      if (query && query.search) {
        let count = 0
        const cursor = query.getCursor(update.state)
        while (!cursor.next().done) {
          count++
        }
        emit('search-results', count)
      } else {
        emit('search-results', 0)
      }
    }),
  ]
}

/**
 * 创建 Tab 大小扩展
 * @param size Tab 空格数
 */
function createTabSizeExtension(size: number): Extension {
  return [
    // 缩进单位（用于 Tab 键缩进）
    indentUnit.of(' '.repeat(size)),
    // Tab 字符显示宽度
    EditorState.tabSize.of(size),
  ]
}

// ========== 生命周期 ==========

onMounted(async () => {
  if (!editorContainer.value) return

  // 确保设置已加载
  if (!settingStore.isLoaded) {
    await settingStore.loadSettings()
  }

  // 创建编辑器状态
  const state = EditorState.create({
    doc: props.modelValue,
    extensions: createExtensions(),
  })

  // 创建编辑器视图
  editorView.value = new EditorView({
    state,
    parent: editorContainer.value,
  })

  // 自动聚焦
  if (props.autofocus) {
    editorView.value.focus()
  }

  // 触发就绪事件
  emit('ready', editorView.value)

  // 监听滚动事件
  editorView.value.scrollDOM.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  // 销毁编辑器实例
  editorView.value?.destroy()
})

// ========== 响应式更新 ==========

// 监听外部 modelValue 变化
watch(
  () => props.modelValue,
  (newValue) => {
    if (!editorView.value) return

    const currentContent = editorView.value.state.doc.toString()
    if (newValue !== currentContent) {
      // 记录当前滚动位置
      const scrollDOM = editorView.value.scrollDOM
      const savedScrollTop = scrollDOM.scrollTop

      isInternalUpdate = true
      editorView.value.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: newValue,
        },
      })

      // 恢复滚动位置 (使用 setTimeout 确保 DOM 更新后执行)
      setTimeout(() => {
        if (editorView.value) {
          editorView.value.scrollDOM.scrollTop = savedScrollTop
        }
      }, 0)

      isInternalUpdate = false
    }
  },
)

// 监听只读状态变化
watch(
  () => props.readonly,
  (newValue) => {
    if (!editorView.value) return

    editorView.value.dispatch({
      effects: readOnlyCompartment.reconfigure(EditorState.readOnly.of(newValue)),
    })
  },
)

// 监听设置变化：主题、字体大小、字体家族
watch(
  [
    () => settingStore.settings.editorTheme,
    () => settingStore.settings.fontSize,
    () => settingStore.settings.fontFamily,
  ],
  ([newTheme, newFontSize, newFontFamily]) => {
    if (!editorView.value) return

    console.log('[MemoEditor] 主题/字体设置变化:', {
      theme: newTheme,
      fontSize: newFontSize,
      fontFamily: newFontFamily,
    })
    editorView.value.dispatch({
      effects: themeCompartment.reconfigure(
        createCompleteTheme(newTheme, newFontSize, newFontFamily),
      ),
    })
  },
)

// 监听设置变化：行号显示
watch(
  () => settingStore.settings.showLineNumbers,
  (showLineNumbers) => {
    if (!editorView.value) return

    console.log('[MemoEditor] 行号显示变化:', showLineNumbers)
    editorView.value.dispatch({
      effects: lineNumbersCompartment.reconfigure(showLineNumbers ? lineNumbers() : []),
    })
  },
)

// 监听设置变化：Tab 大小
watch(
  () => settingStore.settings.tabSize,
  (newTabSize) => {
    if (!editorView.value) return

    console.log('[MemoEditor] Tab 大小变化:', newTabSize)
    editorView.value.dispatch({
      effects: tabSizeCompartment.reconfigure(createTabSizeExtension(newTabSize)),
    })
  },
)

// ========== 暴露方法 ==========

/**
 * 聚焦编辑器
 */
function focus(): void {
  editorView.value?.focus()
}

/**
 * 获取当前内容
 */
function getContent(): string {
  return editorView.value?.state.doc.toString() ?? ''
}

/**
 * 插入文本到光标位置
 */
function insertText(text: string): void {
  if (!editorView.value) return

  const { from } = editorView.value.state.selection.main
  editorView.value.dispatch({
    changes: { from, insert: text },
  })
}

/**
 * 处理滚动事件
 */
function handleScroll(e: Event): void {
  const target = e.target as HTMLElement
  if (!target) return

  const { scrollTop, scrollHeight, clientHeight } = target
  const maxScroll = scrollHeight - clientHeight
  const percentage = maxScroll > 0 ? scrollTop / maxScroll : 0

  emit('scroll', percentage)
}

/**
 * 滚动到指定位置
 * @param percentage 滚动百分比 (0-1)
 */
function scrollToPercentage(percentage: number): void {
  if (!editorView.value) return

  const scrollDOM = editorView.value.scrollDOM
  const { scrollHeight, clientHeight } = scrollDOM
  const maxScroll = scrollHeight - clientHeight

  // 使用 scrollTo 以支持平滑滚动（如果需要）
  scrollDOM.scrollTop = maxScroll * percentage
}

defineExpose({
  focus,
  getContent,
  insertText,
  editorView,
  scrollToPercentage,
})
</script>

<template>
  <div class="memo-editor" :style="{ backgroundColor: editorBackground }">
    <div ref="editorContainer" class="editor-container" />
  </div>
</template>

<style scoped>
.memo-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background-color: var(--color-bg-editor, #1e1e2e);
  border-radius: 8px;
  overflow: hidden;
  transition: background-color 1s ease;
}

.editor-container {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 确保 CodeMirror 填满容器 */
.editor-container :deep(.cm-editor) {
  height: 100%;
}

/* ========== 搜索面板样式 ========== */
.editor-container :deep(.cm-search) {
  background: var(--color-bg-surface, #181825);
  border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  padding: 8px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 13px;
}

.editor-container :deep(.cm-search input),
.editor-container :deep(.cm-search input[type="text"]) {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.15));
  border-radius: 6px;
  color: var(--color-text-primary, #cdd6f4);
  padding: 6px 10px;
  font-size: 13px;
  outline: none;
  transition: all 0.2s ease;
}

.editor-container :deep(.cm-search input:focus) {
  border-color: var(--color-accent, #00ff88);
  background: rgba(0, 255, 136, 0.05);
}

.editor-container :deep(.cm-search button),
.editor-container :deep(.cm-search .cm-button) {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: 6px;
  color: var(--color-text-secondary, #a6adc8);
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.editor-container :deep(.cm-search button:hover),
.editor-container :deep(.cm-search .cm-button:hover) {
  background: rgba(255, 255, 255, 0.15);
  color: var(--color-text-primary, #cdd6f4);
}

.editor-container :deep(.cm-search label) {
  color: var(--color-text-secondary, #a6adc8);
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.editor-container :deep(.cm-search br) {
  display: none;
}

/* 高亮匹配项 */
/* 高亮匹配项 */
.editor-container :deep(.cm-selectionMatch) {
  background-color: rgba(0, 255, 136, 0.25) !important;
  border-bottom: 2px solid rgba(0, 255, 136, 0.5);
}

.editor-container :deep(.cm-searchMatch) {
  background-color: rgba(255, 235, 59, 0.5) !important;
  /* 亮黄色 */
  /* 使用 box-shadow 扩展背景范围，确保覆盖大字体 */
  box-shadow: 0 0 0 1px rgba(255, 235, 59, 0.5);
  border-radius: 2px;
  color: inherit !important;
}

.editor-container :deep(.cm-searchMatch-selected) {
  background-color: #ff5722 !important;
  /* 醒目的深橙色 */
  color: #ffffff !important;
  /* 强制白字 */
  /* 使用 box-shadow 扩展背景范围 (2px) 并添加发光效果 */
  box-shadow: 0 0 0 2px #ff5722, 0 0 8px rgba(255, 87, 34, 0.6);
  border-radius: 3px;
  font-weight: bold;
  z-index: 10;
}
</style>
