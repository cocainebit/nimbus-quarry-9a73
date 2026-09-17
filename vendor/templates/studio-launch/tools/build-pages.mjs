// Assembles the five Apogee pages with one shared header and footer.
import { writeFileSync } from "node:fs";

const OUT = process.argv[2] || new URL("../", import.meta.url).pathname;
const MAIL = "mailto:hello@example.com";

const navItems = [
  ["index.html", "Deck"],
  ["how-it-works.html", "How it works"],
  ["changelog.html", "Changelog"],
  ["principles.html", "Principles"],
];

function head(title, description) {
  return `<!doctype html>
<html lang="en" id="top">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${description}">
<title>${title}</title>
<link rel="preload" href="assets/dm-sans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="style.css">
<script src="script.js" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>`;
}

function header(current) {
  const links = navItems
    .map(([href, label]) => `<a href="${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a>`)
    .join("");
  const menuLinks = navItems.map(([href, label]) => `<a href="${href}">${label}</a>`).join("");
  return `<header class="site-header">
<a class="wordmark" href="index.html" aria-label="Apogee home">apogee</a>
<nav class="site-nav" aria-label="Main navigation">${links}</nav>
<a class="pill header-mail" href="${MAIL}">Write to us</a>
<button class="pill menu-toggle" type="button" aria-haspopup="dialog" aria-controls="menu">Menu</button>
</header>
<dialog class="menu" id="menu" aria-label="Main navigation">
<div class="menu-top"><span class="wordmark">apogee</span><button class="pill menu-close" type="button">Close</button></div>
<nav>${menuLinks}</nav>
<a class="menu-mail" href="${MAIL}">hello@example.com</a>
</dialog>
<main id="main">`;
}

const footer = `</main>
<footer class="site-footer" id="contact">
<div class="footer-top">
<p>Questions about Deck, or about making this site yours?</p>
<a class="footer-mail" href="${MAIL}">hello@example.com</a>
</div>
<a class="footer-wordmark" href="index.html" aria-label="Apogee home">apogee</a>
<div class="footer-bottom">
<span>Apogee, a Plotform studio edition. Deck is an illustrative product.</span>
<nav aria-label="Footer"><a href="credits.html">Credits and source</a><a href="changelog.html">Release notes</a><a href="#top">Back to top</a></nav>
</div>
</footer>
</body>
</html>
`;

const pages = {};

