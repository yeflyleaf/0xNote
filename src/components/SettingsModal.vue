<!-- src/components/SettingsModal.vue -->
<!--
  ⚙️ 设置模态框组件

  【功能】
  1. 字体大小调节 (12-24px)
  2. 字体家族选择
  3. 主题切换 (暗色/亮色/跟随系统)
  4. 自动保存开关
  5. 实时预览设置变化

  【设计原则】
  不直接操作 DOM 或调用平台 API，
  通过 Store 完成所有配置读写。
-->
<script setup lang="ts">
import type { AppSettings } from '@/common/types';
import { DEFAULT_SETTINGS } from '@/common/types';
import { useAppStore, useSettingStore } from '@/stores';
import { computed, onMounted, reactive, watch } from 'vue';

const emit = defineEmits<{
    close: []
}>()

const settingStore = useSettingStore()
const appStore = useAppStore()

// 本地编辑的设置副本（用于实时预览）
const localSettings = reactive<AppSettings>({ ...DEFAULT_SETTINGS })

// 可选的字体家族列表
const fontFamilyOptions = [
    { value: "'JetBrains Mono', 'Fira Code', Consolas, monospace", label: 'JetBrains Mono' },
    { value: "'Fira Code', Consolas, monospace", label: 'Fira Code' },
    { value: "'Source Code Pro', Consolas, monospace", label: 'Source Code Pro' },
    { value: "Consolas, 'Courier New', monospace", label: 'Consolas' },
    { value: "'Cascadia Code', Consolas, monospace", label: 'Cascadia Code' },
    { value: "'Microsoft YaHei', sans-serif", label: '微软雅黑' },
]

// 主题选项
const themeOptions = [
    { value: 'dark', label: '🌙 暗色', icon: '🌙' },
    { value: 'light', label: '☀️ 亮色', icon: '☀️' },
    { value: 'system', label: '💻 跟随系统', icon: '💻' },
]

// 是否有未保存的更改
const hasChanges = computed(() => {
    return JSON.stringify(localSettings) !== JSON.stringify(settingStore.settings)
})

// ========== 生命周期 ==========

onMounted(async () => {
    // 确保设置已加载
    if (!settingStore.isLoaded) {
        await settingStore.loadSettings()
    }
    // 复制到本地副本
    Object.assign(localSettings, settingStore.settings)
})

// 监听主题变化，实时应用
watch(
    () => localSettings.theme,
    (newTheme) => {
        if (newTheme === 'system') {
            // TODO: 检测系统主题
            appStore.setTheme('dark')
        } else {
            appStore.setTheme(newTheme)
        }
    },
)

// ========== 操作方法 ==========

/**
 * 保存并关闭
 */
async function handleSave(): Promise<void> {
    // 将本地设置同步到 Store
    Object.assign(settingStore.settings, localSettings)
    await settingStore.saveSettings()
    emit('close')
}

/**
 * 取消
 */
function handleCancel(): void {
    // 恢复之前的主题
    appStore.setTheme(settingStore.settings.theme === 'system' ? 'dark' : settingStore.settings.theme)
    emit('close')
}

/**
 * 重置为默认
 */
function handleReset(): void {
    Object.assign(localSettings, DEFAULT_SETTINGS)
}

/**
 * 点击遮罩层关闭
 */
function handleOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
        handleCancel()
    }
}

/**
 * ESC 键关闭
 */
function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        handleCancel()
    }
}
</script>

