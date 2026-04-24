## Summary
This PR converts the repository from the broken older browser-first packaging into the first desktop-first `iRefinedX` release candidate. It adds a Windows installer and GitHub Releases update flow, renames and documents the product as `iRefinedX`, preserves the MIT license plus `THIRD_PARTY_NOTICES.md`, and removes obsolete broken material from the previous branch of the project.

## User impact
Before this change there was no clean distributable desktop app flow. The repository still carried old release notes and browser-era artifacts, the GitHub release path was not aligned with the new repo, and the packaged desktop build could fail to bring the injected `iRefinedX` layer along when launched from an installed copy.

With this change, users get a dedicated `iRefinedX` launcher and installer instead of replacing the official iRacing shortcut. The app can auto-discover the official iRacing UI, prompt visibly when a newer GitHub Release exists, and install with English options for desktop shortcut creation and Windows auto-start.

## Root cause
The new desktop runtime work existed only as local iteration and was not yet packaged as a proper distributable app. The release flow still described and built the old runtime bundle model. In addition, the packaged launcher pathing and fallback injection assumptions were not robust enough for installed builds: the packaged root path could resolve incorrectly for the injected runtime, and the fallback loader still required a removed legacy `account-main.js` artifact.

## Fix
The PR adds a real `desktop/` Electron launcher package with runtime preparation, installer assets, and packaging scripts. It wires branding and update-check metadata to `nishizumi-maho/iRefinedX`, adds GitHub Release popup support in both the desktop launcher and injected UI, and introduces an NSIS installer with English checkboxes for desktop shortcut creation and Windows auto-start.

It also hardens runtime startup and discovery by:
- auto-discovering the official iRacing UI through cached path, protocol association, and common install locations
- prompting for the iRacing folder when discovery fails
- packaging the desktop app so the installed build points the bootstrap at the installed payload location
- making fallback injection independent of the removed `account-main.js`
- flushing the in-app update cache per repo slug so stale release notices from older local state do not keep surfacing

The repository cleanup removes stale changelog/wiki material and deleted financial widget code from the old broken version while keeping MIT licensing and third-party notices intact.

## Validation
I validated the source and packaged desktop flow with:
- `npm audit --omit=dev --prefix extension`
- `npm audit --prefix desktop`
- `npm --prefix extension run build`
- `npm --prefix desktop run check`
- `npm --prefix desktop run dist:win`

I also launched the packaged desktop app against the local official iRacing installation and verified:
- automatic discovery of `D:\Program Files (x86)\iRacing\ui`
- startup of the official `iRacingUI.exe`
- a visible `iRefinedX`-injected UI on the installed-path simulation
- updater popup wiring to the GitHub Releases flow

## Release notes
The packaged installer artifact produced by this branch is:
- `desktop/dist/iRefinedX-Setup-1.0.0-x64.exe`

This branch is intended to back the first experimental `v1` desktop prerelease.
