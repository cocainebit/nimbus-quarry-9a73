/* Threshold, a Plotform studio edition: page builder.

   Plain Node, no dependencies. It writes the five pages from one shared shell
   so the bar, the foot and the standing note about illustrative numbers stay
   identical across the site.

   It reads model.js and the shared drawing block at the top of script.js and
   uses them directly, so the curve saved into the HTML, the numbers written
   into the sentences and the figures the browser draws all come from the same
   place and cannot drift apart.

   Usage: node tools/build-pages.mjs [outputDirectory]
   The default output directory is the directory above this one.

   House rules kept by hand in the copy below: no em dashes, no monospace as a
   user interface face, no invented figure presented as research, and every
   visible string sits in a leaf element so Plotform's source editor can select
   it on its own. */

import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const out = resolve(process.argv[2] ?? root);

/* ---------- read the model and the shared drawing helpers ---------- */

const modelSource = await readFile(join(root, "model.js"), "utf8");
const scriptSource = await readFile(join(root, "script.js"), "utf8");
const drawBlock = scriptSource.slice(
  scriptSource.indexOf("/* ---- shared drawing"),
  scriptSource.indexOf("/* ---- end shared drawing ---- */"),
);
if (!drawBlock) throw new Error("Could not find the shared drawing block in script.js");

const { FIGURES, GEOMETRY, DRAW } = new Function(
  `${modelSource}\n${drawBlock}\nreturn { FIGURES, GEOMETRY, DRAW };`,
)();

const counter = FIGURES.counter;
const morning = FIGURES.morning;

/* Every number the prose uses, worked out once, here. */
const N = {
  waitAt: (load) => Math.round(counter.waitMinutes(load)),
  queueAt: (load) => Math.round(counter.peopleWaiting(load)),
  packed: morning.total(false),
  kept: morning.total(true),
};
N.waitedSaved = N.packed.waited - N.kept.waited;
N.peopleLost = N.packed.people - N.kept.people;

const MAIL = "hello@example.com";

const NAV = [
  { href: "index.html", label: "The question" },
  { href: "explainer.html", label: "The explainer" },
  { href: "model.html", label: "The numbers" },
  { href: "notes.html", label: "Notes and sources" },
  { href: "about.html", label: "About" },
];

const pct = (value, total) => `${Math.round((value / total) * 10000) / 100}%`;

/* The same phrasing the browser uses, so the sentence saved into the page and
   the sentence the figure writes cannot differ. */
const plural = (count, one, many) => (count === 1 ? one : many);
const queuePhrase = (people) =>
  people === 0
    ? "the queue is usually empty"
    : `about ${people} ${plural(people, "person is", "people are")} in the queue`;
const queueCaption = (people) =>
  people === 0
    ? "Waiting: usually nobody"
    : people > counter.mostPeopleDrawn
      ? `Waiting: about ${people} people, the first ${counter.mostPeopleDrawn} of them drawn`
      : `Waiting: about ${people} ${plural(people, "person", "people")}`;
const queueValueText = (people) =>
  people === 0
    ? "the queue usually empty."
    : `about ${people} ${plural(people, "person", "people")} waiting.`;

/* ---------- the shell ---------- */

function shell({ file, title, description, body, figures = false }) {
  const nav = NAV.map(
    (item) =>
      `<a href="${item.href}"${item.href === file ? ' aria-current="page"' : ""}>${item.label}</a>`,
  ).join("");
  const scripts = figures
    ? `<script src="model.js" defer></script>\n<script src="script.js" defer></script>`
    : "";
  return `<!doctype html>
<html lang="en" id="top">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${description}">
<meta name="theme-color" content="#f4f1e8">
<title>${title}</title>
<link rel="preload" href="assets/newsreader-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="style.css">
${scripts}
</head>
<body>
<a class="skip" href="#main">Skip to the explanation</a>
<header class="bar">
<div class="bar-inner">
<a class="wordmark" href="index.html">Threshold</a>
<p class="bar-line">One idea at a time, explained with figures you can move</p>
<nav class="bar-nav" aria-label="Main navigation">${nav}</nav>
</div>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
<div class="shell-wide">
<div class="foot-top">
<div>
<p class="foot-note">Threshold is an invented group and every number on this site is illustrative, made up to show how a figure behaves. Nothing here was measured, and no study, dataset or institution is cited.</p>
<a class="foot-mail" href="mailto:${MAIL}">${MAIL}</a>
</div>
<div>
<p class="foot-note">Corrections are welcome and are published on the notes page with the date they were made.</p>
<a class="text-link" href="notes.html">Read the notes and sources</a>
</div>
</div>
<div class="foot-bottom">
<span>Threshold, a Plotform studio edition. Replace the example address before publishing.</span>
<nav aria-label="Foot of the page">
<a href="notes.html">Notes and sources</a>
<a href="model.html">The numbers</a>
<a href="about.html">About</a>
<a href="#top">Back to the top</a>
</nav>
</div>
</div>
</footer>
</body>
</html>
`;
}

const demoNote = (text) => `<p class="demo-note">${text}</p>`;

/* ---------- figure one, drawn from the model ---------- */

const g = GEOMETRY.plot;

function plotLabels() {
  const yLabels = g.markedMinutes
    .map((minutes) => {
      const top = pct(DRAW.plotY(minutes), g.height);
      return `<p class="plot-label plot-label-y" style="left:${pct(g.left, g.width)};top:${top}">${minutes}</p>`;
    })
    .join("\n");
  const xLabels = counter.markedLoads
    .map((load, index) => {
      const left = pct(DRAW.plotX(load), g.width);
      const edge =
        index === 0
          ? " plot-label-first"
          : index === counter.markedLoads.length - 1
            ? " plot-label-last"
            : "";
      return `<p class="plot-label plot-label-x${edge}" style="left:${left};top:${pct(g.bottom, g.height)}">${load}</p>`;
    })
    .join("\n");
  return `${yLabels}\n${xLabels}`;
}

