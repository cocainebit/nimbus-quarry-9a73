# Plotform design benchmark, 17 September 2026

The user's references set the acceptance bar for generated website designs. They are references, not source templates or permission to redistribute their branding, photography, fonts or code.

## Jack & Jill

Source: https://www.jackandjill.ai/
Evidence: `.firecrawl/reference-jackandjill.json`, `.firecrawl/reference-jackandjill.png` and page markdown.

Observed: generous white space, compact navigation, a substantial editorial serif heading, two parallel product demonstrations for two audiences, muted paper panels, small pill actions, restrained separators, real product imagery and story photography. The rendered heading stack is Marist/Georgia; body is Diatype. Extracted sizes at capture: heading 72px, secondary 40px, body 24px. These are viewport-specific observations, not universal tokens. Colors observed: white background, near-black #100F0F, off-white panels; limited colored accents.

Adopt: clear type hierarchy, product-led imagery, contrasting serif/sans roles, deliberate section pacing. Do not substitute fabricated dashboard screenshots or generic feature cards for actual product content. Do not bundle the site's commercial fonts or assets.

## Little Plains

Source: https://www.littleplains.com/
Evidence: `.firecrawl/reference-littleplains.json`, `.firecrawl/reference-littleplains-settled.png`, page markdown.

Observed in branding/page evidence: Jjannon Display and Sohne; deep navy #002142, white and blue #0398FA; project imagery, editorial copy and studio photography. Initial automated screenshot captured an ocean introduction; the settled capture shows an inset white panel with rounded outer corners, a centered floating navigation, a hand-drawn rowing illustration and calligraphic brand headline. This combination of illustration, typography and framing carries the identity. Extracted heading/body sizes are inconsistent with semantic roles; do not promote those figures into implementation tokens without browser inspection.

Adopt: imagery and editorial composition as the main identity, a limited palette and deliberate transitions. Do not claim a generic recent framework reproduces this art direction.

## Michal Rome

Source: https://romemichal.pl/
Evidence: `.firecrawl/reference-romemichal.json`, `.firecrawl/reference-romemichal.png`, page markdown.

Observed: white page, large Geist typography, a headline broken around a changing product visual, numbered editorial sections, split text-and-image case studies, substantial vertical space, thin rules and an oversized ROME footer wordmark. Extracted sizes: headline 100px, section 68px, body 15px. The branding extractor mislabeled the overall page dark; screenshot evidence takes precedence. Motion is visible in changing hero content; precise timing was not established by still screenshots.

Adopt: genuinely responsive typographic scale, varied case-study composition, real project assets and a designed ending. Avoid treating a small résumé list or interchangeable hero as equivalent.

## Acceptance criteria

- Inspect rendered desktop and phone pages, not dependency dates or repository descriptions.
- A strong source has a distinct composition and type system, useful imagery and considered spacing throughout the page.
- New framework versions alone do not qualify a template as reference quality.
- Retain licenses and clearly distinguish original imports, adaptations and motion studies.
- Verify content edits after client hydration and after export; inspect local asset paths and responsive images.
- Include corresponding framework source for further development, including when the license requires it.
- The contemporary selection is an improved starting library, not a claim of parity with these commissioned sites or 20 benchmark-quality designs.
