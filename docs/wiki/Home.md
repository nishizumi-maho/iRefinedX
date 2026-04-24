# iRefinedX Wiki

`iRefinedX` is a desktop-first wrapper around the official local iRacing UI.

The project does not try to rebuild the iRacing app from scratch. Instead, it starts the installed `iRacingUI.exe`, patches the official Electron runtime just enough to add instrumentation and interop hooks, then injects the `iRefinedX` enhancement layer into the real `members-ng` pages the local UI already loads.

## What This Wiki Covers

- how the launcher boots and patches the official local UI
- where the injected feature layer lives and how it is built
- which features are still active in the current product
- how queue persistence, native register/withdraw and session exports behave
- what data is stored locally
- how GitHub Releases updates are checked and surfaced
- what is deliberately excluded from the product
- how CI, release packaging and wiki publication are wired

## Recommended Reading Order

1. [Installation and Updates](Installation-and-Updates)
2. [Architecture](Architecture)
3. [Feature Index](Feature-Index)
4. [Session Registration and Queue](Session-Registration-and-Queue)
5. [Dashboard Intelligence Center](Dashboard-Intelligence-Center)
6. [Session Sharing and Exports](Session-Sharing-and-Exports)
7. [Settings and Storage](Settings-and-Storage)
8. [Privacy, Security, and Data Handling](Privacy-Security-and-Data-Handling)
9. [Build, Release, and CI](Build-Release-and-CI)
10. [Source Map](Source-Map)
11. [Troubleshooting](Troubleshooting)

## Current Product Scope

`iRefinedX` currently focuses on:

- preserving the native iRacing UI and its local-service behavior
- adding queue tools for future sessions
- leaving native `Register` and `Withdraw` actions in place for already-open sessions
- keeping the queue bar persistent and visible across app restarts
- adding the dashboard `Intelligence Center`
- providing session JSON sharing and export tools where the local UI supports them
- surfacing new GitHub releases to the user through an obvious popup

## Current Exclusions

The following are intentionally not part of the current desktop release line:

- the old browser-first distribution model
- the historical financial widget line
- old changelog bundles from earlier experimental branches
- silent self-updating or background install mutation
- queue execution while the app is closed

## Repository Pointers

- Repository root: `https://github.com/nishizumi-maho/iRefinedX`
- Releases: `https://github.com/nishizumi-maho/iRefinedX/releases`
- Wiki source in repo: `docs/wiki/`
- Local runtime research: `docs/research/IRACING_UI_LOCAL_ANALYSIS.md`