pages["index.html"] = head(
  "Apogee · Deck, a desktop sequencer",
  "Deck is a desktop sequencer with sixteen pads, eight knobs and one display. An illustrative product launch site from the Apogee studio edition.",
) + header("index.html") + `
<section class="hero" aria-labelledby="hero-title">
<div class="hero-top">
<span>Deck, a desktop sequencer</span>
<a href="changelog.html">Firmware 1.2, Harbor, is out. Read the notes</a>
</div>
<div class="hero-grid">
<figure class="hero-visual" data-finish-view="graphite">
<img class="is-active" data-finish-image="graphite" src="assets/deck-graphite.svg" width="600" height="400" alt="Deck in graphite, seen from above: a display, transport buttons, eight knobs and sixteen pads">
<img data-finish-image="bone" src="assets/deck-bone.svg" width="600" height="400" alt="Deck in bone, the same sequencer in an off-white finish" aria-hidden="true">
</figure>
<h1 id="hero-title"><span class="hero-open">Play the idea<br>before it</span><span class="hero-close">gets away.</span></h1>
</div>
<div class="hero-bottom">
<div class="finish" role="group" aria-label="Finish">
<span class="finish-label">Finish</span>
<button type="button" data-finish="graphite" aria-pressed="true">Graphite</button>
<button type="button" data-finish="bone" aria-pressed="false">Bone</button>
<span id="finish-status" class="visually-hidden" aria-live="polite"></span>
</div>
<div class="hero-copy">
<p class="lead">Deck is a sequencer for the desk, not the studio. Sixteen pads, eight knobs and one small display, arranged so a pattern takes seconds to start and a few minutes to finish. No menus, and no screen to look at instead of the music.</p>
<a class="text-link" href="how-it-works.html">See how it works</a>
<p class="demo-note">Deck is an illustrative product made for this template. Its specifications, release notes and dates are examples, not a real device.</p>
</div>
</div>
</section>

<section class="section" id="on-the-desk" aria-labelledby="desk-title">
<div class="section-head">
<span class="section-number">01</span>
<h2 id="desk-title">What is on the desk</h2>
<p class="section-note">Three kinds of control, and each does one thing.</p>
</div>
<dl>
<div class="spec-row">
<dt>Pads</dt>
<dd class="spec-copy"><h3>Sixteen pads, in two rows of eight.</h3><p>One row is half a bar of sixteenth notes, so you can read the pattern you are playing without a screen. The pads are rubber, not plastic, and they respond to how hard you play.</p></dd>
<dd class="crop"><img src="assets/detail-pads.svg" width="276" height="184" alt="Close view of the first four pads in both rows, with two steps lit" loading="lazy"></dd>
</div>
<div class="spec-row">
<dt>Knobs</dt>
<dd class="spec-copy"><h3>Eight knobs, one job each.</h3><p>Pitch, decay, filter and drive on the first page, tone, level, pan and swing on the second. A knob does the same thing on every sound, so your hands learn the layout once.</p></dd>
<dd class="crop"><img src="assets/detail-knobs.svg" width="276" height="184" alt="Close view of four knobs above the first row of pads" loading="lazy"></dd>
</div>
<div class="spec-row">
<dt>Display</dt>
<dd class="spec-copy"><h3>One display that shows the step you are on.</h3><p>It shows the level, the current step and the pattern name. That is all it shows, on purpose. Everything you can change is a pad or a knob.</p></dd>
<dd class="crop"><img src="assets/detail-display.svg" width="322" height="215" alt="Close view of the display and the play button" loading="lazy"></dd>
</div>
</dl>
</section>

<section class="section" id="method" aria-labelledby="method-title">
<div class="section-head">
<span class="section-number">02</span>
<h2 id="method-title">A pattern in four moves</h2>
<p class="section-note">The whole method fits on one page.</p>
</div>
<div class="method">
<ol>
<li><a href="how-it-works.html#step-1"><span>01</span><span>Tap the pattern in</span></a></li>
<li><a href="how-it-works.html#step-2"><span>02</span><span>Shape the sound while it plays</span></a></li>
<li><a href="how-it-works.html#step-3"><span>03</span><span>Chain patterns into a song</span></a></li>
<li><a href="how-it-works.html#step-4"><span>04</span><span>Send it out</span></a></li>
</ol>
<div class="crop crop-wide"><img src="assets/detail-pattern.svg" width="548" height="190" alt="All sixteen pads with a four-to-the-floor pattern lit on steps one, five, nine and thirteen" loading="lazy"></div>
<a class="text-link" href="how-it-works.html">Read how it works</a>
</div>
</section>

<section class="section" id="in-the-box" aria-labelledby="box-title">
<div class="section-head">
<span class="section-number">03</span>
<h2 id="box-title">In the box</h2>
<p class="section-note">Everything you need, and nothing you will throw away.</p>
</div>
<div class="box">
<ul>
<li>Deck, in graphite or bone</li>
<li>A braided USB-C cable, two metres</li>
<li>A printed quick-start card, one side</li>
<li>Four rubber feet, already fitted</li>
</ul>
<p>Deck opens with four screws and a standard driver. Nothing inside is glued. When a pad wears out you replace the pad, not the instrument, and the parts list is printed on the underside.</p>
</div>
</section>

<section class="section" id="latest" aria-labelledby="latest-title">
<div class="section-head">
<span class="section-number">04</span>
<h2 id="latest-title">The latest release</h2>
<p class="section-note">Firmware, kept current on the changelog.</p>
</div>
<div class="release-row">
<div class="release-head">
<span class="version">1.2</span>
<h3>Harbor</h3>
<p>2 September 2026</p>
<p class="lead">Pattern chaining, a metronome you can hear over the mix, and a longer undo.</p>
</div>
<ul class="release-list">
<li>Chain up to eight patterns by holding two pattern pads.</li>
<li>The metronome has its own level on the second knob page.</li>
<li>Undo reaches back through the last sixteen edits.</li>
</ul>
<a class="text-link" href="changelog.html">All release notes</a>
</div>
</section>
` + footer;