function plotSvg({ interactive }) {
  const note = DRAW.annotation();
  const grid = g.markedMinutes
    .map(
      (minutes) =>
        `<line x1="${g.left}" y1="${DRAW.round(DRAW.plotY(minutes))}" x2="${g.right}" y2="${DRAW.round(DRAW.plotY(minutes))}"></line>`,
    )
    .join("");
  const startLoad = counter.startingLoad;
  const size = g.markerSize;
  const markerX = DRAW.plotX(startLoad);
  const markerY = DRAW.plotY(counter.waitMinutes(startLoad));
  const marker = interactive
    ? `<g class="plot-marker" id="counter-marker">
<line id="counter-marker-line" x1="${DRAW.round(markerX)}" y1="${DRAW.round(markerY)}" x2="${DRAW.round(markerX)}" y2="${g.bottom}"></line>
<rect id="counter-marker-dot" x="${DRAW.round(markerX - size / 2)}" y="${DRAW.round(markerY - size / 2)}" width="${size}" height="${size}"></rect>
</g>`
    : "";
  const id = (name) => (interactive ? ` id="${name}"` : "");
  return `<svg viewBox="0 0 ${g.width} ${g.height}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
<g class="plot-grid">${grid}</g>
<line class="plot-axis" x1="${g.left}" y1="${g.bottom}" x2="${g.right}" y2="${g.bottom}"></line>
<path class="plot-curve"${id("counter-curve")} d="${DRAW.curvePath()}"></path>
${marker}
<g class="plot-annotation">
<path class="plot-arrow"${id("counter-arrow")} d="${DRAW.swoopPath(note.fromX, note.fromY, note.toX, note.toY, note.bend)}"></path>
<polygon class="plot-arrow-head"${id("counter-arrow-head")} points="${DRAW.swoopHead(note.fromX, note.fromY, note.toX, note.toY, note.bend, 11)}"></polygon>
</g>
</svg>`;
}

function annotationNote() {
  const note = DRAW.annotation();
  return `<p class="plot-note plot-annotation" style="left:${pct(note.fromX, g.width)};top:${pct(note.fromY - 52, g.height)}">Past here the line stops being a slope and starts being a wall.</p>`;
}

function queueRow(load) {
  const shown = Math.min(Math.round(counter.peopleWaiting(load)), counter.mostPeopleDrawn);
  const people = Array.from({ length: counter.mostPeopleDrawn })
    .map(
      (_, index) =>
        `<img class="peep" data-peep src="assets/trust-peep-waiting.png" alt="" width="99" height="176"${index < shown ? "" : " hidden"}>`,
    )
    .join("\n");
  const queuePeople = Math.round(counter.peopleWaiting(load));
  return `<div class="queue">
<div class="queue-desk">
<img class="peep" src="assets/trust-peep-served.png" alt="A drawing of the person who has reached the counter" width="99" height="176">
<p class="queue-caption">At the counter</p>
</div>
<div class="queue-line">
<div class="queue-people" role="img" aria-label="The queue, drawn as one small figure per waiting person">
${people}
</div>
<p class="queue-caption" id="queue-caption">${queueCaption(queuePeople)}</p>
</div>
</div>`;
}

function counterFigure() {
  const load = counter.startingLoad;
  const wait = N.waitAt(load);
  const queue = N.queueAt(load);
  return `<figure class="figure" id="figure-counter" data-annotation="off">
<div class="figure-head">
<p class="figure-kicker">Figure one, move it yourself</p>
<p class="figure-title">One counter, and the queue behind it</p>
</div>
<div class="plot" id="counter-plot">
${plotSvg({ interactive: true })}
${plotLabels()}
${annotationNote()}
</div>
<p class="figure-note">Across the bottom: how many minutes of every hundred are already booked. Up the side: minutes the average person waits before reaching the counter.</p>
${queueRow(load)}
<div class="controls">
<p class="control-label" id="counter-label">How much of the day is already booked, out of 100</p>
<input type="range" id="counter-input" min="${counter.lowestLoad}" max="${counter.highestLoad}" step="1" value="${load}" aria-labelledby="counter-label" aria-describedby="counter-summary" aria-valuetext="${load} out of 100 booked. Average wait ${wait} ${plural(wait, "minute", "minutes")}, ${queueValueText(queue)}">
<p class="control-hint">Drag it, or give it the keyboard focus and use the arrow keys. While you are reading on a wide screen the text moves the slider for you, until you move it yourself.</p>
</div>
<div class="stat-row">
<div class="stat">
<p class="stat-label">Booked</p>
<p class="stat-value tabular" id="counter-load">${load} of 100</p>
</div>
<div class="stat">
<p class="stat-label">Average wait</p>
<p class="stat-value tabular" id="counter-wait">${wait} ${plural(wait, "minute", "minutes")}</p>
</div>
<div class="stat">
<p class="stat-label">People waiting</p>
<p class="stat-value tabular" id="counter-queue">${queue}</p>
</div>
</div>
<figcaption>
<p class="figure-summary" id="counter-summary">With ${load} minutes of every 100 already booked, the average person waits ${wait} ${plural(wait, "minute", "minutes")} and ${queuePhrase(queue)}. One visit takes ${counter.minutesPerVisit} minutes.</p>
<p class="figure-note">Illustrative. The counter takes ${counter.minutesPerVisit} minutes per visit and never closes, which is why the right hand end of the slider gives a wait no real place would ever reach. The arithmetic is on the notes page and the numbers are in model.js.</p>
</figcaption>
</figure>`;
}

/* ---------- figure two, drawn from the model ---------- */

const t = GEOMETRY.timeline;

