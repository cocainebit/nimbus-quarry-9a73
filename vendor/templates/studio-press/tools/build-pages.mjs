/* Quire, a Plotform studio edition: page builder.
   Plain Node, no dependencies. It writes the five HTML pages from one shared
   shell so the masthead bar, the contents dialog and the foot of the page stay
   identical across the publication.

   Usage: node tools/build-pages.mjs [outputDirectory]
   The default output directory is the directory above this one.

   House rules kept by hand in the copy below:
   no em dashes, no monospace, no invented facts, and every visible string sits in
   a leaf element so Plotform's source editor can select it on its own. */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] ?? join(here, ".."));

const MAIL = "letters@example.com";

const NAV = [
  { href: "index.html", label: "Index" },
  { href: "issue.html", label: "Issue Seven" },
  { href: "essay.html", label: "Reading room" },
  { href: "masthead.html", label: "Masthead" },
];

const DEVICE = `<svg class="device" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
<rect x="1.5" y="1.5" width="45" height="45" fill="none" stroke="currentColor" stroke-width="1"></rect>
<rect x="9.5" y="9.5" width="29" height="29" fill="none" stroke="currentColor" stroke-width="1"></rect>
<circle cx="24" cy="24" r="7" fill="none" stroke="currentColor" stroke-width="1"></circle>
<line x1="24" y1="0" x2="24" y2="9.5" stroke="currentColor" stroke-width="1"></line>
<line x1="24" y1="38.5" x2="24" y2="48" stroke="currentColor" stroke-width="1"></line>
<line x1="0" y1="24" x2="9.5" y2="24" stroke="currentColor" stroke-width="1"></line>
<line x1="38.5" y1="24" x2="48" y2="24" stroke="currentColor" stroke-width="1"></line>
<circle cx="24" cy="24" r="2" fill="currentColor"></circle>
</svg>`;

const divider = (extra = "") =>
  `<div class="divider${extra}" aria-hidden="true"><span class="divider-mark"></span></div>`;

/* The inline reading-state script runs before paint so a reader who chose night
   mode never sees a flash of the day palette. The approach is AstroPaper's. */
const BOOT = `(function(){try{var d=document.documentElement,m=localStorage.getItem("quire-reading-mode"),s=localStorage.getItem("quire-type-size");if(m!=="day"&&m!=="night"){m=window.matchMedia("(prefers-color-scheme: dark)").matches?"night":"day";}if(s!=="small"&&s!=="regular"&&s!=="large"){s="regular";}d.setAttribute("data-reading-mode",m);d.setAttribute("data-type-size",s);}catch(e){document.documentElement.setAttribute("data-reading-mode","day");document.documentElement.setAttribute("data-type-size","regular");}})();`;

function bar(current) {
  const links = NAV.map(
    (item) =>
      `<a href="${item.href}"${item.href === current ? ' aria-current="page"' : ""}>${item.label}</a>`,
  ).join("");
  return `<header class="bar">
<div class="bar-inner">
<a class="wordmark" href="index.html" aria-label="Quire, the front page">Quire</a>
<p class="bar-line">A quarterly of essays on how things are made</p>
<nav class="bar-nav" aria-label="Main navigation">${links}</nav>
<button class="control" type="button" data-mode-toggle data-label-off="Night" data-label-on="Day" aria-pressed="false">Night</button>
<button class="control menu-open" type="button" data-menu-open aria-haspopup="dialog" aria-controls="contents-menu">Contents</button>
</div>
</header>
<dialog class="menu" id="contents-menu" aria-label="Contents">
<div class="menu-top">
<span class="wordmark">Quire</span>
<button class="control" type="button" data-menu-close>Close</button>
</div>
<nav aria-label="Publication">${NAV.map((item) => `<a href="${item.href}">${item.label}</a>`).join("")}<a href="colophon.html">Colophon</a></nav>
<a class="menu-mail" href="mailto:${MAIL}">${MAIL}</a>
</dialog>`;
}

const foot = `<footer class="foot" id="letters">
<div class="shell">
<div class="foot-top">
<div>
<p>Letters, corrections and submissions are read by the editors and answered slowly.</p>
<a class="foot-mail" href="mailto:${MAIL}">${MAIL}</a>
</div>
${DEVICE}
</div>
<div class="foot-bottom">
<span class="caps">Quire, a Plotform studio edition. Every piece here is invented.</span>
<nav aria-label="Foot of the page">
<a href="colophon.html">Colophon and source</a>
<a href="masthead.html">Masthead</a>
<a href="#top">Back to the top</a>
</nav>
</div>
</div>
</footer>`;

