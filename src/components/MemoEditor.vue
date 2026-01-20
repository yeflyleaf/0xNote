<!-- src/components/MemoEditor.vue -->
<!--
  📝 核心 Markdown 编辑器组件

  【设计原则】
  1. 组件只负责 UI 渲染和用户交互
  2. 不直接进行文件 I/O，通过 emit 将内容变化传出
  3. 对外暴露统一的 Props 和 Events，内部实现细节黑盒化

  【鸿蒙迁移指南】
  迁移时替换此组件为鸿蒙原生 TextArea + RichText 组件即可，
  保持 modelValue 双向绑定接口不变，外部逻辑无需修改。
-->
<script setup lang="ts">
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { bracketMatching, defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { Compartment, EditorState } from '@codemirror/state'
import { oneDark } from '@codemirror/theme-one-dark'
import {
    EditorView,
    highlightActiveLine,
    highlightActiveLineGutter,
    keymap,
    lineNumbers,
} from '@codemirror/view'
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'

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
}>()

// ========== 编辑器实例 ==========

/** 编辑器容器 DOM 引用 */
const editorContainer = ref<HTMLDivElement | null>(null)

/** 编辑器视图实例 */
const editorView = shallowRef<EditorView | null>(null)

/** 只读模式隔间（用于动态切换） */
const readOnlyCompartment = new Compartment()

/** 是否正在内部更新（防止循环更新） */
let isInternalUpdate = false

// ========== 编辑器配置 ==========

/**
 * 创建编辑器扩展配置
 */
function createExtensions() {
  return [
    // 行号
    lineNumbers(),

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

    // 语法高亮样式
    syntaxHighlighting(defaultHighlightStyle),

    // 暗色主题
    oneDark,

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

    // 编辑器主题样式
    EditorView.theme({
      '&': {
        height: '100%',
        fontSize: '14px',
        fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      },
      '.cm-content': {
        padding: '16px 0',
        caretColor: '#00ff88',
      },
      '.cm-gutters': {
        backgroundColor: 'transparent',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
      },
      '.cm-activeLine': {
        backgroundColor: 'rgba(0, 255, 136, 0.05)',
      },
      '.cm-scroller': {
        overflow: 'auto',
      },
    }),
  ]
}

// ========== 生命周期 ==========

onMounted(() => {
  if (!editorContainer.value) return

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
      isInternalUpdate = true
      editorView.value.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: newValue,
        },
      })
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

defineExpose({
  focus,
  getContent,
  insertText,
  editorView,
})
</script>

<template>
  <div class="memo-editor">
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
