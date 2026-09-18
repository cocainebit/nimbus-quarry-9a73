/*
 * Fettle, a Plotform studio edition.
 *
 * Writes the six HTML pages. The programme lives here once so that the front
 * page, the programme page and the class page cannot drift apart, and so the
 * fourteen session cards stay out of hand written markup.
 *
 * Run from the edition folder:  node tools/build-pages.mjs
 *
 * Editing the produced HTML by hand works too: the pages are the deliverable
 * and nothing at run time depends on this script. Every visible string is its
 * own element so the Plotform source editor can select it as a leaf.
 *
 * All content below is illustrative. Fettle is not a real workshop, the tutors
 * are invented, and the fees are examples marked as such on the page.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const MAIL = "hello@example.com";
const write = (name, html) => {
  writeFileSync(join(root, name), html);
  console.log(`wrote ${name} (${html.length} bytes)`);
};

const NAV = [
  { href: "index.html", label: "Workshop" },
  { href: "programme.html", label: "Programme" },
  { href: "class-spoon-carving.html", label: "Spoon carving" },
  { href: "space.html", label: "The space" },
  { href: "join.html", label: "Join" },
];

const DEMO_NOTE =
  "Fettle is an illustrative workshop written for this template. The classes, tutors, timetable, bench numbers, address and fees are examples rather than a real organisation, and nothing here can be booked. Replace all of it before publishing.";

/* ------------------------------------------------------------------ */
/* The programme. Levels and days drive the filter on programme.html.  */
/* ------------------------------------------------------------------ */
const LEVELS = [
  { id: "all", label: "Any level" },
  { id: "first", label: "First time" },
  { id: "improver", label: "Improver" },
  { id: "open", label: "Open bench" },
];
const DAYS = [
  { id: "all", label: "Any day" },
  { id: "tuesday", label: "Tuesday" },
  { id: "wednesday", label: "Wednesday" },
  { id: "thursday", label: "Thursday" },
  { id: "saturday", label: "Saturday" },
];

const SESSIONS = [
  {
    title: "Spoon carving from a green log",
    tutor: "Nour Haddad",
    level: "first",
    day: "tuesday",
    time: "18:30 to 21:00",
    free: 4,
    fee: "18",
    href: "class-spoon-carving.html",
    note: "Axe, knife and hook knife on a log split the same evening. You go home with a spoon and a sore thumb.",
  },
  {
    title: "Sharpening, properly",
    tutor: "Ivor Bell",
    level: "first",
    day: "tuesday",
    time: "18:30 to 20:30",
    free: 7,
    fee: "14",
    note: "One stone, one strop and one edge, taken from blunt to shaving sharp while somebody watches your wrist.",
  },
  {
    title: "Open bench, wood side",
    tutor: "Duty maker on the night",
    level: "open",
    day: "tuesday",
    time: "19:00 to 22:00",
    free: 10,
    fee: "6",
    note: "Ten benches, no teaching and no project of ours. Bring your own work and somebody to ask.",
  },
  {
    title: "Green woodwork: a three legged stool",
    tutor: "Wes Okonjo",
    level: "improver",
    day: "wednesday",
    time: "18:00 to 21:00",
    free: 2,
    fee: "26",
    note: "Four evenings on one stool: legs at the lathe, a seat you shape by eye, and joints that pull tight as they dry.",
  },
  {
    title: "Hand cut dovetails",
    tutor: "Ada Fenn",
    level: "improver",
    day: "wednesday",
    time: "18:30 to 21:00",
    free: 0,
    fee: "22",
    note: "Saw, chisel, pare, swear, repeat. The first one is ugly and the fourth one is not.",
  },
  {
    title: "Mending: chairs and stools",
    tutor: "Tam Reilly",
    level: "first",
    day: "wednesday",
    time: "18:30 to 20:30",
    free: 5,
    fee: "12",
    note: "Bring the wobbly thing in from the car. Glue blocks, wedges and a clamp rack that takes anything.",
  },
  {
    title: "Lettering with a chisel",
    tutor: "Ada Fenn",
    level: "improver",
    day: "thursday",
    time: "18:30 to 21:00",
    free: 3,
    fee: "24",
    note: "Roman capitals cut into oak, drawn first in pencil and then argued about for an hour.",
  },
  {
    title: "Bookbinding, single section",
    tutor: "Jo Marsh",
    level: "first",
    day: "thursday",
    time: "18:30 to 20:30",
    free: 6,
    fee: "16",
    note: "Fold, pierce, sew and case in. Thirty two pages of paper you choose off the shelf.",
  },
  {
    title: "Open bench, metal side",
    tutor: "Duty maker on the night",
    level: "open",
    day: "thursday",
    time: "19:00 to 22:00",
    free: 8,
    fee: "6",
    note: "The forge stays cold, but the vices, files and the drill are yours. Induction first.",
  },
  {
    title: "Blacksmithing, the first heat",
    tutor: "Bram Ivers",
    level: "first",
    day: "saturday",
    time: "10:00 to 13:00",
    free: 1,
    fee: "42",
    note: "One hook, drawn out and scrolled, from a bar you cut yourself. Hot metal looks exactly like cold metal.",
  },
  {
    title: "Turning on the pole lathe",
    tutor: "Wes Okonjo",
    level: "improver",
    day: "saturday",
    time: "10:00 to 13:00",
    free: 4,
    fee: "28",
    note: "Your leg is the motor. Slower than a chuck and quiet enough to hear the shaving leave the wood.",
  },
  {
    title: "Screen printing on cloth",
    tutor: "Fen Adeyemi",
    level: "first",
    day: "saturday",
    time: "13:30 to 16:30",
    free: 9,
    fee: "20",
    note: "Cut a stencil, pull four prints, ruin one on purpose. Bring a shirt or use ours.",
  },
  {
    title: "Repair cafe, bring anything",
    tutor: "Everyone on duty",
    level: "open",
    day: "saturday",
    time: "13:00 to 16:00",
    free: 10,
    fee: "0",
    note: "Lamps, toasters, zips, bicycles and one accordion so far. No charge and no promises.",
  },
  {
    title: "Basketry from garden willow",
    tutor: "Nour Haddad",
    level: "improver",
    day: "saturday",
    time: "14:00 to 17:00",
    free: 2,
    fee: "24",
    note: "A round base, a stake and strand side, and a border that will not come undone.",
  },
];

