// src/common/editor/themes.ts
/**
 * 🎨 编辑器主题定义
 *
 * 【设计原则】
 * 1. 所有主题必须确保文字与背景有足够对比度
 * 2. 编辑器和预览区域使用相同的主题配色
 * 3. 语法高亮颜色需要清晰可辨
 *
 * 【主题结构】
 * 每个主题包含：
 * - 背景色、文字色
 * - 边框色、强调色
 * - Markdown 语法高亮配色
 */

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags as t } from '@lezer/highlight'

/**
 * 主题配色接口
 */
export interface ThemeColors {
  // 基础色
  background: string
  foreground: string
  caret: string
  selection: string
  selectionBackground: string
  lineHighlight: string
  gutterBackground: string
  gutterForeground: string
  gutterBorder: string

  // 强调色
  accent: string
  accentDim: string

  // 语法高亮色
  heading: string
  bold: string
  italic: string
  link: string
  code: string
  codeBackground: string
  quote: string
  listMarker: string
  meta: string

  // 代码语法高亮
  keyword: string
  string: string
  number: string
  comment: string
  function: string
  variable: string
  type: string
  operator: string
  error: string
}

/**
 * 主题定义接口
 */
export interface ThemeDefinition {
  id: string
  name: string
  description: string
  isDark: boolean
  colors: ThemeColors
}

// ========== 主题预设 ==========

/**
 * 🌑 极夜黑 (默认深色主题)
 * 基于极简黑色 + 霓虹绿强调色
 */
const darkNeonTheme: ThemeDefinition = {
  id: 'dark-neon',
  name: '🌑 极夜黑',
  description: '深邃极致的黑色搭配霓虹绿',
  isDark: true,
  colors: {
    // 基础色
    background: '#0a0a0a',
    foreground: '#e5e5e5',
    caret: '#00ff88',
    selection: '#00ff88',
    selectionBackground: 'rgba(0, 255, 136, 0.2)',
    lineHighlight: 'rgba(0, 255, 136, 0.08)',
    gutterBackground: '#0a0a0a',
    gutterForeground: '#525252',
    gutterBorder: 'rgba(255, 255, 255, 0.08)',

    // 强调色
    accent: '#00ff88',
    accentDim: 'rgba(0, 255, 136, 0.3)',

    // 语法高亮色
    heading: '#89b4fa',
    bold: '#fab387',
    italic: '#94e2d5',
    link: '#89dceb',
    code: '#fab387',
    codeBackground: 'rgba(250, 179, 135, 0.1)',
    quote: '#a6e3a1',
    listMarker: '#00ff88',
    meta: '#6c7086',

    // 代码语法高亮
    keyword: '#cba6f7',
    string: '#a6e3a1',
    number: '#fab387',
    comment: '#6c7086',
    function: '#f9e2af',
    variable: '#89dceb',
    type: '#94e2d5',
    operator: '#89b4fa',
    error: '#f38ba8',
  },
}

/**
 * 🌙 深空蓝 (经典深色主题)
 * 纯净的深蓝色调，减少紫色干扰
 */
const darkBlueTheme: ThemeDefinition = {
  id: 'dark-blue',
  name: '🌙 深空蓝',
  description: '纯净的深蓝色调',
  isDark: true,
  colors: {
    // 基础色
    background: '#232731', // 更浅一点的深蓝背景
    foreground: '#dcdfe4',
    caret: '#528bff',
    selection: '#3e4451',
    selectionBackground: 'rgba(62, 68, 81, 0.5)',
    lineHighlight: 'rgba(50, 56, 66, 0.5)',
    gutterBackground: '#232731',
    gutterForeground: '#636d83',
    gutterBorder: 'rgba(255, 255, 255, 0.05)',

    // 强调色
    accent: '#61afef',
    accentDim: 'rgba(97, 175, 239, 0.2)',

    // 语法高亮色
    heading: '#61afef', // 蓝色标题
    bold: '#e5c07b', // 金色粗体
    italic: '#98c379', // 绿色斜体
    link: '#56b6c2', // 青色链接
    code: '#e06c75', // 红色代码
    codeBackground: 'rgba(224, 108, 117, 0.1)',
    quote: '#98c379', // 绿色引用
    listMarker: '#61afef',
    meta: '#abb2bf',

    // 代码语法高亮
    keyword: '#61afef', // 还是保留一点紫，但整体偏蓝。或者改为蓝色？用户说不要类似紫色。改为 #61afef 蓝色
    string: '#98c379',
    number: '#d19a66',
    comment: '#7f848e',
    function: '#61afef', // 蓝色函数
    variable: '#e06c75',
    type: '#e5c07b',
    operator: '#56b6c2',
    error: '#f44747',
  },
}

