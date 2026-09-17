# Open-source foundations for a Relume-style builder

Research date: 2026-09-15. Primary repositories and product docs were checked live. These are architecture candidates, not a claim that every repository has been installed or benchmarked. This project's build and browser checks cover React Flow + Puck only.

## Recommendation

Build the product around a shared structured website document, React Flow for the spatial workspace, and Puck for visual editing of an original component library. Add generation that produces validated page/section data. This is the closest fit to the workflow documented by Relume, which links sitemap sections to wireframes and assembles sites from a controlled component system.

Sources: [Relume product](https://www.relume.ai/), [Relume wireframe workflow](https://resources.relume.io/resources/docs/how-to-create-and-edit-wireframes-in-the-relume-site-builder).

## Shortlist

| Project | License reported by upstream | Strongest use | Fit / limits |
| --- | --- | --- | --- |
| [React Flow / xyflow](https://github.com/xyflow/xyflow) | MIT | Sitemap, linked page nodes, pan/zoom, custom artboards | Selected and integrated. It is a canvas toolkit, not a website generator. Page content and hierarchy must be supplied by the product. |
| [Puck](https://github.com/puckeditor/puck) | MIT | Embeddable React visual editor, component props, section reordering | Selected and integrated. Bring your own React component library. The separate Puck AI cloud product is not required for this implementation. |
| [Onlook](https://github.com/onlook-dev/onlook) | Apache-2.0 | AI-assisted visual editing of React codebases | Strong candidate for a later freeform code-editing mode. Its editor/codebase model is more complex than the structured site document needed for this initial product. Not integrated. |
| [Open Lovable](https://github.com/firecrawl/open-lovable) | MIT | Reference-site recreation and AI React app generation | Useful generation reference, with Firecrawl and LLM services; README documents Vercel Sandbox or E2B. Upstream calls it an example app. It is not a ready Relume canvas or a complete Base44-style backend platform. Not integrated. |
| [bolt.diy](https://github.com/stackblitz-labs/bolt.diy) | MIT source | Prompt-to-code, runtime preview, multi-provider coding workspace | Broad coding-agent foundation, but a large UI/workflow adaptation. README explicitly says commercial WebContainer API production use needs a separate license. Not selected as the default runtime. |
| [GrapesJS](https://github.com/GrapesJS/grapesjs) | BSD-3-Clause | HTML/CSS page building, templates and export | Good alternative if HTML is the canonical document. Puck better matches this project's React component model. The open-source core should not be confused with separately offered commercial products. Not integrated. |

Licenses above describe the linked upstream code, not all hosted services, example assets, runtime services or optional add-ons. Preserve notices when reusing code. No code from Onlook, Open Lovable, bolt.diy, GrapesJS, or Relume was copied into this project.

## Why no single fork

Our assessment: the evaluated repositories solve different layers. None of the reviewed documentation establishes an out-of-the-box clone of Relume's complete dashboard, sitemap, wireframe, style-guide and export workflow. Forking a prompt-to-code IDE would still leave the core spatial editor and structured content model to build.

## Product model

`Project -> Pages -> Sections`, plus shared design tokens and sitemap positions. The same data is rendered in sitemap nodes, wireframes, the styled preview, Puck editor and static export. Local AI generates validated data instead of arbitrary executable code. This makes the initial pipeline predictable and keeps the template renderer under our control.

The current optional generator uses a separately configured Ollama model via its local HTTP API. No existing user credentials are harvested or automatically used. Demo generation is deliberately identified as a fixed template and only honors the project name and comma-separated `Pages:` directive.

## Implementation update, 2026-09-16

The first product iteration now includes 12 section types, editable structured items, uploads, layout/tone/spacing variants, stable internal links, per-page metadata, section copying/moving, undo/redo, IndexedDB persistence and import. Whole-page and single-section model refinement use a review/apply step. Export includes a small Node contact backend; browser tests run the exported site and verify real inquiry storage. AI quality still needs evaluation with a connected model.

## Next stages

1. Deepen the section catalog and add more industry-specific variants. Measure generation quality against varied real briefs.
2. Add authenticated server-side projects, revision history and asset storage; isolate tenants and enforce access controls before hosting it publicly.
3. Add streamed generation progress; evaluate remote providers and local models for quality, latency and cost using the same briefs. Targeted page/section refinement is now implemented.
4. Add freeform sitemap hierarchy, drag-and-drop section placement, keyboard commands, comments and collaboration.
5. Add React source export and a deployment pipeline. Figma and Webflow exports need dedicated adapters; static HTML export does not substitute for them.
6. Add Base44-style app capabilities separately: data models, authentication, backend logic, secrets, isolated execution, deployment and rollback. A marketing website generator alone is not that product.

## Evidence

Public design captures and search output are stored in `.firecrawl/` (ignored by git). `DESIGN.md` distinguishes observed reference details from inferred implementation choices. The authenticated Relume dashboard was not accessed, so this is an independently implemented similar workflow, not a verified pixel-perfect reproduction.
