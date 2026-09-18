/*
 * Overtone, a Plotform studio edition.
 *
 * Writes the five HTML pages. The catalogue lives here once so the home page,
 * the catalogue page and the release page cannot drift apart, and so the
 * waveform's forty eight bars stay out of the hand written markup.
 *
 * Run from the edition folder:  node tools/build-pages.mjs
 *
 * Editing the produced HTML by hand works too: the pages are the deliverable
 * and nothing at run time depends on this script.
 */
import { writeFile } from "node:fs/promises";

const OUT = new URL("../", import.meta.url);
const MAIL = "hello@example.com";

const NAV = [
  { href: "index.html", label: "Label" },
  { href: "releases.html", label: "Catalogue" },
  { href: "release-tessellate.html", label: "Latest release" },
  { href: "studio.html", label: "Studio" },
];

/* Titles, formats, years and lengths below are illustrative. */
const CATALOGUE = [
  { code: "OVT-014", slug: "ovt-014", title: "Tessellate", format: "Vinyl", year: "2026", note: "Six pieces built from one repeating figure." },
  { code: "OVT-013", slug: "ovt-013", title: "Standing Wave", format: "Digital", year: "2026", note: "Two long takes, recorded in one afternoon." },
  { code: "OVT-012", slug: "ovt-012", title: "Dry Signal", format: "Vinyl", year: "2026", note: "Nothing added after the microphone." },
  { code: "OVT-011", slug: "ovt-011", title: "Room Tone", format: "Tape", year: "2025", note: "The sound of the room between the takes." },
  { code: "OVT-010", slug: "ovt-010", title: "Half Step", format: "Digital", year: "2025", note: "A study that never resolves upward." },
  { code: "OVT-009", slug: "ovt-009", title: "Grid Nine", format: "Vinyl", year: "2025", note: "Nine parts on a nine beat grid." },
  { code: "OVT-008", slug: "ovt-008", title: "Slow Attack", format: "Tape", year: "2024", note: "Every note arrives late on purpose." },
  { code: "OVT-007", slug: "ovt-007", title: "Cold Start", format: "Digital", year: "2024", note: "Machines recorded from the first second on." },
  { code: "OVT-006", slug: "ovt-006", title: "Parallel Fifths", format: "Vinyl", year: "2024", note: "Two lines that refuse to separate." },
  { code: "OVT-005", slug: "ovt-005", title: "Dead Air", format: "Tape", year: "2023", note: "Silence treated as a part of the arrangement." },
  { code: "OVT-004", slug: "ovt-004", title: "Long Decay", format: "Digital", year: "2023", note: "One chord, followed all the way down." },
  { code: "OVT-003", slug: "ovt-003", title: "Pressure Plate", format: "Vinyl", year: "2023", note: "Rhythm cut from contact microphones." },
];

const FORMATS = ["Vinyl", "Tape", "Digital"];
const YEARS = ["2026", "2025", "2024", "2023"];

const TRACKS = [
  { number: "01", title: "Tessellate", length: "4:12" },
  { number: "02", title: "Pale Grid", length: "3:48" },
  { number: "03", title: "Second Room", length: "6:05" },
  { number: "04", title: "Flat Field", length: "2:57" },
  { number: "05", title: "Standing Wave, Reprise", length: "5:31" },
  { number: "06", title: "Dry Return", length: "7:20" },
];

const DEMO_NOTE =
  "Overtone is an illustrative label written for this template. The catalogue numbers, titles, formats, dates and track lengths are examples rather than real records, and the site carries no audio.";

/* ---------- shared chrome ---------- */

function head(title, description) {
  return `<!doctype html>
<html lang="en" id="top">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${description}">
<title>Overtone · ${title}</title>
<link rel="preload" href="assets/manrope.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/inter.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="style.css">
<script src="script.js" defer></script>
</head>
<body>`;
}

