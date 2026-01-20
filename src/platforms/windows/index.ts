// src/platforms/windows/index.ts
/**
 * 🪟 Windows 平台实现统一导出
 *
 * 此文件导出所有 Windows 平台特定的实现类。
 * 业务层通过平台 Adapter 使用这些实现，不直接导入。
 */

export { WindowsConfigService } from './WindowsConfigService'
export { WindowsFileSystem } from './WindowsFileSystem'
export { WindowsSystemMenu } from './WindowsSystemMenu'

