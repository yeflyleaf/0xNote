# 🚀 0xNote 开发提示词工程 (Prompt Suite)

0xNote 是一款基于 Vue3 + Electron 开发的轻量级 Markdown 编辑器。它通过深度修改注册表，实现了 Windows 右键菜单集成，支持像新建 .txt 一样一键创建与秒开 Markdown 文件。

软件内置专业级代码高亮与实时预览，完美解决系统记事本无法阅读代码的痛点。坚持本地优先与零摩擦启动，0xNote 是开发者管理代码碎片与技术灵感的最佳伴侣。

## 🛠️ Phase 0: 项目初始化 (Project Bootstrap)

**目标**：搭建基于 Vue 3 + TypeScript + Electron (或 Tauri) 的项目骨架，并强制执行目录规范。

> **Prompt 1: 初始化项目结构**
> 我正在开发 "0xNote" 项目。请基于 `GEMINI.md` 中的规范，为我生成项目的基础目录结构和核心配置文件。
> **具体要求：**
>
> 1. **技术栈**：Vue 3 (Script Setup), TypeScript, Vite, Pinia, TailwindCSS。
> 2. **构建目标**：Windows 桌面端 (使用 Electron 或 Tauri，请推荐最适合“操作注册表”和“轻量化”的方案并说明理由)。
> 3. **目录结构**：请严格执行 `src/common` (通用逻辑), `src/platforms` (平台特定), `src/components` (UI) 的分层结构。
> 4. **输出**：
>
> - 完整的文件夹树状图。
> - `package.json` 的关键依赖（特别是 Markdown 渲染和代码高亮库）。
> - `tsconfig.json` 配置（必须开启 Strict Mode）。

---

## 🏗️ Phase 1: 核心架构与解耦 (Core Architecture)

**目标**：定义“抽象层 (Interface)”，这是未来迁移鸿蒙的关键。确保业务逻辑不直接依赖 Node.js API。

> **Prompt 2: 定义跨平台抽象层**
> 我们需要实现“逻辑与视图分离”。请为系统底层能力定义 TypeScript 接口 (Interface)。
> **具体要求：**
>
> 1. 在 `src/common/types/` 下定义以下接口：
>
> - `IFileSystem`: 包含 `readFile`, `writeFile`, `createFile` 方法。
> - `ISystemMenu`: 包含 `setupContextMenu` (配置右键菜单) 方法。
>
> 2. 在 `src/platforms/windows/` 下创建一个 **Mock 实现** (暂时只打印日志，不写真逻辑)，确保 TS 类型检查通过。
> 3. 在 `src/stores/fileStore.ts` 中创建一个 Pinia Store，它依赖于 `IFileSystem` 接口，而不是具体的实现类。
> 4. **注意**：所有代码必须添加详细注释，解释为什么这样做有利于迁移鸿蒙。

---

## 📝 Phase 2: 编辑器核心实现 (Editor Engine)

**目标**：实现 Markdown 编辑和代码高亮，封装 Editor 组件。

> **Prompt 3: 封装 Markdown 编辑器组件**
> 请开发核心编辑器组件 `MemoEditor.vue`。
> **具体要求：**
>
> 1. **内核选择**：集成 `Monaco Editor` 或 `CodeMirror 6` (请选择启动速度更快的一个)。
> 2. **组件封装**：
>
> - 创建一个独立的 Vue 组件，接受 `modelValue` (双向绑定内容)。
> - 内部处理代码高亮逻辑 (Syntax Highlighting)。
>
> 3. **鸿蒙兼容性**：请确保这个组件对外的 Props 和 Events 是通用的。不要在组件内部直接写 Node.js 的 fs 读写操作，必须通过 `emit` 事件将内容传出去，由父组件调用 Store 处理。
> 4. **功能**：支持基本的 Markdown 语法高亮，特别是代码块 (`js ... `) 的渲染。

---

## 🔧 Phase 3: Windows 系统深度集成 (System Integration)

**目标**：实现“右键新建”和“文件关联”，这是产品的核心竞争力。

> **Prompt 4: 实现 Windows 注册表集成**
> 我需要实现 Windows 右键菜单的“新建 Markdown 笔记”和“使用 Markdown Memo 打开”功能。
> **具体要求：**
>
> 1. **实现层**：在 Electron 的主进程 (`Main Process`) 中编写逻辑。
> 2. **功能点**：
>
> - 编写一个工具函数 `registerWindowsContextMenu()`。
> - 使用 `regedit` 库或 `child_process` 调用 `reg.exe` 命令。
> - 修改 `HKEY_CLASSES_ROOT\.md` 和 `HKEY_CLASSES_ROOT\Directory\Background\shell`。
>
> 3. **安全机制**：代码应包含错误处理（例如：如果用户没有管理员权限该怎么办）。
> 4. **输出**：请提供完整的 TypeScript 代码块，并标注该文件应该放在 `src/platforms/windows/` 的哪个位置。

---

## 🎨 Phase 4: UI 交互与持久化 (UI & Persistence)

**目标**：完成界面开发，并将文件保存逻辑串联起来。

> **Prompt 5: UI 布局与自动保存逻辑**
> 请完善主界面 `App.vue` 和文件保存逻辑。
> **具体要求：**
>
> 1. **UI 风格**：使用 TailwindCSS 实现极简风格。顶部不仅是标题栏，还要显示“已保存/未保存”的状态指示器。
> 2. **自动保存**：在 Pinia Store 中实现 `debouncedSave` (防抖保存) 功能。当编辑器内容变化超过 1 秒后，自动调用 `IFileSystem.writeFile`。
> 3. **加载逻辑**：应用启动时，检查启动参数 (`process.argv`)。如果是通过“右键打开”启动的，读取指定文件路径的内容并加载到编辑器中。

---

## 🕵️ Phase 5: 代码审查与迁移预演 (Code Review & Audit)

**目标**：让 AI 自己检查代码是否符合“未来迁移鸿蒙”的标准。

> **Prompt 6: 鸿蒙迁移兼容性审查**
> 请扮演一位严格的代码审计员，检查当前项目的所有 `.vue` 和 `.ts` 文件。
> **审查标准（基于 Rules）：**
>
> 1. 是否存在直接的 DOM 操作 (`document.*`)？如果是，请指出并提供 `ref` 修改方案。
> 2. CSS 是否使用了鸿蒙不支持的属性 (如 `float`, `position: fixed`)？
> 3. 是否存在未被接口(`Interface`) 隔离的 Node.js 代码？
>
> **输出**：请输出一份 Markdown 表格形式的《代码合规性报告》，并列出需要修改的代码片段。