function header(current) {
  const links = NAV.map(
    (item) =>
      `<a href="${item.href}"${item.href === current ? ' aria-current="page"' : ""}>${item.label}</a>`,
  ).join("");
  const menuLinks = NAV.map((item) => `<a href="${item.href}">${item.label}</a>`).join("");
  return `<a class="skip" href="#main">Skip to content</a><header class="site-header">
<a class="wordmark" href="index.html" aria-label="Overtone home">overtone</a>
<nav class="site-nav" aria-label="Main navigation">${links}</nav>
<a class="pill header-mail" href="mailto:${MAIL}">Write to us</a>
<button class="pill menu-toggle" type="button" aria-haspopup="dialog" aria-controls="menu">Menu</button>
</header>
<dialog class="menu" id="menu" aria-label="Main navigation">
<div class="menu-top"><span class="wordmark">overtone</span><button class="pill menu-close" type="button">Close</button></div>
<nav>${menuLinks}</nav>
<a class="menu-mail" href="mailto:${MAIL}">${MAIL}</a>
</dialog>
<main id="main">`;
}

function footer() {
  return `</main>
<footer class="site-footer" id="contact">
<div class="footer-top">
<p>Demos, pressing questions, or a room booking. One address reaches the whole label.</p>
<a class="footer-mail" href="mailto:${MAIL}">${MAIL}</a>
</div>
<a class="footer-wordmark" href="index.html" aria-label="Overtone home">overtone</a>
<div class="footer-bottom">
<span>Overtone, a Plotform studio edition. An illustrative label, not a real one.</span>
<nav aria-label="Footer"><a href="credits.html">Credits and source</a><a href="releases.html">Catalogue</a><a href="#top">Back to top</a></nav>
</div>
</footer>
</body>
</html>
`;
}

/* The kinetic layer: giant outlined words that drift behind the content. */
function kinetic(word, rows = 5) {
  const lines = [];
  for (let i = 0; i < rows; i += 1) {
    const solid = i === 2 ? " is-solid" : "";
    lines.push(`<span class="kinetic-line${solid}" style="--n:${i}">${word}</span>`);
  }
  return `<div class="kinetic" aria-hidden="true">${lines.join("")}</div>`;
}

function releaseCard(entry) {
  return `<li class="release" data-format="${entry.format.toLowerCase()}" data-year="${entry.year}">
<a class="release-cover" href="release-tessellate.html" tabindex="-1" aria-hidden="true"><img src="assets/cover-${entry.slug}.svg" width="600" height="600" alt="Sleeve for ${entry.title}: a flat drawn composition" loading="lazy"></a>
<span class="release-cat">${entry.code}</span>
<h3><a href="release-tessellate.html">${entry.title}</a></h3>
<p class="release-meta"><span>${entry.format}</span><span>${entry.year}</span></p>
</li>`;
}

/* Forty eight bars, drawn once here rather than typed into the page. */
function waveform() {
  const bars = [];
  const count = 48;
  for (let i = 0; i < count; i += 1) {
    const shape =
      Math.abs(Math.sin(i / 3.1)) * 0.55 +
      Math.abs(Math.sin(i / 8.7)) * 0.33 +
      0.12;
    const height = Math.max(8, Math.round(shape * 132));
    const y = Math.round((160 - height) / 2);
    bars.push(
      `<rect class="wave-bar" style="--i:${i}" x="${i * 20 + 4}" y="${y}" width="12" height="${height}" rx="1"/>`,
    );
  }
  return `<svg class="wave" viewBox="0 0 960 160" width="960" height="160" aria-hidden="true" focusable="false">
${bars.join("")}
<rect class="playhead" x="0" y="0" width="4" height="160"/>
</svg>`;
}

/* ---------- pages ---------- */

