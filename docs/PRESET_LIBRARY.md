# Design preset library

## Available now

**81 theme families / 123 selectable presets:** 42 tweakcn families with light/dark variants, 35 daisyUI themes, and four original Plotform themes. These are distinct source families, not fifty copies with different names. The catalogue supports search, source filters, light/dark filters and palette thumbnails.

Open a working app from Starter templates, then **App layout**. Select a theme, adjust the body and heading fonts independently, choose an overview layout and navigation position, then publish locally. Design changes are saved in the project and published as a snapshot. The running application retains its previous appearance until republished.

- Eight typography options: Geist, Georgia, system monospace, Inter, DM Sans, Manrope, Playfair Display and JetBrains Mono. Six web-font families ship locally; no Google Fonts request or third-party account is needed.
- 32 independently selectable structural overview layouts. See [layout library](LAYOUT_LIBRARY.md). Navigation can remain on the side or move to the top. Table/cards/board are separate collection-view controls.
- Six editable colors, corner radius, spacing density, heading/body typography and a text-contrast readout.
- Theme-aware app authentication, record dialogs, tables, boards, file screens and buttons. Theme colors also drive native input color-scheme. Primary-button text chooses black or white by contrast.

Theme application deliberately preserves navigation, layout, density, dashboard heading and widget bindings. It changes colors, font recommendations and radius. All remain independently editable. Restoring a project version also restores its saved appearance.

## Easier backend connection

**Connect dashboard automatically** inspects existing collection schemas and suggests count widgets, enum breakdowns and numeric totals using their real IDs/field names. It adds missing bindings without duplicating equivalent widgets, preserves existing choices and caps the dashboard at 12 widgets. You can rename or remove any widget. This action creates no operational records and requires no SQL or manual endpoint configuration.

Published widgets run through the existing member-scoped query/summary endpoints. Theme changes preserve collections, relationships, permissions, accounts, files and records. Installing a catalogue app supplies the initial linked schemas; themes alone do not invent a new business model. New collections/business rules still belong in App backend and its AI preview flow.

## Sources and implementation choice

- [tweakcn](https://tweakcn.com/) provides editable themes and typography controls; the pinned repository's [Apache-2.0 license](https://github.com/jnsahaj/tweakcn/blob/a3b47b37cba97dd637de517aab52c45ec0f83456/LICENSE) permits adaptation subject to its terms.
- [daisyUI themes](https://daisyui.com/docs/themes/) documents 35 built-in themes. We import the MIT-licensed theme objects, not its global component CSS.

We use their theme data as inputs to the current renderer so the editor keeps its existing functional forms, records, relationships and workflows. No external theme service is called when editing or running an app. The imported data is pinned and generated offline; updates require an intentional re-import/review. See [source versions, licenses and adaptations](../vendor/README.md).

These are adapted visual themes, not 81 separately authored application layouts. 32 overview structures are implemented. Upstream component-specific spacing/shadows and all upstream font families are not reproduced; fonts map to the local choices. Custom user colors can reduce contrast—the editor reports this but does not silently replace them.
