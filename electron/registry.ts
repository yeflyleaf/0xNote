// electron/registry.ts
/**
 * 🔧 Windows 注册表集成模块
 *
 * 实现 Windows 右键菜单的：
 * 1. "新建 Markdown 笔记" - 在目录空白处右键
 * 2. "使用 0xNote 打开" - 右键 .md 文件
 *
 * 【技术原理】
 * 通过 child_process 调用 reg.exe 命令修改注册表
 * - HKEY_CLASSES_ROOT\.md - 文件类型关联
 * - HKEY_CLASSES_ROOT\Directory\Background\shell - 目录背景右键菜单
 *
 * 【权限说明】
 * 修改 HKEY_CLASSES_ROOT 需要管理员权限
 * 如果没有权限，会尝试修改 HKEY_CURRENT_USER（仅当前用户生效）
 */

import { exec, execSync } from 'child_process'
import { app } from 'electron'
import * as path from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)

// 应用名称
const APP_NAME = '0xNote'
const FILE_TYPE_ID = '0xNote.md'

/**
 * 注册表操作结果
 */
interface RegistryResult {
  success: boolean
  error?: string
  requiresAdmin?: boolean
}

/**
 * 获取应用可执行文件路径
 */
function getExePath(): string {
  return app.isPackaged
    ? process.execPath
    : path.join(__dirname, '../../node_modules/.bin/electron.cmd')
}

/**
 * 获取应用图标路径
 */
function getIconPath(): string {
  return app.isPackaged
    ? path.join(path.dirname(process.execPath), 'resources', 'icon.ico')
    : path.join(__dirname, '../public/icon.ico')
}

/**
 * 执行注册表命令（带错误处理）
 */
async function executeRegCommand(command: string): Promise<RegistryResult> {
  try {
    await execAsync(command, { encoding: 'utf-8' })
    return { success: true }
  } catch (error) {
    const err = error as Error & { code?: number; stderr?: string }

    // 检查是否是权限问题
    if (err.stderr?.includes('拒绝访问') || err.stderr?.includes('Access is denied')) {
      return {
        success: false,
        error: '需要管理员权限',
        requiresAdmin: true,
      }
    }

    return {
      success: false,
      error: err.message || '注册表操作失败',
    }
  }
}

/**
 * 检查是否有管理员权限
 */
