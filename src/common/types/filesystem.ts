// src/common/types/filesystem.ts
/**
 * 📁 文件系统抽象层接口定义
 *
 * 【为什么需要这个接口？】
 * 为了实现"逻辑与视图分离"，保证架构的灵活性。
 * - Windows: 使用 Node.js fs 模块 + Electron IPC
 *
 * 业务层只依赖此 Interface，平台层负责具体实现。
 */

/**
 * 文件元信息
 */
export interface FileMetadata {
    /** 文件名（不含路径） */
    fileName: string
    /** 完整文件路径 */
    filePath: string
    /** 文件大小（字节） */
    size: number
    /** 最后修改时间（时间戳） */
    lastModified: number
    /** 是否只读 */
    isReadOnly: boolean
}

/**
 * 文件操作结果
 */
export interface FileOperationResult<T = void> {
    /** 操作是否成功 */
    success: boolean
    /** 返回数据 */
    data?: T
    /** 错误信息 */
    error?: string
    /** 错误代码 */
    errorCode?: string
}

/**
 * IFileSystem 接口
 * 定义所有文件操作的契约，平台实现层必须遵循此接口
 */
export interface IFileSystem {
    /**
     * 读取文件内容
     * @param filePath 文件绝对路径
     * @returns 文件内容字符串
     */
    readFile(filePath: string): Promise<FileOperationResult<string>>

    /**
     * 写入文件内容
     * @param filePath 文件绝对路径
     * @param content 要写入的内容
     */
    writeFile(filePath: string, content: string): Promise<FileOperationResult>

    /**
     * 创建新文件
     * @param directoryPath 目录路径
     * @param fileName 文件名（可选，默认生成）
     * @returns 新创建文件的完整路径
     */
    createFile(directoryPath: string, fileName?: string): Promise<FileOperationResult<string>>

    /**
     * 获取文件元信息
     * @param filePath 文件绝对路径
     */
    getFileMetadata(filePath: string): Promise<FileOperationResult<FileMetadata>>

    /**
     * 检查文件是否存在
     * @param filePath 文件绝对路径
     */
    exists(filePath: string): Promise<boolean>

    /**
     * 显示"打开文件"对话框
     * @returns 用户选择的文件路径，取消则返回 undefined
     */
    showOpenDialog(): Promise<FileOperationResult<string>>

    /**
     * 显示"另存为"对话框
     * @param defaultFileName 默认文件名
     * @returns 用户选择的保存路径
     */
    showSaveDialog(defaultFileName: string): Promise<FileOperationResult<string>>

    /**
     * 监听文件变化
     * @param filePath 文件路径
     * @param callback 变化回调
     */
    watchFile(filePath: string, callback: (content: string) => void): Promise<void>

    /**
     * 取消监听文件
     * @param filePath 文件路径
     */
    unwatchFile(filePath: string): Promise<void>
}
