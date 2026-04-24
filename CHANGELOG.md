# Changelog

## v1.2.0

- disabled Electron background throttling and window-occlusion throttling so register/withdraw flows keep running while the UI is minimized or out of focus
- added refresh/watchdog recovery for pending register and withdraw flows
- added queue watchdog recovery so `Queue for next race` no longer stays stuck in `Registering`

## v1.1.0

- added a dedicated `Queue for next race` button in the top `Race Queue` area
- kept native `Register` buttons untouched while allowing the next race to remain queueable after registration opens
- bumped the launcher, injected layer and extension manifest versions to `1.1.0` / `v1.1`

## v1.0.0

- initial public `v1` release line
