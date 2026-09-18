# Threshold: a Plotform studio edition

Dated 2026-09-17. An explorable explanation: a scroll driven essay whose
argument is carried by two interactive figures rather than by paragraphs alone.
This is an authored adaptation, not an unmodified upstream template and not a
copy of any reference site.

## Foundations

### The Evolution of Trust, by Nicky Case

https://github.com/ncase/trust, pinned at commit
`6ec45d73befdb922bd40654dd1c1c903a953562f`, dedicated to the public domain
under CC0 1.0 Universal. Its dedication is kept in
`licenses/ncase-trust-CC0.txt` and a trimmed copy of the upstream is archived
inside `source.zip` under `upstream/trust-6ec45d73/`.

It is the canonical explorable explanation, and the reason it is the right
foundation for this edition is structural rather than visual: it chapters one
argument across a scroll and, at each step, swaps in a small thing the reader
can operate instead of writing another paragraph. That is the genre, and no
website builder ships anything like it.

Taken from it:

- The chaptered reading with one widget per step. Here the widget is a figure
  and the steps are the three paragraphs beside it in chapter two.
- The chapter rail, from `js/core/SlideSelect.js`, where each chapter has a mark
  that lights up when the reader reaches it. Rewritten as ordinary links whose
  `aria-current` is set by an IntersectionObserver.
- The slide state machine in `js/core/Slideshow.js`, where each slide declares
  the state it wants rather than issuing instructions. Here each step carries
  `data-step-load` and `data-step-annotation` and the figure reads them.
- Its stance that the reader is allowed to take the model off the rails, which
  is why the slider stops following the text the moment the reader moves it.
- Two of its drawings. See "Pictures" below.

Not taken from it, deliberately:

- **No audio at all.** Its README lists the sound effects individually and they
  are a mixture of licences: most are CC0, but the slot machine effect is
  Creative Commons Sampling Plus and "click plink pop boop bonk" is Creative
  Commons Attribution NonCommercial. A template that ships in a website builder
  cannot carry a NonCommercial sample, so none of the audio was touched.
- Futura Handwritten by Bill Snyder, `css/FuturaHandwritten.ttf`, a third party
  font from dafont that the CC0 dedication does not cover.
- PIXI.js, Howler.js, Tween.js, Balloon.css, Q, MinPubSub and Pegasus, the
  libraries vendored under `js/lib`, each under its own licence. This edition
  has no dependencies whatsoever.
- The prisoner's dilemma, the tournament, the payoff matrices and every line of
  its writing. The subject here is a different one.

### roadtolarissa, by Adam Pearce

https://github.com/1wheel/roadtolarissa, pinned at commit
`3e28b8aace38d09984a4714ea0c21669081f5dee`, MIT, copyright 2012 to 2018 Adam
Pearce. Its licence is kept in `licenses/roadtolarissa-MIT.txt` and a trimmed
copy of the upstream is archived inside `source.zip` under
`upstream/roadtolarissa-3e28b8aa/`.

It is how a data essay is actually built, and almost all of the visual language
of this edition comes from it.

- The ground and the measure, from `source/style.css`: a newsprint page, one
  centred column of about 750 pixels, a serif set at a generous line height,
  and figures allowed to break wider than the text.
- Figures drawn as SVG from the numbers rather than pasted in as pictures, so
  that changing a number changes the drawing.
- Its chart manners, from the per post stylesheets such as
  `source/regression-discontinuity/style.css`: a faint axis, no domain line on
  the value axis, value labels sitting on their own gridlines instead of in a
  reserved gutter, and a paper coloured halo behind label text so it survives
  crossing a mark.
- Hand drawn annotation arrows curving in from the side of a chart.
- The scroll driven chart state, from the `graph-scroll` library vendored at
  `source/msi-4096/graph-scroll.js`: a container of steps where the step in the
  middle of the window is the active one and decides what the figure shows.
  Rewritten here with an IntersectionObserver, no d3 and no library.