function indexPage() {
  const recent = CATALOGUE.slice(1, 5).map(releaseCard).join("\n");
  const latest = CATALOGUE[0];
  return `${head("A record label and sound studio", "Overtone is an illustrative record label and sound studio: a dark, typographic template with a drawn catalogue, a filtering release index and a waveform that plays no audio.")}
${header("index.html")}
<section class="hero" aria-labelledby="hero-title">
${kinetic("overtone")}
<div class="hero-body">
<p class="eyebrow">A record label and a room to record in</p>
<h1 id="hero-title"><span>Sound with</span><span>the room</span><span class="is-outline">left in.</span></h1>
<p class="lead">Overtone presses a small number of records a year and records most of them in its own two rooms. Nothing is tuned to a chart, and nothing is finished in a hurry.</p>
<div class="hero-foot">
<a class="text-link" href="releases.html">Open the catalogue</a>
<span class="tag">Vinyl, tape and digital</span>
<span class="tag">Two rooms</span>
<span class="tag">Cut at half speed</span>
</div>
<p class="demo-note">${DEMO_NOTE}</p>
</div>
</section>

<div class="marquee" aria-label="Label ticker"><div class="marquee-track"><span class="marquee-text">${latest.code} ${latest.title} is out now. Mastered in room b. Cut at half speed. No plug-ins on the master.</span><span class="marquee-text" aria-hidden="true">${latest.code} ${latest.title} is out now. Mastered in room b. Cut at half speed. No plug-ins on the master.</span></div></div>

<section class="field field-sunk" aria-labelledby="latest-title">
<p class="rule-label"><span>Latest release</span><span>${latest.code}</span></p>
<div class="feature">
<figure class="feature-cover">
<img src="assets/cover-${latest.slug}.svg" width="600" height="600" alt="Sleeve for ${latest.title}: rotated squares turning around one point on a flat field">
</figure>
<div class="feature-body">
<h3 id="latest-title">${latest.title}</h3>
<p class="lead">${latest.note} The figure is played once, then folded into itself until the edges of the pattern stop lining up.</p>
<dl class="spec">
<dt>Format</dt><dd>${latest.format}, one disc</dd>
<dt>Released</dt><dd>${latest.year}</dd>
<dt>Tracks</dt><dd>Six</dd>
<dt>Cut</dt><dd>Half speed, from the studio tape</dd>
</dl>
<a class="text-link" href="release-tessellate.html">Open the release</a>
</div>
</div>
</section>

<section class="section" aria-labelledby="recent-title">
<div class="section-head">
<h2 id="recent-title">Recently on the label</h2>
<p class="lead">Four from the last two years. Every sleeve is drawn rather than photographed, so the catalogue reads as one set.</p>
</div>
<ul class="catalogue">
${recent}
</ul>
<p class="section-foot"><a class="text-link" href="releases.html">See all twelve entries</a></p>
</section>

<section class="section" aria-labelledby="signal-title">
<div class="section-head">
<h2 id="signal-title">One signal, drawn twice</h2>
<p class="lead">The label mark is a level meter frozen at a moment. It appears on the sleeves, on the labels and at the top of every page.</p>
</div>
<figure class="diagram">
<img src="assets/spectrum.svg" width="968" height="200" alt="A band of vertical bars of varying height, drawn as a level meter">
<figcaption>The meter is a drawing. Nothing on this site measures or plays sound.</figcaption>
</figure>
</section>

<section class="field field-bone" aria-labelledby="work-title">
<p class="rule-label"><span>How the label works</span><span>Three rules</span></p>
<div class="section-head">
<h2 id="work-title">Fewer records, longer sessions.</h2>
</div>
<ul class="approach">
<li><h3>The room is part of the record</h3><p>Sessions are recorded in the room they were written for, with the microphones far enough back to hear it. The reverberation on the record is the room, not a setting.</p></li>
<li><h3>Masters are cut, not levelled</h3><p>Records are cut at half speed from the studio tape. Loudness is left where the mix put it, so quiet passages stay quiet on the pressing.</p></li>
<li><h3>Sleeves are drawn</h3><p>Every sleeve is a flat geometric composition built from the same set of shapes. No photographs appear anywhere in the catalogue.</p></li>
</ul>
<p class="demo-note">${DEMO_NOTE}</p>
</section>
${footer()}`;
}