function timelineSvg() {
  const walk = morning.walk(false);
  const hours = [];
  for (
    let minute = morning.firstAppointmentMinute;
    minute <= morning.chartEndMinute;
    minute += 60
  ) {
    hours.push(minute);
  }
  const hourLines = hours
    .map(
      (minute) =>
        `<line x1="${DRAW.round(DRAW.timeX(minute))}" y1="${t.hourTop}" x2="${DRAW.round(DRAW.timeX(minute))}" y2="${t.axisY}"></line>`,
    )
    .join("");
  const planned = walk
    .map((step) => {
      const x = DRAW.timeX(step.planned);
      const width = DRAW.timeX(step.planned + morning.minutesPerAppointment) - x;
      return `<rect data-planned-slot="${step.slot}" data-state="${step.slot === 0 ? "current" : "future"}" x="${DRAW.round(x)}" y="${t.plannedY}" width="${DRAW.round(width)}" height="${t.laneHeight}"></rect>`;
    })
    .join("\n");
  const actual = walk
    .map((step) => {
      const block = DRAW.actualBlock(step);
      return `<rect data-actual-slot="${step.slot}" data-free="${step.free ? "true" : "false"}" data-state="${step.slot === 0 ? "current" : "future"}" x="${DRAW.round(block.x)}" y="${t.actualY}" width="${DRAW.round(block.width)}" height="${t.laneHeight}"></rect>`;
    })
    .join("\n");
  const first = walk[0];
  const firstBlock = DRAW.actualBlock(first);
  const hourLabels = hours
    .map((minute, index) => {
      const edge =
        index === 0
          ? " plot-label-first"
          : index === hours.length - 1
            ? " plot-label-last"
            : "";
      return `<p class="plot-label plot-label-x${edge}" style="left:${pct(DRAW.timeX(minute), t.width)};top:${pct(t.axisY, t.height)}">${DRAW.clockLabel(minute)}</p>`;
    })
    .join("\n");
  return `<div class="timeline" id="morning-timeline" data-mode="packed" tabindex="0" role="img" aria-label="A morning of ${morning.overrunMinutes.length} slots drawn twice, as planned and as it happened.">
<svg viewBox="0 0 ${t.width} ${t.height}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
<g class="timeline-hour">${hourLines}</g>
<g class="lane-planned">
${planned}
</g>
<g class="lane-actual">
${actual}
</g>
<line class="timeline-drop" id="morning-drop" x1="${DRAW.round(DRAW.timeX(first.planned + morning.minutesPerAppointment / 2))}" y1="${t.plannedY + t.laneHeight}" x2="${DRAW.round(firstBlock.x + firstBlock.width / 2)}" y2="${t.actualY}"></line>
<line class="plot-axis" x1="${t.left}" y1="${t.axisY}" x2="${t.right}" y2="${t.axisY}"></line>
</svg>
<p class="plot-label" style="left:0;top:0">As the day was planned</p>
<p class="plot-label" style="left:0;top:${pct(t.actualY - 16, t.height)}">What actually happened</p>
${hourLabels}
</div>`;
}

function morningFigure() {
  const walk = morning.walk(false);
  const first = walk[0];
  return `<figure class="figure" id="figure-morning">
<div class="figure-head">
<p class="figure-kicker">Figure two, step through it</p>
<p class="figure-title">One morning, slot by slot</p>
</div>
${timelineSvg()}
<div class="controls">
<p class="control-label">Step through the morning</p>
<div class="button-row">
<button class="control" type="button" data-step-move="-1">Back one slot</button>
<button class="control" type="button" data-step-move="1">Forward one slot</button>
</div>
<p class="control-hint">The buttons work with the mouse and with the keyboard. With the figure focused, the left and right arrow keys move a slot at a time and the Home and End keys jump to the start and the end of the morning.</p>
</div>
<div class="controls">
<p class="control-label">How the morning is booked</p>
<div class="button-row" role="group" aria-label="How the morning is booked">
<button class="control" type="button" data-mode-value="packed" aria-pressed="true">Every slot booked</button>
<button class="control" type="button" data-mode-value="keep" aria-pressed="false">One slot in ${morning.keepFreeEvery} kept empty</button>
</div>
</div>
<div class="stat-row">
<div class="stat">
<p class="stat-label">Seen so far</p>
<p class="stat-value tabular" id="morning-people">${first.peopleSoFar}</p>
</div>
<div class="stat">
<p class="stat-label">Waiting so far</p>
<p class="stat-value tabular" id="morning-waited">${first.waitedSoFar} minutes</p>
</div>
<div class="stat">
<p class="stat-label">Longest wait yet</p>
<p class="stat-value tabular" id="morning-longest">${first.longestSoFar} minutes</p>
</div>
</div>
<figcaption>
<p class="figure-summary" id="morning-summary" role="status" aria-live="polite">Slot 1 of ${morning.overrunMinutes.length}, planned for ${DRAW.clockLabel(first.planned)}, seen at ${DRAW.clockLabel(first.seenAt)} after waiting ${first.wait} minutes. This visit ran over by ${morning.overrunMinutes[0]} minutes. So far ${first.peopleSoFar} person has been seen and ${first.waitedSoFar} minutes of waiting has been spent.</p>
<p class="figure-note">Illustrative. The overruns are a list of made up numbers in model.js, not a record of anything. Booked end to end, this morning costs ${N.packed.waited} minutes of waiting across ${N.packed.people} people, and the longest wait is ${N.packed.longest} minutes. With one slot in ${morning.keepFreeEvery} left empty, it costs ${N.kept.waited} minutes across ${N.kept.people} people, and the longest wait is ${N.kept.longest} minutes.</p>
</figcaption>
</figure>`;
}

/* ---------- the comparison at the end of the essay ---------- */

function comparisonBars() {
  const maxWait = Math.max(N.packed.waited, N.kept.waited);
  const maxPeople = Math.max(N.packed.people, N.kept.people);
  return `<figure class="figure">
<div class="figure-head">
<p class="figure-kicker">Figure three, the whole morning at once</p>
<p class="figure-title">What the empty slot costs, and what it buys</p>
</div>
<h3>Minutes of waiting, added up across everyone</h3>
<div class="bars">
<div class="bar-item">
<p class="bar-label">Every slot booked</p>
<div class="bar-track"><span class="bar-fill" style="width:${pct(N.packed.waited, maxWait)}"></span></div>
<p class="bar-value">${N.packed.waited} minutes</p>
</div>
<div class="bar-item bar-item-keep">
<p class="bar-label">One slot in ${morning.keepFreeEvery} kept empty</p>
<div class="bar-track"><span class="bar-fill" style="width:${pct(N.kept.waited, maxWait)}"></span></div>
<p class="bar-value">${N.kept.waited} minutes</p>
</div>
</div>
<h3>People seen</h3>
<div class="bars">
<div class="bar-item">
<p class="bar-label">Every slot booked</p>
<div class="bar-track"><span class="bar-fill" style="width:${pct(N.packed.people, maxPeople)}"></span></div>
<p class="bar-value">${N.packed.people} people</p>
</div>
<div class="bar-item bar-item-keep">
<p class="bar-label">One slot in ${morning.keepFreeEvery} kept empty</p>
<div class="bar-track"><span class="bar-fill" style="width:${pct(N.kept.people, maxPeople)}"></span></div>
<p class="bar-value">${N.kept.people} people</p>
</div>
</div>
<figcaption>
<p class="figure-summary">Keeping one slot in ${morning.keepFreeEvery} empty costs ${N.peopleLost} of the ${N.packed.people} appointments and saves ${N.waitedSaved} minutes of other people's mornings. Whether that is a good trade is a decision about who the morning is for, and no figure can make it for you.</p>
<p class="figure-note">Illustrative, drawn from the same made up overruns as figure two. This one does not move, because there is nothing left to vary.</p>
</figcaption>
</figure>`;
}

/* ---------- the front page ---------- */

