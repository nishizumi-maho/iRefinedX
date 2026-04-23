!include "MUI2.nsh"
!include "LogicLib.nsh"
!include "nsDialogs.nsh"

Var IrxOptionsDialog
Var IrxStartupCheckbox
Var IrxDesktopCheckbox
Var IrxStartupState
Var IrxDesktopState

Page Custom IrxOptionsPageCreate IrxOptionsPageLeave

Function IrxOptionsPageCreate
  !insertmacro MUI_HEADER_TEXT "Windows Integration" "Choose how iRefinedX should integrate with Windows."
  nsDialogs::Create 1018
  Pop $IrxOptionsDialog

  ${If} $IrxOptionsDialog == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 24u "These options are applied after the files are installed. Existing choices can be updated during an upgrade."
  Pop $0

  ${NSD_CreateCheckbox} 0 32u 100% 10u "Start iRefinedX with Windows"
  Pop $IrxStartupCheckbox

  ReadRegStr $0 HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "iRefinedX"
  ${If} $0 != ""
    ${NSD_Check} $IrxStartupCheckbox
    StrCpy $IrxStartupState ${BST_CHECKED}
  ${Else}
    StrCpy $IrxStartupState ${BST_UNCHECKED}
  ${EndIf}

  ${NSD_CreateCheckbox} 0 52u 100% 10u "Create a desktop shortcut"
  Pop $IrxDesktopCheckbox
  ${NSD_Check} $IrxDesktopCheckbox
  StrCpy $IrxDesktopState ${BST_CHECKED}

  nsDialogs::Show
FunctionEnd

Function IrxOptionsPageLeave
  ${NSD_GetState} $IrxStartupCheckbox $IrxStartupState
  ${NSD_GetState} $IrxDesktopCheckbox $IrxDesktopState
FunctionEnd

!macro customWelcomePage
  !insertmacro MUI_PAGE_WELCOME
!macroend

!macro customInit
  StrCpy $IrxStartupState ${BST_UNCHECKED}
  StrCpy $IrxDesktopState ${BST_CHECKED}
  ExecWait '"$SYSDIR\taskkill.exe" /F /T /IM IRX.exe' $0
  ExecWait '"$SYSDIR\taskkill.exe" /F /T /IM iRefinedX.exe' $0
  ExecWait '"$SYSDIR\taskkill.exe" /F /T /IM iRacingUI.exe' $0
  ExecWait '"$SYSDIR\taskkill.exe" /F /T /IM "Projeto Secreto Launcher.exe"' $0
  Sleep 1200
!macroend

!macro customInstall
  ExecWait '"$SYSDIR\taskkill.exe" /F /T /IM IRX.exe' $0
  ExecWait '"$SYSDIR\taskkill.exe" /F /T /IM iRefinedX.exe' $0
  ExecWait '"$SYSDIR\taskkill.exe" /F /T /IM iRacingUI.exe' $0
  ExecWait '"$SYSDIR\taskkill.exe" /F /T /IM "Projeto Secreto Launcher.exe"' $0
  Sleep 1200
  ${If} $IrxStartupState == ${BST_CHECKED}
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "iRefinedX" '"$INSTDIR\IRX.exe"'
  ${Else}
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "iRefinedX"
  ${EndIf}

  ${If} $IrxDesktopState == ${BST_CHECKED}
    CreateShortcut "$DESKTOP\iRefinedX.lnk" "$INSTDIR\IRX.exe"
  ${Else}
    Delete "$DESKTOP\iRefinedX.lnk"
  ${EndIf}
!macroend

!macro customUnInstall
  ExecWait '"$SYSDIR\taskkill.exe" /F /T /IM IRX.exe' $0
  ExecWait '"$SYSDIR\taskkill.exe" /F /T /IM iRefinedX.exe' $0
  ExecWait '"$SYSDIR\taskkill.exe" /F /T /IM iRacingUI.exe' $0
  ExecWait '"$SYSDIR\taskkill.exe" /F /T /IM "Projeto Secreto Launcher.exe"' $0
  Sleep 1200
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "iRefinedX"
  Delete "$DESKTOP\iRefinedX.lnk"
!macroend