pages["how-it-works.html"] = head(
  "Apogee · How Deck works",
  "From a blank pad to a finished pattern in four moves: tap it in, shape the sound, chain patterns, send it out.",
) + header("how-it-works.html") + `
<section class="page-head wide">
<span class="section-number">How it works</span>
<h1>From a blank pad to a finished pattern, in four moves.</h1>
<p class="lead">Deck has one method. Learn it once and every pattern starts the same way.</p>
</section>
<div class="steps-layout">
<nav class="step-index" aria-label="Steps">
<ol>
<li><a href="#step-1" aria-current="true"><span>01</span><span>Tap it in</span></a></li>
<li><a href="#step-2"><span>02</span><span>Shape the sound</span></a></li>
<li><a href="#step-3"><span>03</span><span>Chain patterns</span></a></li>
<li><a href="#step-4"><span>04</span><span>Send it out</span></a></li>
</ol>
</nav>
<div class="steps">
<section class="step" id="step-1" aria-labelledby="step-1-title">
<span class="step-number" aria-hidden="true">01</span>
<div class="step-copy">
<h2 id="step-1-title">Tap the pattern in.</h2>
<p>Hold Record and tap pads in time with the click. Deck lands each hit on the nearest sixteenth, or leaves your timing alone if you turn quantise off.</p>
<p>A pattern is one bar by default. Hold Record and press the last pad in the top row to make it two, four or eight.</p>
</div>
<div class="step-visual"><img src="assets/detail-pads.svg" width="276" height="184" alt="Close view of the first four pads in both rows, with two steps lit"></div>
</section>
<section class="step" id="step-2" aria-labelledby="step-2-title">
<span class="step-number" aria-hidden="true">02</span>
<div class="step-copy">
<h2 id="step-2-title">Shape the sound while it plays.</h2>
<p>Each knob does one job on the page you are on: pitch, decay, filter and drive on the first page, tone, level, pan and swing on the second. Hold Shift to switch.</p>
<p>Turn a knob while the pattern runs and the change lands on the next step, so you hear the difference in context rather than in silence.</p>
</div>
<div class="step-visual"><img src="assets/detail-knobs.svg" width="276" height="184" alt="Close view of four knobs above the first row of pads" loading="lazy"></div>
</section>
<section class="step" id="step-3" aria-labelledby="step-3-title">
<span class="step-number" aria-hidden="true">03</span>
<div class="step-copy">
<h2 id="step-3-title">Chain patterns into a song.</h2>
<p>Hold two pattern pads and Deck links them. A chain can be up to eight patterns long and loops until you stop it.</p>
<p>The display shows which pattern is playing and which comes next, so you can build a song without stopping the beat.</p>
</div>
<div class="step-visual"><img src="assets/detail-display.svg" width="322" height="215" alt="Close view of the display and the play button" loading="lazy"></div>
</section>
<section class="step" id="step-4" aria-labelledby="step-4-title">
<span class="step-number" aria-hidden="true">04</span>
<div class="step-copy">
<h2 id="step-4-title">Send it out.</h2>
<p>USB, MIDI in and out, two CV outputs and clock in and out on the back. Deck keeps time on its own, or follows the clock of whatever it is plugged into.</p>
<p>Nothing needs a driver. Plug it into a computer and it shows up as a MIDI device.</p>
</div>
<div class="step-visual wide"><img src="assets/deck-back.svg" width="600" height="140" alt="The back of Deck: power, USB, MIDI in and out, two CV outputs, clock in and out, and a headphone jack" loading="lazy"></div>
</section>
<div class="steps-end">
<a class="text-link" href="changelog.html">Read the release notes</a>
<a class="text-link" href="index.html">Back to Deck</a>
</div>
</div>
</div>
` + footer;

