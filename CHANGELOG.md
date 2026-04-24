# Changelog

## v1.3.0

- fixed automatic queue `register` and `withdraw` so they keep working with the iRacing UI minimized or out of focus
- moved background queue automation off the page-only timer path by waking the renderer from the Electron main process
- made native confirmation prompts and action clicks resilient when the window is occluded and layout visibility checks would previously fail

## v1.2.0

- disabled Electron background throttling and window-occlusion throttling as groundwork for background queue automation
- added refresh/watchdog recovery for pending register and withdraw flows
- added queue watchdog recovery so `Queue for next race` can retry when a request stalls

## v1.1.0

- added a dedicated `Queue for next race` button in the top `Race Queue` area
- kept native `Register` buttons untouched while allowing the next race to remain queueable after registration opens
- bumped the launcher, injected layer and extension manifest versions to `1.1.0` / `v1.1`

## v1.0.0

- initial public `v1` release line