function page({ current, title, description, body, bodyClass = "" }) {
  return `<!doctype html>
<html lang="en" id="top" data-reading-mode="day" data-type-size="regular">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${description}">
<meta name="theme-color" content="#f7f4ec">
<title>${title}</title>
<link rel="preload" href="assets/source-serif-4-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="style.css">
<script>${BOOT}</script>
<script src="script.js" defer></script>
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ""}>
<a class="skip" href="#main">Skip to the text</a>
${bar(current)}
<main id="main">
${body}
</main>
${foot}
</body>
</html>
`;
}

/* ---------------------------------------------------------------- the index */

const PIECES = [
  {
    folio: "04",
    issue: "seven",
    title: "The measure",
    stand: "A column is a decision about pace, taken before a word is set.",
    author: "Ines Marchetti",
    section: "Essay",
  },
  {
    folio: "12",
    issue: "seven",
    title: "Rooms that are mostly door",
    stand: "On buildings that spend their budget on the way in, and what that teaches about first pages.",
    author: "Teodor Salm",
    section: "Essay",
  },
  {
    folio: "21",
    issue: "seven",
    title: "A short defence of the footnote",
    stand: "The note at the foot is a promise to explain later. Sometimes later is the right time.",
    author: "Ines Marchetti",
    section: "Notebook",
  },
  {
    folio: "26",
    issue: "seven",
    title: "On being early",
    stand: "Arriving before the work is ready, and sitting with it anyway.",
    author: "Hana Brekke",
    section: "Essay",
  },
  {
    folio: "33",
    issue: "seven",
    title: "Letters on the winter number",
    stand: "Readers write about margins, about paper, and about one sentence we should not have kept.",
    author: "The editors",
    section: "Correspondence",
  },
  {
    folio: "05",
    issue: "six",
    title: "The second draft is a different building",
    stand: "What survives a rewrite is rarely the part the writer was proud of.",
    author: "Teodor Salm",
    section: "Essay",
  },
  {
    folio: "16",
    issue: "six",
    title: "Against the clean desk",
    stand: "In praise of the pile, the open book and the half finished thing left in view.",
    author: "Marit Okonjo",
    section: "Notebook",
  },
  {
    folio: "24",
    issue: "six",
    title: "What the proof reader hears",
    stand: "Reading for errors is reading aloud with the volume turned down.",
    author: "Hana Brekke",
    section: "Essay",
  },
  {
    folio: "06",
    issue: "five",
    title: "Two kinds of blank page",
    stand: "One is an invitation and one is a verdict. Telling them apart is most of the work.",
    author: "Marit Okonjo",
    section: "Essay",
  },
  {
    folio: "15",
    issue: "five",
    title: "A grammar of handles",
    stand: "Every handle is an instruction written in the wrong language, and we read it anyway.",
    author: "Teodor Salm",
    section: "Notebook",
  },
  {
    folio: "22",
    issue: "five",
    title: "The last mile of anything",
    stand: "The final tenth of a piece of work takes the time the first nine tenths saved.",
    author: "Ines Marchetti",
    section: "Essay",
  },
  {
    folio: "29",
    issue: "five",
    title: "Notes toward a slower method",
    stand: "A method is a set of promises you make to the version of yourself who is tired.",
    author: "Hana Brekke",
    section: "Essay",
  },
];

const ISSUE_NAMES = { seven: "Issue Seven", six: "Issue Six", five: "Issue Five" };

const indexRows = PIECES.map(
  (piece) => `<li class="index-item" data-issue="${piece.issue}">
<a class="index-row" href="essay.html">
<span class="index-folio">${piece.folio}</span>
<span class="index-title">${piece.title}</span>
<span class="index-stand">${piece.stand}</span>
<span class="index-meta"><span class="index-author">${piece.author}</span><span>${piece.section}</span><span>${ISSUE_NAMES[piece.issue]}</span></span>
</a>
</li>`,
).join("\n");