const levelLabel = (id) => LEVELS.find((l) => l.id === id).label;
const dayLabel = (id) => DAYS.find((d) => d.id === id).label;
const totalFree = SESSIONS.reduce((sum, s) => sum + s.free, 0);

/* ------------------------------------------------------------------ */
/* Shared chrome.                                                      */
/* ------------------------------------------------------------------ */
function head(title, description) {
  return `<!doctype html>
<html lang="en" id="top">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${description}">
<title>${title}</title>
<link rel="preload" href="assets/bricolage-grotesque.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="style.css">
<script src="script.js" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>`;
}

function header(current) {
  const links = NAV.map(
    (item) =>
      `<a href="${item.href}"${item.href === current ? ' aria-current="page"' : ""}>${item.label}</a>`,
  ).join("");
  return `<header class="site-header">
<a class="wordmark" href="index.html" aria-label="Fettle home">fettle</a>
<nav class="site-nav" aria-label="Main navigation">${links}</nav>
<a class="pill header-mail" href="mailto:${MAIL}">Write to us</a>
<button class="pill menu-toggle" type="button" aria-haspopup="dialog" aria-controls="menu">Menu</button>
</header>
<dialog class="menu" id="menu" aria-label="Main navigation">
<div class="menu-top"><span class="wordmark">fettle</span><button class="pill menu-close" type="button">Close</button></div>
<nav>${NAV.map((item) => `<a href="${item.href}">${item.label}</a>`).join("")}</nav>
<a class="menu-mail" href="mailto:${MAIL}">${MAIL}</a>
</dialog>`;
}

function demoNote(label = "Please note") {
  return `<section class="note-card" aria-label="About this template">
<span class="note-label">${label}</span>
<p class="note-text">${DEMO_NOTE}</p>
</section>`;
}

function footer() {
  return `<footer class="site-footer" id="contact">
<div class="footer-top">
<p class="footer-line">Write to the bench about a place, an induction or getting in through the yard.</p>
<a class="footer-mail" href="mailto:${MAIL}">${MAIL}</a>
</div>
<a class="footer-wordmark" href="index.html" aria-label="Fettle home">fettle</a>
<div class="footer-bottom">
<span class="footer-small">Fettle, a Plotform studio edition. An illustrative workshop and class programme.</span>
<nav aria-label="Footer"><a href="credits.html">Credits and source</a><a href="join.html">How to join</a><a href="#top">Back to top</a></nav>
</div>
</footer>
</body>
</html>
`;
}

const rule = () => `<div class="rule" role="presentation"></div>`;