const CHAPTERS = [
  {
    id: "c1",
    number: "Chapter one",
    title: "One counter, one morning",
    note: "What the word busy is doing when a place says it is busy.",
  },
  {
    id: "c2",
    number: "Chapter two",
    title: "Busy is not the same as full",
    note: "A slider, a curve, and the moment the line stops being a slope.",
  },
  {
    id: "c3",
    number: "Chapter three",
    title: "A morning, slot by slot",
    note: "Step through twelve appointments and watch one late visit reach the end of the day.",
  },
  {
    id: "c4",
    number: "Chapter four",
    title: "What an empty slot buys",
    note: "The trade stated plainly, with the cost named as well as the saving.",
  },
  {
    id: "c5",
    number: "Chapter five",
    title: "What would change our mind",
    note: "Where this model stops being useful, written down before you ask.",
  },
];

const frontPage = shell({
  file: "index.html",
  title: "Threshold: why does the last ten percent cost so much?",
  description:
    "An illustrative explorable explanation about queues: a counter that is nine tenths booked does not wait a little longer than one that is eight tenths booked.",
  figures: false,
  body: `<section class="hero shell">
<p class="eyebrow">Threshold, an explainer group</p>
<h1>Why does the last ten percent cost so much?</h1>
<p class="lede">A counter that is busy 90 minutes in every 100 does not wait slightly longer than one busy 70 minutes in every 100. In the small model on this site it waits ${Math.round((N.waitAt(90) / N.waitAt(70)) * 10) / 10} times as long. Here is that curve, what it does to one ordinary morning, and what it means for anyone who runs a queue.</p>
<div class="hero-actions">
<a class="button" href="explainer.html">Read the explainer</a>
<a class="button button-quiet" href="model.html">See the numbers first</a>
</div>
</section>

<section class="section shell-wide">
<figure class="figure" data-annotation="on">
<div class="figure-head">
<p class="figure-kicker">The shape of the whole argument</p>
<p class="figure-title">Minutes of waiting against how booked the day is</p>
</div>
<div class="plot">
${plotSvg({ interactive: false })}
${plotLabels()}
${annotationNote()}
</div>
<figcaption>
<p class="figure-summary">At 70 booked out of 100 the average wait is ${N.waitAt(70)} minutes. At 80 it is ${N.waitAt(80)} minutes. At 90 it is ${N.waitAt(90)} minutes. At 95 it is ${N.waitAt(95)} minutes, which is off the top of this chart. The step from 80 to 90 adds ${N.waitAt(90) - N.waitAt(80)} minutes. The step from 90 to 95 adds ${N.waitAt(95) - N.waitAt(90)} more.</p>
<p class="figure-note">Illustrative. This curve is arithmetic applied to invented numbers, not a measurement. The version in the explainer has a slider.</p>
</figcaption>
</figure>
</section>

<section class="section shell">
<div class="section-head">
<h2>What you will actually do here</h2>
</div>
<ul class="promise">
<li>
<p class="promise-number">One</p>
<p class="promise-body">Move a slider and watch a queue grow behind a single counter, with the wait and the number of people written out in words underneath.</p>
</li>
<li>
<p class="promise-number">Two</p>
<p class="promise-body">Step through a morning of appointments, one slot at a time, and see what a five minute overrun at nine o'clock does to the person booked in at noon.</p>
</li>
<li>
<p class="promise-number">Three</p>
<p class="promise-body">Read every number the figures use, in one short page, and change them yourself if you disagree with any of them.</p>
</li>
</ul>
</section>

<section class="section shell">
<div class="section-head">
<h2>The explainer, chapter by chapter</h2>
</div>
<ul class="contents">
${CHAPTERS.map(
  (chapter, index) => `<li>
<a href="explainer.html#${chapter.id}">
<span class="contents-number">${String(index + 1).padStart(2, "0")}</span>
<span class="contents-title">${chapter.title}</span>
<span class="contents-note">${chapter.note}</span>
</a>
</li>`,
).join("\n")}
</ul>
${demoNote(
  "Everything on this site is illustrative. Threshold is not a real group, the counter and the surgery do not exist, and every figure here was invented to show how the arithmetic behaves. No study, dataset or institution is cited anywhere on this site, because there is nothing real behind it to cite.",
)}
</section>

<section class="section shell">
<div class="section-head">
<h2>Who publishes this</h2>
</div>
<p>Threshold is a small group that explains one idea at a time and then stops. We publish the numbers behind every figure on a page of their own, we say what our model leaves out before anyone asks, and we keep the whole source of each explainer beside it so that a reader can take it apart.</p>
<p><a class="text-link" href="about.html">More about how we work</a></p>
</section>`,
});

/* ---------- the explainer ---------- */

