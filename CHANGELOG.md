# Changelog

All notable changes to this project will be documented in this file.

## v1 - 2026-04-23

- Introduced the Windows desktop launcher package for `iRefinedX`.
- Shipped a dedicated NSIS installer with desktop shortcut and Windows auto-start options.
- Added GitHub Releases update checks with a visible in-app update popup.
- Added automatic iRacing UI discovery with manual folder fallback and `remember` or `use once` behavior.
- Switched the runtime model to rebuild a managed working copy of the current official local iRacing UI on each launch.
- Preserved the official iRacing shortcut path by keeping the `iRefinedX` runtime separate from the normal local UI entry point.
- Added uninstall cleanup for local launcher state and managed runtime files.
- Reworked the README and wiki for desktop installation, updates, privacy, and troubleshooting.
- Kept the MIT license and `THIRD_PARTY_NOTICES.md`.