function releasesPage() {
  const formatButtons = ["All", ...FORMATS]
    .map(
      (name) =>
        `<button type="button" data-value="${name === "All" ? "all" : name.toLowerCase()}" aria-pressed="${name === "All"}">${name}</button>`,
    )
    .join("");
  const yearButtons = ["All", ...YEARS]
    .map(
      (name) =>
        `<button type="button" data-value="${name === "All" ? "all" : name}" aria-pressed="${name === "All"}">${name}</button>`,
    )
    .join("");
  return `${head("The catalogue", "Twelve illustrative releases with drawn sleeves, filtered by format and by year without leaving the page.")}
${header("releases.html")}
<section class="page-head">
<div>
<p class="eyebrow">Catalogue</p>
<h1>Twelve entries, filed by format and year.</h1>
</div>
<div>
<p class="lead">Narrow the list by format, by year, or by both. Nothing is fetched while you do it: every entry is already on the page and the filters only decide what stays visible.</p>
<p class="demo-note">${DEMO_NOTE} Every entry opens the same release page in this template; copy <span>release-tessellate.html</span> once per record.</p>
</div>
</section>
<section class="section" aria-labelledby="catalogue-title">
<h2 class="visually-hidden" id="catalogue-title">Catalogue</h2>
<div class="filters">
<div class="filter-group" role="group" aria-label="Format" data-filter="format">
<span class="filter-label">Format</span>
${formatButtons}
</div>
<div class="filter-group" role="group" aria-label="Year" data-filter="year">
<span class="filter-label">Year</span>
${yearButtons}
</div>
<div class="filter-foot">
<p class="filter-count" id="release-count" role="status">Showing all ${CATALOGUE.length} releases</p>
<button class="filter-clear" type="button">Clear the filters</button>
</div>
</div>
<ul class="catalogue" id="catalogue">
${CATALOGUE.map(releaseCard).join("\n")}
</ul>
<p class="release-empty" id="release-empty" hidden>Nothing in the catalogue matches that pair of filters. Clear one of them to see more.</p>
</section>
${footer()}`;
}

function releasePage() {
  const entry = CATALOGUE[0];
  const tracks = TRACKS.map(
    (track) =>
      `<li><span class="track-number">${track.number}</span><span class="track-title">${track.title}</span><span class="track-length">${track.length}</span></li>`,
  ).join("\n");
  return `${head(`${entry.code} ${entry.title}`, "An illustrative release page: a drawn sleeve, a tracklist set in tabular figures and a waveform whose play state is a drawing rather than an audio file.")}
${header("release-tessellate.html")}
<section class="release-hero" aria-labelledby="release-title">
${kinetic("tessellate", 4)}
<div class="release-hero-body">
<p class="eyebrow">${entry.code}</p>
<h1 id="release-title">${entry.title}</h1>
<p class="hero-meta"><span class="tag">${entry.format}</span><span class="tag">${entry.year}</span><span class="tag">Six tracks</span><span class="tag">Half speed cut</span></p>
</div>
</section>
<section class="section" aria-labelledby="listen-title">
<div class="release-layout">
<div class="release-art">
<img src="assets/cover-${entry.slug}.svg" width="600" height="600" alt="Sleeve for ${entry.title}: nine squares rotating around one point on a flat field">
<dl class="spec">
<dt>Catalogue</dt><dd>${entry.code}</dd>
<dt>Format</dt><dd>${entry.format}, one disc</dd>
<dt>Released</dt><dd>${entry.year}</dd>
<dt>Sleeve</dt><dd>Drawn for the release</dd>
</dl>
<a class="text-link" href="releases.html">Back to the catalogue</a>
</div>
<div class="release-main">
<h2 id="listen-title" class="visually-hidden">The record</h2>
<p class="lead">${entry.note} Each piece takes the same six bar figure and turns it a little further, until the pattern stops meeting itself at the edges.</p>
<div class="player" data-playing="false">
<div class="player-top">
<button class="play" type="button" aria-pressed="false"><span class="play-icon" aria-hidden="true"></span><span class="play-label">Play the waveform</span></button>
<span class="player-clock">Side A, 30:03</span>
</div>
<div class="wave-wrap">
${waveform()}
</div>
<p class="player-note">No audio file is loaded and nothing plays. The button moves a drawing between two states, and the drawing holds still when the browser is set to reduce motion.</p>
<span class="visually-hidden" id="player-status" aria-live="polite"></span>
</div>
<ol class="tracklist">
${tracks}
</ol>
<dl class="credit-list">
<div><dt>Recorded</dt><dd>Room A, over four sessions</dd></div>
<div><dt>Mixed</dt><dd>Room B, on the console</dd></div>
<div><dt>Cut</dt><dd>Half speed, from the studio tape</dd></div>
<div><dt>Sleeve</dt><dd>Drawn in house, printed one colour</dd></div>
</dl>
<p class="demo-note">${DEMO_NOTE}</p>
</div>
</div>
</section>
<section class="field field-bone" aria-labelledby="pressing-title">
<p class="rule-label"><span>Pressing notes</span><span>${entry.code}</span></p>
<div class="section-head">
<h2 id="pressing-title">What is on the disc, and what is not.</h2>
<p class="lead">The record runs at thirty three and a third, one disc, with a plain inner sleeve. The lacquer was cut from the studio tape rather than a file, so the two sides were mastered to the same level and left there.</p>
</div>
<p class="demo-note">Pressing details on this page are illustrative. Replace them with your own before publishing, and write to <a class="text-link" href="mailto:${MAIL}">${MAIL}</a> if you want the layout adjusted.</p>
</section>
${footer()}`;
}

