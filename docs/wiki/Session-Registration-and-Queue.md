# Session Registration and Queue

This page documents how `iRefinedX` handles native registration and future-session queueing.

## Source Of Truth

`iRefinedX` now follows a simple rule:

- if the session is already open for direct registration, keep using the native iRacing UI buttons
- if the session is still closed, offer `Queue`

That rule keeps the current release much closer to the official UI.

## Current Behavior

### Open session

For the currently open race or qualifying slot:

- the top card keeps the native `Register`
- the lower table/list also keeps the native action
- `iRefinedX` does not replace those buttons with its own custom register button
- the `Race Queue` block can still expose `Queue for next race`, so the next race can stay queued even after the session has opened for direct registration

### Future session

For future sessions whose registration has not opened yet:

- `iRefinedX` can expose `Queue`
- the top `Race Queue` block keeps a dedicated `Queue for next race` button for the current next-race slot
- the queue stores the intended session and selected car context
- once the target session becomes actionable, the queue flow can register it

## Withdraw Behavior

Withdraw is handled against the real local UI/session state. The current release hardens this by treating websocket pushes as the truth source when possible, so `registering` or `withdrawing` does not remain stuck only because the DOM lagged.

## Queue Persistence

Queue state is stored locally and survives app restarts.

Current persistence goals:

- the queue bar is hydrated as soon as the app opens
- the user does not need to revisit the original series page to see pending queue entries
- closing and reopening the app does not erase the queue

## Important Offline Boundary

If the app is closed when a queued session reaches its registration time:

- `iRefinedX` does not register that session in the background
- reopening the app later still shows the queue entry
- the queue entry is not retroactively executed just because the app reopened

This is intentional. The queue engine only runs while the UI is actually open.

## Bottom Queue Bar

The lower queue bar is a compact persistent status strip. Current behavior:

- centered at the bottom of the UI
- grows horizontally as more sessions are queued
- orders sessions from nearest to farthest, left to right
- keeps the `IREF` control on the far right
- exposes the settings trigger even when the bar is compact

## Optional Queue Settings

Current queue-related settings include:

- enable/disable queue tools
- re-queue displaced registration
- queue registration sound
- queue sound volume

## Relevant Files

- `extension/src/features/auto-register.js`
- `extension/src/features/auto-register.css`
- `extension/src/features/status-bar.jsx`
- `extension/src/features/status-bar.css`
- `extension/src/helpers/websockets.js`
- `extension/src/helpers/webui-locale.js`
