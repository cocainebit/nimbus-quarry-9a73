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
Observed homepage tokens: Geist Variable, background #F1F0EE, ink #161616, bright accent #FF00F4, secondary border #DCDBD9, 4px spacing unit, 6–8px control radius. Public canvas screenshot uses a neutral background, monochrome wireframes, compact top tabs and device controls.
Implementation approximations: 224px dashboard navigation, 280px inspector, 60px toolbar, 14px body, 12px metadata, 36px dashboard title. Magenta is reserved for generation and selection; dark buttons for primary workspace actions.

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
