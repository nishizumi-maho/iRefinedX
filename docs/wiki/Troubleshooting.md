# Troubleshooting

This page collects the most common current failure modes.

## The App Starts But The UI Looks Unmodified

Check:

- `extension/dist/` was built successfully
- the launcher was started from the current repository copy
- the runtime log shows `window-injected`
- the runtime did not fall back to an older build directory

Useful files:

- `desktop/runlogs/stdout-local-runtime.log`
- `logs/*.jsonl`

## Queue Bar Is Empty After Restart

Expected current behavior:

- queued sessions should hydrate immediately on app open
- you should not need to revisit the original series page

If it does not:

- check local storage for `iref_watch_queue`
- confirm the app is running the current built source
- inspect the latest `renderer-probe` log entries for queue count

## Queue Did Not Register While The App Was Closed

That is expected.

The queue is persistent, but it is not a background daemon. `iRefinedX` only executes queue actions while the UI is actually open.

## Register Or Withdraw Spins Forever

This usually means one of three things:

- the page state changed and the DOM did not refresh
- the websocket or local-service push did not reach the injected layer
- the user is testing an older build without the current websocket truth-source fixes

Check the latest runtime log for:

- `registration_status`
- `reg_registered`
- `reg_none`
- `reg_withdraw_response`

## Save Dialog Does Not Open For Session JSON

Check:

- the action is running inside the desktop runtime, not a plain browser
- the runtime log does not show `will-download` interception failures
- the page actually exposed a valid session export action

## Update Popup Does Not Appear

Check:

- the current release tag is newer than the local version
- the repo has at least one published GitHub Release
- outbound access to the GitHub Releases API is not blocked

If there is no published release yet, the updater has nothing to announce.

## iRacing Updated And The Wrapper Broke

The launcher patches extracted official files. After a real iRacing UI update, re-run the launcher and, if needed, inspect:

- `desktop/prepare-runtime.cjs`
- `desktop/official-runtime-bootstrap-source.cjs`
- the latest log for patching failures