const explainerPage = shell({
  file: "explainer.html",
  title: "The last ten percent: an illustrative explainer from Threshold",
  description:
    "A scroll driven explainer with two interactive figures about why waiting grows so fast as a shared counter fills up. Every number is illustrative.",
  figures: true,
  body: `<article>
<header class="essay-head shell">
<p class="eyebrow">Chapter zero, before anything else</p>
<h1>The last ten percent</h1>
<p class="lede">Waiting does not grow in step with how busy a place is. It grows much faster than that, and almost all of the growth is hiding in the last stretch before full. This is a short explanation of why, with two figures you can move.</p>
<div class="essay-meta">
<p>About eight minutes to read</p>
<p>Two figures you can move</p>
<p>Every number illustrative</p>
</div>
${demoNote(
  "Read this first. The numbers in these figures are invented for the template. They are not measurements, they do not describe any real counter, surgery, kitchen or call centre, and no study is cited anywhere here. What is real is the arithmetic, which is written out in words on the notes page, and the shape it produces. Put your own numbers in model.js and the figures will follow them.",
)}
</header>

<nav class="rail" aria-label="Chapters">
<div class="rail-inner">
<p class="rail-label">Chapters</p>
<ol class="rail-list">
${CHAPTERS.map(
  (chapter, index) =>
    `<li><a href="#${chapter.id}" data-rail-for="${chapter.id}">${index + 1}. ${chapter.title}</a></li>`,
).join("\n")}
</ol>
</div>
</nav>

<section class="chapter shell" id="c1" aria-labelledby="c1-title">
<p class="chapter-number">Chapter one</p>
<h2 id="c1-title">One counter, one morning</h2>
<p>Picture one counter with one person behind it. People turn up through the day, wait their turn, take a few minutes each and leave. The only number we need to start with is how much of the day is already spoken for: if the counter can handle a hundred minutes of work in a hundred minutes, and ${counter.startingLoad} minutes of work turns up, then the counter is ${counter.startingLoad} percent booked.</p>
<p>That number is usually the one on the dashboard. It is the one a manager is asked to push up, because a counter standing idle looks like money left on the table. Three days, drawn as the same hundred minutes:</p>
<div class="bars">
<div class="bar-item">
<p class="bar-label">A quiet day, 40 booked out of 100</p>
<div class="bar-track"><span class="bar-fill" style="width:40%"></span></div>
<p class="bar-value">60 minutes of the day are not spoken for</p>
</div>
<div class="bar-item">
<p class="bar-label">A normal day, 70 booked out of 100</p>
<div class="bar-track"><span class="bar-fill" style="width:70%"></span></div>
<p class="bar-value">30 minutes of the day are not spoken for</p>
</div>
<div class="bar-item">
<p class="bar-label">A day the dashboard is pleased with, 90 booked out of 100</p>
<div class="bar-track"><span class="bar-fill" style="width:90%"></span></div>
<p class="bar-value">10 minutes of the day are not spoken for</p>
</div>
</div>
<p class="aside-note">Nothing about those three bars suggests that the third one is dangerous. They step up in even tens. The trouble is that the thing a person actually experiences, the wait, does not step up in even tens at all.</p>
</section>

<section class="scrolly" id="c2" aria-labelledby="c2-title">
<div class="shell">
<p class="chapter-number">Chapter two</p>
<h2 id="c2-title">Busy is not the same as full</h2>
<p>Here is the same counter with the wait drawn against how booked it is. Move the slider, or read the three steps beside it, which move it for you.</p>
</div>
<div class="scrolly-grid">
<div class="scrolly-figure">
${counterFigure()}
</div>
<div class="scrolly-steps">
<div class="scrolly-step" data-step-load="${counter.startingLoad}" data-step-annotation="off" data-active="true">
<h3>Start where most places think they are</h3>
<p>At ${counter.startingLoad} booked out of 100 the average person waits ${N.waitAt(counter.startingLoad)} minutes and there are about ${N.queueAt(counter.startingLoad)} people in front of them. This feels fine. Nobody writes a letter about it. There are ${100 - counter.startingLoad} minutes in every hundred with nothing booked into them, and that spare time is quietly doing the work of swallowing every visit that runs long.</p>
</div>
<div class="scrolly-step" data-step-load="90" data-step-annotation="off">
<h3>Now book nine tenths of it</h3>
<p>At 90 the wait is ${N.waitAt(90)} minutes and about ${N.queueAt(90)} people are standing in line. The counter is working twenty percent harder than before. The person at the back of the queue is waiting nearly four times as long. Going from 80 to 90 alone adds ${N.waitAt(90) - N.waitAt(80)} minutes to the average wait, which is more than the whole wait at ${counter.startingLoad}.</p>
</div>
<div class="scrolly-step" data-step-load="${counter.kneeLoad}" data-step-annotation="on">
<h3>The line stops being a slope</h3>
<p>At ${counter.kneeLoad} the wait is ${N.waitAt(counter.kneeLoad)} minutes, off the top of the chart, with about ${N.queueAt(counter.kneeLoad)} people waiting. The last five points of booking cost ${N.waitAt(counter.kneeLoad) - N.waitAt(90)} minutes, which is more than the previous fifty points cost put together. Nothing broke. Nobody made a mistake. The arithmetic simply stopped being forgiving.</p>
</div>
</div>
</div>
<div class="shell">
<p class="pull">The counter did not get worse. It got fuller. Those are different things, and only one of them is visible on a dashboard.</p>
<p>The reason is easier to feel than to prove. Every time a visit runs long, the time has to come from somewhere. In a day with room in it, the overrun lands in an empty minute and disappears. In a day with no room in it, the overrun lands on the next person, who passes it to the person after them. The spare capacity was not waste. It was the thing that was absorbing your mistakes.</p>
</div>
</section>

<section class="chapter shell-wide" id="c3" aria-labelledby="c3-title">
<div class="shell">
<p class="chapter-number">Chapter three</p>
<h2 id="c3-title">A morning, slot by slot</h2>
<p>The curve is a summary of many mornings. Here is one of them, drawn twice: once as it was planned, and once as it happened. There are ${morning.overrunMinutes.length} appointments of ${morning.minutesPerAppointment} minutes each, ${morning.appointmentsPerHour} to the hour, starting at ${DRAW.clockLabel(morning.firstAppointmentMinute)}. A few of them run over by a handful of minutes, which is the most ordinary thing in the world.</p>
<p>Step forward through the morning and watch where the lateness goes.</p>
</div>
${morningFigure()}
<div class="shell">
<p>Booked end to end, the last person of the morning is seen ${N.packed.longest} minutes late, and the morning costs ${N.packed.waited} minutes of waiting spread across ${N.packed.people} people. No single overrun in the list is longer than ${Math.max(...morning.overrunMinutes)} minutes. Nobody was careless. The delay is not a thing that happened once, it is a thing that was passed along.</p>
<p>Now press the second button and keep one slot in every ${morning.keepFreeEvery} empty. The empty slot has no patient in it, so the lateness carried into it has nothing to be passed to, and the morning starts again on time at the top of the hour. The longest wait falls from ${N.packed.longest} minutes to ${N.kept.longest}.</p>
<p class="aside-note">This is the part an explainer has to be honest about. The empty slots are not free. Keeping one in every ${morning.keepFreeEvery} means ${N.kept.people} people are seen instead of ${N.packed.people}.</p>
</div>
</section>

<section class="chapter shell-wide" id="c4" aria-labelledby="c4-title">
<div class="shell">
<p class="chapter-number">Chapter four</p>
<h2 id="c4-title">What an empty slot buys</h2>
<p>Both sides of the trade, from the same made up morning:</p>
</div>
${comparisonBars()}
<div class="shell">
<p style="margin-top:2rem">${N.peopleLost} fewer appointments, and ${N.waitedSaved} minutes of other people's mornings handed back. Whether that is a good deal depends on something no figure can tell you: what the morning is for, and who is paying for the waiting. If the people waiting are paid to wait, the packed morning is cheap. If they took a day off work to be there, it is not.</p>
<p class="pull">Slack is not the opposite of efficiency. It is the price of a promise about time.</p>
<p>The useful thing about seeing it drawn is that the argument stops being about attitude. Nobody has to be accused of being lazy or of being a martinet. There is a curve, it bends where it bends, and the question is simply which side of the bend you would like to run your week on.</p>
</div>
</section>

<section class="chapter shell" id="c5" aria-labelledby="c5-title">
<p class="chapter-number">Chapter five</p>
<h2 id="c5-title">What would change our mind</h2>
<p>This is a toy. It is a useful toy, because the shape it produces is the shape real queues have, but it is a toy, and here is the list of ways it is wrong.</p>
<ul class="plain-list">
<li>The counter in figure one never closes. That is why the far end of the slider produces a wait of ${N.waitAt(counter.highestLoad)} minutes, which no real place would ever reach, because in a real place the day ends and the queue goes home.</li>
<li>Nobody in this model gives up and leaves, and nobody is seen out of turn. Both of those things happen constantly, and both of them flatten the curve.</li>
<li>Arrivals here are as unpredictable as they can possibly be. A place that can smooth its arrivals, with appointments that people keep, sits on a much kinder curve than this one.</li>
<li>The morning in figure two has one room and one queue. Two rooms sharing one queue behave very differently, and better, than two rooms with a queue each.</li>
<li>Every number in both figures was invented for this template. If you have real numbers, put them in model.js. The drawings will follow them, and then the argument will be about your place rather than about ours.</li>
</ul>
<p style="margin-top:1.5rem">The notes give the arithmetic in words and say plainly which parts are invented. The numbers page lets you change them.</p>
<p><a class="text-link" href="notes.html">Read the notes and sources</a></p>
<p><a class="text-link" href="model.html">Open the numbers</a></p>
</section>
</article>`,
});

