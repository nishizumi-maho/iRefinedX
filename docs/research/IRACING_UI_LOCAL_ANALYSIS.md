# Local iRacing UI Analysis

Date: 2026-04-23  
Workspace: `E:\iracing X nativo`

## Installed app

- executable: `D:\Program Files (x86)\iRacing\ui\iRacingUI.exe`
- packaged app: `D:\Program Files (x86)\iRacing\ui\resources\app.asar`
- package name: `iracing-electron`
- version: `8.7.3`

## Confirmed architecture

The local iRacing UI is an Electron shell around the official web frontend, not a separate native UI implementation.

Confirmed entry points from the extracted `app.asar`:

- `package.json`
  - `main`: `compiled/main.js`
- preload:
  - `compiled/preload.js`

## Confirmed runtime behavior

From `compiled/main.js` and the extracted runtime:

- the main window loads the remote iRacing web app with `BrowserWindow.loadURL(...)`
- the base URL is assembled from environment and suffix, producing the `members-ng` style origin
- the app registers deep-link protocols like `iracing://`
- the renderer receives native APIs through `window.interop` and `window.electronTRPC`
- the main process talks to:
  - `iRacingViewer.dll`
  - the local iRacing service on `http://127.0.0.1:32034`
- the app registers host-window integration via:
  - `iRacingHostRegister`
  - `viewerSupportBegin`

## Local data and state

Observed local profile/state locations:

- roaming Electron profile:
  - `C:\Users\user\AppData\Roaming\iracing-electron`
- local data:
  - `C:\Users\user\AppData\Local\iRacing`

Important profile hints found in the live machine:

- `config.json` stores `subdomainSuffix`, zoom, theme, language and window state
- `DevToolsActivePort` exists in the profile, indicating Chromium devtools plumbing is present even if the port is not currently open

## Why the wrapper approach is the correct base

Because the installed app already:

- owns the preload bridge expected by the remote UI
- owns the DLL/local-service integrations needed for launch, viewer and sim flows
- owns the protocol/deep-link handling

the only realistic way to get a desktop app that stays functionally aligned with the local iRacing UI is:

1. boot the official local Electron app logic
2. instrument its network/websocket behavior
3. inject `iRefinedX` into that runtime

That is the approach implemented in `desktop/`.