/**
 *  深岩灰 (灰色系主题)
 * 沉稳内敛的深灰色调
 */
const deepGrayTheme: ThemeDefinition = {
  id: 'deep-gray',
  name: '� 深岩灰',
  description: '沉稳内敛的深灰色调',
  isDark: true,
  colors: {
    // 基础色
    background: '#242424',
    foreground: '#d4d4d4',
    caret: '#d4d4d4',
    selection: '#404040',
    selectionBackground: 'rgba(64, 64, 64, 0.5)',
    lineHighlight: 'rgba(255, 255, 255, 0.03)',
    gutterBackground: '#242424',
    gutterForeground: '#6e6e6e',
    gutterBorder: 'rgba(255, 255, 255, 0.05)',

    // 强调色
    accent: '#a6a6a6',
    accentDim: 'rgba(166, 166, 166, 0.2)',

    // 语法高亮色
    heading: '#d4d4d4',
    bold: '#e5e5e5',
    italic: '#a6a6a6',
    link: '#9cdcfe',
    code: '#ce9178',
    codeBackground: 'rgba(206, 145, 120, 0.05)',
    quote: '#808080',
    listMarker: '#a6a6a6',
    meta: '#6e6e6e',

    // 代码语法高亮
    keyword: '#c586c0',
    string: '#ce9178',
    number: '#b5cea8',
    comment: '#6a9955',
    function: '#dcdcaa',
    variable: '#9cdcfe',
    type: '#4ec9b0',
    operator: '#d4d4d4',
    error: '#f44747',
  },
}

/**
 * ☀️ 清晨白 (亮色主题)
 * GitHub 风格亮色主题
 */
const lightMorningTheme: ThemeDefinition = {
  id: 'light-morning',
  name: '☀️ 清晨白',
  description: 'GitHub 风格亮色主题',
  isDark: false,
  colors: {
    // 基础色
    background: '#ffffff',
    foreground: '#24292f',
    caret: '#0550ae',
    selection: '#0550ae',
    selectionBackground: 'rgba(5, 80, 174, 0.2)',
    lineHighlight: 'rgba(5, 80, 174, 0.05)',
    gutterBackground: '#f6f8fa',
    gutterForeground: '#6e7781',
    gutterBorder: '#d0d7de',

    // 强调色
    accent: '#0550ae',
    accentDim: 'rgba(5, 80, 174, 0.2)',

    // 语法高亮色
    heading: '#0550ae',
    bold: '#953800',
    italic: '#116329',
    link: '#0969da',
    code: '#953800',
    codeBackground: 'rgba(149, 56, 0, 0.08)',
    quote: '#57606a',
    listMarker: '#0550ae',
    meta: '#6e7781',

    // 代码语法高亮
    keyword: '#cf222e',
    string: '#0a3069',
    number: '#0550ae',
    comment: '#6e7781',
    function: '#8250df',
    variable: '#953800',
    type: '#116329',
    operator: '#24292f',
    error: '#cf222e',
  },
}

/**
 * 🌿 自然绿 (护眼亮色主题)
 */
const lightNatureTheme: ThemeDefinition = {
  id: 'light-nature',
  name: '🌿 自然绿',
  description: '护眼自然色系亮色主题',
  isDark: false,
  colors: {
    // 基础色
    background: '#f5f5f0',
    foreground: '#3d3d3d',
    caret: '#2d8f2d',
    selection: '#2d8f2d',
    selectionBackground: 'rgba(45, 143, 45, 0.2)',
    lineHighlight: 'rgba(45, 143, 45, 0.05)',
    gutterBackground: '#eaebe6',
    gutterForeground: '#7a7a6d',
    gutterBorder: '#d5d5c8',

    // 强调色
    accent: '#2d8f2d',
    accentDim: 'rgba(45, 143, 45, 0.2)',

    // 语法高亮色
    heading: '#2d8f2d',
    bold: '#b35900',
    italic: '#1a6b5c',
    link: '#1565c0',
    code: '#9c4221',
    codeBackground: 'rgba(156, 66, 33, 0.08)',
    quote: '#527a52',
    listMarker: '#2d8f2d',
    meta: '#7a7a6d',

    // 代码语法高亮
    keyword: '#8f2d8f',
    string: '#527a52',
    number: '#b35900',
    comment: '#7a7a6d',
    function: '#1565c0',
    variable: '#9c4221',
    type: '#1a6b5c',
    operator: '#5c5c5c',
    error: '#cc2936',
  },
}