Not taken: d3, graph-scroll itself, Jekyll, the post archive, every dataset and
every line of its writing. Its `source/shared/swoopyarrows.js` is vendored from
bizweekgraphics under its own terms, so it was not copied; the annotation arrow
here is written for this edition as a quadratic curve with a head aimed along
its tangent.

## What is new

Both figures, the model, the page builder, the whole stylesheet, the type
system and all of the writing. The new work is licensed MIT (`LICENSE`).

## The two figures

Both are plain JavaScript against hand written SVG. No chart library, no
framework, no dependency of any kind.

**Figure one, the counter.** A range input sets how booked the day is, from
`lowestLoad` to `highestLoad`. The drawn curve, the marker, the row of waiting
people, the three readouts and the sentence underneath are all recomputed from
`model.js`. It is keyboard operable because it is a real range input: arrow
keys move it a point at a time, Home and End jump to the ends. Its state
reaches a screen reader through `aria-valuetext`, which is rewritten on every
change, and the visible sentence below it is the same statement in longer form.

**Figure two, the morning.** A timeline of appointments drawn twice, as planned
and as it happened, stepped through a slot at a time. Two buttons move it, and
the figure also answers the left and right arrow keys, Home and End, which is
why the drawing itself is focusable. A second pair of buttons switches between
a fully booked morning and one with an empty slot in every few, and the whole
timeline is repositioned from the model. Its summary is a live region, so the
state is announced when the reader steps, and the three readouts above it are
the running tally.

## The model

`model.js` holds every number in both figures and the two short pieces of
arithmetic that turn them into a drawing. It is loaded before `script.js`, and
`tools/build-pages.mjs` reads the same file, so the curve saved into the HTML,
the numbers written into the sentences and the figures the browser draws all
come from one place. Change a value and reload: both figures follow it. Run the
builder again to refresh the numbers written into the sentences.

Every number in it was invented for this template. The arithmetic is standard
textbook queue arithmetic, written out in words on the notes page and presented
as arithmetic rather than as a finding. No study is cited anywhere on the site,
no institution is named, and every page carries a visible note saying that the
content is illustrative.

## Pictures

Two bitmaps, both CC0 artwork from ncase/trust, both recorded in `SOURCE.json`
with the exact atlas frame they were cut from: `assets/trust-peep-waiting.png`
and `assets/trust-peep-served.png`. They were cut out of
`assets/splash/splash_peep.png`, trimmed to the drawing and reduced. Nothing
was redrawn, recoloured or added. The about page credits them in public even
though the dedication does not require it.

There are no photographs and no generated images. Everything else drawn on the
site, including both charts, the timeline, the annotation arrow and the
comparison bars, is SVG or CSS written for this edition and generated from the
model.

## Typography

Fraunces by Undercase Type for the headings, and Newsreader by Production Type
for everything that is read, both under the SIL Open Font License 1.1 and both
bundled as files rather than loaded from a font service. Fraunces is here for
its SOFT and WONK axes, which are set in the stylesheet and are what stop the
headings looking like a default. Newsreader is a screen reading serif with a
real italic and lining tabular figures, which the figure readouts use so that
numbers do not jump as they change. There is no monospace anywhere.

Nothing is loaded from anywhere else. No remote scripts, fonts, trackers, maps
or form services. The only address on the site is `hello@example.com`; replace
it before publishing.

## Motion

Readers who ask for reduced motion get no scroll driven change at all: the
figure stops following the text, the sticky column becomes an ordinary block,
smooth scrolling and every transition stop, and the annotation on the chart is
simply drawn rather than faded in. Both figures stay fully usable, and because
every step of the argument carries its own number in the running text, the
essay reads straight through as an ordinary document.

## Building

The site is static: open `index.html` through any static server.
`tools/build-pages.mjs` regenerates the five pages; pass an output directory as
the first argument to write elsewhere. It is a plain Node script with no
dependencies. Editing the HTML directly also works.