const indexBody = `<section class="plate" aria-labelledby="plate-title">
<div class="shell">
<div class="plate-top">
<div class="plate-issue">
${DEVICE}
<p class="caps">Issue Seven, Autumn</p>
</div>
<p class="caps">Founded to be read slowly</p>
</div>
<div class="plate-main">
<h1 class="plate-title" id="plate-title">Quire</h1>
<p class="plate-sub">Four times a year, a small number of long pieces about the making of ordinary things, set to be read rather than scanned.</p>
</div>
</div>
</section>

<section class="shell lead" aria-labelledby="lead-title">
<div>
<p class="caps lead-kicker">Lead essay, Issue Seven</p>
<h2 class="lead-title" id="lead-title"><a href="essay.html">The measure</a></h2>
<p class="lead-stand">On the width of a column, the quiet work a margin does, and why a line of text is a unit of attention rather than a unit of space.</p>
<div class="lead-meta">
<p class="byline">Ines Marchetti</p>
<p class="caps">Essay</p>
<p class="caps">Folio 04</p>
</div>
<p style="margin-top:1.5rem"><a class="text-link" href="essay.html">Open it in the reading room</a></p>
</div>
<aside class="lead-aside" aria-label="From the editors">
<p class="caps" style="margin-bottom:0.75rem">From the editors</p>
<p>This number is about width: of a column, of a doorway, of the gap a reader is willing to jump between one line and the next.</p>
<p>The reading room keeps the type size and the reading mode you choose, and carries them to the next piece you open.</p>
<p><a class="text-link" href="issue.html">See the whole issue</a></p>
</aside>
</section>

${divider()}

<section class="shell" aria-labelledby="index-title">
<div class="section-head">
<h2 id="index-title">The index</h2>
<p class="caps">Every piece, newest first</p>
</div>
<div class="filter" data-filter role="group" aria-label="Filter the index by issue">
<p class="caps filter-label">Show</p>
<button class="control" type="button" data-filter-value="all" aria-pressed="true">All issues</button>
<button class="control" type="button" data-filter-value="seven" aria-pressed="false">Issue Seven</button>
<button class="control" type="button" data-filter-value="six" aria-pressed="false">Issue Six</button>
<button class="control" type="button" data-filter-value="five" aria-pressed="false">Issue Five</button>
</div>
<ul class="index-list">
${indexRows}
</ul>
<p class="status" id="index-status" role="status" aria-live="polite"></p>
<p class="demo-note">The content of this template is illustrative. The pieces, the contributors, the issues and the folio numbers were invented for it, and every entry in this index opens the same sample essay.</p>
</section>`;

/* --------------------------------------------------------------- the issue */

const CONTENTS = [
  { part: "Essays" },
  { folio: "04", title: "The measure", author: "Ines Marchetti" },
  { folio: "12", title: "Rooms that are mostly door", author: "Teodor Salm" },
  { folio: "26", title: "On being early", author: "Hana Brekke" },
  { part: "Notebook" },
  { folio: "21", title: "A short defence of the footnote", author: "Ines Marchetti" },
  { folio: "24", title: "Three tools that did not survive the move", author: "Marit Okonjo" },
  { part: "Correspondence" },
  { folio: "33", title: "Letters on the winter number", author: "Our readers" },
  { folio: "36", title: "A correction, and how it happened", author: "The editors" },
];

const contentsList = CONTENTS.map((row) =>
  row.part
    ? `<li class="contents-part"><span class="caps">${row.part}</span></li>`
    : `<li class="contents-entry">
<a class="contents-link" href="essay.html">
<span class="contents-title">${row.title}</span>
<span class="contents-leader" aria-hidden="true"></span>
<span class="contents-author">${row.author}</span>
<span class="contents-folio">${row.folio}</span>
</a>
</li>`,
).join("\n");

