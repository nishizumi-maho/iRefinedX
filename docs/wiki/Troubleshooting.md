# Troubleshooting

## The App Opens But iRacing Content Update Keeps Reappearing

- Confirm the local iRacing installation is updated from the official UI.
- Restart iRefinedX after content finishes updating.
- If the helper service was interrupted, relaunch the app so the local bridge reconnects cleanly.

## Queue State Looks Wrong After Withdrawing

- Refresh the page or navigate away and back to the series page.
- iRefinedX should resync the native registration state and return the queue controls to the correct state.

## Join/Register Does Not Trigger

- Confirm the official local iRacing installation is still present.
- Confirm the local helper service can be reached on `127.0.0.1`.
- Confirm another desktop shell is not already blocking the same flow.

## Update Notice Does Not Open the Installer

- The notice opens the official GitHub release page or installer asset in the browser.
- If your default browser blocks the download, open the release page manually and download the latest installer.

## Diagnostics

Packaged builds write a reduced diagnostics log focused on failures and important operational events. The log lives in the application user data directory.
