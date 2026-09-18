# Plenum

A six page website for an illustrative three day congress, written in plain HTML, one stylesheet and one small script. No build step, no dependencies, no remote requests, no photographs.

- `index.html` what the congress is, the three days and the three tracks
- `programme.html` the multi day time grid, with the day tabs and the track filter
- `talk-maintenance.html` a single talk
- `speakers.html` the speaker index
- `venue.html` the drawn plan, the walk from the station, access and practical information
- `credits.html` where every part of this edition comes from

Open `index.html` through any static server.

The schedule lives in one file, `tools/programme-data.json`. Edit it and run `node tools/build-programme.mjs`: the tool rewrites the region of `programme.html` between `<!-- grid:start -->` and `<!-- grid:end -->` and the region of `style.css` between `/* grid:start */` and `/* grid:end */`, and leaves everything else alone. Nothing else needs a tool, and editing the HTML directly works.

Plenum is a Plotform studio edition adapted from jekyll-theme-conference by Digitale Gesellschaft (MIT). See `VENDOR-NOTES.md` for what was reused, `SOURCE.json` for per asset provenance, and `upstream/` for the pinned upstream source. The content is illustrative: replace the wordmark, the schedule, the speakers, the address and the example email address before publishing.