/**
 * 🌅 暖橙日落 (温暖亮色主题)
 */
const lightSunsetTheme: ThemeDefinition = {
  id: 'light-sunset',
  name: '🌅 日落橙',
  description: '温暖舒适的暖色调主题',
  isDark: false,
  colors: {
    // 基础色
    background: '#fdf6e3',
    foreground: '#073642',
    caret: '#cb4b16',
    selection: '#cb4b16',
    selectionBackground: 'rgba(203, 75, 22, 0.2)',
    lineHighlight: 'rgba(203, 75, 22, 0.05)',
    gutterBackground: '#f5eed6',
    gutterForeground: '#93a1a1',
    gutterBorder: '#eee8d5',

    // 强调色
    accent: '#cb4b16',
    accentDim: 'rgba(203, 75, 22, 0.2)',

    // 语法高亮色
    heading: '#268bd2',
    bold: '#d33682',
    italic: '#2aa198',
    link: '#268bd2',
    code: '#cb4b16',
    codeBackground: 'rgba(203, 75, 22, 0.08)',
    quote: '#859900',
    listMarker: '#cb4b16',
    meta: '#93a1a1',

    // 代码语法高亮
    keyword: '#859900',
    string: '#2aa198',
    number: '#d33682',
    comment: '#93a1a1',
    function: '#268bd2',
    variable: '#b58900',
    type: '#cb4b16',
    operator: '#657b83',
    error: '#dc322f',
  },
}

// ========== 主题集合 ==========

/**
 * 所有可用主题
 */
export const AVAILABLE_THEMES: ThemeDefinition[] = [
  darkNeonTheme,
  darkBlueTheme,
  deepGrayTheme,
  lightMorningTheme,
  lightNatureTheme,
  lightSunsetTheme,
]

/**
 * 默认主题 ID
 */
export const DEFAULT_THEME_ID = 'dark-neon'

/**
 * 根据 ID 获取主题
 */
export function getThemeById(id: string): ThemeDefinition {
  return AVAILABLE_THEMES.find((theme) => theme.id === id) ?? darkNeonTheme
}

// ========== CodeMirror 主题生成 ==========

/**
 * 根据主题配色创建 CodeMirror 编辑器主题
 */
export function createEditorTheme(colors: ThemeColors, fontSize: number, fontFamily: string) {
  return EditorView.theme(
    {
      '&': {
        height: '100%',
        fontSize: `${fontSize}px`,
        fontFamily: fontFamily,
        backgroundColor: 'transparent',
        color: colors.foreground,
        transition: 'color 1s ease',
      },
      '.cm-content': {
        padding: '16px 0',
        caretColor: colors.caret,
      },
      '.cm-cursor': {
        borderLeftColor: colors.caret,
      },
      '.cm-selectionBackground': {
        backgroundColor: `${colors.selectionBackground} !important`,
      },
      '&.cm-focused .cm-selectionBackground': {
        backgroundColor: `${colors.selectionBackground} !important`,
      },
      '.cm-gutters': {
        backgroundColor: 'transparent',
        borderRight: `1px solid ${colors.gutterBorder}`,
        color: colors.gutterForeground,
        transition: 'border-color 1s ease, color 1s ease',
      },
      '.cm-activeLineGutter': {
        backgroundColor: colors.lineHighlight,
        color: colors.accent,
      },
      '.cm-activeLine': {
        backgroundColor: colors.lineHighlight,
      },
      '.cm-scroller': {
        overflow: 'auto',
      },
      '.cm-line': {
        padding: '0 16px',
      },
    },
    { dark: true },
  )
}

/**
 * 根据主题配色创建语法高亮样式
 */
