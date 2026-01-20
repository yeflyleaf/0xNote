# 🚀 0xNote

> 轻量级 Markdown 编辑器 | Windows 右键菜单集成 | 实时预览 | 专业代码高亮

![Vue 3](https://img.shields.io/badge/Vue-3-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Electron](https://img.shields.io/badge/Electron-40-orange)

## ✨ 特性

- 🎨 **专业级代码高亮** - 基于 CodeMirror 6，支持 100+ 编程语言
- 👁️ **实时预览** - 双栏分屏，左侧编写右侧预览，所见即所得
- ⚡ **极速启动** - 轻量级设计，秒开体验
- 🖱️ **右键菜单集成** - 像新建 `.txt` 一样一键创建 Markdown
- 💾 **智能自动保存** - 防抖保存，永不丢失
- ⚙️ **个性化设置** - 字体、主题、自动保存等可自定义
- 🌙 **深色/亮色主题** - 护眼设计，基于 Catppuccin 色板
- 🔌 **跨平台架构** - 已为鸿蒙迁移做好准备

## 📸 功能预览

### 视图模式

- **分栏模式** - 左侧编辑器 + 右侧实时预览
- **仅编辑模式** - 全屏编辑器，专注书写
- **仅预览模式** - 全屏预览，阅读体验

### 设置面板

- 字体大小 (12-24px)
- 字体家族选择
- 主题切换 (暗色/亮色)
- 自动保存开关及延迟配置

## 📁 项目结构

```
src/
├── common/                 # 🌐 跨平台通用代码
│   └── types/              # TypeScript 接口定义
│       ├── config.ts       # IConfigService 配置服务接口
│       ├── filesystem.ts   # IFileSystem 文件系统接口
│       ├── system-menu.ts  # ISystemMenu 系统菜单接口
│       └── index.ts        # 统一导出
│
├── platforms/              # 💻 平台特定实现
│   ├── adapter.ts          # 平台适配器（核心枢纽）
│   ├── windows/            # Windows 平台实现
│   │   ├── WindowsConfigService.ts
│   │   ├── WindowsFileSystem.ts
│   │   ├── WindowsSystemMenu.ts
│   │   └── index.ts
│   └── harmony/            # 鸿蒙平台实现（占位符）
│       ├── HarmonyConfigService.ts
│       ├── HarmonyFileSystem.ts
│       ├── HarmonySystemMenu.ts
│       └── components/     # 鸿蒙组件接口定义
│
├── components/             # 🧩 Vue 组件
│   ├── MemoEditor.vue      # 核心 Markdown 编辑器
│   ├── MemoPreview.vue     # Markdown 实时预览
│   ├── SettingsModal.vue   # 设置模态框
│   ├── TitleBar.vue        # 标题栏 + 状态指示
│   ├── StatusBar.vue       # 底部状态栏
│   └── index.ts
│
├── stores/                 # 🗃️ Pinia 状态管理
│   ├── fileStore.ts        # 文件状态 + 自动保存
│   ├── appStore.ts         # 应用全局状态 + 视图模式
│   ├── settingStore.ts     # 设置状态管理
│   └── index.ts
│
├── assets/
│   └── styles/
│       └── index.css       # 全局样式 + 设计令牌
│
├── App.vue                 # 主应用组件（分栏布局）
└── main.ts                 # 应用入口

electron/
├── main.ts                 # Electron 主进程
├── preload.ts              # 预加载脚本
└── registry.ts             # Windows 注册表操作

build/
└── installer.nsh           # NSIS 安装脚本

docs/
└── RELEASE_CHECKLIST.md    # 发布验收清单
```

## 🛠️ 技术栈

| 分类     | 技术                                 |
| -------- | ------------------------------------ |
| 框架     | Vue 3 (Composition API) + TypeScript |
| 构建     | Vite 7                               |
| 状态管理 | Pinia 3                              |
| 样式     | TailwindCSS 4                        |
| 编辑器   | CodeMirror 6                         |
| Markdown | markdown-it + DOMPurify              |
| 桌面化   | Electron 40                          |
| 安装程序 | electron-builder + NSIS              |

## 🚦 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器 (仅 Web)
npm run dev

# 启动 Electron 开发模式
npm run electron:dev

# 类型检查
npm run type-check

# 构建生产版本
npm run build
```

## 📦 构建与发布

```bash
# 构建 Windows 安装包 (exe)
npm run build:win

# 构建 macOS 安装包 (dmg)
npm run build:mac

# 构建 Linux 安装包 (AppImage/deb)
npm run build:linux

# 构建所有平台
npm run build:all
```

构建产物将输出到 `release/` 目录。

## 🖱️ Windows 集成

安装后自动集成：

1. **文件关联** - 双击 `.md` 文件用 0xNote 打开
2. **右键菜单 (文件夹空白处)** - "新建 Markdown 笔记"
3. **右键菜单 (.md 文件)** - "使用 0xNote 编辑"

## 🏗️ 架构设计理念

### 逻辑与视图分离

所有业务逻辑通过 **接口 (Interface)** 抽象，平台实现与 UI 完全解耦：

```
┌─────────────────────────────────────────────────────────┐
│                     Vue Components                      │
│         (MemoEditor, MemoPreview, Settings...)          │
└───────────────────────────┬─────────────────────────────┘
                            │ 调用
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Pinia Stores                         │
│         (fileStore, appStore, settingStore)             │
└───────────────────────────┬─────────────────────────────┘
                            │ 依赖接口
                            ▼
┌─────────────────────────────────────────────────────────┐
│               Platform Adapter                           │
│          (运行时检测平台，返回实现)                        │
└───────────────────────────┬─────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
    ┌───────────┐     ┌───────────┐     ┌───────────┐
    │  Windows  │     │  Harmony  │     │   Web     │
    │ 实现层     │     │  实现层   │     │  实现层    │
    └───────────┘     └───────────┘     └───────────┘
```

### 鸿蒙迁移准备

本项目遵循以下规范，确保未来可无缝迁移：

- ❌ 禁止直接 DOM 操作 (`document.getElementById`)
- ❌ 禁止在组件中调用 Node.js API
- ✅ 所有系统能力通过接口抽象
- ✅ CSS 优先使用 Flexbox 布局
- ✅ 类型严格，无隐式 `any`
- ✅ 鸿蒙平台占位符已就绪

## 📋 发布检查清单

详见 [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md)

## 📄 License

AGPL-3.0
