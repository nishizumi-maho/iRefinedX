# Privacy, Security, and Data Handling

This page documents the current privacy and security posture of `iRefinedX`.

## Current Security Review Results

The current repository review checked the tracked source tree for:

- obvious hardcoded secrets
- private keys
- API keys
- authentication tokens
- passwords

No active secrets or credentials were intentionally present in the tracked application source. The only token-shaped reference in tracked files is the normal GitHub Actions `GH_TOKEN` placeholder used by release automation.

## Dependency Audit

Current audit results:

- `npm audit --omit=dev --prefix extension`: clean
- `npm audit --omit=dev --prefix desktop`: clean
- GitHub CodeQL: configured through `.github/workflows/security-quality.yml`

## Repository Hygiene

The repository intentionally ignores generated and sensitive local-runtime material, including:

- `node_modules/`
- build output
- `logs/`
- `.analysis/`
- extracted runtime scratch data
- desktop run logs

That matters because runtime instrumentation logs can contain navigation and request metadata that do not belong in source control.

## Data Stored Locally

`iRefinedX` stores only the minimum local state needed for settings and queue continuity, such as:

- user settings
- queued sessions
- current registration state
- update-check cache
- optional per-season selected car memory

## Data Not Intentionally Stored As A Product Feature

`iRefinedX` does not intentionally store:

- passwords
- raw auth tokens
- payment card data
- external-service credentials
- a cloud-synced personal profile

## Runtime Logging Boundary

The desktop runtime always keeps low-noise launcher and lifecycle diagnostics.

Verbose network diagnostics are opt-in only through `IREFINED_VERBOSE_NETWORK_LOGS=1`.

When that opt-in flag is enabled, the desktop runtime can additionally log:

- page navigation
- selected request metadata
- websocket visibility
- probe output useful for debugging register/withdraw/export flows

These logs are local diagnostics only. They should not be committed or published casually.

## Update Checks

The update system calls only the public GitHub Releases API for `nishizumi-maho/iRefinedX`.

It is notification-only:

- no silent install
- no privilege escalation
- no private update service
- no background download or binary replacement

## Product Boundary

`iRefinedX` is not a simulator cheat or bypass layer. It does not:

- automate driving
- bypass iRacing login
- replace iRacing entitlement checks
- keep a background queue engine alive while the UI is closed

## Maintenance Posture

The intended maintenance rule is simple:

- keep the desktop wrapper thin
- keep stored data local and small
- keep permissions narrow
- keep release/update behavior explicit
- keep stale experimental branches and unused artifacts out of the repository