/* ------------------------------------------------------------------ */
/* index.html                                                          */
/* ------------------------------------------------------------------ */
{
  const tutors = [
    { file: "person-nour.svg", name: "Nour Haddad", role: "Spoons, willow and anything that bends", alt: "A hand drawn portrait of a smiling person in a headscarf" },
    { file: "person-wes.svg", name: "Wes Okonjo", role: "Green woodwork and the pole lathe", alt: "A hand drawn portrait of a bearded person with untidy hair" },
    { file: "person-ada.svg", name: "Ada Fenn", role: "Joints, letter cutting and sharp corners", alt: "A hand drawn portrait of a laughing person with curly hair in a bun" },
    { file: "person-ivor.svg", name: "Ivor Bell", role: "Sharpening, and the tool wall", alt: "A hand drawn portrait of an older person in round glasses" },
    { file: "person-fen.svg", name: "Fen Adeyemi", role: "Print, dye and cloth", alt: "A hand drawn portrait of a person with cornrows and folded arms" },
    { file: "person-bram.svg", name: "Bram Ivers", role: "Forge, anvil and the metal side", alt: "A hand drawn portrait of a serious person with a shaved head and a chin beard" },
  ];
  const openTonight = SESSIONS.filter((s) => s.day === "tuesday");
  const steps = [
    { file: "tool-notebook.svg", alt: "A hand drawn notebook with a pencil across it", n: "01", title: "Put your name down", text: "Write to the bench and say which session and which date. Somebody answers within a few days, by hand, from the same address." },
    { file: "tool-apron.svg", alt: "A hand drawn workshop apron with a front pocket", n: "02", title: "Turn up in old clothes", text: "Aprons, ear defenders and safety glasses hang by the door. Shoes need to cover your whole foot, which rules out most of summer." },
    { file: "tool-knife.svg", alt: "A hand drawn carving knife with a wooden handle", n: "03", title: "Get shown once, then do it", text: "Tutors demonstrate at the front for ten minutes and then stay out of your way. Tools stay on the wall until you have been shown the one you want." },
    { file: "tool-log.svg", alt: "A hand drawn split log showing its growth rings", n: "04", title: "Take it home", text: "Whatever you make leaves with you the same evening, finished or not. Nothing is kept back and nothing is sold." },
  ];

  write(
    "index.html",
    `${head("Fettle, a workshop and a class programme", "Fettle is an illustrative community workshop: ten benches, four evenings a week, and classes in wood, metal, print and repair. A Plotform studio edition drawn entirely by hand.")}
${header("index.html")}
<main id="main">

<section class="hero" aria-labelledby="hero-title">
<div class="hero-words">
<span class="eyebrow">A workshop and a class programme, on an example street</span>
<h1 id="hero-title"><span class="line">Ten benches.</span><span class="line indent">Four evenings</span><span class="line">a week.</span></h1>
<p class="lead">Fettle is a room with a concrete floor, a tool wall, a kettle that takes too long, and ten benches that are free most of the time. Fourteen sessions run each week, from a first evening with a knife to an open bench where nobody teaches you anything.</p>
<div class="hero-actions">
<a class="button" href="programme.html">See the programme</a>
<a class="text-link" href="join.html">How joining works</a>
</div>
</div>
<figure class="hero-figure">
<img src="assets/mark-fettle.svg" width="680" height="540" alt="A hand drawn workbench with a vice at one end, a half carved spoon and a ruler on the top, shavings on the floor, and a pegboard above holding a saw, a square and a mallet">
<figcaption class="caption">Bench one, at about nine in the evening.</figcaption>
</figure>
</section>

${rule()}

<section class="section" id="tonight" aria-labelledby="tonight-title">
<div class="section-head">
<span class="kicker">01</span>
<h2 id="tonight-title">On a Tuesday</h2>
<p class="meta">Three of the fourteen weekly sessions. The other eleven are on the programme.</p>
</div>
<div class="card-row">
${openTonight
  .map(
    (s) => `<article class="card">
<span class="tag tag-${s.level}">${levelLabel(s.level)}</span>
<h3 class="card-title">${s.href ? `<a href="${s.href}">${s.title}</a>` : s.title}</h3>
<p class="card-when">${dayLabel(s.day)}, ${s.time}</p>
<p class="card-tutor">With ${s.tutor}</p>
<p class="card-note">${s.note}</p>
<p class="card-free">${s.free} of 10 benches free</p>
</article>`,
  )
  .join("\n")}
</div>
<a class="text-link" href="programme.html">Filter all fourteen by level and by day</a>
</section>

${rule()}

<section class="section people" id="people" aria-labelledby="people-title">
<div class="section-head">
<span class="kicker">02</span>
<h2 id="people-title">Who is at the front</h2>
<p class="meta">Six tutors, all invented, drawn rather than photographed. Nobody here is a professional teacher and everybody here has burnt something.</p>
</div>
<ul class="people-grid">
${tutors
  .map(
    (t) => `<li class="person">
<img src="assets/${t.file}" width="700" height="720" alt="${t.alt}" loading="lazy">
<h3 class="person-name">${t.name}</h3>
<p class="person-role">${t.role}</p>
</li>`,
  )
  .join("\n")}
</ul>
</section>

<section class="band" aria-labelledby="band-title">
<span class="band-label">The rule of the room</span>
<p class="band-text" id="band-title">If you are the only person who knows how to do the thing, you have to show somebody else before you go home. That is the whole membership agreement, and it fits on the back of the door.</p>
<a class="text-link light" href="space.html">What the room actually looks like</a>
</section>

<section class="section" id="how" aria-labelledby="how-title">
<div class="section-head">
<span class="kicker">03</span>
<h2 id="how-title">How an evening runs</h2>
<p class="meta">Every session follows the same four beats, whether it is spoons or a forge.</p>
</div>
<ol class="steps">
${steps
  .map(
    (s) => `<li class="step">
<img src="assets/${s.file}" width="220" height="220" alt="${s.alt}" loading="lazy">
<span class="step-number">${s.n}</span>
<h3 class="step-title">${s.title}</h3>
<p class="step-text">${s.text}</p>
</li>`,
  )
  .join("\n")}
</ol>
</section>

${rule()}

<section class="section split" id="find" aria-labelledby="find-title">
<div class="split-a">
<h2 id="find-title">Finding us</h2>
<p class="body">The door is the green one in the yard behind the example street, past the bins and the willow that nobody planted. There is no sign yet, because the sign is itself a Thursday class that keeps getting postponed.</p>
<p class="body">Level access from the yard, a wide door and no step at the threshold. The yard gate is propped open on class nights.</p>
<a class="text-link" href="space.html">The plan of the room</a>
</div>
<div class="split-b">
<dl class="hours">
<dt class="hours-day">Tuesday</dt><dd class="hours-time">18:30 to 22:00</dd>
<dt class="hours-day">Wednesday</dt><dd class="hours-time">18:00 to 21:00</dd>
<dt class="hours-day">Thursday</dt><dd class="hours-time">18:30 to 22:00</dd>
<dt class="hours-day">Saturday</dt><dd class="hours-time">10:00 to 17:00</dd>
<dt class="hours-day">Everything else</dt><dd class="hours-time">Locked, and the kettle is cold</dd>
</dl>
<a class="button ghost" href="mailto:${MAIL}">Ask about a place</a>
</div>
</section>

${demoNote()}
</main>
${footer()}`,
  );
}

