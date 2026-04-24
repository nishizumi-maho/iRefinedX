# iRefinedX

`iRefinedX` is a Windows desktop launcher that reuses the installed local iRacing UI and injects the `iRefinedX` enhancement layer into the official runtime.

It is not a fake clone of the iRacing UI. It boots the real local Electron app, keeps the native preload, local service, viewer integration and session handoff, then layers the `iRefinedX` features on top.

## Documentation

- Wiki: [github.com/nishizumi-maho/iRefinedX/wiki](https://github.com/nishizumi-maho/iRefinedX/wiki)
- Research/reference docs: [docs/research](docs/research)
- Releases: [github.com/nishizumi-maho/iRefinedX/releases](https://github.com/nishizumi-maho/iRefinedX/releases)
- Third-party notices: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)

The wiki is the primary technical reference. It documents the runtime architecture, feature behavior, storage model, privacy boundaries, troubleshooting and release flow in detail.

## What It Does

- boots the official local iRacing UI instead of replacing it
- keeps native register, withdraw, launch and viewer behavior
- adds queue tools for future sessions while preserving native register buttons for open sessions
- keeps the lower queue/status bar visible across app restarts
- adds the full-width `Intelligence Center` dashboard widget
- provides session JSON sharing and export helpers where the local UI supports them
- checks GitHub Releases and warns the user when a newer `iRefinedX` version exists

## What It Does Not Do

- it does not replace the installed iRacing binaries with a custom client
- it does not bypass iRacing authentication
- it does not automate driving inputs
- it does not keep queue automation alive while the app is closed
- it does not ship the iRacing UI itself inside this repository

## Requirements

- Windows
- local iRacing installation with the official `iRacingUI.exe`
- Node.js for source-based local builds
- an authenticated iRacing account

## Local Build And Run

1. Build the enhancement layer:
   - `npm --prefix extension install`
   - `npm --prefix extension run build`
2. Install launcher dependencies:
   - `npm --prefix desktop install`
3. Start `iRefinedX`:
   - `npm --prefix desktop start`

The launcher patches the extracted local iRacing UI runtime in place, then starts the official `iRacingUI.exe`.

## Installer Model

The Windows installer ships `iRefinedX` as its own app and shortcut. It does not overwrite the official iRacing shortcut or replace the official installation entry point.

On install, the user can choose:

- create a desktop shortcut
- start `iRefinedX` automatically with Windows

On first launch, `iRefinedX` tries to find the official iRacing UI automatically by checking:

- the saved `iRefinedX` UI path cache
- the `iracing://` protocol association in the Windows registry
- common default install paths such as `C:\Program Files (x86)\iRacing\ui` and `D:\Program Files (x86)\iRacing\ui`

If none of those match, the app opens a folder picker so the user can point `iRefinedX` at the installed iRacing directory once, then reuses that location on later launches.

## Update Model

`iRefinedX` checks [GitHub Releases](https://github.com/nishizumi-maho/iRefinedX/releases) and shows a visible popup when a newer version is available.

The updater only notifies. It does not silently self-update. The intended release artifact is a downloadable `iRefinedX` package or installer published on GitHub Releases.

## Security And Privacy Summary

- `npm audit --omit=dev --prefix extension`: clean
- `npm audit --omit=dev --prefix desktop`: clean
- tracked source was scanned for obvious secrets and credentials
- runtime logs, extracted app files, build output and local analysis folders are gitignored
- queue state and settings are stored locally on the machine running the app

## Repository Layout

- [`desktop/`](desktop): launcher, runtime patching and desktop-specific instrumentation
- [`extension/`](extension): browser extension source and build config
- [`docs/wiki/`](docs/wiki): source for the GitHub wiki
- [`docs/research/`](docs/research): deeper analysis/reference material
- [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md): third-party notices kept with the MIT-licensed source tree

## Support and Issues

- Use GitHub Issues for bug reports and feature requests.
- Include the `iRefinedX` version, the iRacing UI version, the affected page and a screenshot when the issue is UI-related.

## License and Affiliation

This repository is MIT licensed. `iRefinedX` is not affiliated with iRacing.
