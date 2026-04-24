!include "LogicLib.nsh"
!include "nsDialogs.nsh"

!define AUTO_START_REG_PATH "Software\Microsoft\Windows\CurrentVersion\Run"
!define AUTO_START_REG_NAME "iRefinedX"
!define DESKTOP_SHORTCUT_NAME "iRefinedX.lnk"
!define APP_EXECUTABLE_NAME "iRefinedX.exe"

Var DialogHandle
Var DesktopShortcutCheckbox
Var AutoStartCheckbox
Var DesktopShortcutState
Var AutoStartState

!macro customHeader
  Page custom irefinedOptionsPageCreate irefinedOptionsPageLeave
!macroend

!macro customInstallMode
  StrCpy $isForceCurrentInstall 1
!macroend

Function irefinedOptionsPageCreate
  nsDialogs::Create 1018
  Pop $DialogHandle

  ${If} $DialogHandle == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 28u "Choose the Windows integration options for iRefinedX. You can change them later by reinstalling the app."
  Pop $0

  ${NSD_CreateCheckbox} 0 36u 100% 12u "Create a desktop shortcut"
  Pop $DesktopShortcutCheckbox
  ${NSD_Check} $DesktopShortcutCheckbox

  ${NSD_CreateCheckbox} 0 56u 100% 12u "Start iRefinedX when Windows starts"
  Pop $AutoStartCheckbox

  ReadRegStr $0 HKCU "${AUTO_START_REG_PATH}" "${AUTO_START_REG_NAME}"
  ${If} $0 != ""
    ${NSD_Check} $AutoStartCheckbox
  ${EndIf}

  nsDialogs::Show
FunctionEnd

Function irefinedOptionsPageLeave
  ${NSD_GetState} $DesktopShortcutCheckbox $DesktopShortcutState
  ${NSD_GetState} $AutoStartCheckbox $AutoStartState
FunctionEnd

!macro customInstall
  ${If} $DesktopShortcutState == 1
    CreateShortCut "$DESKTOP\${DESKTOP_SHORTCUT_NAME}" "$INSTDIR\${APP_EXECUTABLE_NAME}"
  ${Else}
    Delete "$DESKTOP\${DESKTOP_SHORTCUT_NAME}"
  ${EndIf}

  ${If} $AutoStartState == 1
    WriteRegStr HKCU "${AUTO_START_REG_PATH}" "${AUTO_START_REG_NAME}" '"$INSTDIR\${APP_EXECUTABLE_NAME}"'
  ${Else}
    DeleteRegValue HKCU "${AUTO_START_REG_PATH}" "${AUTO_START_REG_NAME}"
  ${EndIf}
!macroend

!macro customUnInstall
  DeleteRegValue HKCU "${AUTO_START_REG_PATH}" "${AUTO_START_REG_NAME}"
  Delete "$DESKTOP\${DESKTOP_SHORTCUT_NAME}"
!macroend
