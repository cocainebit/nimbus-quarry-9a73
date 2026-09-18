# Fettle

A six page website for an illustrative community workshop and class programme, written in plain HTML, one stylesheet and one small script. No build step, no dependencies at run time, no remote requests, and no photography anywhere: everything on the page is drawn.

- `index.html` what the place is, who is at the front, how an evening runs
- `programme.html` all fourteen weekly sessions, filtered by level and by evening with a live count
- `class-spoon-carving.html` one class in full: what to bring, what you will make, the shape of the evening
- `space.html` the room, as a drawn floor plan with a key, plus a drawn chart of how the week fills up
- `join.html` the three ways in, the induction, and what this site honestly cannot do
- `credits.html` where every part of this edition comes from

Open `index.html` through any static server.

## Redrawing the art

Everything drawn was written to a file once, at build time. Nothing is drawn in the browser.

```
node tools/make-art.mjs      # rules, frames, callout, tools, floor plan, chart (Rough.js)
node tools/make-people.mjs   # the eleven Open Peeps figures
node tools/build-pages.mjs   # the six HTML pages, from the programme data inside that file
```

None of these is required. Their output is committed, and editing the HTML, the CSS and the SVG files by hand works.

## Credits

Fettle is a Plotform studio edition adapted from PaperCSS (ISC). The drawings are made with Rough.js (MIT) and the people are Open Peeps by Pablo Stanley (CC0, no attribution required). The typeface is Bricolage Grotesque (OFL). See `VENDOR-NOTES.md` for what was reused and why, `SOURCE.json` for per asset provenance, `licenses/` for every notice, and `upstream/` for the pinned upstream sources.

The content is illustrative: replace the wordmark, the programme, the tutors, the address, the fees and the example email address before publishing.
