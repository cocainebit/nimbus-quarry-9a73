# Bevel: a Plotform studio edition

Dated 2026-09-17. This is an authored adaptation, not an unmodified upstream template and not an additional independently sourced repository.

## Foundation

7.css, https://github.com/khang-nd/7.css, pinned revision 3e934439c7587e0e89cce12bb3179cd3f8fd187b, MIT, copyright 2021 Khang Nguyen Duy. Its MIT notice is kept in `licenses/7css-MIT.txt`, and the complete upstream working tree is archived under `upstream/7css-3e934439-source.zip` and inside `source.zip` under `upstream/7.css-3e934439/`.

## Why not 98.css or XP.css

The brief for this edition started at 98.css. A licence check ruled it out and the audit is recorded here because the trap is easy to walk into.

98.css is MIT, but the font it depends on is not. It bundles `fonts/converted/ms_sans_serif.woff` and `ms_sans_serif_bold.woff`, and the source archives it keeps beside them say what they are. From `fonts/src/ms-sans-serif/license.txt` at the tip of that repository:

> The FontStruction "MS Sans Serif" (https://fontstruct.com/fontstructions/show/1384746) by "lou" is licensed under a Creative Commons Attribution Share Alike license (http://creativecommons.org/licenses/by-sa/3.0/).

Share alike propagates. Everybody who published a website built from an edition carrying that file would inherit a copyleft obligation on it, and the file is a reconstruction of a typeface belonging to someone else on top of that. XP.css carries the same face plus Perfect DOS VGA 437, so it fails the same way.

7.css, which is itself built on XP.css, ships no font files at all: its `--w7-font` is a system stack. That removes the font licence surface entirely, and its identity is gradients and borders rather than bitmaps, which suits an edition that must contain no photography. The register moves from Windows 98 to the Aero years, which the pages are written for rather than against.

## What was reused

- The window shell: a 1px dark border, a 6px radius, the drop shadow and the lit inner rim, with the glass gradient sitting behind it on a pseudo element (`gui/_window.scss`, `.window` and `.window::before`).
- The title bar: its gradient, the white inner edge, the halo that keeps the title legible over the glass, and the control cluster on its own rounded plate.
- The raised control: 1px border, 3px radius, inset white rim and the two stop gradient, with the hover and active fills (`gui/_button.scss`). It carries the buttons and the tab strip here.
- The tab strip whose selected tab drops its bottom border so the panel edge runs under it (`gui/_tabs.scss`).
- The sunken field border colours (`gui/_textbox.scss`) and the group box with its inset white rim (`gui/_groupbox.scss`).
- The tree view: the 20px indent, the dotted connectors and the small square expander that turns from a plus into a minus (`gui/_treeview.scss`).
- The status bar with its divided fields.
- The custom property naming. Everything borrowed keeps its `--w7-` prefix in `style.css`, so each formula can be traced back to the file it came from; everything this edition decides for itself is prefixed `--bv-`.

## What was not reused

The upstream icon PNGs in `gui/icon`. Nothing in this edition is a raster image: the window controls, the six application icons, the drawn screens and the diagram are all SVG written here, so no reconstruction of anyone's interface art is redistributed. Also left behind: `docs/` and its demo photograph, the components this edition does not use (menus, combo boxes, sliders, spinners, progress bars, balloons, list boxes, scrollbar skinning), the npm and postcss build, and all upstream copy. The published pages load no part of the upstream archive.

## What is new

Every page, its layout, its copy and its responsive behaviour. The pane grid that makes the chrome the layout rather than a frame drawn around a normal page. The type system. The tab widget script. All thirteen drawings in `assets/`. The new work is licensed MIT (`LICENSE`).

## Typography

7.css asks the machine for Segoe UI and falls back to Noto Sans. This edition bundles that fallback, so the pages look the same on a machine that has never held the first: **Noto Sans**, a humanist sans under the SIL Open Font License, as `assets/noto-sans.woff2` with its licence in `licenses/noto-sans-OFL.txt`. It carries the chrome at 13 to 14px and the document at 16.5px, and headings run to 800 weight with negative tracking, which is this edition's own voice rather than a period imitation.

**JetBrains Mono**, also under the Open Font License, appears in exactly two places: the console on the tour page and the release notes sample on the versions page. Navigation, headings and body copy are never monospaced. No remote fonts, scripts, trackers or form services. Contact is a `mailto:` link to the example address `hello@example.com`; replace it before publishing.

## Interaction

The inspector on `features.html` is a real tab widget, not a carousel: `role="tablist"` with four `role="tab"` buttons carrying `aria-selected` and `aria-controls`, and four `role="tabpanel"` elements labelled by their tab and reachable with Tab. Left and Right, and Up and Down, move along the strip and select as they go; Home and End jump to its ends; a roving tabindex keeps the strip one stop rather than four. Clicking does the same thing. Focus is drawn as a solid two pixel ring rather than the faint dotted line of the period.

The navigator tree in the left pane and the questions on the help page are native `details` elements, so they open and close with the keyboard whether or not the script has loaded.

The three window controls in each title bar are ornament. A page cannot be minimised, so they are drawn shapes marked `aria-hidden` rather than buttons that would announce an action they never perform. Every control that is announced here does something.

## Responsive behaviour

The chrome is the grid. Above 900px the window body is two real panes, the navigator and the document. Below that the panes stack with the document first and the navigator under it. Below 560px the window gives up its radius, its side borders and its shadow and runs edge to edge, the ornament controls are dropped, the status bar fields become full width rows and the taskbar loses its margins. At 320px there is no horizontal scrolling: the title bar truncates rather than pushing, the tab strip wraps, and the console and the file sample scroll inside their own panes.

Every transition and the console caret stop under `prefers-reduced-motion: reduce`, where the caret is left visible rather than mid blink.

## Content

Plumbline and Tin Roof Software are invented for this template. The drawn screens, the version numbers, the dates, the changelog entries and the help answers are illustrative, and each page carries a visible note that says so. No price, no download count, no award, no testimonial and no claim about real software appears anywhere. The three build rows on the versions page are marked as not connected, because the template ships no application files; point them at your own releases when you publish.

## Building

The site is static: open `index.html` through any static server. The five pages come from `tools/build-pages.mjs`, which refuses to write a page containing an em dash, and the drawings from `tools/make-art.mjs`. Both are plain Node scripts with no dependencies, and neither runs in the browser. Editing the produced HTML directly works too, because the HTML, CSS and JavaScript are the deliverable.