function studioPage() {
  return `${head("The studio", "Two rooms, one signal path, and the way an illustrative label records and cuts its records.")}
${header("studio.html")}
<section class="page-head">
<div>
<p class="eyebrow">The studio</p>
<h1>Two rooms, one signal path.</h1>
</div>
<div>
<p class="lead">The label and the studio are the same address. Records are written in one room, recorded in the other, and cut without leaving the building.</p>
<p class="demo-note">${DEMO_NOTE}</p>
</div>
</section>

<section class="section" aria-labelledby="approach-title">
<div class="section-head">
<h2 id="approach-title">How a record gets made here</h2>
</div>
<ul class="approach">
<li><h3>01 Bring the piece in finished</h3><p>Sessions start from something that already works in a room. Arrangement happens before the first session rather than during it.</p></li>
<li><h3>02 Record the whole take</h3><p>Parts are played through. Where an edit is needed it is made at a bar line, not inside a phrase.</p></li>
<li><h3>03 Mix on the console</h3><p>The mix is a set of moves made in one pass, with the fades written down so a second pass can repeat them.</p></li>
<li><h3>04 Cut and leave it</h3><p>The lacquer is cut at half speed from the tape. Nothing is raised afterwards to match another record.</p></li>
</ul>
</section>

<section class="field field-sunk" aria-labelledby="path-title">
<p class="rule-label"><span>The signal path</span><span>Drawn, not photographed</span></p>
<div class="section-head">
<h2 id="path-title">Microphone to lacquer, with one loop.</h2>
<p class="lead">The dotted return is the only place a signal goes backward: the room send that puts the second room into the first.</p>
</div>
<figure class="diagram">
<img src="assets/signal-path.svg" width="900" height="400" alt="A routing diagram: one source splitting into two paths, joining at a highlighted box, then continuing to an output, with a dotted loop returning to the second path">
<figcaption>A drawing of the routing, not a photograph of the racks.</figcaption>
</figure>
</section>

<section class="section" aria-labelledby="rooms-title">
<div class="section-head">
<h2 id="rooms-title">The rooms</h2>
<p class="lead">Two rooms and a cutting bench. Both rooms are bookable by the day, including for records the label is not releasing.</p>
</div>
<ul class="rooms">
<li><h3>Room A</h3><p>The live room. High ceiling, wooden floor, one dead corner for close work. Big enough for a group playing together.</p></li>
<li><h3>Room B</h3><p>The mix room. Console, tape machine, and a pair of speakers that have not moved in years.</p></li>
<li><h3>The bench</h3><p>Where lacquers are cut and sleeves are printed. One colour at a time, which is why the sleeves look the way they do.</p></li>
</ul>
</section>

<section class="field field-bone" aria-labelledby="contact-title">
<p class="rule-label"><span>Contact</span><span>One address</span></p>
<div class="section-head">
<h2 id="contact-title">Write, and say which room you mean.</h2>
<p class="lead">Demos, pressing questions and room bookings all reach the same place. There is no form on this site and nothing here is sent anywhere.</p>
</div>
<p class="section-foot"><a class="text-link" href="mailto:${MAIL}">${MAIL}</a></p>
<p class="demo-note">The address above is an example. Replace it with your own before publishing.</p>
</section>
${footer()}`;
}