/* ---------- the numbers ---------- */

const MODEL_ROWS_COUNTER = [
  ["minutesPerVisit", counter.minutesPerVisit, "How long one person takes once they reach the counter. Raise it and every wait on the chart rises in proportion."],
  ["lowestLoad", counter.lowestLoad, "The left hand end of the slider and of the chart, in minutes booked out of 100."],
  ["highestLoad", counter.highestLoad, "The right hand end of the slider. It stops short of 100 because at exactly 100 the arithmetic has no answer."],
  ["startingLoad", counter.startingLoad, "Where the slider sits when the page opens, and the load the first step of chapter two talks about."],
  ["chartTopMinutes", counter.chartTopMinutes, "The top of the drawn chart, in minutes. The curve leaves the top of the frame rather than being squashed into it."],
  ["mostPeopleDrawn", counter.mostPeopleDrawn, "How many little figures the queue drawing can hold. Past this the caption gives the number in words instead."],
  ["kneeLoad", counter.kneeLoad, "The load the third step of chapter two points the annotation arrow at."],
];

const MODEL_ROWS_MORNING = [
  ["firstAppointmentMinute", morning.firstAppointmentMinute, `Minutes past midnight for the first appointment, so ${DRAW.clockLabel(morning.firstAppointmentMinute)}.`],
  ["minutesPerAppointment", morning.minutesPerAppointment, "How long each appointment is meant to take."],
  ["appointmentsPerHour", morning.appointmentsPerHour, "How many slots fill an hour when nothing is left empty."],
  ["freeSlotMinutes", morning.freeSlotMinutes, "How much lateness an empty slot can swallow before the next person is affected."],
  ["keepFreeEvery", morning.keepFreeEvery, "In the kinder morning, one slot in this many is left empty on purpose."],
  ["overrunMinutes", morning.overrunMinutes.join(", "), "Minutes each visit ran over, in order. This list is the whole story of the morning, and every number in it was made up."],
  ["chartEndMinute", morning.chartEndMinute, `The right hand end of the drawn timeline, so ${DRAW.clockLabel(morning.chartEndMinute)}.`],
];

const modelRows = (rows) => `<dl class="rows">
${rows
  .map(
    ([name, value, note]) => `<div>
<dt>${name}</dt>
<dd class="value tabular">${value}</dd>
<dd>${note}</dd>
</div>`,
  )
  .join("\n")}
</dl>`;

const modelPage = shell({
  file: "model.html",
  title: "The numbers behind the figures: Threshold",
  description:
    "Every illustrative number the two figures use, what it means, and how to change it without touching the code.",
  figures: false,
  body: `<section class="hero shell">
<p class="eyebrow">The numbers</p>
<h1>Everything the figures are made of</h1>
<p class="lede">Both figures on this site are driven by one short file of numbers called model.js. Nothing is hidden in the code. If you disagree with a value, change it, and the drawings, the readouts and the sentences will follow.</p>
${demoNote(
  "None of these numbers were measured. They were invented for this template so that the figures have something to draw. If you publish a version of this explainer, replace them with your own and rewrite the notes page to say where yours came from.",
)}
</section>

<section class="section shell">
<div class="section-head">
<h2>Figure one: one counter</h2>
</div>
${modelRows(MODEL_ROWS_COUNTER)}
</section>

<section class="section shell">
<div class="section-head">
<h2>Figure two: one morning</h2>
</div>
${modelRows(MODEL_ROWS_MORNING)}
</section>

<section class="section shell">
<div class="section-head">
<h2>The two rules, in words</h2>
</div>
<p>There are only two pieces of arithmetic on this site, and both of them live at the bottom of the same file.</p>
<ol class="note-list">
<li>
<p class="note-title">The wait</p>
<p class="note-body">Take how booked the day is as a fraction of one. Divide it by what is left over. Multiply by the minutes one visit takes. At ${counter.startingLoad} booked out of 100 that is ${counter.startingLoad / 100} divided by ${Math.round((1 - counter.startingLoad / 100) * 100) / 100}, times ${counter.minutesPerVisit} minutes, which gives ${N.waitAt(counter.startingLoad)} minutes.</p>
</li>
<li>
<p class="note-title">The queue</p>
<p class="note-body">Take how booked the day is, square it, and divide by what is left over. At ${counter.startingLoad} out of 100 that gives about ${N.queueAt(counter.startingLoad)} people standing in line.</p>
</li>
<li>
<p class="note-title">The morning</p>
<p class="note-body">Walk the slots in order, carrying a running lateness. A booked slot waits whatever lateness has been carried in, then adds its own overrun to it. An empty slot subtracts up to ${morning.freeSlotMinutes} minutes of lateness and passes on what is left.</p>
</li>
</ol>
<p style="margin-top:1.5rem">Both of the first two are textbook arithmetic for the simplest queue anyone models, the one where arrivals are as unpredictable as they can be. They are not a finding, and they are not ours. What is ours, and what is invented, are the numbers we put into them.</p>
</section>

<section class="section shell">
<div class="section-head">
<h2>How to change them</h2>
</div>
<ul class="plain-list">
<li>Open model.js. It is the file with nothing in it but numbers and two short pieces of arithmetic.</li>
<li>Change a value and reload the page. Both figures redraw from the new numbers, including the curve, the queue and the whole timeline.</li>
<li>The numbers written into the sentences are a separate matter. They are put there by the page builder so that a reader with JavaScript switched off still gets the argument, so run the builder again to refresh them, or edit the sentences by hand.</li>
<li>Then rewrite the notes page. An explainer whose numbers have changed and whose notes have not is worse than one with no notes at all.</li>
</ul>
</section>`,
});

