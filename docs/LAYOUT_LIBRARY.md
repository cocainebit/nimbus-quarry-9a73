# Plotform responsive layout library

Plotform has 32 structural overview layouts, independently selectable from its 123 theme presets. Layouts reposition the heading, database widgets, collection summaries, recent records and action area. Each preserves the same working record controls, authentication and permission checks.

## Choose and inspect

Open an app → **App layout** → **Responsive layout library**. Search by name or filter Dashboards, Analytics, Workspaces, Editorial and Portals. Cards visualize the actual desktop, tablet and mobile section grids. Choosing a card applies its structure to the project; republish to update the running app.

The live canvas offers **Desktop 1440px**, **Tablet 1024px** and **Phone 390px**. It renders at the selected width and scales into the editor; scroll inside the canvas to inspect longer pages. This activates the same content-container breakpoints as the published app, even when the editor itself is narrow. Preview records are labeled illustrative.

## Structures

- Dashboards: Classic dashboard, Wide overview.
- Analytics: Scoreboard, Pulse monitor, Metric wall, Insights rail, Report desk, Executive brief, Comparison desk, Signal board.
- Workspaces: Focus desk, Split workspace, Inbox workspace, Command desk, Workbench, Queue and context, Review station, Task focus.
- Editorial: Workspace journal, Magazine desk, Feature story, Daily digest, Morning briefing, Notebook, Editorial grid, Reading room.
- Portals: Welcome portal, Client home, Service hub, Member space, Project hub, Concierge.

These 32 distinct desktop matrices include side rails, asymmetrical grids, work-first streams, full-width metric bands, centered reading columns and three-column operational views. Recent records use list, card, timeline-like or compact presentation. The chronological visual style displays available recent records; it is not a scheduling/calendar feature.

## Responsive behavior and backend integrity

A shared `AppOverviewLayout` renders both preview and runtime. Named grid areas change at 700px and 1100px of **available content width**, not only browser width. On narrow screens, every section becomes a single-column stack in semantic DOM order. No data panels are hidden to make a small screen fit. Empty custom-widget sections are omitted and wholly empty grid rows collapse.

Layout selection changes `app.design.layout` only. Colors, fonts, navigation, widget bindings, schemas, permissions, memberships and saved records stay intact. Existing dashboard/focus/split/wide documents retain valid IDs. AI design proposals can select any of the 32 validated IDs.

## Validation and scope

Unit tests verify unique structural matrices, rectangular areas, complete mobile ordering, schema allowlisting, legacy IDs and preserved bindings across every layout/theme combination. A browser geometry test renders the production `AppWorkspace` with HTTP data fixtures for all 32 layouts at 1600,1100,768,390 and 320px: 160 layout/viewport combinations. It checks the expected container arrangement, visible sections, data rendering, non-overlapping slot bounds and no page-level horizontal overflow. A separate real-backend browser flow selects a new layout in the library, publishes and creates related records, changes theme and republishes with data intact.

These are operational **overview structures**, not 32 separate business apps. Collection screens retain their table/cards/board controls. Custom drag-resize grids and arbitrary page composition remain outside this catalogue.
