# Session Sharing and Exports

This page documents the current session sharing and export tools in `iRefinedX`.

## Current Supported Areas

### Hosted / Leagues create-race flows

The create-race wizard can expose JSON import/export helpers so session setup can be moved between runs without re-entering the entire configuration by hand.

### Test Drive

Test Drive has its own narrower sharing flow and remains a separate feature toggle.

### Per-session export buttons

Where the live page exposes enough session context, `iRefinedX` can add `Export Session JSON` to individual sessions.

## Current UI Policy

The heavy aggregate page-header export buttons for Hosted and Leagues are currently hidden to reduce clutter.

That leaves the more context-specific per-session actions as the visible path.

## Save Dialog Behavior

Inside the desktop runtime, JSON exports are wired to the real Windows save flow.

That matters because browser-style download behavior is not enough inside the patched local UI. The desktop layer catches the relevant downloads and keeps the save dialog behavior consistent.

## Safety Boundaries

These tools only operate on page state already visible to the logged-in user. They do not bypass:

- entitlement checks
- server-side validation
- hidden admin-only options

## Settings Surface

The current settings panel can:

- enable/disable Test Drive session sharing
- enable/disable Hosted/League session tools
- hide go-racing JSON export buttons

## Relevant Files

- `extension/src/features/share-hosted-session.jsx`
- `extension/src/features/share-test-session.jsx`
- `extension/src/features/go-racing-export.js`
- `extension/src/helpers/download.js`
- `desktop/official-runtime-bootstrap-source.cjs`
