# THIRD PARTY NOTICES

`iRefinedX` is distributed under the MIT License. This repository also uses third-party open-source components during build and runtime preparation.

## Application Dependencies

### `@electron/asar`

- License: MIT
- Repository: <https://github.com/electron/asar>
- Usage: extracts the official local iRacing `app.asar` so the desktop runtime can patch the official Electron entry points.

### `dom-chef`

- License: MIT
- Repository: <https://github.com/kidonng/dom-chef>
- Usage: JSX-style DOM construction in the `iRefinedX` web layer.

### `select-dom`

- License: MIT
- Repository: <https://github.com/sindresorhus/select-dom>
- Usage: lightweight DOM selection helpers in the injected UI layer.

### `socket.io-client`

- License: MIT
- Repository: <https://github.com/socketio/socket.io-client>
- Usage: websocket connectivity used by queue and session-state helpers.

### `vite`

- License: MIT
- Repository: <https://github.com/vitejs/vite>
- Usage: build pipeline for the injected `iRefinedX` web layer.

### `vite-plugin-static-copy`

- License: MIT
- Repository: <https://github.com/sapphi-red/vite-plugin-static-copy>
- Usage: copies manifest, icons and bridge assets into the built distribution.

## Notes

- The official iRacing UI is not redistributed by this repository. `iRefinedX` expects an existing local iRacing installation.
- Third-party GitHub Actions used by CI remain governed by their own repositories and licenses.