const issueBody = `<section class="issue-head" aria-labelledby="issue-title">
<div class="shell">
<p class="caps issue-number">Issue Seven, Autumn</p>
<h1 class="issue-title" id="issue-title">Width</h1>
<p class="issue-sub">Eight pieces on the space between things: in a column of text, in a doorway, in a working week.</p>
</div>
</section>

<section class="shell pair" aria-labelledby="note-title">
<h2 class="caps" id="note-title">Editor's note</h2>
<div class="note-column">
<p>We began this number with a complaint. A reader wrote to say that our winter issue was hard going, and that she had given up halfway through a piece she otherwise liked. She was careful to say it was not the writing. It was, she thought, something about the page.</p>
<p>She was right, and the fault was ours. We had widened the column by a small amount to fit a longer piece into fewer screens, and in doing so we had asked her eye to travel further at the end of every line than it wanted to. Nobody notices that as a decision. They notice it as fatigue, and they blame the writer.</p>
<p>So this issue is about width, and about the other quiet dimensions that decide whether a thing is used gladly or abandoned politely. Our contributors took it in different directions: one to a column of text, one to a doorway, one to the shape of a working week.</p>
<p class="sign-off">The editors</p>
</div>
</section>

${divider("")}

<section class="shell narrow" aria-labelledby="contents-title">
<div class="section-head">
<h2 id="contents-title">Contents</h2>
<p class="caps">Issue Seven</p>
</div>
<ul class="contents">
${contentsList}
</ul>
<p class="demo-note">This issue, its pieces and its contributors are invented for this template. Every entry opens the same sample essay, and the folio numbers are illustrative.</p>
</section>`;

/* ------------------------------------------------------------- the reading */

