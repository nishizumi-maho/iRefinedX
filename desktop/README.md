# iRefinedX Desktop Runtime

`iRefinedX` boots the installed local iRacing UI and injects the `iRefinedX` enhancement layer on top of the official app instead of trying to recreate the UI from scratch.

## What it does

- uses the installed `D:\Program Files (x86)\iRacing\ui\resources\app.asar` as the primary app
- keeps the official local UI preload, IPC, DLL and local-service behavior
- preserves the native iRacing register, withdraw and window-control flows
- loads the built `iRefinedX` web layer when possible
- falls back to direct script/CSS injection if the extension does not load
- logs HTTP/XHR/fetch/websocket activity into `logs/*.jsonl`
- checks GitHub Releases and raises a desktop update popup when a newer version is available

## Usage

1. Build the injected web layer:
   - `npm run build:extension`
2. Install desktop dependencies:
   - `npm install`
3. Start the shell:
   - `npm start`

## Installed App Behavior

The packaged `iRefinedX` app auto-discovers the official local iRacing UI by checking:

- the saved `iRefinedX` UI path cache
- the Windows protocol association for `iracing://`
- common default install locations

If auto-discovery fails, it opens a folder picker and accepts either the iRacing root folder or the `ui` folder directly. The chosen path is then cached under `%APPDATA%\iRefinedX\config\iracing-ui-dir.json`.

The NSIS installer is configured to show two English install options:

- `Create a desktop shortcut`
- `Start iRefinedX when Windows starts`

If your iRacing UI is installed in a non-standard location and you want to override discovery manually, set `IRACING_UI_DIR`.