<template>
    <Teleport to="body">
        <div class="modal-overlay" @click="handleOverlayClick" @keydown="handleKeydown" tabindex="-1">
            <div class="modal-container" @click.stop>
                <!-- 标题栏 -->
                <header class="modal-header">
                    <h2 class="modal-title">⚙️ 设置</h2>
                    <button class="close-btn" title="关闭" @click="handleCancel">✕</button>
                </header>

                <!-- 设置内容 -->
                <div class="modal-body">
                    <!-- 外观设置 -->
                    <section class="settings-section">
                        <h3 class="section-title">🎨 外观</h3>

                        <!-- 主题选择 -->
                        <div class="setting-item">
                            <label class="setting-label">主题</label>
                            <div class="theme-selector">
                                <button v-for="option in themeOptions" :key="option.value"
                                    :class="['theme-btn', { active: localSettings.theme === option.value }]"
                                    @click="localSettings.theme = option.value as AppSettings['theme']">
                                    {{ option.label }}
                                </button>
                            </div>
                        </div>

                        <!-- 字体大小 -->
                        <div class="setting-item">
                            <label class="setting-label">
                                字体大小
                                <span class="setting-value">{{ localSettings.fontSize }}px</span>
                            </label>
                            <div class="range-container">
                                <span class="range-label">12</span>
                                <input type="range" v-model.number="localSettings.fontSize" min="12" max="24" step="1"
                                    class="range-input" />
                                <span class="range-label">24</span>
                            </div>
                        </div>

                        <!-- 字体家族 -->
                        <div class="setting-item">
                            <label class="setting-label">字体</label>
                            <select v-model="localSettings.fontFamily" class="select-input">
                                <option v-for="option in fontFamilyOptions" :key="option.value" :value="option.value">
                                    {{ option.label }}
                                </option>
                            </select>
                        </div>
                    </section>

                    <!-- 编辑器设置 -->
                    <section class="settings-section">
                        <h3 class="section-title">✏️ 编辑器</h3>

                        <!-- 显示行号 -->
                        <div class="setting-item setting-toggle">
                            <label class="setting-label">显示行号</label>
                            <button :class="['toggle-btn', { active: localSettings.showLineNumbers }]"
                                @click="localSettings.showLineNumbers = !localSettings.showLineNumbers">
                                <span class="toggle-thumb" />
                            </button>
                        </div>

                        <!-- Tab 大小 -->
                        <div class="setting-item">
                            <label class="setting-label">Tab 大小</label>
                            <div class="tab-size-selector">
                                <button v-for="size in [2, 4, 8]" :key="size"
                                    :class="['tab-btn', { active: localSettings.tabSize === size }]"
                                    @click="localSettings.tabSize = size">
                                    {{ size }}
                                </button>
                            </div>
                        </div>
                    </section>

                    <!-- 保存设置 -->
                    <section class="settings-section">
                        <h3 class="section-title">💾 保存</h3>

                        <!-- 自动保存 -->
                        <div class="setting-item setting-toggle">
                            <div>
                                <label class="setting-label">自动保存</label>
                                <p class="setting-desc">编辑后自动保存文件</p>
                            </div>
                            <button :class="['toggle-btn', { active: localSettings.autoSave }]"
                                @click="localSettings.autoSave = !localSettings.autoSave">
                                <span class="toggle-thumb" />
                            </button>
                        </div>

                        <!-- 自动保存延迟 -->
                        <div v-if="localSettings.autoSave" class="setting-item">
                            <label class="setting-label">
                                自动保存延迟
                                <span class="setting-value">{{ localSettings.autoSaveDelay / 1000 }}秒</span>
                            </label>
                            <div class="range-container">
                                <span class="range-label">0.5s</span>
                                <input type="range" v-model.number="localSettings.autoSaveDelay" min="500" max="5000"
                                    step="500" class="range-input" />
                                <span class="range-label">5s</span>
                            </div>
                        </div>
                    </section>

                    <!-- 预览设置 -->
                    <section class="settings-section">
                        <h3 class="section-title">👁️ 预览</h3>

                        <!-- 同步滚动 -->
                        <div class="setting-item setting-toggle">
                            <div>
                                <label class="setting-label">同步滚动</label>
                                <p class="setting-desc">编辑器与预览面板同步滚动</p>
                            </div>
                            <button :class="['toggle-btn', { active: localSettings.syncScroll }]"
                                @click="localSettings.syncScroll = !localSettings.syncScroll">
                                <span class="toggle-thumb" />
                            </button>
                        </div>
                    </section>
                </div>

                <!-- 底部按钮 -->
                <footer class="modal-footer">
                    <button class="btn btn-ghost" @click="handleReset">恢复默认</button>
                    <div class="footer-actions">
                        <button class="btn btn-secondary" @click="handleCancel">取消</button>
                        <button class="btn btn-primary" @click="handleSave" :disabled="settingStore.isSaving">
                            {{ settingStore.isSaving ? '保存中...' : '保存' }}
                        </button>
                    </div>
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
    max-width: 520px;
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

