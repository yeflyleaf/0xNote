; electron/installer.nsh
; 0xNote NSIS 自定义安装脚本
;
; 【功能】
; 1. 安装时注册 Windows 右键菜单和文件关联
; 2. 卸载时清理注册表
;
; 【调用方式】
; electron-builder 会在打包时自动调用此脚本

!include "MUI2.nsh"
!include "FileFunc.nsh"

; ========== 安装时执行 ==========
!macro customInstall
  ; 调用应用程序注册 Windows 集成
  ; --register 参数会触发静默注册模式
  DetailPrint "正在注册 Windows 集成..."
  nsExec::ExecToLog '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" --register'
  Pop $0
  ${If} $0 != 0
    DetailPrint "Windows 集成注册可能需要管理员权限，请在首次启动时手动注册"
  ${EndIf}
!macroend

; ========== 卸载时执行 ==========
!macro customUnInstall
  ; 调用应用程序注销 Windows 集成
  DetailPrint "正在移除 Windows 集成..."
  nsExec::ExecToLog '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" --unregister'
  
  ; 备用方案：直接删除注册表项（用户级别）
  DeleteRegKey HKCU "Software\Classes\.md"
  DeleteRegKey HKCU "Software\Classes\0xNote.MarkdownFile"
  DeleteRegKey HKCU "Software\Classes\Directory\Background\shell\0xNote"
  DeleteRegKey HKCU "Software\Classes\Directory\shell\0xNote"
  
  ; 清理应用数据目录（可选）
  ; RMDir /r "$INSTDIR\data"
!macroend