function isAdmin(): boolean {
  try {
    // 尝试写入一个需要管理员权限的测试键
    execSync('reg query "HKLM\\SOFTWARE" /ve', { encoding: 'utf-8', stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

/**
 * 注册 .md 文件类型关联
 *
 * 注册表结构：
 * HKEY_CLASSES_ROOT\.md
 *   (Default) = "0xNote.MarkdownFile"
 *
 * HKEY_CLASSES_ROOT\0xNote.MarkdownFile
 *   (Default) = "Markdown 文档"
 *   \DefaultIcon
 *     (Default) = "path\to\icon.ico"
 *   \shell\open\command
 *     (Default) = "path\to\0xNote.exe" "%1"
 */
export async function registerFileAssociation(): Promise<RegistryResult> {
  const exePath = getExePath()
  const iconPath = getIconPath()

  // 使用 HKCU 避免需要管理员权限
  const rootKey = isAdmin() ? 'HKCR' : 'HKCU\\Software\\Classes'

  const commands = [
    // 设置 .md 文件类型
    `reg add "${rootKey}\\.md" /ve /d "${FILE_TYPE_ID}" /f`,

    // 创建文件类型描述
    `reg add "${rootKey}\\${FILE_TYPE_ID}" /ve /d "Markdown 文档" /f`,

    // 设置图标
    `reg add "${rootKey}\\${FILE_TYPE_ID}\\DefaultIcon" /ve /d "${iconPath}" /f`,

    // 设置打开命令
    `reg add "${rootKey}\\${FILE_TYPE_ID}\\shell\\open\\command" /ve /d "\\"${exePath}\\" \\"%1\\"" /f`,

    // 添加 "使用 0xNote 编辑" 右键菜单项
    `reg add "${rootKey}\\${FILE_TYPE_ID}\\shell\\edit" /ve /d "使用 ${APP_NAME} 编辑" /f`,
    `reg add "${rootKey}\\${FILE_TYPE_ID}\\shell\\edit\\command" /ve /d "\\"${exePath}\\" \\"%1\\"" /f`,

    // 添加 "新建 -> Markdown 文档" (ShellNew)
    // 这会在 Windows 右键菜单的 "新建" 子菜单中添加 "Markdown 文件"
    `reg add "${rootKey}\\.md\\ShellNew" /v "NullFile" /d "" /f`,
  ]

  for (const cmd of commands) {
    const result = await executeRegCommand(cmd)
    if (!result.success) {
      return result
    }
  }

  console.log('[Registry] 文件类型关联注册成功')
  return { success: true }
}

/**
 * 注册所有 Windows 集成（文件关联）
 * 注意：已移除目录背景右键菜单的注册，并会主动清理旧版本的残留项
 */
export async function registerWindowsIntegration(): Promise<RegistryResult> {
  console.log('[Registry] 开始注册 Windows 集成...')

  const fileResult = await registerFileAssociation()
  if (!fileResult.success) {
    return fileResult
  }

  // 主动清理旧版本的目录右键菜单（如果存在）
  const rootKey = isAdmin() ? 'HKCR' : 'HKCU\\Software\\Classes'
  const cleanupCommands = [
    `reg delete "${rootKey}\\Directory\\Background\\shell\\${APP_NAME}" /f`,
    `reg delete "${rootKey}\\Directory\\shell\\${APP_NAME}" /f`,
  ]

  for (const cmd of cleanupCommands) {
    try {
      await executeRegCommand(cmd)
    } catch {
      // 忽略删除失败（可能键不存在）
    }
  }

  // 通知 Shell 刷新图标缓存
  try {
    await execAsync('ie4uinit.exe -show')
  } catch {
    // 忽略刷新失败
  }

  console.log('[Registry] Windows 集成注册完成')
  return { success: true }
}

/**
 * 移除所有 Windows 集成
 * 注意：只删除 0xNote 添加的内容，不影响其他程序的 .md 文件关联
 */
export async function unregisterWindowsIntegration(): Promise<RegistryResult> {
  console.log('[Registry] 开始移除 Windows 集成...')

  const rootKey = isAdmin() ? 'HKCR' : 'HKCU\\Software\\Classes'

  // 1. 只删除 ShellNew 子键（右键 -> 新建 -> Markdown 文档）
  // 不删除 .md 整个键，避免影响其他程序的文件关联
  const shellNewCommands = [`reg delete "${rootKey}\\.md\\ShellNew" /f`]

  // 2. 删除 0xNote 的文件类型定义
  const fileTypeCommands = [`reg delete "${rootKey}\\${FILE_TYPE_ID}" /f`]

  // 3. 清理旧版目录右键菜单（如果有残留）
  const contextMenuCommands = [
    `reg delete "${rootKey}\\Directory\\Background\\shell\\${APP_NAME}" /f`,
    `reg delete "${rootKey}\\Directory\\shell\\${APP_NAME}" /f`,
  ]

  const allCommands = [...shellNewCommands, ...fileTypeCommands, ...contextMenuCommands]

  // 移除时忽略不存在的键
  for (const cmd of allCommands) {
    try {
      await execAsync(cmd, { encoding: 'utf-8' })
    } catch {
      // 忽略删除失败（可能键不存在）
    }
  }

  // 4. 如果 .md 的默认值是 0xNote.MarkdownFile，则清除它（但不删除整个键）
  try {
    const { stdout } = await execAsync(`reg query "${rootKey}\\.md" /ve`, { encoding: 'utf-8' })
    if (stdout.includes(FILE_TYPE_ID)) {
      await execAsync(`reg delete "${rootKey}\\.md" /ve /f`, { encoding: 'utf-8' })
      console.log('[Registry] 已清除 .md 默认关联')
    }
  } catch {
    // 忽略查询失败
  }

  // 5. 刷新 Shell 图标缓存
  try {
    await execAsync('ie4uinit.exe -show')
  } catch {
    // 忽略刷新失败
  }

  console.log('[Registry] Windows 集成已移除')
  return { success: true }
}

/**
 * 检查是否已注册
 */
export function isRegistered(): boolean {
  try {
    const rootKey = 'HKCU\\Software\\Classes'
    execSync(`reg query "${rootKey}\\${FILE_TYPE_ID}" /ve`, { encoding: 'utf-8', stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}
