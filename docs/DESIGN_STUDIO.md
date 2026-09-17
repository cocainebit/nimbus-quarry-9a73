# App design studio

Open an app starter, then **App layout** to develop its interface. The studio edits portable, validated design data in the project rather than injecting arbitrary CSS. Its live canvas uses explicitly illustrative records; published widgets use the signed-in member's authorized database rows.

## Available controls

- 123 presets across 81 theme families: original Botanical/Studio/Editorial/Terminal plus licensed tweakcn and daisyUI theme data. Search and filter by source and light/dark appearance. See [preset library](PRESET_LIBRARY.md).
- Independently adjustable primary/background/surface/text/muted/border colors, eight body and heading font choices, radius, compact/comfortable density, sidebar/top navigation and dashboard heading, plus 32 structural overview layouts.
- Bound dashboard widgets: count, numeric total, grouped enum breakdown and recent records. Aggregations run on the server over all authorized records, not the first page in the browser.
- Collection screens: rename, reorder, change table/cards/board, choose enum status field, hide individual columns, add/remove screens. Column visibility is presentation only; use backend permissions for data access.
- Published tables use server search and sorting, accurate matching totals, and paginated loading. Existing create/edit/delete forms and status board controls still persist to the backend.

Changes save with the project; publish again to update its runtime snapshot. A widget with a removed/incompatible backend field reports a load failure; update its binding in the studio. Fonts use local/system stacks, without third-party font requests.

## Research and implementation choices

[shadcn/ui theming](https://ui.shadcn.com/docs/theming) documents semantic color variables and paired surface/foreground tokens. We applied that approach to the existing app renderer so designer previews and published interfaces share one token function. No shadcn dependency is required: existing accessible native controls and the current component layer remain in use.

The schema in `shared/app-design.mjs` constrains tokens and widget definitions. `AppDesignPreview` is a compact design illustration; `AppWorkspace` renders real member records and server-side summaries. A collection query never overrides server authorization.

## Validation and limitations

`node --test tests/app-design.test.mjs` verifies constrained CSS token transfer, rejected malformed widget definitions, and safe summary category handling. Browser/backend integration tests cover actual persistence separately.

This is a configurable application design system, not arbitrary React code generation. Chart types currently consist of accessible labeled horizontal breakdowns; mixed-series/time-series charts, drag-resize grids, breakpoint-specific styling, custom component authoring and automatic contrast enforcement are not implemented. Select colors with readable contrast. Design preview numbers are deliberately marked illustrative.

## AI design development

**Develop app design** accepts a prompt and asks the configured Ollama, Venice or Chutes provider for a structured design proposal. The server validates theme tokens, navigation, collection/field bindings and widget types. The preview sends schema metadata rather than customer records, and makes no database changes. Apply updates the editable project; a changed source document requires a fresh preview. Publish updates the member-facing app. Actual inference quality remains unverified without a configured model.

We retained [Puck](https://puckeditor.com/blog/puck-014.md) for marketing-page editing: its iframe viewport rendering is useful for page layouts. Generated operational apps use shared validated design configuration so their forms, tables and dashboard widgets stay connected to real database behavior. This is an implementation choice, not a claim that Puck supplies the app backend.
