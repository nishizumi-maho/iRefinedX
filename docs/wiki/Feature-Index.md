# Feature Index

This is the current active feature map for `iRefinedX`.

## Core Runtime

- boots the official installed `iRacingUI.exe`
- keeps official preload, local-service and viewer plumbing
- exposes working native window controls through the local UI
- keeps low-noise runtime diagnostics on by default and verbose network diagnostics opt-in

## Registration And Queue

- native `Register` and `Withdraw` remain the primary controls for sessions that are already open
- `Queue` is used for future sessions that are not yet open for direct registration
- queue tools support race and qualifying flows exposed by the page
- queue bar persists across app restarts
- queue bar stays visible immediately after app launch, without needing to revisit the series page
- optional queue sound and displaced-registration requeue behavior

## Dashboard

- `Intelligence Center` only
- full-width layout
- no legacy financial widget

## Sharing And Export

- Test Drive session sharing
- Hosted and League create-race tools
- per-session `Export Session JSON` where the page exposes session context
- Windows save dialog support through the desktop runtime

## Quality-Of-Life UI Tweaks

- session-type join button text
- optional no-toasts / auto-close toasts
- optional sidebar hiding
- optional collapsed left menu
- optional log panel

## Release And Update Visibility

- desktop popup when a newer GitHub Release exists
- in-app update button and update note

## Deliberately Removed Or Disabled

- old browser-only distribution flow
- financial widget line
- clutter-heavy aggregate export buttons on Hosted/Leagues page headers
