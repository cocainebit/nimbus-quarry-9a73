# Plotform design reference

## Source
Captured 2026-09-15 from https://www.relume.ai/ and https://resources.relume.io/resources/docs/how-to-create-and-edit-wireframes-in-the-relume-site-builder.
Evidence: `.firecrawl/branding.json`, `.firecrawl/wireframes.json`, `.firecrawl/canvas.png`.

## Reference Screenshot
![Relume homepage reference](./.firecrawl/home.png)
Homepage capture is viewport-sized; the initial full-page CLI attempt returned text rather than an image.

![Public Relume canvas documentation](./.firecrawl/canvas.png)
The screenshot documents the public wireframe interface; the authenticated current dashboard has not been inspected. Dashboard layout below is an interpretation, not a verified pixel match.

## Design Summary
Quiet warm-gray workspace, white panels, fine borders, dense controls and generous canvas. Top workflow tabs, floating controls, page artboards, small utilitarian type. Own Plotform identity and original content.

## Design Tokens
Measured from the live relume.ai DOM on 2026-09-20 (computed styles and its `:root` variables, read with Playwright). They live as custom properties at the top of `src/style.css`.
- Type: Geist Variable. Headings weight 400 with tracking -0.03em at 56px and -0.02em at 24 to 40px. Body 14px/1.5, lead 18px, meta 12px. Kickers are uppercase mono in the accent.
- Neutrals: #101010 ink, #343434, #5c5c5c, #8a8a8a, #b9b9b9 disabled, #e4e2df, #ecebe9, #f1f0ee ground, #fff raised.
- Lines: `rgba(27,25,25,.1)` hairline. States: hover `rgba(22,22,22,.08)`, surface `.06`, press `.12`.
- Accent: #ff00f4, hover #ff29f6, tints #ffcfff and #ff9fff, subtle `rgba(255,223,255,.5)`, text-safe #cf00c0.
- Controls: 32px high, 6px radius, 14px weight 400 labels. Primary is solid accent with white text, secondary is transparent with a hairline, fields are filled with the surface tint and turn white with an accent border on focus. Composer and dialogs use a 16px radius; tab groups are a #e4e2df pill with a white active segment.
Sidebar, measured from the signed-in `/sites` page on 2026-09-20 (the owner passed the login's human check in a visible window): 272px wide on `rgba(241,240,238,.9)` with a hairline right edge, 8px section padding, a 40px switcher with an inset hairline and an 8px radius, a #d5f89d 11px/500 chip, a full-width 32px accent create button, a 30px filled search, 32px nav rows at 14px/500 with an 8px radius, 4px apart, selected #ffd7ff, count chips on the surface tint with a 4px radius, and a footer above a hairline holding a 24px initials square, the name and a plan chip. Login card, from `/app/login`: a 348px frame of white hairlines that run past the corners and fade, a 5px white square on each corner, 24px side padding around a 300px column, a 24px/440 heading, 32px filled fields with placeholder labels and an eye toggle, a full-width accent submit and 12px/500 links with a dotted accent underline. Page and cards, from `/sites`: no top bar, main padding 48px 32px 24px, a 20px/500 section title with 12px below it, a three column grid 16px apart. A card is an 8px radius hairline frame with 1px padding on the ground color, a #ecebe9 well with 8px padding and 8px gaps holding white tiles with a 12px radius, then a 34px footer (padding 4px 4px 4px 8px) with a 20px white icon chip, a 14px/500 name, 12px meta in #343434 and 26px icon buttons. Hover only strengthens the border. Editor chrome, from `/app/site/...`: a 48px top bar on `rgba(241,240,238,.9)` with 8px side padding and a hairline below, laid out as three columns so the tabs sit dead centre; a 32px back button, a 14px/500 name; tabs in a #e4e2df pill with 26px segments, 12px side padding, a 16px icon and a 14px/500 label, the active one white; on the right 32px controls 6px apart, text buttons with a hairline, square icon buttons, and one accent action. The rail is 46px wide with 8px padding and 32px hairline tiles 8px apart; the side panel is 281px. Forms, from the site settings page: a 20px/500 page title, section cards with an 8px radius, a hairline, the ground colour and 32px padding, a 14px/500 card title, 12px/400 #343434 labels 4px above 32px fields filled with the surface tint, chips in 11px/500 uppercase mono on the surface tint with a 4px radius, group labels in 12px/500 uppercase mono. Dashboard hero, after the intake screen the owner captured at `/app/site/.../intake`: one centred column filling the first screen, a 32px/400 two line title, a 14px line of body text, a 680px composer with a 12px radius whose hint sits left and actions right, then a small muted label over a row of 26px hairline chips. The composer's placeholder is not a `placeholder` attribute. Relume's public composer swaps two stacked lines in `rgba(92,92,92,.72)` at 16px/24px every 3.3 seconds with `opacity 0.3s linear, transform 0.3s linear`; ours keeps that colour and size but, at the owner's request, is a typewriter: an accent caret types each line, rests blinking on the finished sentence, backspaces it away and types the next. It disappears once there is text. Dropdown lists are our own design in the same language, since no Relume list was measured: a white panel with an 8px radius, a hairline ring and a soft shadow, 4px padding, 32px rows with a 6px radius, the hover tint on hover and the accent tint plus a check on the chosen row. Only the empty Brief view was reachable, the canvas views are not yet inspected. App-generated shells (`app-workspace.css`, `app-overview-layout.css`) keep their own theme variables and are not part of this theme.

## Components
Dashboard: workspace navigation, brief composer, project cards with genuine miniature previews, search and template starters. Editor: project header, Sitemap / Wireframes / Style guide / Design tabs, draggable page nodes and edges, property inspector, zoom controls, responsive preview and export.

## Page Patterns
One shared project document drives all views. Sitemap sections and wireframe sections remain synchronized. Style tokens apply to every artboard. At narrow widths collapse navigation and inspector; editor remains a desktop-first workspace.

## Content Style
Short labels, useful empty states, explicit demo and connection status, original project names and sample copy.

## Agent Build Instructions
Use React Flow for canvas behavior and Puck for component editing. Do not reproduce screenshot annotations. Keep content editable, no fake collaboration or deployment buttons. Preserve source evidence. Use local fonts and CSS artwork; no Relume logos or proprietary component code.

## Rerun Inputs
workflow: firecrawl-website-design-clone
source_url: https://www.relume.ai/
target_stack: React, TypeScript, Vite, React Flow, Puck
output: DESIGN.md
