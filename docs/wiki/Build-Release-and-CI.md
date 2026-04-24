# Build, Release, and CI

This page documents the current build and release model for the desktop-first `iRefinedX` repository.

## Local Build

### Extension layer

The injected UI layer lives in `extension/`.

Typical commands:

- `npm --prefix extension install`
- `npm --prefix extension run build`

This produces `extension/dist/`.

### Desktop layer

The launcher lives in `desktop/`.

Typical commands:

- `npm --prefix desktop install`
- `npm --prefix desktop run check`
- `npm --prefix desktop start`

## Version Sources

Current version metadata is maintained in:

- `desktop/package.json`
- `extension/package.json`
- `extension/public/manifest.json`

The current reset baseline is `v1`.

## CI Workflow

`.github/workflows/extension.yml` is now the main CI verification workflow.

It currently:

- installs extension dependencies
- builds the injected layer
- installs desktop dependencies
- syntax-checks the desktop runtime scripts

`.github/workflows/security-quality.yml` is the security workflow.

It currently:

- runs runtime dependency audits for `extension/` and `desktop/`
- runs CodeQL on the JavaScript codebase
- feeds GitHub code scanning so the Security and Quality area stays active

## Release Workflow

`.github/workflows/release.yml` now builds the Windows `iRefinedX` installer instead of the old browser-extension zip or runtime-only bundle.

Current release automation:

- runs on Windows
- installs Inno Setup on the runner
- builds `extension/dist/`
- prepares the packaged desktop app payload
- builds the unpacked desktop payload with `electron-builder --win dir`
- compiles the final Windows installer with `ISCC.exe`
- uploads the installer as the GitHub Release asset

The release page is also the target used by the in-app update popup.

## Wiki Sync Workflow

`.github/workflows/wiki-sync.yml` publishes `docs/wiki/` into the GitHub wiki.

That keeps detailed docs:

- versioned in the repository
- reviewable in normal diffs
- synced to the live wiki without manual copy-paste

## Recommended Release Checklist

1. keep `desktop/package.json`, `extension/package.json` and `manifest.json` aligned
2. build `extension/dist/`
3. run `npm --prefix desktop run check`
4. validate the packaged launcher against a real local iRacing install
5. build `npm --prefix desktop run dist:win`
6. publish the GitHub Release with the installer asset
7. verify the update popup resolves to the new release page
8. verify CodeQL and dependency audit checks are green before treating the release as final