const release = (opts) => `<details class="release"${opts.open ? " open" : ""}>
<summary>
<span class="release-version"><span class="version">${opts.version}</span>${opts.current ? '<span class="current">Current</span>' : ""}</span>
<span class="release-heading"><span class="release-title">${opts.name}</span><span class="release-date">${opts.date}</span></span>
<span class="release-summary">${opts.summary}</span>
<span class="release-mark" aria-hidden="true">+</span>
</summary>
<div class="release-body">
<div>
${opts.groups.map(([title, items]) => `<div class="release-group"><h3>${title}</h3><ul>${items.map((t) => `<li>${t}</li>`).join("")}</ul></div>`).join("\n")}
</div>
</div>
</details>`;

pages["changelog.html"] = head(
  "Apogee · Deck release notes",
  "Every firmware release for Deck, newest first. What changed, and why.",
) + header("changelog.html") + `
<section class="page-head">
<span class="section-number">Changelog</span>
<h1>Release notes.</h1>
<p class="lead">Every firmware release for Deck, newest first. Each entry says what changed and why. The versions, names and dates are illustrative, as is Deck itself.</p>
<div class="tools"><button class="pill expand-all" type="button" aria-pressed="false"><span class="when-closed">Expand all</span><span class="when-open">Collapse all</span></button></div>
</section>
<section class="changelog" aria-label="Releases">
${release({
  version: "1.2", name: "Harbor", date: "2 September 2026", open: true, current: true,
  summary: "Pattern chaining, a metronome you can hear over the mix, and a longer undo.",
  groups: [
    ["Added", ["Chain up to eight patterns by holding two pattern pads.", "A metronome with its own level on the second knob page, so it stays audible over the mix."]],
    ["Changed", ["Undo now reaches back through the last sixteen edits instead of the last one.", "The display shows the next pattern in a chain, not only the current one."]],
    ["Fixed", ["Swing no longer resets when you change knob pages."]],
  ],
})}
${release({
  version: "1.1", name: "Kestrel", date: "14 June 2026",
  summary: "A second knob page, and the display learns to stay out of the way.",
  groups: [
    ["Added", ["A second knob page: tone, level, pan and swing. Hold Shift to switch.", "Quantise can be turned off per pattern."]],
    ["Changed", ["The display dims after a minute without input and wakes on the next touch."]],
    ["Fixed", ["The softest taps are no longer rounded down to silence."]],
  ],
})}
${release({
  version: "1.0", name: "Firstlight", date: "30 March 2026",
  summary: "The first firmware that ships in the box.",
  groups: [
    ["Added", ["Sixteen-step patterns with velocity on every step.", "USB, MIDI and CV output, with clock in and out.", "Sixteen pattern slots per bank, saved as you go."]],
    ["Changed", ["Startup goes straight to the last pattern you played."]],
  ],
})}
${release({
  version: "0.9", name: "Dockyard", date: "19 January 2026",
  summary: "The pre-release firmware used during the last round of testing.",
  groups: [
    ["Added", ["Everything in 1.0, before any of it had a name."]],
    ["Known limits", ["Chains were not yet available.", "Patterns had to be saved by hand."]],
  ],
})}
</section>
` + footer;

