# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| 1.x | Yes |
| < 1.0 | No |

## Reporting a Vulnerability

Use GitHub Security Advisories or private vulnerability reporting for this repository whenever possible.

If private reporting is unavailable, open a public issue only for non-sensitive hardening requests. Do not publish account data, tokens, credentials, exploit chains, or private logs in a public issue.

When reporting a vulnerability, include:

- the `iRefinedX` version
- the Windows version
- whether the problem happens in the packaged app or from source
- reproduction steps
- the impact and any data exposure observed

## Security Notes

- `iRefinedX` does not add extra analytics or telemetry on top of the official iRacing web experience.
- Update prompts only query GitHub Releases for this repository and point the user to the official release page.
- iRacing UI path choices, launcher state, and queue-related local settings stay on the local machine.
- The Windows installer cleans local launcher state and the managed runtime copy during uninstall.