/* ------------------------------------------------------------------ */
/* programme.html, with the filter                                     */
/* ------------------------------------------------------------------ */
{
  const buttons = (group, items) =>
    items
      .map(
        (item, i) =>
          `<button class="chip" type="button" data-${group}="${item.id}" aria-pressed="${i === 0 ? "true" : "false"}">${item.label}</button>`,
      )
      .join("");

  const cards = SESSIONS.map(
    (s) => `<article class="session" data-level="${s.level}" data-day="${s.day}" data-free="${s.free}">
<div class="session-top">
<span class="tag tag-${s.level}">${levelLabel(s.level)}</span>
<span class="session-when">${dayLabel(s.day)}, ${s.time}</span>
</div>
<h3 class="session-title">${s.href ? `<a href="${s.href}">${s.title}</a>` : s.title}</h3>
<p class="session-tutor">With ${s.tutor}</p>
<p class="session-note">${s.note}</p>
<div class="session-foot">
<span class="session-free">${s.free === 0 ? "No benches free" : `${s.free} of 10 benches free`}</span>
<span class="session-fee">${s.fee === "0" ? "No charge" : `${s.fee} pounds, illustrative`}</span>
</div>
</article>`,
  ).join("\n");

  write(
    "programme.html",
    `${head("The programme, fourteen sessions a week, Fettle", "Fourteen illustrative weekly sessions at Fettle, filtered by level and by day, with a live count of the benches left free.")}
${header("programme.html")}
<main id="main">
<section class="page-head" aria-labelledby="programme-title">
<span class="eyebrow">Every week, term time and otherwise</span>
<h1 id="programme-title">Fourteen sessions, from a standing start.</h1>
<p class="lead">Nothing here needs any experience you do not already have. Filter by how much of it you have, or by the evening you can actually get to. The count underneath keeps up with both.</p>
</section>

<section class="filters" aria-labelledby="filters-title">
<h2 class="filters-title" id="filters-title">Narrow it down</h2>
<div class="filter-group">
<span class="filter-label" id="level-label">Level</span>
<div class="chips" role="group" aria-labelledby="level-label" data-filter="level">${buttons("level", LEVELS)}</div>
</div>
<div class="filter-group">
<span class="filter-label" id="day-label">Evening</span>
<div class="chips" role="group" aria-labelledby="day-label" data-filter="day">${buttons("day", DAYS)}</div>
</div>
<p class="count" id="programme-count" role="status">Showing all 14 sessions, any level, any day. ${totalFree} benches free.</p>
<noscript><p class="meta">The filter needs JavaScript. All fourteen sessions are listed below either way.</p></noscript>
</section>

<section class="programme" aria-label="Sessions">
${cards}
</section>

<p class="empty" id="programme-empty" hidden>No sessions match that pair. Widen the level or pick another evening.</p>

${rule()}

<section class="section split" aria-labelledby="fees-title">
<div class="split-a">
<h2 id="fees-title">About the fees</h2>
<p class="body">The figures on the cards are illustrative examples for this template, not a real price list. They are printed the way a workshop would print them, so that you can see how a price sits in the layout, and so that you remember to change them.</p>
<p class="body">Nothing on this site can take a payment or hold a place. There is no booking system behind it, by design.</p>
</div>
<div class="split-b">
<a class="button ghost" href="mailto:${MAIL}">Ask about a session</a>
<p class="meta">Say which session, which date, and whether you have been before.</p>
</div>
</section>

${demoNote()}
</main>
${footer()}`,
  );
}

