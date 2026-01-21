; electron/installer.nsh
; 0xNote NSIS 自定义安装脚本
; 页面顺序：欢迎页 -> 安装目录 -> 组件选择 -> 安装 -> 完成

; 包含所需的 NSIS 头文件
!include "nsDialogs.nsh"
!include "LogicLib.nsh"

; ========== 安装程序专用代码（卸载程序阶段不需要） ==========
!ifndef BUILD_UNINSTALLER

; ========== 变量定义 ==========
Var Dialog
Var CheckboxDesktop
Var CheckboxContextMenu
Var CreateDesktopShortcut
Var AddContextMenu

; ========== 自定义页面：组件选择 ==========
Function ComponentsPage
  nsDialogs::Create 1018
  Pop $Dialog
  
  ${If} $Dialog == error
    Abort
  ${EndIf}
  
  ; 创建说明文本
  ${NSD_CreateLabel} 0 0 100% 24u "请选择要安装的可选组件："
  Pop $0
  
  ; 创建复选框：桌面快捷方式（默认选中）
  ${NSD_CreateCheckbox} 0 30u 100% 12u "创建桌面快捷方式"
  Pop $CheckboxDesktop
  ${NSD_Check} $CheckboxDesktop
  
  ; 创建复选框：右键菜单（默认选中）
  ${NSD_CreateCheckbox} 0 48u 100% 12u "添加右键菜单功能（新建 Markdown 文档）"
  Pop $CheckboxContextMenu
  ${NSD_Check} $CheckboxContextMenu
  
  ; 说明文本
  ${NSD_CreateLabel} 0 72u 100% 48u "提示：$\r$\n• 桌面快捷方式可在桌面快速启动 0xNote$\r$\n• 右键菜单可在文件资源管理器中快速新建 Markdown 文档"
  Pop $0
  
  nsDialogs::Show
FunctionEnd

; 保存用户选择
Function ComponentsPageLeave
  ${NSD_GetState} $CheckboxDesktop $CreateDesktopShortcut
  ${NSD_GetState} $CheckboxContextMenu $AddContextMenu
FunctionEnd

; ========== 注册自定义页面 ==========
; 使用 electron-builder 提供的 customPageAfterChangeDir 宏
; 确保页面顺序为：欢迎页 -> 安装目录 -> 组件选择 -> 安装 -> 完成
!macro customPageAfterChangeDir
  Page custom ComponentsPage ComponentsPageLeave
!macroend

!endif ; BUILD_UNINSTALLER

; ========== 安装时执行 ==========
!macro customInstall
  ; 1. 根据用户选择创建桌面快捷方式
  ${If} $CreateDesktopShortcut == ${BST_CHECKED}
    DetailPrint "正在创建桌面快捷方式..."
    CreateShortCut "$DESKTOP\${APP_FILENAME}.lnk" "$INSTDIR\${APP_EXECUTABLE_FILENAME}"
  ${Else}
    DetailPrint "跳过创建桌面快捷方式"
  ${EndIf}

  ; 2. 根据用户选择注册右键菜单
  ${If} $AddContextMenu == ${BST_CHECKED}
    DetailPrint "正在注册 Windows 集成..."
    nsExec::ExecToLog '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" --register'
  ${Else}
    DetailPrint "跳过注册 Windows 集成"
  ${EndIf}
!macroend

; ========== 卸载时执行 ==========
!macro customUnInstall
  ; 调用应用程序注销 Windows 集成（首选方式）
  DetailPrint "正在移除 Windows 集成..."
  nsExec::ExecToLog '"$INSTDIR\${APP_EXECUTABLE_FILENAME}" --unregister'
  
  ; ========== 精确清理注册表（仅删除 0xNote 添加的内容） ==========
  ; 注意：不删除 .md 整个键，避免影响其他程序的文件关联
  
  ; 1. 只删除 ShellNew 子键（右键 -> 新建 -> Markdown 文档）
  DetailPrint "清理新建菜单项..."
  nsExec::ExecToLog 'reg delete "HKCU\Software\Classes\.md\ShellNew" /f'
  nsExec::ExecToLog 'reg delete "HKCR\.md\ShellNew" /f'
  
  ; 2. 删除 0xNote 的文件类型定义（这是我们自己创建的，可以安全删除）
  DetailPrint "清理文件类型定义..."
  nsExec::ExecToLog 'reg delete "HKCU\Software\Classes\0xNote.md" /f'
  nsExec::ExecToLog 'reg delete "HKCR\0xNote.md" /f'
  
  ; 3. 清理旧版目录右键菜单（如果有残留）
  nsExec::ExecToLog 'reg delete "HKCU\Software\Classes\Directory\Background\shell\0xNote" /f'
  nsExec::ExecToLog 'reg delete "HKCU\Software\Classes\Directory\shell\0xNote" /f'
  nsExec::ExecToLog 'reg delete "HKCR\Directory\Background\shell\0xNote" /f'
  nsExec::ExecToLog 'reg delete "HKCR\Directory\shell\0xNote" /f'
  
  ; 4. 如果 .md 的默认值是 0xNote.md，则清除它（但不删除整个键）
  ; 这样其他程序的关联不会受影响
  nsExec::ExecToLog 'reg query "HKCU\Software\Classes\.md" /ve | findstr "0xNote.md" && reg delete "HKCU\Software\Classes\.md" /ve /f'
  
  ; 5. 刷新 Shell 图标缓存
  DetailPrint "刷新系统缓存..."
  nsExec::ExecToLog 'ie4uinit.exe -show'
  
  ; 6. 删除桌面快捷方式
  DetailPrint "删除快捷方式..."
  Delete "$DESKTOP\${APP_FILENAME}.lnk"
  Delete "$SMPROGRAMS\${APP_FILENAME}.lnk"
  
  DetailPrint "卸载清理完成"
!macroend
