// electron/main.ts
/**
 * 🖥️ Electron 主进程
 *
 * 负责：
 * - 创建和管理窗口
 * - 处理系统级 IPC 调用
 * - 文件系统操作
 * - 注册表集成（Windows）
 * - 命令行参数处理（--register / --unregister）
 */

import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

// 是否为开发模式
const isDev = !app.isPackaged

// ==================== 命令行参数处理 ====================
// 检查是否是注册表操作模式（静默模式）
const args = process.argv.slice(isDev ? 2 : 1)
const isRegisterMode = args.includes('--register')
const isUnregisterMode = args.includes('--unregister')
const isNewFileMode = args.includes('--new')

// 如果是注册表操作模式，立即处理并退出
if (isRegisterMode || isUnregisterMode) {
  // 不显示窗口，直接处理注册表
  app.whenReady().then(async () => {
    // 动态导入注册表模块（避免影响正常启动性能）
    const { registerWindowsIntegration, unregisterWindowsIntegration } = await import('./registry')

    if (isRegisterMode) {
      console.log('[Main] 静默模式：注册 Windows 集成')
      const result = await registerWindowsIntegration()
      process.exit(result.success ? 0 : 1)
    } else if (isUnregisterMode) {
      console.log('[Main] 静默模式：注销 Windows 集成')
      const result = await unregisterWindowsIntegration()
      process.exit(result.success ? 0 : 1)
    }
  })
} else {
  // ==================== 正常应用启动 ====================

  // ==================== 路径配置 ====================
  // 强制将用户数据（缓存、配置、Local Storage 等）存储在应用安装目录下的 data 文件夹
  // ⚠️ 注意：此路径配置仅适用于 PC 客户端 (Electron)，绝对不要影响移动端 (HarmonyOS)
  // 移动端应使用系统默认的沙箱路径
  // 必须在 app 'ready' 事件之前设置
  try {
    let dataPath = ''
    if (isDev) {
      // 开发模式：项目根目录/data
      dataPath = path.join(process.cwd(), 'data')
    } else {
      // 生产模式：可执行文件同级目录/data
      dataPath = path.join(path.dirname(process.execPath), 'data')
    }

    app.setPath('userData', dataPath)
    console.log(`[Main] UserData path set to: ${dataPath}`)
  } catch (error) {
    console.error('[Main] Failed to set UserData path:', error)
  }

  // 主窗口引用
  let mainWindow: BrowserWindow | null = null

  /**
   * 创建主窗口
   */
  function createWindow(): void {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 600,
      minHeight: 400,
      title: '0xNote',
      icon: path.join(__dirname, '../public/icon.ico'),
      frame: true, // 使用系统标题栏，后续可改为 false 实现自定义
      backgroundColor: '#1e1e2e',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
    })

    // 加载页面
    if (isDev) {
      // 开发模式：加载开发服务器
      mainWindow.loadURL('http://localhost:5173')
      mainWindow.webContents.openDevTools()
    } else {
      // 生产模式：加载打包后的页面
      mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }

    // 窗口关闭时清除引用
    mainWindow.on('closed', () => {
      mainWindow = null
    })

    // 外部链接在默认浏览器打开
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })
  }

  // ==================== IPC Handlers ====================

  /**
   * 读取文件
   */
  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8')
      return { success: true, data: content }
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      return { success: false, error: err.message, errorCode: err.code }
    }
  })

  /**
   * 写入文件
   */
  ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
    try {
      await fs.promises.writeFile(filePath, content, 'utf-8')
      return { success: true }
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      return { success: false, error: err.message, errorCode: err.code }
    }
  })

  /**
   * 检查文件是否存在
   */
  ipcMain.handle('fs:exists', async (_event, filePath: string) => {
    try {
      await fs.promises.access(filePath)
      return true
    } catch {
      return false
    }
  })

  /**
   * 获取文件信息
   */
  ipcMain.handle('fs:getMetadata', async (_event, filePath: string) => {
    try {
      const stats = await fs.promises.stat(filePath)
      const fileName = path.basename(filePath)
      return {
        success: true,
        data: {
          fileName,
          filePath,
          size: stats.size,
          lastModified: stats.mtimeMs,
          isReadOnly: false, // TODO: 检查只读属性
        },
      }
    } catch (error) {
      const err = error as NodeJS.ErrnoException
      return { success: false, error: err.message }
    }
  })

  /**
   * 打开文件对话框
   */
  ipcMain.handle('dialog:openFile', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: '打开 Markdown 文件',
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown'] },
        { name: '所有文件', extensions: ['*'] },
      ],
      properties: ['openFile'],
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: '用户取消' }
    }
    return { success: true, data: result.filePaths[0] }
  })

  /**
   * 保存文件对话框
   */
  ipcMain.handle('dialog:saveFile', async (_event, defaultFileName: string) => {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: '保存 Markdown 文件',
      defaultPath: defaultFileName,
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: '所有文件', extensions: ['*'] },
      ],
    })

    if (result.canceled || !result.filePath) {
      return { success: false, error: '用户取消' }
    }
    return { success: true, data: result.filePath }
  })

  /**
   * 获取启动参数（用于右键打开文件）
   */
  ipcMain.handle('app:getLaunchArgs', () => {
    return process.argv.slice(isDev ? 2 : 1)
  })

  /**
   * 获取 --new 参数指定的目录（从右键菜单新建文件）
   */
  ipcMain.handle('app:getNewFileDirectory', () => {
    if (isNewFileMode) {
      const newIndex = args.indexOf('--new')
      if (newIndex !== -1 && args[newIndex + 1]) {
        return args[newIndex + 1]
      }
    }
    return null
  })

  // ==================== 注册表集成 ====================

  // 延迟导入避免影响启动性能
  let registryModule: typeof import('./registry') | null = null

  async function getRegistryModule() {
    if (!registryModule) {
      registryModule = await import('./registry')
    }
    return registryModule
  }

  /**
   * 注册 Windows 集成（文件关联 + 右键菜单）
   */
  ipcMain.handle('registry:register', async () => {
    if (process.platform !== 'win32') {
      return { success: false, error: '仅支持 Windows 平台' }
    }
    const { registerWindowsIntegration } = await getRegistryModule()
    return await registerWindowsIntegration()
  })

  /**
   * 移除 Windows 集成
   */
  ipcMain.handle('registry:unregister', async () => {
    if (process.platform !== 'win32') {
      return { success: false, error: '仅支持 Windows 平台' }
    }
    const { unregisterWindowsIntegration } = await getRegistryModule()
    return await unregisterWindowsIntegration()
  })

  /**
   * 检查是否已注册
   */
  ipcMain.handle('registry:isRegistered', async () => {
    if (process.platform !== 'win32') {
      return false
    }
    const { isRegistered } = await getRegistryModule()
    return isRegistered()
  })

  // ==================== 生命周期 ====================

  app.whenReady().then(async () => {
    createWindow()

    // Windows: 首次启动时自动注册文件关联和右键菜单
    if (process.platform === 'win32' && app.isPackaged) {
      const { isRegistered, registerWindowsIntegration } = await getRegistryModule()
      if (!isRegistered()) {
        console.log('[Main] 首次启动，自动注册 Windows 集成...')
        const result = await registerWindowsIntegration()
        if (!result.success) {
          console.warn('[Main] Windows 集成注册失败:', result.error)
        }
      }
    }

    // macOS: 点击 dock 图标时重新创建窗口
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })

  // 所有窗口关闭时退出（macOS 除外）
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  // 安全：阻止导航到其他页面
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-navigate', (event) => {
      event.preventDefault()
    })
  })
}
