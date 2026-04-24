# Architecture

This page explains how `iRefinedX` is put together and why the desktop wrapper approach is the current architecture.

## Core Design Decision

The local iRacing UI is already an Electron shell around the official web frontend. Because of that, `iRefinedX` does not try to replace the app.

Instead it:

- boots the official local UI
- preserves the native preload bridge and local-service wiring
- injects the `iRefinedX` web layer into the pages already rendered by the official app

That decision keeps the product aligned with the real iRacing UI behavior.

## Main Layers

### `desktop/`

This is the launcher/runtime-preparation layer.

Its responsibilities are:

- locate the installed iRacing UI
- extract `app.asar`
- patch the official `compiled/main.js`
- patch the official `compiled/preload.js`
- write the `iRefinedX` bootstrap module
- spawn the official `iRacingUI.exe`
- log runtime and network instrumentation
- run the GitHub Releases update check and show the desktop popup

### `extension/`

This is the injected enhancement layer.

It is still built like a browser extension because that structure gives:

- manifest-style script separation
- a stable Vite build
- a clean `main.js` entry point
- a practical fallback injection bundle

Inside the desktop runtime the same build artifacts are reused as the in-app enhancement layer.

## Injection Modes

`iRefinedX` supports two execution paths:

### Extension mode

If the runtime accepts the extension assets cleanly, the official UI loads them like a Chromium extension payload.

### Fallback mode

If extension-mode loading is unstable, the launcher injects the built JavaScript and CSS directly into the page.

The desktop runtime also injects a local `chrome.storage.local` polyfill so the same feature code can keep working in fallback mode.

## Native Interop

The patched preload keeps and extends the official bridge. `iRefinedX` adds interop for:

- minimize
- maximize
- restore
- close
- safe close override

That is what lets the native iRacing titlebar buttons remain the source of truth while the desktop wrapper hides conflicting outer-window behavior.

## Network And Session Visibility

The bootstrap layer instruments:

- `fetch`
- `XMLHttpRequest`
- websocket creation and open state
- Electron `webRequest`
- downloads that should trigger a Windows save dialog

These logs are written to `logs/*.jsonl` and are useful when validating registration, withdraw, queue and export behavior against the live local UI.

## Queue Architecture

Queue scheduling and persistence live in the injected layer, not the launcher. The launcher is only responsible for keeping the environment stable enough for the UI hooks to run.

Important boundary:

- queued sessions persist if the app closes
- queued sessions do not auto-register while the app is closed
- reopening the app does not retroactively trigger a missed queue slot

## Why The Old Browser-Only Model Was Dropped

The browser-only model could not faithfully preserve:

- local UI windowing behavior
- `electronTRPC`
- viewer/DLL integration
- local service flows
- native register/launch behavior

The current desktop-first design solves those problems by building on the official runtime instead of approximating it.