function creditsPage() {
  return `${head("Credits and source", "Where the Overtone studio edition comes from: the Codrops kinetic type foundation, the drawn sleeves, and the Inter and Manrope fonts.")}
${header("credits.html")}
<section class="page-head">
<div>
<p class="eyebrow">Credits</p>
<h1>Built on a licensed foundation, and labelled as one.</h1>
</div>
<div>
<p class="lead">Overtone is a Plotform studio edition: an authored adaptation rather than an unchanged upstream template, with every source recorded here.</p>
</div>
</section>
<section class="credits" aria-label="Credits and source">
<div class="credit-group">
<h2>Foundation</h2>
<p>Adapted from <a href="https://github.com/codrops/KineticTypePageTransition">Kinetic Type Page Transition</a> by Codrops, MIT, pinned at commit ebe926e2f1de42950c36ff8a678321155280c1af. The kinetic layer of oversized repeated type behind the content, the custom property colour theme, the frame style header and the flat colour field treatment come from there.</p>
<p>The upstream animates with GSAP, which carries its own licence. This edition does not use it: the drift, the ticker and the waveform are plain CSS animations, and the JavaScript has no dependencies at all.</p>
</div>
<div class="credit-group">
<h2>Sleeves and diagrams</h2>
<p>The twelve sleeves, the level meter and the routing diagram are SVG files written for this edition by a small script included in the download. There is no photography anywhere on the site and no generated imagery.</p>
</div>
<div class="credit-group">
<h2>Fonts</h2>
<p>Manrope for display and Inter for text, both under the SIL Open Font License and both bundled locally. Numbers are set in the same sans with tabular figures, so track lengths line up without a monospace face. No remote fonts, scripts, trackers or form services are used.</p>
</div>
<div class="credit-group">
<h2>Sound</h2>
<p>The waveform on the release page is a drawing. The site carries no audio file, loads no player and starts nothing on its own, and the play button only moves the drawing between two states.</p>
</div>
<div class="credit-group">
<h2>Content</h2>
<p>${DEMO_NOTE} No performer is named, and no chart position, sales figure, price, award or review appears anywhere.</p>
</div>
<div class="credit-group">
<h2>Source and licences</h2>
<p><a href="source.zip" download>Download the complete source</a>, which holds this adaptation and the pinned upstream repository.</p>
<p><a href="LICENSE">The MIT licence for this edition</a>, <a href="licenses/kinetic-type-MIT.txt">the Codrops MIT notice</a>, <a href="licenses/manrope-OFL.txt">the Manrope Open Font License</a> and <a href="licenses/inter-OFL.txt">the Inter Open Font License</a>.</p>
</div>
</section>
${footer()}`;
}

const pages = {
  "index.html": indexPage(),
  "releases.html": releasesPage(),
  "release-tessellate.html": releasePage(),
  "studio.html": studioPage(),
  "credits.html": creditsPage(),
};

for (const [name, html] of Object.entries(pages)) {
  if (html.includes("\u2014")) throw new Error(`Em dash in ${name}`);
  await writeFile(new URL(name, OUT), html);
}
console.log(`Wrote ${Object.keys(pages).length} pages`);