/* ------------------------------------------------------------------ */
/* class-spoon-carving.html                                            */
/* ------------------------------------------------------------------ */
{
  const bring = [
    { file: "tool-knife.svg", alt: "A hand drawn carving knife with a wooden handle", title: "Nothing sharp", text: "Every knife, axe and hook knife in the room belongs to the workshop and stays in the room. Bringing your own is fine but it gets checked first." },
    { file: "tool-apron.svg", alt: "A hand drawn workshop apron with a front pocket", title: "Clothes you can ruin", text: "Green wood is wet and it stains. Aprons hang by the door. Shoes have to cover your whole foot." },
    { file: "tool-glasses.svg", alt: "A hand drawn pair of safety glasses", title: "Nothing, we have those", text: "Safety glasses and a cut resistant glove for your holding hand are handed out at the start and counted back in at the end." },
    { file: "tool-notebook.svg", alt: "A hand drawn notebook with a pencil across it", title: "Something to write on", text: "Optional, and about half the room does it. The grain does not care but you will want to remember which way it ran." },
  ];
  const beats = [
    { t: "18:30", title: "Split a log", text: "Birch or cherry, cut this month, split down with a froe until you have a billet the size of your forearm." },
    { t: "18:50", title: "Axe out the blank", text: "Ten minutes of demonstration at the front, then the chopping block. This is the loud part of the evening." },
    { t: "19:30", title: "Knife work", text: "The outside shape first, then the crank, then the handle. Sitting down, elbows in, thumb behind the blade." },
    { t: "20:20", title: "Hollow the bowl", text: "Hook knife, both hands, short strokes across the grain. Everybody goes through the bottom at least once in their first year." },
    { t: "20:50", title: "Sweep up and go", text: "Tools wiped and back on the wall, shavings in the yard bin, spoon in your pocket. It dries over a fortnight." },
  ];

  write(
    "class-spoon-carving.html",
    `${head("Spoon carving from a green log, Fettle", "An illustrative first evening class at Fettle: split a log, axe out a blank and carve a spoon that goes home with you the same night.")}
${header("class-spoon-carving.html")}
<main id="main">
<section class="page-head" aria-labelledby="class-title">
<span class="eyebrow">First time, Tuesday, 18:30 to 21:00</span>
<h1 id="class-title">Spoon carving from a green log</h1>
<p class="lead">The whole evening is one object. You start with a length of wood that was a branch a fortnight ago, and you leave with a spoon that you will use, lose, and be quietly pleased about for years.</p>
<ul class="facts">
<li class="fact"><span class="fact-key">Tutor</span><span class="fact-value">Nour Haddad</span></li>
<li class="fact"><span class="fact-key">Level</span><span class="fact-value">First time, no experience at all</span></li>
<li class="fact"><span class="fact-key">Benches</span><span class="fact-value">4 of 10 free</span></li>
<li class="fact"><span class="fact-key">Fee</span><span class="fact-value">18 pounds, an illustrative example</span></li>
</ul>
</section>

<section class="class-figures" aria-label="People at the class">
<figure class="class-figure">
<img src="assets/figure-showing.svg" width="420" height="700" alt="A hand drawn figure pointing at something while explaining it" loading="lazy">
<figcaption class="caption">Ten minutes of demonstration, then out of your way.</figcaption>
</figure>
<figure class="class-figure">
<img src="assets/figure-bench.svg" width="420" height="700" alt="A hand drawn figure standing with their weight on one leg" loading="lazy">
<figcaption class="caption">Most of the evening is spent standing at a block.</figcaption>
</figure>
<figure class="class-figure">
<img src="assets/figure-wheels.svg" width="520" height="640" alt="A hand drawn figure using a wheelchair, smiling" loading="lazy">
<figcaption class="caption">Two benches drop to seated height. Say so when you write.</figcaption>
</figure>
</section>

${rule()}

<section class="section" aria-labelledby="bring-title">
<div class="section-head">
<span class="kicker">01</span>
<h2 id="bring-title">What to bring</h2>
<p class="meta">Which is, mostly, nothing.</p>
</div>
<ul class="bring">
${bring
  .map(
    (b) => `<li class="bring-item">
<img src="assets/${b.file}" width="220" height="220" alt="${b.alt}" loading="lazy">
<h3 class="bring-title">${b.title}</h3>
<p class="bring-text">${b.text}</p>
</li>`,
  )
  .join("\n")}
</ul>
</section>

<section class="section split" aria-labelledby="make-title">
<div class="split-a">
<h2 id="make-title">What you will make</h2>
<p class="body">One eating spoon, about the length of your hand, with a shallow bowl and a handle that suits whichever way you hold it. It will be slightly crooked. That is not a fault of the evening, it is a property of spoons.</p>
<p class="body">You will also leave with a bag of shavings if you want them, a blunted edge you sharpened yourself, and a fairly strong opinion about birch.</p>
<a class="text-link" href="programme.html">The rest of the programme</a>
</div>
<div class="split-b">
<figure class="framed">
<img src="assets/tool-log.svg" width="220" height="220" alt="A hand drawn split log showing its growth rings">
<figcaption class="caption">The log is split along the rings, never sawn across them.</figcaption>
</figure>
</div>
</section>

${rule()}

<section class="section" aria-labelledby="shape-title">
<div class="section-head">
<span class="kicker">02</span>
<h2 id="shape-title">The shape of the evening</h2>
<p class="meta">Two and a half hours, and it does run over.</p>
</div>
<ol class="timeline">
${beats
  .map(
    (b) => `<li class="beat">
<span class="beat-time">${b.t}</span>
<h3 class="beat-title">${b.title}</h3>
<p class="beat-text">${b.text}</p>
</li>`,
  )
  .join("\n")}
</ol>
</section>

<section class="band" aria-labelledby="tutor-title">
<span class="band-label">Your tutor</span>
<p class="band-text" id="tutor-title">Nour has taught this evening more times than anybody has counted and still splits the logs herself on the afternoon of the class, because green wood that has sat about for a week carves like a chair leg.</p>
<a class="text-link light" href="mailto:${MAIL}">Ask about a place on a Tuesday</a>
</section>

${demoNote()}
</main>
${footer()}`,
  );
}

