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

### iRefined
iRefinedX adapts selected assets and portions of code from the original iRefined project by Jason Murray.

Original project: https://github.com/jason-murray/irefined
Original license: MIT
The MIT License requires preserving the copyright notice and permission notice. The original notice is reproduced below.

MIT License

Copyright (c) 2026 Jason Murray

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Notes

- The official iRacing UI is not redistributed by this repository. `iRefinedX` expects an existing local iRacing installation.
- Third-party GitHub Actions used by CI remain governed by their own repositories and licenses.
