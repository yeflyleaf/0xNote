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
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { bracketMatching } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { Compartment, EditorState } from '@codemirror/state'
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

/** 是否正在内部更新（防止循环更新） */
let isInternalUpdate = false

// ========== 计算属性 ==========

/** 当前主题的背景色 */
const editorBackground = computed(() => {
  const theme = getThemeById(settingStore.settings.editorTheme)
  return theme.colors.background
})

// ========== 编辑器配置 ==========

/**
 * 创建编辑器扩展配置
 */
function createExtensions() {
  const settings = settingStore.settings

  return [
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

    // 完整主题（包含编辑器样式和语法高亮）
    themeCompartment.of(
      createCompleteTheme(settings.editorTheme, settings.fontSize, settings.fontFamily),
    ),

    // 只读模式（可动态切换）
    readOnlyCompartment.of(EditorState.readOnly.of(props.readonly)),

    // 快捷键
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      // Ctrl+S 保存
      {
        key: 'Mod-s',
        run: () => {
          emit('save')
          return true
        },
      },
    ]),

    // 内容变化监听
    EditorView.updateListener.of((update) => {
      if (update.docChanged && !isInternalUpdate) {
        const newContent = update.state.doc.toString()
        emit('update:modelValue', newContent)
      }
    }),
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
</style>
