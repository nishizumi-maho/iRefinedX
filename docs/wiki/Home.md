# iRefinedX Wiki

iRefinedX is a desktop adaptation of the official local iRacing UI with the iRefinedX enhancement layer integrated into the Electron shell.

## Contents

- [Installation and Updates](./Installation-and-Updates.md)
- [Using iRefinedX](./Using-iRefinedX.md)
- [Session Queue and Registration](./Session-Queue-and-Registration.md)
- [League and Hosted Tools](./League-and-Hosted-Tools.md)
- [Architecture](./Architecture.md)
- [Troubleshooting](./Troubleshooting.md)

## Core Goals

- Keep the UI as close as possible to the official local iRacing desktop client
- Preserve native register, withdraw, join, and content-update behavior
- Restore iRefined-style enhancements without replacing the official product flow
- Ship a clean Windows installer with upgrade support

## Main Components

- Electron shell
- Native bridge for local iRacing integration
- Local helper/content-update bridge
- Injected iRefinedX enhancement layer
- Queue and registration state manager
- GitHub release update notifier
