# iRefinedX

`iRefinedX` is a separate Windows launcher for the local iRacing UI.

Inside the UI, the short name is `iReX`. The full app name, installer name, release name, and repository name stay `iRefinedX`.

## Download and install

1. Open the Releases page:
   - [https://github.com/nishizumi-maho/iRefinedX/releases](https://github.com/nishizumi-maho/iRefinedX/releases)
2. Download the latest Windows installer:
   - `iRefinedX-Setup-1.0.0-x64.exe`
3. Run the installer.
4. Choose the Windows options you want:
   - `Create a desktop shortcut`
   - `Start iRefinedX when Windows starts`
5. Finish the install and open `iRefinedX`.

## What happens on first launch

`iRefinedX` tries to find your official local `iRacingUI.exe` automatically.

If it cannot find the install, or if it finds more than one valid iRacing installation, it opens a folder picker. You can then:

- choose the iRacing root folder or the `ui` folder directly
- tell `iRefinedX` to remember that choice
- or use that folder only for the current launch

The saved choice is local to your PC and is removed when `iRefinedX` is uninstalled.

## Official UI vs iRefinedX

- Use the normal iRacing shortcut to open the official local UI.
- Use the `iRefinedX` shortcut to open the modified UI with the iReX layer.

`iRefinedX` now works from a fresh managed copy of the current official local UI every time it starts. That means:

- the official iRacing UI files stay available for the official shortcut
- if iRacing updates its local UI, the next `iRefinedX` launch rebuilds its working copy from the new official version
- uninstalling `iRefinedX` removes its own saved state and managed runtime copy

## What iRefinedX adds

- the real local iRacing UI, not a fake clone
- native iRacing register, withdraw, launch, viewer, and local-service behavior
- iReX queue tools for future sessions
- lower queue/status bar persistence across restarts
- the full-width `Intelligence Center`
- session JSON export helpers where supported
- a visible update popup when a newer GitHub Release exists

## Updating

`iRefinedX` checks GitHub Releases and shows a popup when a newer version is available.

It does not silently self-update. To update:

1. download the newer installer from Releases
2. run it on top of the existing install
3. reopen `iRefinedX`

The installer is configured to update the existing installation in place instead of treating that as a full uninstall.

## Uninstall

Removing `iRefinedX` cleans up:

- its desktop shortcut and Windows auto-start entry
- its saved iRacing UI path choice
- its managed runtime copy
- its local app data used by the launcher

## Privacy and security

- no extra analytics or telemetry are added by `iRefinedX`
- queue state and app settings stay on the local machine
- update checks only talk to GitHub Releases for this repository
- tracked source was checked for obvious secrets and credentials
- `npm audit --omit=dev --prefix extension`: clean
- `npm audit --omit=dev --prefix desktop`: clean
- CodeQL and Dependabot are configured for the repository

## Documentation

- Releases: [https://github.com/nishizumi-maho/iRefinedX/releases](https://github.com/nishizumi-maho/iRefinedX/releases)
- Wiki: [https://github.com/nishizumi-maho/iRefinedX/wiki](https://github.com/nishizumi-maho/iRefinedX/wiki)
- Research docs: [docs/research](docs/research)
- Third-party notices: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
- Security policy: [SECURITY.md](SECURITY.md)

## From source

1. `npm --prefix extension install`
2. `npm --prefix extension run build`
3. `npm --prefix desktop install`
4. `npm --prefix desktop start`

## License and affiliation

This repository is MIT licensed. `iRefinedX` is not affiliated with iRacing.
