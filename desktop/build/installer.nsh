!include "LogicLib.nsh"
!include "nsDialogs.nsh"
!include "FileFunc.nsh"

!define AUTO_START_REG_PATH "Software\Microsoft\Windows\CurrentVersion\Run"
!define AUTO_START_REG_NAME "iRefinedX"
!define DESKTOP_SHORTCUT_NAME "iRefinedX.lnk"
!define APP_EXECUTABLE_NAME "iRefinedX.exe"
!define CLEANUP_COMMAND_LINE "--cleanup-installed-state"
!define UNINSTALL_APP_RUNNING_ERROR "Close iRefinedX and the iRacing UI before uninstalling, then try again."
!define UNINSTALL_CLEANUP_FAILED_ERROR "iRefinedX couldn't restore the original iRacing UI files. Close iRefinedX and the iRacing UI, then try uninstalling again."

!ifdef BUILD_UNINSTALLER
  !macro customCheckAppRunning
    nsExec::Exec `"$SYSDIR\cmd.exe" /C tasklist /FI "IMAGENAME eq ${APP_EXECUTABLE_NAME}" /FO CSV | "$SYSDIR\find.exe" /I "${APP_EXECUTABLE_NAME}"`
    Pop $0

    ${If} $0 == 0
      IfSilent +2
      MessageBox MB_OK|MB_ICONEXCLAMATION "${UNINSTALL_APP_RUNNING_ERROR}"
      SetErrorLevel 1
      Quit
    ${EndIf}

    nsExec::Exec `"$SYSDIR\cmd.exe" /C tasklist /FI "IMAGENAME eq iRacingUI.exe" /FO CSV | "$SYSDIR\find.exe" /I "iRacingUI.exe"`
    Pop $0

    ${If} $0 == 0
      IfSilent +2
      MessageBox MB_OK|MB_ICONEXCLAMATION "${UNINSTALL_APP_RUNNING_ERROR}"
      SetErrorLevel 1
      Quit
    ${EndIf}
  !macroend
!endif

!ifndef BUILD_UNINSTALLER
  Var DialogHandle
  Var DesktopShortcutCheckbox
  Var AutoStartCheckbox
  Var DesktopShortcutState
  Var AutoStartState
  Var InstallerForegroundRetryCount
  !define MUI_CUSTOMFUNCTION_GUIINIT irefinedInstallerGuiInit

  !macro customPageAfterChangeDir
    Page custom irefinedOptionsPageCreate irefinedOptionsPageLeave
  !macroend
!endif

!macro customInstallMode
  StrCpy $isForceCurrentInstall 1
!macroend

!ifndef BUILD_UNINSTALLER
  Function irefinedBringInstallerToFront
    ShowWindow $HWNDPARENT ${SW_SHOWNORMAL}
    BringToFront
    System::Call 'user32::SetWindowPos(p $HWNDPARENT, p -1, i 0, i 0, i 0, i 0, i 0x0013)'
    System::Call 'user32::SetForegroundWindow(p $HWNDPARENT)'
    System::Call 'user32::SetWindowPos(p $HWNDPARENT, p -2, i 0, i 0, i 0, i 0, i 0x0013)'
  FunctionEnd

  Function irefinedStopInstallerForegroundRetry
    ${NSD_KillTimer} irefinedRetryInstallerForeground
  FunctionEnd

  Function irefinedRetryInstallerForeground
    System::Call 'user32::GetForegroundWindow()p.r0'
    System::Call 'user32::IsWindowVisible(p $HWNDPARENT)i.r1'

    ${If} $1 <> 0
    ${AndIf} $0 == $HWNDPARENT
      Call irefinedStopInstallerForegroundRetry
      Return
    ${EndIf}

    Call irefinedBringInstallerToFront
    IntOp $InstallerForegroundRetryCount $InstallerForegroundRetryCount - 1

    ${IfThen} $InstallerForegroundRetryCount <= 0 ${|} Call irefinedStopInstallerForegroundRetry ${|}
  FunctionEnd

  Function irefinedInstallerGuiInit
    StrCpy $InstallerForegroundRetryCount 12
    Call irefinedBringInstallerToFront
    ${NSD_CreateTimer} irefinedRetryInstallerForeground 500
  FunctionEnd

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
!endif

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

  ${IfNot} ${isUpdated}
    ${If} ${FileExists} "$INSTDIR\${APP_EXECUTABLE_NAME}"
      ExecWait '"$INSTDIR\${APP_EXECUTABLE_NAME}" ${CLEANUP_COMMAND_LINE}' $0

      ${If} $0 != 0
        IfSilent +2
        MessageBox MB_OK|MB_ICONSTOP "${UNINSTALL_CLEANUP_FAILED_ERROR}"
        SetErrorLevel $0
        Abort
      ${EndIf}
    ${EndIf}
  ${EndIf}
!macroend