/* ------------------------------------------------------------------ */
/* space.html, with the plan and the chart                             */
/* ------------------------------------------------------------------ */
{
  const rooms = [
    { n: "1", name: "The long room", text: "Ten benches in two rows, each with a vice, a bench hook and a light you can swing. Two drop to seated height." },
    { n: "2", name: "Machine bay", text: "Bandsaw, planer thicknesser and a pillar drill, behind a partition, with extraction along the wall. Induction before you touch any of them." },
    { n: "3", name: "Timber store", text: "Offcuts free to members, boards priced on the shelf, and a rack of green wood under a wet sack." },
    { n: "4", name: "Kettle and sink", text: "The slowest kettle in the county, a sink deep enough for a bucket, and the only chair anybody fights over." },
    { n: "5", name: "Sharpening corner", text: "Stones, a strop and a grinder nobody is allowed to use in a hurry. Every edge in the building comes through here." },
    { n: "6", name: "The yard", text: "Chopping blocks, three stools, a table for the messy half of a class, and the willow that nobody planted." },
  ];
  const week = [
    { day: "Tuesday", taken: 9 },
    { day: "Wednesday", taken: 10 },
    { day: "Thursday", taken: 7 },
    { day: "Friday", taken: 4 },
    { day: "Saturday", taken: 10 },
    { day: "Sunday", taken: 3 },
  ];

  write(
    "space.html",
    `${head("The space, ten benches and a yard, Fettle", "The illustrative Fettle workshop drawn as a plan: a long bench room, a machine bay, a timber store, a sharpening corner and a yard.")}
${header("space.html")}
<main id="main">
<section class="page-head" aria-labelledby="space-title">
<span class="eyebrow">One floor, one door, one kettle</span>
<h1 id="space-title">One long room, ten benches and a yard.</h1>
<p class="lead">It was a joinery, then a tyre place, then empty for eleven years. The floor is still the original concrete and the rings on it are from the tyres, not from us.</p>
</section>

<section class="plan-section" aria-labelledby="plan-title">
<h2 class="plan-title" id="plan-title">The plan</h2>
<figure class="plan">
<img src="assets/plan.svg" width="1000" height="640" alt="A hand drawn floor plan: ten benches in two rows in a long room, a machine bay with three machines behind a partition, a timber store, a sink, a sharpening corner, and a yard with stools and a table. A door opens onto the yard on the south side.">
<figcaption class="caption">Drawn, not surveyed. The plan carries no labels of its own so the key below stays editable text.</figcaption>
</figure>
<ol class="plan-key">
${rooms
  .map(
    (r) => `<li class="key-item">
<span class="key-number">${r.n}</span>
<h3 class="key-name">${r.name}</h3>
<p class="key-text">${r.text}</p>
</li>`,
  )
  .join("\n")}
</ol>
</section>

${rule()}

<section class="section" aria-labelledby="chart-title">
<div class="section-head">
<span class="kicker">01</span>
<h2 id="chart-title">How the week fills up</h2>
<p class="meta">Benches taken on a typical week, out of ten. These figures are illustrative examples for this template, not a measurement of anything.</p>
</div>
<div class="chart-block">
<figure class="chart">
<img src="assets/chart-benches.svg" width="760" height="360" alt="A hand drawn bar chart. Six bars, one for each day from Tuesday to Sunday, showing benches taken out of ten: nine, ten, seven, four, ten and three.">
<figcaption class="caption">The chart carries no numbers of its own. The same figures are in the table beside it.</figcaption>
</figure>
<table class="chart-table">
<caption class="chart-caption">Benches taken out of ten, an illustrative week</caption>
<thead>
<tr><th scope="col">Day</th><th scope="col">Taken</th><th scope="col">Free</th></tr>
</thead>
<tbody>
${week
  .map(
    (w) =>
      `<tr><th scope="row">${w.day}</th><td>${w.taken}</td><td>${10 - w.taken}</td></tr>`,
  )
  .join("\n")}
</tbody>
</table>
</div>
</section>

${rule()}

<section class="section split" aria-labelledby="access-title">
<div class="split-a">
<h2 id="access-title">Getting in</h2>
<p class="body">Level access from the yard through a door wide enough for a wheelchair, with no step at the threshold and no door closer to fight. The yard itself is flat and the gate is propped open on class nights.</p>
<p class="body">The machine bay is loud enough that ear defenders are not optional. Two benches drop to seated height and one has a knee recess. Say what you need when you write and it will be set up before you arrive.</p>
<p class="body">There is no parking. There is a bike rack that holds six, and it is bolted to something serious.</p>
</div>
<div class="split-b">
<dl class="hours">
<dt class="hours-day">Tuesday</dt><dd class="hours-time">18:30 to 22:00</dd>
<dt class="hours-day">Wednesday</dt><dd class="hours-time">18:00 to 21:00</dd>
<dt class="hours-day">Thursday</dt><dd class="hours-time">18:30 to 22:00</dd>
<dt class="hours-day">Saturday</dt><dd class="hours-time">10:00 to 17:00</dd>
</dl>
<p class="address">Fettle<br>The yard behind 41 Example Street<br>Example town</p>
<a class="button ghost" href="mailto:${MAIL}">Ask about access</a>
</div>
</section>

${demoNote()}
</main>
${footer()}`,
  );
}