const essayBody = `<div class="shell">
<div class="running-head">
<p class="caps">Quire, Issue Seven</p>
<p class="caps">Reading room</p>
</div>
</div>

<div class="reading">
<aside class="rail" aria-label="Reading settings">
<div class="rail-group">
<span class="caps rail-legend" id="size-legend">Type size</span>
<div class="rail-buttons" role="group" aria-labelledby="size-legend">
<button class="control size-a" type="button" data-size="small" aria-pressed="false" style="font-size:0.8rem">A</button>
<button class="control size-a" type="button" data-size="regular" aria-pressed="true" style="font-size:1rem">A</button>
<button class="control size-a" type="button" data-size="large" aria-pressed="false" style="font-size:1.25rem">A</button>
</div>
</div>
<div class="rail-group">
<span class="caps rail-legend" id="mode-legend">Reading mode</span>
<div class="rail-buttons" role="group" aria-labelledby="mode-legend">
<button class="control" type="button" data-mode-toggle data-label-off="Night" data-label-on="Day" aria-pressed="false">Night</button>
</div>
</div>
<p class="rail-note">Both settings are kept in this browser and carried to the next piece you open.</p>
<p class="visually-hidden" id="reading-status" role="status" aria-live="polite"></p>
</aside>

<div class="essay-column">
<header class="essay-head">
<p class="caps essay-kicker">Essay, folio 04</p>
<h1 class="essay-title">The measure</h1>
<p class="essay-stand">A column is a decision about pace, taken before a word is set.</p>
<div class="essay-byline">
<p class="byline">Ines Marchetti</p>
<p class="caps">Issue Seven, Autumn</p>
</div>
</header>
<div class="essay-body">
<p class="opening">Setting a page begins with a decision that nobody sees. Before the face is chosen, before the size is fixed, before anyone argues about the space between the lines, someone decides how wide the text will be. Everything after that is negotiation with a number already set.</p>
<p>A column is not a container. It is a tempo mark. A narrow measure hurries the eye, breaks sentences into short runs, and makes a paragraph read like a list of assertions. A wide measure slows it down, and then slows it past the point of comfort, because at the end of every line the eye has to sweep back and find the beginning of the next one. If that journey is long enough the eye lands on a line it has already read, or skips one it has not. The reader almost never notices the error. The reader notices only that the page is tiring.</p>

<aside class="margin-note">
<p class="caps">In this margin</p>
<p>Notes like this one are set two sizes down and a shade lighter, so they read as an aside rather than an interruption. On a narrow screen they step into the column and take a rule on the left instead.</p>
</aside>

<p>Our house rule is plain. A line of this publication holds somewhere between sixty and seventy five characters, spaces counted, and the leading is set a little looser than the face asks for. That is not a law, and we have broken it in every issue we have printed. It is a starting position, the way a cook starts with salt.</p>

<h2>What the margin is for</h2>
<p>Margins are usually explained as breathing room, which is true and not very useful. A margin is where the page keeps everything that is not the argument: the folio, the running head, the remark that would otherwise have become a parenthesis, and, on paper, the thumb that holds the sheet. In a book the outer margin is generous because a hand has to go somewhere. On a screen the hand is elsewhere, so the margin is free to do other work, and the work we give it here is annotation.</p>
<p>A note in the margin is a different grammatical act from a note at the foot. The footnote is a deferral: read on, it says, and I will explain myself later. The marginal note is simultaneous. It sits beside the sentence it qualifies and asks to be read in the same breath, or skipped with nothing lost. The distinction sounds small. It changes how you write the sentence the note hangs from, because a sentence that expects to be interrupted is built differently from one that does not.</p>

<aside class="margin-note">
<p class="caps">A test</p>
<p>If a marginal note can be moved to the foot of the piece without anything being lost, it was a footnote all along, and it should go there.</p>
</aside>

<p>There is a further courtesy, older than either. When a line begins with a quotation mark, or ends with a comma, the mark is allowed to sit slightly outside the column so that the optical edge of the text stays straight. Punctuation is thin. Aligned mathematically it leaves the margin looking dented. Hanging it costs nothing, and almost nobody sees it, which is the point.</p>

<div class="pull">
<p>“Most of typography is a set of small corrections made on behalf of someone who will never be told.”</p>
</div>

<p>That is the temperament the work asks for. A page is not improved in the way a sentence is improved, by one decisive change that everyone can admire. It is improved by twenty adjustments of a quarter of a millimetre, none of which can be defended on its own, and all of which together are the difference between a reader who finishes and a reader who does not.</p>

<h2>The reader's half of the work</h2>
<p>We have put two controls at the top of this page: the size of the type, and the choice between day and night. They are not accessibility features bolted on at the end, though we hope they serve. They are an admission. We do not know the light you are reading in, the distance from your eye to the glass, or how tired you are at this hour. A printed page cannot ask. This one can, so it does, and it remembers your answer for the next piece you open.</p>

<aside class="margin-note">
<p class="caps">Kept where</p>
<p>The two settings live in this browser only. Nothing is sent anywhere, because there is nowhere for it to be sent.</p>
</aside>

<p>What the controls do not change, at least not directly, is the measure itself. Make the type larger and the column grows with it, because the column is specified in characters rather than in pixels. The line holds roughly the same number of words at every size, and the rhythm of the piece survives the adjustment. That is the one thing we did not want to leave to chance.</p>
<p>None of this shows up as design. When it works, a reader reaches the end of a paragraph without having made a single decision along the way, which is the only review that matters and the only one nobody writes. When it fails, the complaint is never about line length. It is that the piece was too long, or the writer was dull, or the screen was too bright. The page takes the blame in silence, and taking the blame in silence is most of the job.</p>
</div>

<section class="notes" aria-labelledby="notes-title">
<h2 class="caps" id="notes-title">Notes</h2>
<ol>
<li>
<p class="note-lemma">a starting position, the way a cook starts with salt</p>
<p class="note-body">Every issue has at least one piece that breaks the rule, usually a short one, where a narrow column and a fast line are the whole effect. We set those by eye and argue about them afterwards.</p>
</li>
<li>
<p class="note-lemma">the thumb that holds the sheet</p>
<p class="note-body">A colleague points out that this argument makes the reader's hand a design constraint, and that we should therefore be willing to leave a wide margin on a screen for no reason at all. We are willing. We have simply given the space a job.</p>
</li>
<li>
<p class="note-lemma">twenty adjustments of a quarter of a millimetre</p>
<p class="note-body">The figure is a manner of speaking rather than a count. Nobody has ever measured the corrections in a page, and a person who did would have found a better use for the afternoon.</p>
</li>
</ol>
</section>

<nav class="adjacent" aria-label="Other pieces in this issue">
<a href="issue.html">
<span class="caps">Earlier in the issue</span>
<span class="adjacent-title">Rooms that are mostly door</span>
</a>
<a class="adjacent-next" href="issue.html">
<span class="caps">Later in the issue</span>
<span class="adjacent-title">A short defence of the footnote</span>
</a>
</nav>

<p class="demo-note">This essay was written for this template. It is illustrative: the author, the publication and the issue are invented, and nothing here reports a real event, a real reader or a real measurement.</p>
</div>
</div>`;

/* ------------------------------------------------------------- the masthead */

const STAFF = [
  ["Editor", "Ines Marchetti"],
  ["Deputy editor", "Teodor Salm"],
  ["Notebook", "Marit Okonjo"],
  ["Correspondence", "Hana Brekke"],
  ["Proofs", "Aurelie Nkemba"],
  ["Design and setting", "The editors"],
];

