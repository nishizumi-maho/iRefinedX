# Architecture

## Electron Shell

The app wraps the official iRacing web UI inside an Electron window configured to behave like the local desktop client.

Key responsibilities:

- Single-instance enforcement
- Native-like title bar handling
- Window state persistence
- External link handling
- GitHub release update checks

## Preload Layer

The preload script injects the iRefinedX enhancement bundle and bridges the renderer to native Electron IPC.

Key responsibilities:

- Chrome extension compatibility shim
- Local helper/content-update bridge
- Join interception
- Queue and registration state persistence
- In-app update notice injection

## Native Bridge

The native bridge integrates with local iRacing components for actions that require the installed desktop environment.

Key responsibilities:

- Native service and viewer integration
- Replay, AI roster, and local file helpers
- Join and sim-launch workflows
- Local install and version detection

## iRefinedX Bundle

The injected bundle provides the enhancement layer:

- Queue bar
- Intelligence Center
- Session export controls
- Queue/register helpers
- Desktop-specific styling adjustments

## Installer

The Windows installer is built with Electron Builder and NSIS.

Key responsibilities:

- Upgrade-in-place installs
- Stopping a running instance before replacing files
- Optional startup registration
- Optional desktop shortcut creation
