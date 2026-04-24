#ifndef AppVersion
#define AppVersion "1.1.0"
#endif

#ifndef AppDisplayVersion
#define AppDisplayVersion "v1.1"
#endif

#ifndef AppPublisher
  #define AppPublisher "nishizumi-maho"
#endif

#ifndef AppRepositoryUrl
  #define AppRepositoryUrl "https://github.com/nishizumi-maho/iRefinedX"
#endif

#ifndef PackagedDir
  #define PackagedDir "..\dist\win-unpacked"
#endif

#ifndef OutputDir
  #define OutputDir "..\dist"
#endif

#define AppName "iRefinedX"
#define AppExeName "iRefinedX.exe"
#define AppMutexName "Global\iRefinedX.Installer"
#define AutoStartValueName "iRefinedX"
#define CleanupArgument "--cleanup-installed-state"
#define DesktopShortcutName "iRefinedX"

[Setup]
AppId={{AFB259CA-B625-53AC-95DE-D9AF2397C4E0}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppDisplayVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppRepositoryUrl}
AppSupportURL={#AppRepositoryUrl}
AppUpdatesURL={#AppRepositoryUrl}
DefaultDirName={localappdata}\Programs\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
UsePreviousAppDir=yes
UsePreviousTasks=yes
OutputDir={#OutputDir}
OutputBaseFilename=iRefinedX-Setup-{#AppVersion}-x64
SetupIconFile=icon.ico
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName}
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
PrivilegesRequired=lowest
WizardStyle=modern
Compression=lzma2/normal
SolidCompression=yes
ChangesAssociations=no
SetupMutex={#AppMutexName}
CloseApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"
Name: "autostart"; Description: "Start iRefinedX when Windows starts"; Flags: unchecked

[Files]
Source: "{#PackagedDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{autoprograms}\{#AppName}"; Filename: "{app}\{#AppExeName}"; WorkingDir: "{app}"
Name: "{autodesktop}\{#DesktopShortcutName}"; Filename: "{app}\{#AppExeName}"; WorkingDir: "{app}"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "{#AutoStartValueName}"; ValueData: """{app}\{#AppExeName}"""; Tasks: autostart; Flags: uninsdeletevalue

[Run]
Filename: "{app}\{#AppExeName}"; Description: "Launch {#AppName}"; WorkingDir: "{app}"; Flags: nowait postinstall skipifsilent

[Code]
const
  AutoStartRegPath = 'Software\Microsoft\Windows\CurrentVersion\Run';
  AppRunningError = 'Close iRefinedX before installing, then try again.';
  UninstallAppRunningError = 'Close iRefinedX and the iRacing UI before uninstalling, then try again.';
  UninstallCleanupFailedError = 'iRefinedX couldn''t restore the original iRacing UI files. Close iRefinedX and the iRacing UI, then try uninstalling again.';

function IsProcessRunning(const ExeName: string): Boolean;
var
  ResultCode: Integer;
  Params: string;
begin
  Params :=
    '/C tasklist /FI "IMAGENAME eq ' + ExeName + '" /FO CSV | ' +
    ExpandConstant('{sys}\find.exe') + ' /I "' + ExeName + '"';
  Result :=
    Exec(ExpandConstant('{cmd}'), Params, '', SW_HIDE, ewWaitUntilTerminated, ResultCode) and
    (ResultCode = 0);
end;

procedure ApplyIntegrationSelections;
begin
  if not WizardIsTaskSelected('desktopicon') then
    DeleteFile(ExpandConstant('{autodesktop}\{#DesktopShortcutName}.lnk'));

  if not WizardIsTaskSelected('autostart') then
    RegDeleteValue(HKCU, AutoStartRegPath, '{#AutoStartValueName}');
end;

function InitializeSetup(): Boolean;
begin
  Result := True;

  if IsProcessRunning('{#AppExeName}') then begin
    MsgBox(AppRunningError, mbCriticalError, MB_OK);
    Result := False;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
    ApplyIntegrationSelections;
end;

function InitializeUninstall(): Boolean;
var
  ResultCode: Integer;
begin
  Result := False;

  if IsProcessRunning('{#AppExeName}') or IsProcessRunning('iRacingUI.exe') then begin
    MsgBox(UninstallAppRunningError, mbCriticalError, MB_OK);
    Exit;
  end;

  if FileExists(ExpandConstant('{app}\{#AppExeName}')) then begin
    if not Exec(
      ExpandConstant('{app}\{#AppExeName}'),
      '{#CleanupArgument}',
      ExpandConstant('{app}'),
      SW_HIDE,
      ewWaitUntilTerminated,
      ResultCode
    ) then begin
      MsgBox(UninstallCleanupFailedError, mbCriticalError, MB_OK);
      Exit;
    end;

    if ResultCode <> 0 then begin
      MsgBox(UninstallCleanupFailedError, mbCriticalError, MB_OK);
      Exit;
    end;
  end;

  Result := True;
end;
