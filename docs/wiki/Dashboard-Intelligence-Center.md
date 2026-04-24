# Dashboard Intelligence Center

This page documents the current dashboard widget shipped in `iRefinedX`.

## Scope

The dashboard currently keeps only one custom dashboard widget line: `Intelligence Center`.

The older financial widget line is intentionally out of scope for the current desktop release.

## Current Layout

The widget is configured to use the full available horizontal dashboard area instead of sharing the row with a second custom widget.

Additional presentation adjustments already applied:

- the old `iRefined V4` wording was removed
- the widget expands across the full row
- it follows the native dashboard background instead of forcing an unrelated panel structure around it

## Data Focus

The widget focuses on member progression and recent account activity already exposed by the page, such as:

- anniversary timing
- recent activity
- streak data
- membership age
- license and participation context the dashboard already exposes

## Data Source Model

The widget does not depend on a separate `iRefinedX` backend. It reads page state that the official logged-in dashboard already exposes to the local UI session.

## Privacy Boundary

The widget is intentionally less sensitive than the removed financial tools because it does not require a secondary order-history data bridge.

That keeps the current dashboard scope simpler:

- no payment-data feature path
- no order-history sync dependency
- no extra financial storage surface

## Relevant Files

- `extension/src/features/intelligence-center.js`
- `extension/src/features/intelligence-center.css`
- `extension/src/features/dashboard-widget-row.css`
- `extension/src/helpers/dashboard-widget-row.js`
