<!-- src/components/ShortcutsModal.vue -->
<!--
  ⌨️ 快捷键设置模态框组件

  【功能】
  1. 展示所有可用快捷键
  2. 支持快捷键的查看和编辑（未来）
  3. 快捷键分组展示

  【设计原则】
  不直接操作 DOM 或调用平台 API，
  通过 Store 完成所有配置读写。
-->
<script setup lang="ts">
import { computed, ref } from 'vue';

const emit = defineEmits<{
  close: []
}>()

// 快捷键分组接口
interface ShortcutItem {
  id: string
  label: string
  keys: string[]
  description?: string
}

interface ShortcutGroup {
  id: string
  title: string
  icon: string
  shortcuts: ShortcutItem[]
}

// 快捷键配置数据
const shortcutGroups = ref<ShortcutGroup[]>([
  {
    id: 'file',
    title: '文件操作',
    icon: '📁',
    shortcuts: [
      { id: 'new-file', label: '新建文件', keys: ['Ctrl', 'N'], description: '创建一个新的 Markdown 文件' },
      { id: 'open-file', label: '打开文件', keys: ['Ctrl', 'O'], description: '打开现有的 Markdown 文件' },
      { id: 'save-file', label: '保存文件', keys: ['Ctrl', 'S'], description: '保存当前文件' },
      { id: 'save-as', label: '另存为', keys: ['Ctrl', 'Shift', 'S'], description: '将当前文件另存为新文件' },
    ],
  },
  {
    id: 'edit',
    title: '编辑操作',
    icon: '✏️',
    shortcuts: [
      { id: 'undo', label: '撤销', keys: ['Ctrl', 'Z'], description: '撤销上一步操作' },
      { id: 'redo', label: '重做', keys: ['Ctrl', 'Y'], description: '重做上一步撤销的操作' },
      { id: 'cut', label: '剪切', keys: ['Ctrl', 'X'], description: '剪切选中的内容' },
      { id: 'copy', label: '复制', keys: ['Ctrl', 'C'], description: '复制选中的内容' },
      { id: 'paste', label: '粘贴', keys: ['Ctrl', 'V'], description: '粘贴剪贴板中的内容' },
      { id: 'select-all', label: '全选', keys: ['Ctrl', 'A'], description: '选中所有内容' },
      { id: 'find', label: '查找', keys: ['Ctrl', 'F'], description: '打开查找面板' },
      { id: 'replace', label: '查找和替换', keys: ['Ctrl', 'H'], description: '打开查找和替换面板' },
      { id: 'find-next', label: '查找下一个', keys: ['F3'], description: '跳转到下一个匹配项' },
      { id: 'find-prev', label: '查找上一个', keys: ['Shift', 'F3'], description: '跳转到上一个匹配项' },
      { id: 'indent', label: '增加缩进', keys: ['Tab'], description: '增加当前行的缩进' },
      { id: 'outdent', label: '减少缩进', keys: ['Shift', 'Tab'], description: '减少当前行的缩进' },
    ],
  },
  {
    id: 'format',
    title: 'Markdown 格式',
    icon: '📝',
    shortcuts: [
      { id: 'bold', label: '粗体', keys: ['Ctrl', 'B'], description: '将选中文本用 ** 包裹' },
      { id: 'italic', label: '斜体', keys: ['Ctrl', 'I'], description: '将选中文本用 * 包裹' },
      { id: 'strikethrough', label: '删除线', keys: ['Ctrl', 'Shift', 'X'], description: '将选中文本用 ~~ 包裹' },
      { id: 'code-inline', label: '行内代码', keys: ['Ctrl', '`'], description: '将选中文本用 ` 包裹' },
      { id: 'code-block', label: '代码块', keys: ['Ctrl', 'Shift', 'K'], description: '插入代码块' },
      { id: 'link', label: '插入链接', keys: ['Ctrl', 'K'], description: '插入 [text](url) 格式链接' },
      { id: 'image', label: '插入图片', keys: ['Ctrl', 'Shift', 'I'], description: '插入 ![alt](url) 格式图片' },
    ],
  },
  {
    id: 'view',
    title: '视图与设置',
    icon: '👁️',
    shortcuts: [
      { id: 'toggle-preview', label: '切换视图模式', keys: ['Ctrl', 'P'], description: '在分栏/编辑/预览模式间切换' },
      { id: 'toggle-theme', label: '切换主题', keys: ['Ctrl', 'Shift', 'T'], description: '在深色/亮色主题间快速切换' },
      { id: 'open-settings', label: '打开设置', keys: ['Ctrl', ','], description: '打开设置面板' },
      { id: 'open-shortcuts', label: '快捷键帮助', keys: ['Ctrl', '/'], description: '显示当前快捷键列表' },
    ],
  },
])

// 搜索关键词
const searchQuery = ref('')

// 过滤后的快捷键分组
const filteredGroups = computed<ShortcutGroup[]>(() => {
  if (!searchQuery.value.trim()) {
    return shortcutGroups.value
  }

  const query = searchQuery.value.toLowerCase().trim()

  return shortcutGroups.value
    .map((group) => ({
      ...group,
      shortcuts: group.shortcuts.filter(
        (shortcut) =>
          shortcut.label.toLowerCase().includes(query) ||
          shortcut.keys.join('+').toLowerCase().includes(query) ||
          (shortcut.description?.toLowerCase().includes(query) ?? false),
      ),
    }))
    .filter((group) => group.shortcuts.length > 0)
})

// ========== 操作方法 ==========

/**
 * 关闭弹框
 */