/* ---------- notes and sources ---------- */

const NOTES = [
  [
    "Nothing here was measured",
    `Threshold is an invented group, the counter is an invented counter, and the morning in figure two is an invented morning. Every number on this site was chosen to make a figure behave, not to describe anything that happened. Nothing on this site should be quoted as evidence about a real place.`,
  ],
  [
    "The wait curve",
    `The curve in figure one is a single piece of arithmetic: how booked the day is, divided by what is left over, times the ${counter.minutesPerVisit} minutes a visit takes. It is the standard result for the simplest queue in the textbooks, the one with a single server and arrivals that are as unpredictable as they can be. It is arithmetic rather than a finding, so there is no study behind it to cite, and we have deliberately not dressed it up as one.`,
  ],
  [
    "Why the curve leaves the top of the chart",
    `At ${counter.kneeLoad} booked out of 100 the average wait in this model is ${N.waitAt(counter.kneeLoad)} minutes, which is above the ${counter.chartTopMinutes} minute top of the frame. We let the line leave the chart rather than rescaling, because rescaling is how a chart hides exactly the thing this page is about.`,
  ],
  [
    "The twelve minute visit",
    `The ${counter.minutesPerVisit} minutes a visit takes is a made up number chosen so the arithmetic lands on readable values. Change it in model.js and every wait on the chart changes in proportion to it. The shape of the curve does not change at all, which is the point worth taking away.`,
  ],
  [
    "The morning's overruns",
    `The list of overruns is ${morning.overrunMinutes.join(", ")} minutes, in order. We made it up. It has no long overruns in it on purpose, because the argument is more interesting when nothing has gone badly wrong: the longest single overrun is ${Math.max(...morning.overrunMinutes)} minutes and the morning still ends ${N.packed.longest} minutes late.`,
  ],
  [
    "What the empty slot does",
    `An empty slot absorbs up to ${morning.freeSlotMinutes} minutes of lateness, which is simply how long the slot is. That is the whole mechanism. It is not a scheduling technique we are recommending by name, and we have not tested it anywhere.`,
  ],
  [
    "Why the sentences do not move when you drag",
    `The numbers inside the running text are written into the page when it is built, not while you read. A reader with JavaScript switched off, or with the figures still loading, gets the whole argument with its numbers intact. The figures themselves recompute live from the same file, so the two can only disagree if someone edits the page without rebuilding it.`,
  ],
  [
    "What this model leaves out",
    `No closing time, so the queue never goes home. Nobody gives up and leaves. Nobody is seen out of turn. Arrivals are as unpredictable as they can be, which is the least kind assumption available. One counter, one queue. Each of these makes the real world gentler than this page, and none of them changes the direction of the argument.`,
  ],
  [
    "No study is cited here, on purpose",
    `It would be easy to make this page look more authoritative by attaching a reference to a real paper or naming a real institution. That would be dishonest, because the numbers are ours and they are invented. If you fork this template, cite the work you actually did, and leave this note in place until you have done it.`,
  ],
  [
    "Corrections",
    `Corrections are published here with the date they were made and a line saying what was wrong. There are none yet, because this page has never claimed anything about the world.`,
  ],
];

const notesPage = shell({
  file: "notes.html",
  title: "Notes and sources: Threshold",
  description:
    "Where every number in the explainer comes from, what the model leaves out, and why no real study is cited.",
  figures: false,
  body: `<section class="hero shell">
<p class="eyebrow">Notes and sources</p>
<h1>Showing the working</h1>
<p class="lede">An explainer that will not show its working is a poster. This page lists every number the figures use, says which of them are invented, and sets out what the model leaves out before anyone has to ask.</p>
${demoNote(
  "The short version: all of it is invented. The arithmetic is standard and the numbers are ours, chosen to make the figures legible. Nothing on this site is a measurement of anything.",
)}
</section>

<section class="section shell">
<div class="section-head">
<h2>Notes</h2>
</div>
<ol class="note-list">
${NOTES.map(
  ([title, body]) => `<li>
<p class="note-title">${title}</p>
<p class="note-body">${body}</p>
</li>`,
).join("\n")}
</ol>
</section>

<section class="section shell">
<div class="section-head">
<h2>What would change our mind</h2>
</div>
<ul class="plain-list">
<li>A place with real arrival records whose waits stayed flat as it filled past ninety. That would mean its arrivals are far smoother than this model assumes, and we would want to say so loudly.</li>
<li>A morning where the empty slot did not absorb the lateness, because the lateness arrived in one lump bigger than the slot. Our figure quietly assumes that overruns come in small pieces.</li>
<li>Any case where the people waiting are also the people being paid, which turns the whole trade in chapter four upside down.</li>
</ul>
</section>

<section class="section shell">
<div class="section-head">
<h2>How this page was made</h2>
</div>
<p>Threshold is a Plotform studio edition, written on top of two openly licensed pieces of work. Their licence texts are kept beside these pages in the licences folder, and the full adapted source, including both upstream projects, is packaged as a download.</p>
<ol class="note-list">
<li>
<p class="note-title">The Evolution of Trust, by Nicky Case, under Creative Commons Zero</p>
<p class="note-body">A public domain dedication, so it can be used and changed by anybody for anything. We took the way it chapters a scroll and swaps one small widget in per step instead of writing another paragraph. The two hand drawn people in the first figure are its artwork, cut from its opening spritesheet and made smaller. Its sound and music are a mixture of licences, including one effect that is not free for commercial use, so we took no audio at all. Its lettering comes from a third party font that is not covered by the dedication, so we took none of that either.</p>
<p class="note-body"><a class="text-link" href="licenses/ncase-trust-CC0.txt">The dedication, as shipped with this template</a></p>
</li>
<li>
<p class="note-title">roadtolarissa, by Adam Pearce, under the MIT licence</p>
<p class="note-body">How a data essay is actually built: a newsprint ground, one narrow column of text, charts drawn as SVG from the numbers rather than pasted in as pictures, faint axes with the labels sitting on the gridlines under a paper coloured halo, and a hand drawn annotation arrow curving in from the side. The arrow helper it vendors belongs to somebody else, so we did not copy it; the one on this page is written here from the same geometry.</p>
<p class="note-body"><a class="text-link" href="licenses/roadtolarissa-MIT.txt">The MIT licence, as shipped with this template</a></p>
</li>
<li>
<p class="note-title">Fraunces and Newsreader, under the SIL Open Font License 1.1</p>
<p class="note-body">Fraunces by Undercase Type sets the headings. Newsreader by Production Type sets the reading. Both are bundled with these pages as files rather than loaded from a font service, and both licence texts travel with them.</p>
<p class="note-body"><a class="text-link" href="licenses/fraunces-OFL.txt">The Fraunces licence</a></p>
<p class="note-body"><a class="text-link" href="licenses/newsreader-OFL.txt">The Newsreader licence</a></p>
</li>
<li>
<p class="note-title">Everything else</p>
<p class="note-body">Both figures, the stylesheet, the page builder and all of the writing were made for this edition and are licensed MIT.</p>
</li>
</ol>
<p style="margin-top:1.5rem"><a class="archive" href="source.zip" download>Download the complete source</a></p>
<p class="figure-note">There are no remote scripts, fonts, trackers, maps or form services anywhere on this site. The only address on it is an example one.</p>
</section>`,
});

