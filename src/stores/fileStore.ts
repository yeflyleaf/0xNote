// src/stores/fileStore.ts
/**
 * 📄 文件状态管理 Store
 *
 * 【设计原则】
 * 此 Store 依赖于 IFileSystem 接口，而非具体实现类。
 * 这确保了业务逻辑与平台实现完全解耦。
 *
 * 【鸿蒙迁移指南】
 * 迁移时此文件无需任何修改！
 * 只需确保平台适配器返回正确的 HarmonyFileSystem 实例即可。
 */

import type { FileMetadata } from '@/common/types'
import { useFileSystem } from '@/platforms/adapter'
import { debounce } from 'lodash-es'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

/**
 * 保存状态枚举
 */
export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error'

export const useFileStore = defineStore('file', () => {
    // ========== 状态 (State) ==========

    /** 当前打开的文件路径 */
    const currentFilePath = ref<string | null>(null)

    /** 编辑器内容 */
    const content = ref<string>('')

    /** 原始内容（用于判断是否修改） */
    const originalContent = ref<string>('')

    /** 文件元信息 */
    const fileMetadata = ref<FileMetadata | null>(null)

    /** 保存状态 */
    const saveStatus = ref<SaveStatus>('saved')

    /** 最后保存时间 */
    const lastSavedAt = ref<number | null>(null)

    /** 错误信息 */
    const errorMessage = ref<string | null>(null)

    // ========== 计算属性 (Getters) ==========

    /** 是否有未保存的更改 */
    const hasUnsavedChanges = computed(() => {
        return content.value !== originalContent.value
    })

    /** 当前文件名 */
    const currentFileName = computed(() => {
        if (!currentFilePath.value) return '未命名'
        return currentFilePath.value.split(/[/\\]/).pop() ?? '未命名'
    })

    /** 是否为新文件 */
    const isNewFile = computed(() => currentFilePath.value === null)

    // ========== 操作方法 (Actions) ==========

    /**
     * 获取文件系统服务
     * 延迟获取确保平台适配器已初始化
     */
    const getFileSystem = () => useFileSystem()

    /**
     * 打开文件
     * @param filePath 文件路径
     */
    async function openFile(filePath: string): Promise<boolean> {
        try {
            saveStatus.value = 'saving' // 复用状态表示加载中
            errorMessage.value = null

            const fs = getFileSystem()
            const result = await fs.readFile(filePath)

            if (!result.success || result.data === undefined) {
                throw new Error(result.error ?? '读取文件失败')
            }

            content.value = result.data
            originalContent.value = result.data
            currentFilePath.value = filePath

            // 获取文件元信息
            const metaResult = await fs.getFileMetadata(filePath)
            if (metaResult.success && metaResult.data) {
                fileMetadata.value = metaResult.data
            }

            saveStatus.value = 'saved'
            return true
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '未知错误'
            errorMessage.value = errMsg
            saveStatus.value = 'error'
            console.error('[FileStore] openFile 失败:', errMsg)
            return false
        }
    }

    /**
     * 保存文件
     * @param forcePath 强制保存到指定路径（另存为场景）
     */
    async function saveFile(forcePath?: string): Promise<boolean> {
        const targetPath = forcePath ?? currentFilePath.value

        // 新文件需要先选择保存位置
        if (!targetPath) {
            return await saveFileAs()
        }

        try {
            saveStatus.value = 'saving'
            errorMessage.value = null

            const fs = getFileSystem()
            const result = await fs.writeFile(targetPath, content.value)

            if (!result.success) {
                throw new Error(result.error ?? '保存文件失败')
            }

            originalContent.value = content.value
            currentFilePath.value = targetPath
            saveStatus.value = 'saved'
            lastSavedAt.value = Date.now()

            console.log('[FileStore] 文件已保存:', targetPath)
            return true
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '未知错误'
            errorMessage.value = errMsg
            saveStatus.value = 'error'
            console.error('[FileStore] saveFile 失败:', errMsg)
            return false
        }
    }

    /**
     * 另存为
     */
    async function saveFileAs(): Promise<boolean> {
        try {
            const fs = getFileSystem()
            const result = await fs.showSaveDialog(currentFileName.value)

            if (!result.success || !result.data) {
                // 用户取消
                return false
            }

            return await saveFile(result.data)
        } catch (error) {
            const errMsg = error instanceof Error ? error.message : '未知错误'
            errorMessage.value = errMsg
            saveStatus.value = 'error'
            return false
        }
    }

    /**
     * 创建新文件
     */
    function createNewFile(): void {
        content.value = ''
        originalContent.value = ''
        currentFilePath.value = null
        fileMetadata.value = null
        saveStatus.value = 'saved'
        errorMessage.value = null
    }

    /**
     * 更新内容（由编辑器调用）
     */
    function updateContent(newContent: string): void {
        content.value = newContent
        if (hasUnsavedChanges.value) {
            saveStatus.value = 'unsaved'
        }
    }

    /**
     * 防抖保存（内容变化后 1 秒自动保存）
     */
    const debouncedSave = debounce(async () => {
        // 只有有文件路径且有未保存更改时才自动保存
        if (currentFilePath.value && hasUnsavedChanges.value) {
            console.log('[FileStore] 自动保存触发')
            await saveFile()
        }
    }, 1000)

    // 监听内容变化，触发防抖保存
    watch(content, () => {
        if (hasUnsavedChanges.value) {
            saveStatus.value = 'unsaved'
            debouncedSave()
        }
    })

    /**
     * 显示打开文件对话框
     */
    async function showOpenFileDialog(): Promise<boolean> {
        try {
            const fs = getFileSystem()
            const result = await fs.showOpenDialog()

            if (!result.success || !result.data) {
                return false
            }

            return await openFile(result.data)
        } catch (error) {
            console.error('[FileStore] showOpenFileDialog 失败:', error)
            return false
        }
    }

    // ========== 导出 ==========
    return {
        // State
        currentFilePath,
        content,
        fileMetadata,
        saveStatus,
        lastSavedAt,
        errorMessage,

        // Getters
        hasUnsavedChanges,
        currentFileName,
        isNewFile,

        // Actions
        openFile,
        saveFile,
        saveFileAs,
        createNewFile,
        updateContent,
        showOpenFileDialog,
    }
})
