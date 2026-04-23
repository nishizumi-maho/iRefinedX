# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| 1.x | Yes |
| < 1.0 | No |

## Reporting a Vulnerability

Use GitHub Security Advisories / private vulnerability reporting for this repository whenever possible.

If private reporting is unavailable, open a GitHub issue only for non-sensitive hardening requests. Do not post credential leaks, working exploit chains, or personal account data in a public issue.

When reporting a vulnerability, include:

- The iRefinedX version
- Windows version
- Whether the issue happens in the packaged app or from source
- Reproduction steps
- The impact and any data exposure observed

## Security Notes

- iRefinedX does not add remote telemetry or analytics on top of the official iRacing web experience.
- Diagnostic logging is intentionally reduced in packaged builds and is focused on failures and high-value operational errors.
- Update prompts are based on GitHub Releases and only direct the user to the official release page or installer asset.