pages["principles.html"] = head(
  "Apogee · Principles",
  "The five things the studio behind Deck holds to: one display, one job per control, firmware that gets better not bigger, repairable by design, no account required.",
) + header("principles.html") + `
<section class="page-head">
<span class="section-number">Principles</span>
<h1>Fewer things, done properly.</h1>
<p class="lead">Apogee is the studio behind Deck. Use this page to say who you are and what you will not compromise on. These are the five things we hold to.</p>
</section>
<figure class="photo">
<img src="assets/moon.jpg" width="1920" height="1080" alt="The cratered surface of the Moon in black and white, lit from the left">
<figcaption><p>Apogee is the point in an orbit farthest from home. The name is a reminder that an instrument should take you somewhere.</p><p>Photograph of the lunar surface by NASA, via Unsplash.</p></figcaption>
</figure>
<section class="principles" aria-label="Principles">
<div class="principle"><span class="section-number">01</span><h2>One display, not a screen.</h2><p>A screen invites menus. Deck shows the step, the level and the pattern name, and nothing else. Everything you can change is a pad or a knob.</p></div>
<div class="principle"><span class="section-number">02</span><h2>Every control does one thing.</h2><p>A knob that changes meaning depending on context has to be learned again every time you pick the instrument up. Ours do not.</p></div>
<div class="principle"><span class="section-number">03</span><h2>Firmware gets better, not bigger.</h2><p>Each release fixes something or removes a step. Nothing is added because it could be, and every change is written down on the changelog.</p></div>
<div class="principle"><span class="section-number">04</span><h2>Repairable by design.</h2><p>Four screws and a standard driver. Pads, knobs and the display are parts, not the whole instrument, and the parts list is printed on the underside.</p></div>
<div class="principle"><span class="section-number">05</span><h2>No account required.</h2><p>Deck does not phone home. An update is a file you copy across, and you can read every one of them before you do.</p></div>
</section>
<section class="closing">
<span class="section-number">What Deck is not</span>
<div>
<h2>A sequencer, and only that.</h2>
<p>Deck is not a synthesizer, not a sampler with a screen, and not a controller for software. It makes patterns and sends them out. If that is what you need, it will be enough.</p>
<p>This page is illustrative template content. Replace the principles, the photograph and the closing note with your own.</p>
</div>
</section>
` + footer;

pages["credits.html"] = head(
  "Apogee · Credits and source",
  "Where the Apogee studio edition comes from: the Moon Landing foundation, the composed product drawings, the lunar photograph and the DM Sans font.",
) + header("credits.html") + `
<section class="page-head">
<span class="section-number">Credits</span>
<h1>Built on shared foundations.</h1>
<p class="lead">Apogee is a Plotform studio edition: an authored adaptation, labelled as one, with every source recorded here.</p>
</section>
<section class="credits" aria-label="Credits and source">
<div class="credit-group">
<h2>Foundation</h2>
<p>Adapted from <a href="https://github.com/mhyfritz/astro-landing-page">Moon Landing (astro-landing-page)</a> by Markus Hsi-Yang Fritz, MIT, pinned at commit 987617a50863d31bb865ee531391a191d74a878a. The dark page architecture (header, splash, content sections, footer), the CSS custom-property theme approach and the theme switcher, which became the finish toggle, come from there. The complete upstream source is included in the download.</p>
<p>The layout, typography, copy, the product drawings and the JavaScript are new work for this edition, licensed MIT.</p>
</div>
<div class="credit-group">
<h2>Product imagery</h2>
<p>The Deck drawings (the two finishes, the detail views and the back panel) are SVG files authored for this template and licensed with the rest of the code. Deck is an illustrative product: replace the drawings with photographs of your own product and the layout will hold.</p>
</div>
<div class="credit-group">
<h2>Photograph</h2>
<p>The lunar surface on the principles page is a NASA photograph published on Unsplash, credited in the Moon Landing README and used under the Unsplash License. No other photography is used.</p>
</div>
<div class="credit-group">
<h2>Font</h2>
<p>DM Sans, by Colophon Foundry and the DM Sans Project Authors, under the SIL Open Font License, bundled locally. No remote fonts, scripts, trackers or forms are used. Contact links open your email application with an example address; replace it before publishing.</p>
</div>
<div class="credit-group">
<h2>Source and licenses</h2>
<p><a href="source.zip" download>Download the complete source</a> (this adaptation and the upstream repository).</p>
<p><a href="LICENSE">Read the MIT license for this edition</a>, <a href="licenses/moon-landing-MIT.txt">the Moon Landing MIT notice</a> and <a href="licenses/dm-sans-OFL.txt">the DM Sans Open Font License</a>.</p>
</div>
</section>
` + footer;

for (const [name, html] of Object.entries(pages)) {
  if (html.includes(String.fromCharCode(8212))) throw new Error("em dash in " + name);
  writeFileSync(OUT + name, html);
  console.log(name, html.length, "bytes");
}