/* ------------------------------------------------------------------ */
/* join.html                                                           */
/* ------------------------------------------------------------------ */
{
  const tiers = [
    {
      name: "A single session",
      price: "6 to 42 pounds",
      text: "Pay for the one evening, on the evening. The number depends on what the class eats: steel and charcoal cost more than birch.",
      items: ["No membership needed", "Tools and materials included", "Ask by email, first come"],
    },
    {
      name: "Bench membership",
      price: "16 pounds a month",
      text: "Open bench on Tuesday and Thursday, the timber store at member prices, and a shelf with your name on a bit of masking tape.",
      items: ["Two open benches a week", "Induction included", "Cancel by saying so"],
    },
    {
      name: "Keyholder",
      price: "34 pounds a month",
      text: "Your own key, for people who have been around a year and have shown somebody else how to do at least one thing.",
      items: ["Come in when you like", "One duty evening a month", "Proposed by two members"],
    },
  ];

  write(
    "join.html",
    `${head("Joining Fettle, and how to ask", "How joining the illustrative Fettle workshop works: single sessions, bench membership, keyholding, induction, and an example email address.")}
${header("join.html")}
<main id="main">
<section class="page-head" aria-labelledby="join-title">
<span class="eyebrow">There is no form on this page, and that is deliberate</span>
<h1 id="join-title">Joining, and how to ask about a bench.</h1>
<p class="lead">Everything here happens by email and then in person. Write and say what you want to do, somebody writes back, and you come and stand in the room before you commit to anything.</p>
<a class="button" href="mailto:${MAIL}">Write to the bench</a>
</section>

${rule()}

<section class="section" aria-labelledby="tiers-title">
<div class="section-head">
<span class="kicker">01</span>
<h2 id="tiers-title">Three ways in</h2>
<p class="meta">Every figure below is an illustrative example for this template, not a real price.</p>
</div>
<ul class="tiers">
${tiers
  .map(
    (t) => `<li class="tier">
<h3 class="tier-name">${t.name}</h3>
<p class="tier-price">${t.price}</p>
<p class="tier-illustrative">Illustrative example</p>
<p class="tier-text">${t.text}</p>
<ul class="tier-list">
${t.items.map((i) => `<li class="tier-item">${i}</li>`).join("\n")}
</ul>
<a class="text-link" href="mailto:${MAIL}">Ask about this one</a>
</li>`,
  )
  .join("\n")}
</ul>
</section>

${rule()}

<section class="section split" aria-labelledby="induction-title">
<div class="split-a">
<h2 id="induction-title">The induction</h2>
<p class="body">Forty minutes on a Tuesday, in a group of four or fewer. It covers where the first aid kit is, which way the extraction switch goes, what the three alarms mean, and how to put every tool back so the next person can find it.</p>
<p class="body">It is not a test and nobody fails it. It ends with you sharpening one chisel, badly, while somebody stands next to you.</p>
<p class="body">Nothing on this website books it. Write, and it gets written into the book by the kettle.</p>
<a class="text-link" href="space.html">Where everything is</a>
</div>
<div class="split-b">
<figure class="framed">
<img src="assets/person-ivor.svg" width="700" height="720" alt="A hand drawn portrait of an older person in round glasses" loading="lazy">
<figcaption class="caption">Ivor does most of the inductions, and all of the sharpening.</figcaption>
</figure>
</div>
</section>

<section class="band" aria-labelledby="honest-title">
<span class="band-label">What this site cannot do</span>
<p class="band-text" id="honest-title">There is no booking system, no payment, no account and no waiting list behind these pages. The contact link opens your own email application at an example address. A published site would need a real address and a person who reads it.</p>
<a class="text-link light" href="credits.html">Credits and the source archive</a>
</section>

<section class="section split" aria-labelledby="ask-title">
<div class="split-a">
<h2 id="ask-title">What to say when you write</h2>
<ul class="plain-list">
<li class="plain-item">Which session or which kind of membership.</li>
<li class="plain-item">Whether you have done any of it before, honestly.</li>
<li class="plain-item">Anything that would make the room easier: a seated bench, quieter hours, a door held open.</li>
<li class="plain-item">Which evenings you can actually get to.</li>
</ul>
</div>
<div class="split-b">
<a class="button ghost" href="mailto:${MAIL}">${MAIL}</a>
<p class="meta">Replies take a few days, because the person who reads it also has a job.</p>
</div>
</section>

${demoNote()}
</main>
${footer()}`,
  );
}

