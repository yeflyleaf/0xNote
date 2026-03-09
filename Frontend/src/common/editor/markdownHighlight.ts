// src/common/editor/markdownHighlight.ts
/**
 * 📝 VS Code 风格的 Markdown 语法高亮配置
 *
 * 【设计目标】
 * 复刻 VS Code 默认 Dark+ 主题的 Markdown 高亮配色
 *
 * 【配色参考】
 * - 标题 (Heading): #569CD6 (蓝色)
 * - 强调/粗体 (Bold): #CE9178 (橙棕色)
 * - 斜体 (Italic): #4EC9B0 (青绿色)
 * - 链接 (Link): #4FC1FF (亮蓝色)
 * - 代码 (Code): #CE9178 (橙色)
 * - 引用 (Quote): #6A9955 (绿色)
 * - 列表标记: #D4D4D4 (浅灰)
 * - 元字符 (如 #, *, `): #808080 (灰色)
 */

import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

/**
 * VS Code Dark+ 主题配色常量
 */
const VSCodeColors = {
    // 蓝色系
    blue: '#569CD6', // 关键字、标题
    lightBlue: '#4FC1FF', // 链接
    darkBlue: '#264F78', // 选中背景

    // 绿色系
    green: '#6A9955', // 注释、引用
    teal: '#4EC9B0', // 类型、斜体

    // 橙色系
    orange: '#CE9178', // 字符串、粗体
    lightOrange: '#D7BA7D', // 正则表达式

    // 紫色系
    purple: '#C586C0', // 控制关键字

    // 黄色系
    yellow: '#DCDCAA', // 函数

    // 灰色系
    gray: '#808080', // 元字符
    lightGray: '#D4D4D4', // 普通文本
    whiteGray: '#9CDCFE', // 变量

    // 红色系
    red: '#F44747', // 错误
} as const

/**
 * VS Code 风格的 Markdown 语法高亮样式
 *
 * @description
 * 此样式表匹配 CodeMirror 的 Markdown 语法树标签，
 * 为不同的 Markdown 元素应用 VS Code 风格的颜色
 */
export const vscodeMarkdownHighlightStyle = HighlightStyle.define([
    // ========== 标题 (Headings) ==========
    // # 一级标题 到 ###### 六级标题
    {
        tag: t.heading1,
        color: VSCodeColors.blue,
        fontWeight: 'bold',
        fontSize: '1.6em',
    },
    {
        tag: t.heading2,
        color: VSCodeColors.blue,
        fontWeight: 'bold',
        fontSize: '1.4em',
    },
    {
        tag: t.heading3,
        color: VSCodeColors.blue,
        fontWeight: 'bold',
        fontSize: '1.2em',
    },
    {
        tag: t.heading4,
        color: VSCodeColors.blue,
        fontWeight: 'bold',
        fontSize: '1.1em',
    },
    {
        tag: t.heading5,
        color: VSCodeColors.blue,
        fontWeight: 'bold',
    },
    {
        tag: t.heading6,
        color: VSCodeColors.blue,
        fontWeight: 'bold',
    },

    // 标题标记符号 (#) - 使用 processingInstruction 或 meta
    {
        tag: t.processingInstruction,
        color: VSCodeColors.gray,
    },

    // ========== 强调 (Emphasis) ==========
    // **粗体**
    {
        tag: t.strong,
        color: VSCodeColors.orange,
        fontWeight: 'bold',
    },

    // *斜体*
    {
        tag: t.emphasis,
        color: VSCodeColors.teal,
        fontStyle: 'italic',
    },

    // ~~删除线~~
    {
        tag: t.strikethrough,
        textDecoration: 'line-through',
        color: VSCodeColors.gray,
    },

    // ========== 链接 (Links) ==========
    // [链接文本](url)
    {
        tag: t.link,
        color: VSCodeColors.lightBlue,
        textDecoration: 'underline',
    },

    // URL 部分
    {
        tag: t.url,
        color: VSCodeColors.teal,
    },

    // ========== 引用 (Blockquote) ==========
    // > 引用文本
    {
        tag: t.quote,
        color: VSCodeColors.green,
        fontStyle: 'italic',
    },

    // ========== 代码 (Code) ==========
    // `行内代码`
    {
        tag: t.monospace,
        color: VSCodeColors.orange,
        fontFamily: 'Consolas, "Courier New", monospace',
    },

    // ========== 元字符和标记 ==========
    // 特殊标记符号 (如 #, *, `, > 等)
    {
        tag: t.meta,
        color: VSCodeColors.gray,
    },

    // 转义字符
    {
        tag: t.escape,
        color: VSCodeColors.lightOrange,
    },

    // 内容分隔符 (---)
    {
        tag: t.contentSeparator,
        color: VSCodeColors.gray,
    },

    // ========== 内嵌代码块中的语法高亮 ==========
    // 关键字
    {
        tag: t.keyword,
        color: VSCodeColors.purple,
    },

    // 操作符
    {
        tag: t.operator,
        color: VSCodeColors.lightGray,
    },

    // 注释
    {
        tag: t.comment,
        color: VSCodeColors.green,
        fontStyle: 'italic',
    },

    // 字符串
    {
        tag: t.string,
        color: VSCodeColors.orange,
    },

    // 数字
    {
        tag: t.number,
        color: '#B5CEA8',
    },

    // 布尔值/特殊值
    {
        tag: t.bool,
        color: VSCodeColors.blue,
    },

    // 函数名
    {
        tag: t.function(t.variableName),
        color: VSCodeColors.yellow,
    },

    // 类名
    {
        tag: t.className,
        color: VSCodeColors.teal,
    },

    // 类型名
    {
        tag: t.typeName,
        color: VSCodeColors.teal,
    },

    // 属性名
    {
        tag: t.propertyName,
        color: VSCodeColors.whiteGray,
    },

    // 变量名
    {
        tag: t.variableName,
        color: VSCodeColors.whiteGray,
    },

    // 定义
    {
        tag: t.definition(t.variableName),
        color: VSCodeColors.whiteGray,
    },

    // 标签名 (HTML/XML)
    {
        tag: t.tagName,
        color: VSCodeColors.blue,
    },

    // 属性名 (HTML/XML)
    {
        tag: t.attributeName,
        color: VSCodeColors.whiteGray,
    },

    // 属性值 (HTML/XML)
    {
        tag: t.attributeValue,
        color: VSCodeColors.orange,
    },

    // ========== 错误 ==========
    {
        tag: t.invalid,
        color: VSCodeColors.red,
    },
])

/**
 * 导出 CodeMirror 扩展，可直接在编辑器配置中使用
 */
export const vscodeMarkdownHighlight = syntaxHighlighting(vscodeMarkdownHighlightStyle)