/* ========== 内容区域 ========== */
.modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
}

/* ========== 设置分组 ========== */
.settings-section {
    margin-bottom: 24px;
}

.settings-section:last-child {
    margin-bottom: 0;
}

.section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-secondary, #a6adc8);
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--color-border, rgba(255, 255, 255, 0.05));
}

/* ========== 设置项 ========== */
.setting-item {
    margin-bottom: 16px;
}

.setting-item:last-child {
    margin-bottom: 0;
}

.setting-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.setting-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-primary, #cdd6f4);
    margin-bottom: 8px;
}

.setting-toggle .setting-label {
    margin-bottom: 0;
}

.setting-value {
    color: var(--color-accent, #00ff88);
    font-weight: 600;
    font-size: 12px;
    padding: 2px 6px;
    background: rgba(0, 255, 136, 0.1);
    border-radius: 4px;
}

.setting-desc {
    font-size: 12px;
    color: var(--color-text-muted, #6c7086);
    margin-top: 2px;
}

/* ========== 主题选择器 ========== */
.theme-selector {
    display: flex;
    gap: 8px;
}

.theme-btn {
    flex: 1;
    padding: 10px 16px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text-secondary, #a6adc8);
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.theme-btn:hover {
    background: rgba(255, 255, 255, 0.1);
}

.theme-btn.active {
    background: rgba(0, 255, 136, 0.15);
    color: var(--color-accent, #00ff88);
    border: 1px solid rgba(0, 255, 136, 0.3);
}

/* ========== 滑动条 ========== */
.range-container {
    display: flex;
    align-items: center;
    gap: 12px;
}

.range-label {
    font-size: 12px;
    color: var(--color-text-muted, #6c7086);
    min-width: 24px;
}

.range-input {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.1);
    appearance: none;
    cursor: pointer;
}

.range-input::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--color-accent, #00ff88);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 255, 136, 0.4);
    transition: transform 0.2s ease;
}

.range-input::-webkit-slider-thumb:hover {
    transform: scale(1.1);
}

/* ========== 下拉选择 ========== */
.select-input {
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
    color: var(--color-text-primary, #cdd6f4);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.select-input:hover {
    border-color: rgba(0, 255, 136, 0.3);
}

.select-input:focus {
    outline: none;
    border-color: var(--color-accent, #00ff88);
}

.select-input option {
    background: #1e1e2e;
    color: #cdd6f4;
}

/* ========== 切换按钮 ========== */
.toggle-btn {
    position: relative;
    width: 48px;
    height: 26px;
    border-radius: 13px;
    background: rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    flex-shrink: 0;
}

.toggle-btn.active {
    background: var(--color-accent, #00ff88);
}

.toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    transition: transform 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-btn.active .toggle-thumb {
    transform: translateX(22px);
}

/* ========== Tab 大小选择 ========== */
.tab-size-selector {
    display: flex;
    gap: 8px;
}

.tab-btn {
    padding: 8px 16px;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.05);
    color: var(--color-text-secondary, #a6adc8);
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.tab-btn:hover {
    background: rgba(255, 255, 255, 0.1);
}

.tab-btn.active {
    background: rgba(0, 255, 136, 0.15);
    color: var(--color-accent, #00ff88);
}

/* ========== 底部按钮 ========== */
.modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-top: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
}

.footer-actions {
    display: flex;
    gap: 8px;
}

.btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.btn-ghost {
    color: var(--color-text-muted, #6c7086);
}

.btn-ghost:hover {
    color: var(--color-text-secondary, #a6adc8);
    background: rgba(255, 255, 255, 0.05);
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-text-primary, #cdd6f4);
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.15);
}

.btn-primary {
    background: var(--color-accent, #00ff88);
    color: #1e1e2e;
}

.btn-primary:hover {
    background: #00cc6a;
    transform: translateY(-1px);
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}
</style>
