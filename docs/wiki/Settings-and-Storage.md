# Settings and Storage

This page documents the current user-facing settings and the main local storage keys used by `iRefinedX`.

## Primary Settings Object

User settings are stored in local storage under:

- `iref_settings`

## Current Settings Keys

The current settings object includes:

- `share-test-session`
- `share-hosted-session`
- `hide-go-racing-json-export-buttons`
- `auto-register`
- `queue-requeue-displaced-registration`
- `queue-register-sound`
- `queue-register-sound-volume`
- `better-join-button`
- `dashboard-intelligence-center`
- `no-toasts`
- `auto-close-toasts`
- `toast-timeout-s`
- `no-sidebars`
- `collapse-menu`
- `logger`

## Queue And Registration Storage

Queue and registration state use:

- `iref_watch_queue`
- `iref_registration_state`

Additional per-season remembered car picks use:

- `selected_car_season_<contentId>`

## Update-Notice Storage

The update-notice logic uses:

- `iref_release_info` for cached GitHub release info
- `iref_update_popup_seen_tag` in `sessionStorage` to avoid reopening the same in-app popup repeatedly in the same session

## Fallback Desktop Storage Shim

When the runtime is in fallback-injection mode, the desktop layer provides a `chrome.storage.local` polyfill backed by local storage using the prefix:

- `irefined-electron-storage::`

That keeps the injected feature layer working without a full browser-extension container.

## Storage Philosophy

The active storage model is intentionally local and narrow:

- no cloud sync
- no credential storage as a product feature
- no background service database
- enough persistence to survive app restarts and preserve user intent

## Relevant Files

- `extension/src/helpers/settings.js`
- `extension/src/features/auto-register.js`
- `extension/src/helpers/updates.js`
- `desktop/official-runtime-bootstrap-source.cjs`
