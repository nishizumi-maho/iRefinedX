# Source Map

This page is a quick navigation guide for the current repository.

## Root

- `README.md`: concise product overview
- `LICENSE`: MIT license
- `THIRD_PARTY_NOTICES.md`: third-party notice inventory
- `docs/`: wiki source and research notes
- `extension/`: injected enhancement layer
- `desktop/`: desktop launcher and runtime patching

## Desktop Runtime

- `desktop/main.cjs`: launcher entry point
- `desktop/prepare-runtime.cjs`: extracts and patches the official iRacing UI runtime
- `desktop/official-runtime-bootstrap-source.cjs`: runtime instrumentation, native interop, download handling and desktop update popup
- `desktop/README.md`: desktop runtime notes

## Injected Web Layer

- `extension/src/main.js`: feature bootstrap
- `extension/src/feature-manager.js`: feature registration and rerun coordination
- `extension/public/manifest.json`: build metadata for the injected layer

## Feature Hotspots

- `extension/src/features/auto-register.js`: queue, register, withdraw and persistence logic
- `extension/src/features/status-bar.jsx`: lower queue/status bar
- `extension/src/features/intelligence-center.js`: dashboard Intelligence Center
- `extension/src/features/go-racing-export.js`: per-session export actions
- `extension/src/features/share-hosted-session.jsx`: Hosted/League wizard tools
- `extension/src/features/share-test-session.jsx`: Test Drive sharing
- `extension/src/features/update-notice.js`: in-app update notice
- `extension/src/features/settings-panel.jsx`: settings UI

## Helper Hotspots

- `extension/src/helpers/settings.js`: default settings and persistence
- `extension/src/helpers/updates.js`: GitHub release check for the injected layer
- `extension/src/helpers/download.js`: save/export helpers
- `extension/src/helpers/websockets.js`: websocket state helper
- `extension/src/helpers/webui-locale.js`: language-aware button/session label matching

## Docs

- `docs/wiki/`: GitHub wiki source
- `docs/research/IRACING_UI_LOCAL_ANALYSIS.md`: runtime architecture reference