/* ------------------------------------------------------------------ */
/* credits.html                                                        */
/* ------------------------------------------------------------------ */
{
  const credits = [
    {
      name: "PaperCSS",
      what: "The foundation this edition is adapted from: a sketchbook component layer whose irregular border radii and offset shadows are the reason a plain rectangle can look drawn. Its ideas were rewritten rather than its stylesheet vendored, partly so the edition could drop its remote Google Fonts import.",
      terms: "ISC Licence, copyright 2017 to 2018 Rhyne Vlaservich",
      file: "licenses/papercss-ISC.txt",
      url: "https://github.com/papercss/papercss",
    },
    {
      name: "Rough.js",
      what: "Draws every hand drawn graphic here: the rules, the frames, the pinned note, the tool sketches, the floor plan and the chart. It runs once at build time in tools/make-art.mjs and writes static SVG files, so nothing is redrawn in the browser and no stroke ever moves.",
      terms: "MIT Licence, copyright 2019 Preet Shihn",
      file: "licenses/roughjs-MIT.txt",
      url: "https://github.com/rough-stuff/rough",
    },
    {
      name: "Open Peeps",
      what: "Every person on this site. A hand drawn illustration library by Pablo Stanley, which openpeeps.com places in the public domain under CC0, so no attribution is required. It is credited here anyway. It is the reason this edition can show a room full of people without one photograph.",
      terms: "CC0 1.0, public domain, no attribution required",
      file: "licenses/open-peeps-CC0.txt",
      url: "https://www.openpeeps.com",
    },
    {
      name: "react-peeps",
      what: "The machine readable copy of the Open Peeps artwork, by Emre Cakir. tools/make-people.mjs renders its components once at build time into the static SVG figures in the assets folder. No React reaches the browser.",
      terms: "MIT Licence, copyright 2020 to present Emre Cakir",
      file: "licenses/react-peeps-MIT.txt",
      url: "https://github.com/CeamKrier/react-peeps",
    },
    {
      name: "Bricolage Grotesque",
      what: "The one typeface on the site, by Atelier Triay, bundled as a local variable woff2 with the weight axis. Nothing is requested from a font service.",
      terms: "SIL Open Font License 1.1, copyright 2022 the Bricolage Grotesque Project Authors",
      file: "licenses/bricolage-grotesque-OFL.txt",
      url: "https://github.com/ateliertriay/bricolage",
    },
  ];

  write(
    "credits.html",
    `${head("Credits and source, Fettle", "Where every part of the Fettle studio edition comes from, what it is licensed under, and where to get the complete adapted source.")}
${header("credits.html")}
<main id="main">
<section class="page-head" aria-labelledby="credits-title">
<span class="eyebrow">Everything borrowed, and on what terms</span>
<h1 id="credits-title">Credits and source</h1>
<p class="lead">Fettle is a Plotform studio edition, adapted from PaperCSS. It is not an unchanged upstream template. Every third party piece is listed below with its terms and the licence file that ships inside this folder.</p>
<a class="button" href="source.zip">Download the complete source</a>
</section>

${rule()}

<section class="section" aria-labelledby="pieces-title">
<div class="section-head">
<span class="kicker">01</span>
<h2 id="pieces-title">What is in here, and whose it is</h2>
<p class="meta">Full provenance, per asset, is in SOURCE.json next to these pages.</p>
</div>
<ul class="credit-list">
${credits
  .map(
    (c) => `<li class="credit">
<h3 class="credit-name">${c.name}</h3>
<p class="credit-what">${c.what}</p>
<p class="credit-terms">${c.terms}</p>
<a class="credit-link" href="${c.file}">${c.file}</a>
<a class="credit-link" href="${c.url}">${c.url}</a>
</li>`,
  )
  .join("\n")}
</ul>
</section>

${rule()}

<section class="section split" aria-labelledby="images-title">
<div class="split-a">
<h2 id="images-title">On the pictures</h2>
<p class="body">There is no photography on this site, and no generated images. Every graphic is an SVG file written by a script in tools/: the drawn furniture by Rough.js, the people by Open Peeps. Nothing was taken from any reference site.</p>
<p class="body">Both scripts run once, at build time, and write files. Rough.js re-rolls its strokes on every render, so drawing in the browser would make the page jitter and would break the source editor's hold on whatever leaf you had selected. Every call passes an explicit seed, so running the scripts again writes the same bytes.</p>
<p class="body">Nothing on any page requests anything from another host. No scripts, no fonts, no trackers, no maps and no form services.</p>
</div>
<div class="split-b">
<figure class="framed">
<img src="assets/tool-gouge.svg" width="220" height="220" alt="A hand drawn hook gouge with a curved blade">
<figcaption class="caption">Drawn by tools/make-art.mjs, like everything else on this site that is not a person.</figcaption>
</figure>
</div>
</section>

${demoNote("On the content")}
</main>
${footer()}`,
  );
}

console.log("done");