const SPEC = [
  ["Text face", "Source Serif 4, set with optical sizing so that display sizes run finer and text sizes run sturdier."],
  ["Measure", "Sixty two characters at the standard size, specified in characters so that it grows with the type."],
  ["Leading", "About one and six tenths of the type size, a little looser than the face asks for."],
  ["Paragraphs", "Indented rather than spaced, as a book sets them, with no indent after a subheading."],
  ["Furniture", "The same face, set as capitals at small size and letterspaced. No second family, and no monospace anywhere."],
  ["Rules", "Hairlines for entries, a double rule for the head and foot of a page, and a lozenge where a section turns."],
  ["Reading modes", "Day and night, both drawn from one set of tokens so that contrast holds either way."],
  ["Pictures", "None. This publication is set, not illustrated, and the only marks are rules and one printer's device."],
];

const mastheadBody = `<section class="issue-head" aria-labelledby="masthead-title">
<div class="shell">
<p class="caps issue-number">Masthead</p>
<h1 class="issue-title" id="masthead-title">Who makes it</h1>
<p class="issue-sub">A small publication, made by people who also do other work, and set entirely in one typeface.</p>
</div>
</section>

<section class="shell pair" aria-labelledby="staff-title">
<h2 class="caps" id="staff-title">The editors</h2>
<div>
<ul class="staff">
${STAFF.map(([role, name]) => `<li><span class="caps staff-role">${role}</span><span class="staff-name">${name}</span></li>`).join("\n")}
</ul>
<p class="demo-note">The people named here are invented for this template, as are their roles. Replace them with your own before you publish.</p>
</div>
</section>

${divider("")}

<section class="shell pair" aria-labelledby="setting-title">
<h2 class="caps" id="setting-title">How it is set</h2>
<div>
<div class="pair-body">
<p>A publication with no pictures has to make its identity out of the things it does have: a face, a measure, a set of rules and a pair of margins. That is a narrower brief than it sounds, and a more forgiving one, because none of it goes out of date.</p>
</div>
<dl class="spec">
${SPEC.map(([term, value]) => `<div class="spec-row"><dt>${term}</dt><dd>${value}</dd></div>`).join("\n")}
</dl>
</div>
</section>

<section class="shell pair" aria-labelledby="ladder-title">
<h2 class="caps" id="ladder-title">The scale</h2>
<div>
<ul class="ladder">
<li><span class="caps ladder-label">Display</span><p class="ladder-line ladder-display">Width, and what it costs</p></li>
<li><span class="caps ladder-label">Title</span><p class="ladder-line ladder-title">Rooms that are mostly door</p></li>
<li><span class="caps ladder-label">Text</span><p class="ladder-line ladder-text">A column is not a container. It is a tempo mark, and it is set before anything else is chosen.</p></li>
<li><span class="caps ladder-label">Text italic</span><p class="ladder-line ladder-italic">A column is not a container. It is a tempo mark, and it is set before anything else is chosen.</p></li>
<li><span class="caps ladder-label">Furniture</span><p class="ladder-line ladder-caps">Issue seven, autumn, folio 04</p></li>
</ul>
</div>
</section>

<section class="shell pair" aria-labelledby="submit-title">
<h2 class="caps" id="submit-title">Writing for us</h2>
<div class="pair-body">
<p>We read everything that arrives and answer slowly. Send the piece itself rather than a description of it, in whatever form you have it, and tell us in one line what you think it is about.</p>
<p>We publish four times a year, and a piece accepted now will usually appear in the number after next.</p>
<p><a class="text-link" href="mailto:${MAIL}">${MAIL}</a></p>
<p class="demo-note">This address is an example. It opens your email application and goes nowhere: there is no form, no service and no tracking anywhere in this template.</p>
</div>
</section>`;

/* ------------------------------------------------------------- the colophon */