function handleClose(): void {
  emit('close')
}

/**
 * 点击遮罩层关闭
 */
function handleOverlayClick(event: MouseEvent): void {
  if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
    handleClose()
  }
}

/**
 * ESC 键关闭
 */
function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    handleClose()
  }
}

/**
 * 格式化快捷键显示
 */
function formatKeyDisplay(key: string): string {
  const keyMap: Record<string, string> = {
    Ctrl: 'Ctrl',
    Shift: 'Shift',
    Alt: 'Alt',
    Enter: '↵',
    Backspace: '⌫',
    Tab: 'Tab',
    Escape: 'Esc',
  }
  return keyMap[key] ?? key
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-overlay" @click="handleOverlayClick" @keydown="handleKeydown" tabindex="-1">
      <div class="modal-container" @click.stop>
        <!-- 标题栏 -->
        <header class="modal-header">
          <h2 class="modal-title">⌨️ 快捷键</h2>
          <button class="close-btn" title="关闭" @click="handleClose">✕</button>
        </header>

        <!-- 搜索栏 -->
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input v-model="searchQuery" type="text" class="search-input" placeholder="搜索快捷键..." autofocus />
          <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">✕</button>
        </div>

        <!-- 快捷键内容 -->
        <div class="modal-body">
          <!-- 无搜索结果时 -->
          <div v-if="filteredGroups.length === 0" class="no-results">
            <span class="no-results-icon">🔍</span>
            <p class="no-results-text">未找到匹配的快捷键</p>
            <p class="no-results-hint">尝试使用其他关键词搜索</p>
          </div>

          <!-- 快捷键分组列表 -->
          <section v-for="group in filteredGroups" :key="group.id" class="shortcut-section">
            <h3 class="section-title">
              <span class="section-icon">{{ group.icon }}</span>
              {{ group.title }}
            </h3>

            <div class="shortcut-list">
              <div v-for="shortcut in group.shortcuts" :key="shortcut.id" class="shortcut-item">
                <div class="shortcut-info">
                  <span class="shortcut-label">{{ shortcut.label }}</span>
                  <span v-if="shortcut.description" class="shortcut-desc">{{ shortcut.description
                  }}</span>
                </div>
                <div class="shortcut-keys">
                  <kbd v-for="(key, idx) in shortcut.keys" :key="idx" class="key">
                    {{ formatKeyDisplay(key) }}
                  </kbd>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- 底部提示 -->
        <footer class="modal-footer">
          <div class="footer-hint">
            <span class="hint-icon">💡</span>
            <span class="hint-text">部分快捷键可能需要在编辑器中使用</span>
          </div>
          <button class="btn btn-primary" @click="handleClose">知道了</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ========== 遮罩层 ========== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* ========== 模态框容器 ========== */
.modal-container {
  width: 100%;
  max-width: 600px;
  max-height: 85vh;
  background: var(--color-bg-surface, #181825);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== 标题栏 ========== */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary, #cdd6f4);
}

.close-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--color-text-secondary, #a6adc8);
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(243, 139, 168, 0.2);
  color: #f38ba8;
}

/* ========== 搜索栏 ========== */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 20px 0;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  border-radius: 10px;
  transition: all 0.2s ease;
}

.search-bar:focus-within {
  border-color: var(--color-accent, #00ff88);
  background: rgba(0, 255, 136, 0.05);
}

.search-icon {
  font-size: 14px;
  color: var(--color-text-muted, #6c7086);
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: var(--color-text-primary, #cdd6f4);
}

.search-input::placeholder {
  color: var(--color-text-muted, #6c7086);
}

.clear-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 10px;
  color: var(--color-text-muted, #6c7086);
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
}

.clear-btn:hover {
  background: rgba(243, 139, 168, 0.2);
  color: #f38ba8;
}

/* ========== 内容区域 ========== */
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

/* ========== 无结果提示 ========== */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.no-results-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-results-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-primary, #cdd6f4);
  margin-bottom: 4px;
}

.no-results-hint {
  font-size: 14px;
  color: var(--color-text-muted, #6c7086);
}

/* ========== 快捷键分组 ========== */
.shortcut-section {
  margin-bottom: 24px;
}

.shortcut-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary, #a6adc8);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.05));
}

.section-icon {
  font-size: 16px;
}

/* ========== 快捷键列表 ========== */
.shortcut-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 10px;
  transition: all 0.2s ease;
}

.shortcut-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.shortcut-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shortcut-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary, #cdd6f4);
}

.shortcut-desc {
  font-size: 12px;
  color: var(--color-text-muted, #6c7086);
}

/* ========== 快捷键样式 ========== */
.shortcut-keys {
  display: flex;
  align-items: center;
  gap: 4px;
}

.key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.05));
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  font-family: var(--font-mono, 'JetBrains Mono', 'Consolas', monospace);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-primary, #cdd6f4);
  box-shadow:
    0 2px 0 rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.3);
}

.shortcut-keys .key+.key::before {
  content: '+';
  position: absolute;
  left: -10px;
  font-size: 10px;
  color: var(--color-text-muted, #6c7086);
}

.shortcut-keys {
  position: relative;
}

.shortcut-keys .key {
  position: relative;
}

/* ========== 底部 ========== */
.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
}

.footer-hint {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hint-icon {
  font-size: 14px;
}

.hint-text {
  font-size: 12px;
  color: var(--color-text-muted, #6c7086);
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--color-accent, #00ff88);
  color: #1e1e2e;
}

.btn-primary:hover {
  background: #00cc6a;
  transform: translateY(-1px);
}
</style>
