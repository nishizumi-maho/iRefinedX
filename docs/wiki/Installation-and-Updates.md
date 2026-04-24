# Installation and Updates

This page explains the current desktop install model for `iRefinedX` and how release notifications behave.

## Runtime Prerequisites

`iRefinedX` assumes:

- Windows
- a working local iRacing installation
- the official `iRacingUI.exe` present under the normal iRacing UI directory, unless overridden by environment variables
- Node.js when running from source

## Local Source Flow

From the repository root:

1. build the injected web layer  
   `npm --prefix extension install`  
   `npm --prefix extension run build`
2. install the desktop launcher dependency  
   `npm --prefix desktop install`
3. start the launcher  
   `npm --prefix desktop start`

## What The Launcher Does On Start

At startup the desktop layer:

1. locates the installed iRacing UI
2. extracts the official `app.asar` if needed
3. patches the official `main.js` and `preload.js`
4. writes the `iRefinedX` bootstrap module into the extracted runtime
5. starts the official `iRacingUI.exe`
6. injects the built `iRefinedX` layer into matching pages

This is why the product behaves like the official local UI instead of a reimplementation.

## Installed App Discovery Flow

The packaged Windows app tries to locate the official iRacing UI automatically before it asks the user for anything.

Discovery order:

1. a previously saved `iRefinedX` UI path
2. the Windows `iracing://` protocol association in the registry
3. common default install locations such as `C:\Program Files (x86)\iRacing\ui` and `D:\Program Files (x86)\iRacing\ui`

If those checks fail, `iRefinedX` opens a folder picker. The user can select either the iRacing root folder or the `ui` folder directly. Once a valid folder is chosen, the app caches it locally and reuses it on future launches.

## Installer Options

The Windows installer is the intended release artifact for normal users.

It installs `iRefinedX` as its own launcher and exposes two install-time options:

- `Create a desktop shortcut`
- `Start iRefinedX when Windows starts`

`Create a desktop shortcut` is enabled by default. This keeps the official iRacing shortcut untouched while still making the modified launcher easy to access.

## Recommended End-User Install Flow

For a normal user, the intended flow is:

1. download `iRefinedX-Setup-*.exe` from GitHub Releases
2. close `iRefinedX` and `iRacing UI` if either is open
3. run the installer
4. keep the desktop shortcut enabled unless a dedicated shortcut is not wanted
5. finish the install and open `iRefinedX`
6. if prompted, point `iRefinedX` at the installed iRacing root or `ui` folder once

After installation:

- open `iRacing UI` for the untouched official runtime
- open `iRefinedX` for the injected runtime

## Update Detection

`iRefinedX` checks the latest GitHub Release through the public Releases API:

- desktop runtime popup: native desktop modal shown by the launcher
- in-app notice: update toolbar button plus settings-panel note inside the injected UI

Version metadata comes from:

- `desktop/package.json`
- `extension/package.json`
- `extension/vite.config.js`

Stable builds prefer stable GitHub Releases and ignore newer prereleases by default. Experimental builds can follow the prerelease channel.

## Update Behavior

When a newer release exists:

- a desktop popup is shown prominently
- the popup can open the latest release page directly
- the in-app UI also exposes the new version inside the toolbar and settings panel

The updater is notification-only. It does not silently replace files or patch the app in the background.

## Release Artifact Model

The intended public release artifact is a Windows installer published on GitHub Releases.

Portable development output can still exist for local testing, but the main user-facing distribution path is the installer.

The update popup deliberately points users to the release page instead of attempting a self-update.

## Upgrade Guidance

When a new release is published:

1. close `iRefinedX`
2. download the newer release installer
3. run the installer
4. reopen `iRefinedX`

## Uninstall Behavior

During uninstall, `iRefinedX` first tries to restore the original official UI files that were kept beside the injected runtime.

The uninstaller intentionally stops with an error if:

- `iRefinedX` is still open
- the official `iRacingUI.exe` is still open
- the runtime cleanup fails

That rule exists to avoid leaving the local UI in a half-restored state.

## Boundaries

- if GitHub has no release yet, no update is shown
- if the app is offline, the update check fails quietly and only logs the failure
- the updater does not depend on any private API or secret token