/* ---------- about ---------- */

const aboutPage = shell({
  file: "about.html",
  title: "About Threshold",
  description:
    "Threshold is an invented explainer group used as the publisher of this illustrative template.",
  figures: false,
  body: `<section class="hero shell">
<p class="eyebrow">About</p>
<h1>We explain one idea and then stop</h1>
<p class="lede">Threshold publishes a small number of explainers a year. Each one takes a single idea, gives the reader something to move, and says plainly what it does not know. This is the whole of our method.</p>
${demoNote(
  "Threshold does not exist. The group, the people below, the funding and the history were invented for this template, and no real organisation is described here. Replace all of it before you publish anything.",
)}
</section>

<section class="section shell">
<div class="section-head">
<h2>How we work</h2>
</div>
<ul class="promise">
<li>
<p class="promise-number">One</p>
<p class="promise-body">One idea per explainer. If a second idea turns up while we are writing, it becomes a second explainer or it is cut.</p>
</li>
<li>
<p class="promise-number">Two</p>
<p class="promise-body">Every figure carries a sentence saying what it currently shows, so the argument survives without pictures, without motion and without a mouse.</p>
</li>
<li>
<p class="promise-number">Three</p>
<p class="promise-body">Every number lives in one file we publish, and the notes page says which numbers are invented. When we have real data, the notes say where it came from.</p>
</li>
<li>
<p class="promise-number">Four</p>
<p class="promise-body">The whole source of each explainer ships beside it, so anyone can take it apart, change a number and see what it does to the conclusion.</p>
</li>
</ul>
</section>

<section class="section shell">
<div class="section-head">
<h2>Who we are</h2>
</div>
<ul class="people">
<li>
<p class="person-name">Rosalind Abara</p>
<p class="person-role">Writing and editing</p>
<p class="person-body">Cuts the second idea out of every draft. Keeps the list of things we do not know and makes sure it gets published.</p>
</li>
<li>
<p class="person-name">Teodor Vranic</p>
<p class="person-role">Figures</p>
<p class="person-body">Draws the figures and then tries to use them with the keyboard alone before anybody else sees them.</p>
</li>
<li>
<p class="person-name">Mei Halvorsen</p>
<p class="person-role">Checking</p>
<p class="person-body">Rebuilds every model from the description on the notes page. If she cannot, the notes page is wrong.</p>
</li>
</ul>
<p class="figure-note" style="margin-top:1.5rem">Invented people, invented roles. Nobody here is real.</p>
</section>

<section class="section shell">
<div class="section-head">
<h2>The drawings in the queue</h2>
</div>
<p>The two small figures in the first chart are not ours. They come from The Evolution of Trust by Nicky Case, an explorable explanation dedicated to the public domain under Creative Commons Zero, which means the artwork can be used and changed by anybody for anything. We cut two frames out of its opening spritesheet and made them smaller. Nothing else was changed.</p>
<div class="credit">
<div class="credit-art">
<img src="assets/trust-peep-waiting.png" alt="A hand drawn figure with a round head, standing and waiting" width="99" height="176">
<img src="assets/trust-peep-served.png" alt="The same hand drawn figure, smiling, with pink cheeks" width="99" height="176">
</div>
<div class="credit-body">
<p>Attribution is not required by the dedication. We give it anyway, because an explainer that hides where its pictures came from has already lost the argument it is trying to make about showing your working.</p>
<p><a class="text-link" href="licenses/ncase-trust-CC0.txt">Read the dedication</a></p>
<p><a class="text-link" href="notes.html">See the full list of what we borrowed</a></p>
</div>
</div>
</section>

<section class="section shell">
<div class="section-head">
<h2>What we will not do</h2>
</div>
<ul class="plain-list">
<li>We will not put a number on a page without saying where it came from, even when the honest answer is that we made it up for a template.</li>
<li>We will not cite a real study to make an invented figure look sturdier than it is.</li>
<li>We will not build a figure that only works with a mouse, or one whose meaning disappears when somebody turns animation off.</li>
<li>We will not load anything from somewhere else. No remote scripts, fonts, trackers, maps or form services, on any page.</li>
</ul>
</section>

<section class="section shell">
<div class="section-head">
<h2>Write to us</h2>
</div>
<p>Corrections, disagreements and better numbers are all welcome. There is no form on this site, on purpose, because a form is somebody else's service reading your words before we do.</p>
<p><a class="foot-mail" href="mailto:${MAIL}">${MAIL}</a></p>
<p class="figure-note">An example address. Replace it before you publish.</p>
</section>`,
});

/* ---------- write ---------- */

const pages = [
  ["index.html", frontPage],
  ["explainer.html", explainerPage],
  ["model.html", modelPage],
  ["notes.html", notesPage],
  ["about.html", aboutPage],
];

await mkdir(out, { recursive: true });
for (const [file, html] of pages) {
  if (html.includes("—")) throw new Error(`Em dash found in ${file}`);
  await writeFile(join(out, file), html, "utf8");
  console.log(`wrote ${join(out, file)}`);
}
