# 🚀 0xNote 开发计划 - Stage 2: 完善与发布 (Polish & Release)

当前状态：Windows 核心 MVP 已就绪（编辑、保存、右键菜单集成）。
本阶段目标：补全"所见即所得"的预览功能，完善设置系统，配置安装包脚本，并正式启动鸿蒙端架构准备。

---

## 🌗 Phase 5: 双栏实时预览 (Live Preview Split-View) ✅ 已完成

**目标**：实现"左侧写代码，右侧看效果"的经典 Markdown 体验。

### 实现内容

1. ✅ **依赖安装**：使用 `markdown-it` + `github-markdown-css` + `dompurify`
2. ✅ **组件开发**：创建 `src/components/MemoPreview.vue`
   - 接收 `content` (string) 作为 Props
   - 使用 `markdown-it` 将 Markdown 转换为 HTML
   - 使用 `DOMPurify` 进行 XSS 防护
3. ✅ **样式同步**：预览区域支持暗色/亮色主题
4. ✅ **布局调整**：App.vue 实现 Grid/Flex 分栏布局
5. ✅ **状态控制**：TitleBar 添加视图切换按钮（编辑/预览/分栏）
6. ✅ **性能优化**：预览渲染使用 `debounce` 防抖处理

---

## ⚙️ Phase 6: 设置系统与主题管理 (Settings System) ✅ 已完成

**目标**：让用户能自定义字号、字体和快捷键，完成产品化封装。

### 实现内容

1. ✅ **Store 扩展**：创建 `src/stores/settingStore.ts`
   - 字段：`fontSize`, `fontFamily`, `theme`, `autoSave`, `autoSaveDelay`, `showLineNumbers`, `tabSize`, `syncScroll`
2. ✅ **UI 实现**：创建 `src/components/SettingsModal.vue`
   - 模态框组件，包含所有设置表单项
   - 实时预览字体和字号变化
3. ✅ **鸿蒙兼容性**：
   - 定义 `IConfigService` 接口 (`src/common/types/config.ts`)
   - Windows 实现：`WindowsConfigService` (使用 localStorage)
   - 鸿蒙占位符：`HarmonyConfigService`

---

## 📦 Phase 7: 安装包与生命周期脚本 (Installer & NSIS) ✅ 已完成

**目标**：生成的 `.exe` 安装后自动集成右键菜单，卸载时自动清理。

### 实现内容

1. ✅ **NSIS 脚本**：创建 `build/installer.nsh`
   - `customInstall` 宏：安装完成后执行 `--register` 参数
   - `customUnInstall` 宏：卸载时清理注册表键值
2. ✅ **主进程优化**：更新 `electron/main.ts`
   - 增加 `--register` 参数处理（静默注册模式）
   - 增加 `--unregister` 参数处理（静默注销模式）
   - 增加 `--new` 参数处理（从右键新建文件）
3. ✅ **构建配置**：更新 `electron-builder.yml`
   - 包含 NSIS 自定义脚本
   - 添加额外资源配置

---

## 🌉 Phase 8: 鸿蒙架构分岔 (HarmonyOS Branching) ✅ 已完成

**目标**：在不破坏 Windows 代码的前提下，建立鸿蒙开发的平行宇宙。

### 实现内容

1. ✅ **目录重构**：创建 `src/platforms/harmony/` 目录
2. ✅ **核心复用**：
   - 确认 `src/common/types` 完全解耦
   - 确认 `src/stores` 依赖接口而非实现
3. ✅ **空实现**：
   - `HarmonyFileSystem.ts` - 文件系统占位符
   - `HarmonySystemMenu.ts` - 系统菜单占位符
   - `HarmonyConfigService.ts` - 配置服务占位符
4. ✅ **UI 迁移策略**：
   - 创建 `components/MemoEditor.ets.ts` 伪代码接口文档
   - 定义与 Vue 组件相同的 Props/Events 接口

---

## ✅ Phase 9: 最终验收清单 (Final Polish) ✅ 已完成

**目标**：在发布 GitHub Release 前的最后检查。

### 实现内容

1. ✅ 创建 `docs/RELEASE_CHECKLIST.md` 验收清单
   - 大文件测试检查项
   - 异常恢复检查项
   - 路径兼容性检查项
   - 快捷键冲突检查项
   - UI/UX 测试检查项
   - 安装卸载测试检查项
   - 性能测试检查项
   - 安全测试检查项
2. ✅ 更新 README.md 文档

---

## 📊 实现文件清单

### 新增文件

| 文件                                                 | 描述                  |
| ---------------------------------------------------- | --------------------- |
| `src/components/MemoPreview.vue`                     | Markdown 实时预览组件 |
| `src/components/SettingsModal.vue`                   | 设置模态框组件        |
| `src/common/types/config.ts`                         | 配置服务接口定义      |
| `src/stores/settingStore.ts`                         | 设置状态管理 Store    |
| `src/platforms/windows/WindowsConfigService.ts`      | Windows 配置服务实现  |
| `src/platforms/harmony/index.ts`                     | 鸿蒙平台模块入口      |
| `src/platforms/harmony/HarmonyFileSystem.ts`         | 鸿蒙文件系统占位符    |
| `src/platforms/harmony/HarmonySystemMenu.ts`         | 鸿蒙系统菜单占位符    |
| `src/platforms/harmony/HarmonyConfigService.ts`      | 鸿蒙配置服务占位符    |
| `src/platforms/harmony/components/MemoEditor.ets.ts` | 鸿蒙编辑器接口文档    |
| `build/installer.nsh`                                | NSIS 安装脚本         |
| `docs/RELEASE_CHECKLIST.md`                          | 发布验收清单          |

### 修改文件

| 文件                             | 描述                   |
| -------------------------------- | ---------------------- |
| `src/App.vue`                    | 添加分栏布局支持       |
| `src/components/TitleBar.vue`    | 添加视图切换和设置按钮 |
| `src/components/index.ts`        | 添加新组件导出         |
| `src/stores/appStore.ts`         | 添加视图模式状态       |
| `src/stores/index.ts`            | 添加新 Store 导出      |
| `src/common/types/index.ts`      | 添加配置类型导出       |
| `src/platforms/adapter.ts`       | 添加配置服务支持       |
| `src/platforms/windows/index.ts` | 添加配置服务导出       |
| `electron/main.ts`               | 添加命令行参数处理     |
| `electron-builder.yml`           | 添加 NSIS 脚本配置     |
| `README.md`                      | 更新功能说明           |

### 新增依赖

```json
{
  "markdown-it": "^14.x",
  "dompurify": "^3.x",
  "github-markdown-css": "^5.x",
  "@types/markdown-it": "^14.x",
  "@types/dompurify": "^3.x"
}
```

---

## 🎯 下一步工作

1. [ ] 运行 `npm run build:win` 生成 Windows 安装包
2. [ ] 按照 `docs/RELEASE_CHECKLIST.md` 执行验收测试
3. [ ] 创建 GitHub Release 并上传安装包
4. [ ] 开始 Phase 2: 鸿蒙端开发