export function createHighlightStyle(colors: ThemeColors) {
  return HighlightStyle.define([
    // ========== 标题 ==========
    {
      tag: t.heading1,
      color: colors.heading,
      fontWeight: 'bold',
      fontSize: '1.6em',
    },
    {
      tag: t.heading2,
      color: colors.heading,
      fontWeight: 'bold',
      fontSize: '1.4em',
    },
    {
      tag: t.heading3,
      color: colors.heading,
      fontWeight: 'bold',
      fontSize: '1.2em',
    },
    {
      tag: t.heading4,
      color: colors.heading,
      fontWeight: 'bold',
      fontSize: '1.1em',
    },
    {
      tag: t.heading5,
      color: colors.heading,
      fontWeight: 'bold',
    },
    {
      tag: t.heading6,
      color: colors.heading,
      fontWeight: 'bold',
    },

    // ========== 强调 ==========
    {
      tag: t.strong,
      color: colors.bold,
      fontWeight: 'bold',
    },
    {
      tag: t.emphasis,
      color: colors.italic,
      fontStyle: 'italic',
    },
    {
      tag: t.strikethrough,
      textDecoration: 'line-through',
      color: colors.meta,
    },

    // ========== 链接 ==========
    {
      tag: t.link,
      color: colors.link,
      textDecoration: 'underline',
    },
    {
      tag: t.url,
      color: colors.link,
    },

    // ========== 引用 ==========
    {
      tag: t.quote,
      color: colors.quote,
      fontStyle: 'italic',
    },

    // ========== 代码 ==========
    {
      tag: t.monospace,
      color: colors.code,
      fontFamily: 'Consolas, "Courier New", monospace',
    },

    // ========== 元字符 ==========
    {
      tag: t.meta,
      color: colors.meta,
    },
    {
      tag: t.processingInstruction,
      color: colors.meta,
    },
    {
      tag: t.contentSeparator,
      color: colors.meta,
    },

    // ========== 代码块语法高亮 ==========
    {
      tag: t.keyword,
      color: colors.keyword,
    },
    {
      tag: t.operator,
      color: colors.operator,
    },
    {
      tag: t.comment,
      color: colors.comment,
      fontStyle: 'italic',
    },
    {
      tag: t.string,
      color: colors.string,
    },
    {
      tag: t.number,
      color: colors.number,
    },
    {
      tag: t.bool,
      color: colors.keyword,
    },
    {
      tag: t.function(t.variableName),
      color: colors.function,
    },
    {
      tag: t.className,
      color: colors.type,
    },
    {
      tag: t.typeName,
      color: colors.type,
    },
    {
      tag: t.propertyName,
      color: colors.variable,
    },
    {
      tag: t.variableName,
      color: colors.variable,
    },
    {
      tag: t.definition(t.variableName),
      color: colors.variable,
    },
    {
      tag: t.tagName,
      color: colors.keyword,
    },
    {
      tag: t.attributeName,
      color: colors.variable,
    },
    {
      tag: t.attributeValue,
      color: colors.string,
    },
    {
      tag: t.invalid,
      color: colors.error,
    },
  ])
}

/**
 * 创建完整的 CodeMirror 主题扩展
 */
export function createCompleteTheme(themeId: string, fontSize: number, fontFamily: string) {
  const theme = getThemeById(themeId)
  const editorTheme = createEditorTheme(theme.colors, fontSize, fontFamily)
  const highlightStyle = createHighlightStyle(theme.colors)

  return [editorTheme, syntaxHighlighting(highlightStyle)]
}

/**
 * 生成预览区域的 CSS 变量
 */
export function generatePreviewCssVars(themeId: string): Record<string, string> {
  const theme = getThemeById(themeId)
  const c = theme.colors

  return {
    '--preview-bg': c.background,
    '--preview-text': c.foreground,
    '--preview-text-muted': c.meta,
    '--preview-accent': c.accent,
    '--preview-accent-dim': c.accentDim,
    '--preview-heading': c.heading,
    '--preview-bold': c.bold,
    '--preview-italic': c.italic,
    '--preview-link': c.link,
    '--preview-code': c.code,
    '--preview-code-bg': c.codeBackground,
    '--preview-quote': c.quote,
    '--preview-quote-bg': c.accentDim,
    '--preview-border': c.gutterBorder,
    '--preview-selection': c.selectionBackground,
  }
}