const colophonBody = `<section class="issue-head" aria-labelledby="colophon-title">
<div class="shell">
<p class="caps issue-number">Colophon</p>
<h1 class="issue-title" id="colophon-title">How this was made</h1>
<p class="issue-sub">What was adapted, what was written for this edition, and where the source and the licences live.</p>
</div>
</section>

<section class="shell pair" aria-labelledby="foundation-title">
<h2 class="caps" id="foundation-title">Foundation</h2>
<div class="colophon-body">
<p>Adapted from AstroPaper by Sat Naing, an MIT licensed Astro publication theme, pinned at commit 35cfa7fbe0b897306d27670d3819e55d5205f3dd. Its notice is kept beside these pages in the licences folder, and the upstream source is archived inside the source download.</p>
<p>What was taken is the architecture rather than the code: a publication with an index, an issue, a piece, an about page and a colophon; the token pair held on a data attribute on the root element; and the reading state written to local storage and applied before paint so that the page never flashes the wrong palette. What was left behind is Astro, Tailwind, the search, the feed, the generated preview images and every line of upstream copy.</p>
<p>The pages, the stylesheet, the script, the type system and all of the writing were made for this edition and are licensed MIT.</p>
</div>
</section>

<section class="shell pair" aria-labelledby="type-title">
<h2 class="caps" id="type-title">Type</h2>
<div class="colophon-body">
<p>Set in Source Serif 4 by Frank Griesshammer for Adobe, under the SIL Open Font License 1.1. Two files are bundled with these pages, a roman and an italic, each carrying the weight and optical size axes. The licence is kept in the licences folder. Nothing is loaded from a font service, and there is no remote script, tracker or form anywhere in this template.</p>
</div>
</section>

<section class="shell pair" aria-labelledby="pictures-title">
<h2 class="caps" id="pictures-title">Pictures</h2>
<div class="colophon-body">
<p>There are none. This edition carries no photographs and no generated images. The printer's device in the masthead bar and at the foot of every page is an inline drawing written for this template, and every rule, lozenge and leader is drawn by the stylesheet.</p>
</div>
</section>

<section class="shell pair" aria-labelledby="content-title">
<h2 class="caps" id="content-title">Content</h2>
<div class="colophon-body">
<p>Everything in this publication is illustrative. Quire does not exist. The essays, the contributors, the editors, the issues, the folio numbers and the letters from readers were invented for this template, and no claim, figure or endorsement here refers to anything real.</p>
<p>Replace the writing with your own, and replace the example address before you publish.</p>
</div>
</section>

<section class="shell pair" aria-labelledby="source-title">
<h2 class="caps" id="source-title">Source</h2>
<div class="colophon-body">
<p>The complete adapted source, together with the upstream it was adapted from, is packaged beside these pages.</p>
<p><a class="archive" href="source.zip" download>Download the source archive</a></p>
<ul class="colophon-list">
<li>Adapted work, licensed MIT, written for Plotform.</li>
<li>AstroPaper, licensed MIT, copyright 2023 Sat Naing.</li>
<li>Source Serif 4, licensed under the SIL Open Font License 1.1, copyright 2014 to 2023 Adobe.</li>
</ul>
</div>
</section>`;

/* ---------------------------------------------------------------- write out */

const pages = [
  {
    file: "index.html",
    current: "index.html",
    title: "Quire, a quarterly of essays on how things are made",
    description:
      "Quire is an illustrative essay publication: an index of pieces, an issue, a reading room and a masthead, set in one typeface with no pictures.",
    body: indexBody,
  },
  {
    file: "issue.html",
    current: "issue.html",
    title: "Issue Seven, Width | Quire",
    description:
      "Issue Seven of Quire: an editor's note and a contents list of eight illustrative pieces about the space between things.",
    body: issueBody,
  },
  {
    file: "essay.html",
    current: "essay.html",
    title: "The measure | Quire",
    description:
      "An illustrative essay on line length, margins and the reader's half of the work, set with a drop cap, marginal notes and keyed end notes.",
    body: essayBody,
    bodyClass: "page-reading",
  },
  {
    file: "masthead.html",
    current: "masthead.html",
    title: "Masthead | Quire",
    description:
      "Who makes Quire, how it is set, the type scale it uses, and how to write for it.",
    body: mastheadBody,
  },
  {
    file: "colophon.html",
    current: "colophon.html",
    title: "Colophon | Quire",
    description:
      "What Quire was adapted from, the typeface it is set in, and where the source archive and licences live.",
    body: colophonBody,
  },
];

await mkdir(out, { recursive: true });
for (const item of pages) {
  await writeFile(join(out, item.file), page(item), "utf8");
  console.log("wrote " + join(out, item.file));
}
