# Theme sources and attribution

Only theme data is vendored; upstream CSS component frameworks and network services are not loaded at runtime.

- **tweakcn**, Sahaj Jain and contributors. Apache-2.0; full license in `tweakcn/LICENSE`. Source: https://github.com/jnsahaj/tweakcn/blob/a3b47b37cba97dd637de517aab52c45ec0f83456/utils/theme-presets.ts . Pinned revision `a3b47b37cba97dd637de517aab52c45ec0f83456`. Upstream data retained unmodified. 42 families, each with light and dark definitions.
- **daisyUI**, Pouya Saadeghi. MIT; full copyright/license in `daisyui/LICENSE`. Source: published npm package `daisyui@5.7.39`, `theme/object.js` saved unchanged as `themes.mjs`. Package SHA-1 `bb8ae91530cd93fde09be27d415b5cf7eebeace1`. https://github.com/saadeghi/daisyui . 35 theme families.

`node scripts/build-design-presets.mjs` regenerates `shared/design-presets.generated.mjs` offline using these pinned inputs and Chromium's CSS color parser. Our adapter converts upstream colors into six hex tokens, adjusts secondary text toward the source foreground to retain contrast on both surfaces, bounds corner radii, and maps typography to our locally bundled font choices. Unsupported upstream shadows, tracking, spacing, and component-specific tokens are not imported. These are **adapted themes**, not pixel-identical clones of the upstream renderer.

There are 77 upstream families / 119 variants, plus four original Plotform (formerly Site Studio) presets: **81 families / 123 choices**. Light/dark variants are clearly labeled; they are not counted as separate families. 32 screen layouts are independently selectable and are Plotform implementations, not upstream templates.

Runtime distribution includes license copies in `public/licenses/` (served at `/licenses/`). Locally bundled Geist, Inter, DM Sans, Manrope, Playfair Display and JetBrains Mono fonts use their Fontsource packages; corresponding original license files are also copied there. Georgia and system monospace use installed system fonts.
