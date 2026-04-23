# iRefinedX

iRefinedX is a Windows desktop launcher that embeds the official local iRacing UI and layers the iRefinedX enhancement set directly on top of it. The goal is to stay as close as possible to the original iRacing desktop experience while adding queue management, export tools, dashboard enhancements, and quality-of-life improvements that fit the native flow.

This project is an adaptation of the now no-longer-functional iRefined project. iRefinedX reuses selected assets and portions of code from the original MIT-licensed repository by Jason Murray, with attribution and license notice preserved as required by the MIT License. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).

## What iRefinedX Does

- Uses the official local iRacing UI as the primary experience
- Injects the iRefinedX enhancement layer into the Electron shell
- Preserves native register, withdraw, join, spectate, hosted, league, and update flows
- Adds session queue handling on top of the official UI
- Restores league and hosted tools expected from the local desktop experience
- Provides in-app GitHub release update notices
- Packages everything as a Windows installer with upgrade-in-place support

## Requirements

- Windows 10 or Windows 11 x64
- A working iRacing installation
- The official iRacing UI and local helper components installed and up to date
- An active iRacing account

## Install

1. Open the latest GitHub release for this repository.
2. Download the Windows installer named `IRX-<version>-x64.exe`.
3. Close any running copies of iRefinedX, IRX, or older test builds before starting the installer.
4. Run the installer.
5. Choose your install directory.
6. Select whether iRefinedX should start with Windows.
7. Select whether a desktop shortcut should be created.
8. Finish the installation and launch the app.

The installer is built to upgrade over an existing iRefinedX installation. During an upgrade it stops the running application first so files can be replaced cleanly.

## First Launch

1. Open `iRefinedX`.
2. Sign in with your iRacing account if required.
3. Let the official iRacing content update flow finish if the local installation needs content.
4. Use the app exactly like the official local UI, with the iRefinedX layer already injected.

## How to Use the App

### Official Racing

- The main green button follows the native iRacing register and withdraw behavior.
- Queue controls are available in the race session list and in the iRefinedX queue bar.
- When a valid race session becomes available, the blue queue status dot can be clicked to register immediately.
- Automatic registration starts when the queued race session reaches the configured registration window.

### Leagues and Hosted

- League and hosted pages mirror the local UI structure more closely, including browse and session actions.
- Session JSON export remains available where it is useful, especially for league and hosted workflows.

### Queue Behavior

- A queued race can stay queued even before registration opens.
- If a queued session becomes valid for registration, the queue state changes accordingly.
- If you are already registered elsewhere, iRefinedX withdraws and then registers the queued target when needed.
- Queue state is persisted and restored after restarting the app.

### Updates

- iRefinedX checks GitHub Releases from inside the app.
- When a new release is available, a visible in-app update card appears.
- Click `Download update` to open the official release page or installer asset.
- Install the newer version on top of the old one.

## Privacy and Security Notes

- iRefinedX does not add analytics or third-party telemetry on top of the official iRacing web experience.
- Packaged builds keep diagnostics focused on failures and operational errors.
- Repository security includes CodeQL scanning, Dependabot, and GitHub security analysis configuration.

## Development

```powershell
npm ci
npm start
```

Build a directory package:

```powershell
npm run pack:dir
```

Build the Windows installer:

```powershell
npm run dist:win
```

## Documentation

Detailed end-user and technical documentation lives in the project wiki and in the versioned markdown files under [docs/wiki](./docs/wiki).

## License

iRefinedX is released under the MIT License. See [LICENSE](./LICENSE).

Attribution for reused MIT-licensed material from the original iRefined project is documented in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
