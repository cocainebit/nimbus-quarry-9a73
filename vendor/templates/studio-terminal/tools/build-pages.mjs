// Builds the five pages of Bevel. The chrome is written once here so the five
// documents cannot drift apart; the produced HTML is the deliverable and can be
// edited directly afterwards. Run with: node tools/build-pages.mjs
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const nav = [
  { file: "index.html", label: "Overview" },
  { file: "features.html", label: "The tour" },
  { file: "versions.html", label: "Versions" },
  { file: "support.html", label: "Help" },
  { file: "about.html", label: "About" },
];

const licences = [
  { file: "licenses/7css-MIT.txt", label: "7.css, MIT" },
  { file: "licenses/noto-sans-OFL.txt", label: "Noto Sans, OFL" },
  { file: "licenses/jetbrains-mono-OFL.txt", label: "JetBrains Mono, OFL" },
  { file: "LICENSE", label: "This edition, MIT" },
];

const ornament = `<span class="title-bar-controls" aria-hidden="true"><span><svg viewBox="0 0 10 10" focusable="false"><rect x="1" y="7" width="8" height="1.6" fill="#10202c"/></svg></span><span><svg viewBox="0 0 10 10" focusable="false"><rect x="1.2" y="1.6" width="7.6" height="6.8" fill="none" stroke="#10202c" stroke-width="1.5"/></svg></span><span><svg viewBox="0 0 10 10" focusable="false"><path d="M2 2 L8 8 M8 2 L2 8" stroke="#ffffff" stroke-width="1.8" fill="none"/></svg></span></span>`;

const titleBar = (title, icon = "icon-plumbline.svg") =>
  `<header class="title-bar">
<img class="title-bar-icon" src="assets/${icon}" width="64" height="64" alt="">
<p class="title-bar-text">${title}</p>
${ornament}
</header>`;

const menuStrip = (current) =>
  `<div class="menu-strip">
<nav class="site-nav" aria-label="Main navigation">${nav
    .map(
      (item) =>
        `<a href="${item.file}"${item.file === current ? ' aria-current="page"' : ""}>${item.label}</a>`,
    )
    .join("")}</nav>
<span class="menu-tail">Illustrative template</span>
</div>`;

const navigator = (current) =>
  `<aside class="pane pane-side">
<nav aria-label="Document navigator">
<p class="pane-title">Navigator</p>
<ul class="tree-view">
<li><details open><summary><img class="tree-icon" src="assets/icon-folder.svg" width="64" height="64" alt=""><span>Plumbline</span></summary>
<ul>${nav
    .map(
      (item) =>
        `<li><a href="${item.file}"${item.file === current ? ' aria-current="page"' : ""}>${item.label}</a></li>`,
    )
    .join("")}</ul>
</details></li>
<li><details><summary><img class="tree-icon" src="assets/icon-folder.svg" width="64" height="64" alt=""><span>Licences</span></summary>
<ul>${licences
    .map((item) => `<li><a href="${item.file}">${item.label}</a></li>`)
    .join("")}</ul>
</details></li>
</ul>
</nav>
<p class="side-note">The navigator holds the same links as the menu. Both groups open and close with the keyboard.</p>
</aside>`;

const statusBar = (fields) =>
  `<div class="status-bar">${fields
    .map((field) => `<p class="status-bar-field">${field}</p>`)
    .join("")}</div>`;

const taskbar = () =>
  `<footer class="taskbar">
<div class="taskbar-inner">
<a class="taskbar-mark" href="index.html"><img src="assets/icon-plumbline.svg" width="64" height="64" alt=""><span>Plumbline</span></a>
<nav aria-label="Footer navigation">${nav
    .map((item) => `<a href="${item.file}">${item.label}</a>`)
    .join("")}</nav>
<span class="tray">Illustrative content</span>
</div>
<div class="colophon">
<p>Bevel is a Plotform studio edition. Its window chrome is adapted from 7.css by Khang Nguyen Duy, used under the MIT licence.</p>
<p>Plumbline and Tin Roof Software are invented for this template. Write to <a href="mailto:hello@example.com">hello@example.com</a> and replace that address with your own before you publish.</p>
</div>
</footer>`;

const page = ({ file, title, description, heading, status, main, aside }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${description}">
<title>${title}</title>
<link rel="preload" href="assets/noto-sans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="style.css">
<script src="script.js" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to the document</a>
<div class="frame">
<div class="window">
${titleBar(heading)}
${menuStrip(file)}
<div class="window-body">
${navigator(file)}
<main class="pane pane-main" id="main">
${main}
</main>
</div>
${statusBar(status)}
<div class="window-foot"></div>
</div>
${aside || ""}
</div>
${taskbar()}
</body>
</html>
`;

const demoNote = (text) => `<p class="demo-note">${text}</p>`;

/* ------------------------------------------------------------- overview -- */
const overviewAside = `<section class="window is-quiet" aria-labelledby="notes-title">
${titleBar("notes.txt", "icon-book.svg")}
<div class="window-body is-single">
<div class="pane pane-main">
<h2 id="notes-title">Read this first</h2>
<p>Plumbline and Tin Roof Software are invented for this template. Nothing on these pages is a real program, no file is attached to any button, and no version below describes software you can run.</p>
<p>Replace the name, the drawn screens and the notes with your own. The window, the bevels and the glass are CSS, so your own writing sits inside the chrome without any of it becoming an image.</p>
</div>
</div>
${statusBar(["A plain note, kept in the second window", "Nothing here is fetched"])}
<div class="window-foot"></div>
</section>`;

const overview = page({
  file: "index.html",
  title: "Plumbline · A small editor for small games",
  description:
    "Bevel is a Plotform studio edition: an illustrative desktop software product presented as a late nineties application window, with panes, a navigator tree and a tabbed properties panel.",
  heading: "Plumbline · Overview",
  status: ["Ready", "Five pages, one window", "Illustrative content throughout"],
  aside: overviewAside,
  main: `<div class="section">
<p class="eyebrow">Tin Roof Software</p>
<div class="hero">
<div class="hero-body">
<h1>A small editor for small games.</h1>
<p class="lead">Plumbline draws tiles, lays them into maps and writes one sheet your own code can read. It opens in a single window, keeps its files as plain text, and asks nothing of you at start up.</p>
<div class="actions">
<a class="pushbutton is-default" href="features.html">Take the tour</a>
<a class="pushbutton" href="versions.html">Read the version notes</a>
</div>
</div>
<figure class="hero-figure">
<img src="assets/screen-editor.svg" width="960" height="600" alt="A drawn editor window: a column of tools, a tile canvas with a small scene on it, and a panel of colour swatches and layers">
<figcaption>Illustrative screen, drawn as vector art rather than captured from a running program.</figcaption>
</figure>
</div>
${demoNote(
  "Everything on this page is illustrative. Plumbline is an invented product written to fill the template, and the screens are drawings rather than photographs of software.",
)}
</div>

<div class="section">
<h2>What it is for</h2>
<p>Three ideas hold the whole program together, and the rest of it follows from them.</p>
<div class="grid">
<div class="card">
<img class="card-icon" src="assets/icon-plumbline.svg" width="64" height="64" alt="">
<h3>Tiles first</h3>
<p>Draw at the size you will ship. The grid is the document, so nothing is resampled on the way out.</p>
</div>
<div class="card">
<img class="card-icon" src="assets/icon-folder.svg" width="64" height="64" alt="">
<h3>Files you can read</h3>
<p>A map is a list of tiles and a list of layers, saved as plain text. You can open it in any editor and still recognise it.</p>
</div>
<div class="card">
<img class="card-icon" src="assets/icon-book.svg" width="64" height="64" alt="">
<h3>One window</h3>
<p>Tools on the left, canvas in the middle, palette and layers on the right. Nothing floats away and nothing hides behind anything else.</p>
</div>
</div>
</div>

<div class="section">
<h2>Where to go next</h2>
<ul class="rowlist">
<li>
<img class="row-icon" src="assets/icon-book.svg" width="64" height="64" alt="">
<div class="row-body">
<h3>The tour</h3>
<p>How a tile becomes a map, and what each panel of the inspector holds.</p>
</div>
<a class="pushbutton" href="features.html">Open the tour</a>
</li>
<li>
<img class="row-icon" src="assets/icon-disk.svg" width="64" height="64" alt="">
<div class="row-body">
<h3>Versions</h3>
<p>An invented changelog, kept in the shape a real one would take.</p>
</div>
<a class="pushbutton" href="versions.html">Open the versions</a>
</li>
<li>
<img class="row-icon" src="assets/icon-help.svg" width="64" height="64" alt="">
<div class="row-body">
<h3>Help</h3>
<p>Questions, known limits, and one honest way to get in touch.</p>
</div>
<a class="pushbutton" href="support.html">Open the help</a>
</li>
</ul>
</div>`,
});

/* ------------------------------------------------------------- the tour -- */
const tabs = [
  {
    id: "canvas",
    label: "Canvas",
    heading: "The canvas",
    body: "The canvas is the map itself, at the size the game will read it. Grid lines sit under the tiles rather than over them, so a drawing never has to be squinted at through its own guides.",
    image: {
      src: "assets/screen-map.svg",
      alt: "A drawn map view: a grid of coloured tiles with a road running through it and a dashed selection rectangle",
      w: 960,
      h: 600,
    },
    spec: [
      ["Grid", "Set once per map, in tiles rather than pixels"],
      ["Selection", "Rectangular, and it keeps its shape while you drag it"],
      ["Undo", "Per map, and it survives a save"],
    ],
  },
  {
    id: "palette",
    label: "Palette",
    heading: "The palette",
    body: "A palette is a small, fixed set of colours that every tile in a project shares. Slots can be locked, so a colour that older tiles depend on cannot quietly change under them.",
    image: {
      src: "assets/panel-palette.svg",
      alt: "A drawn palette panel: sixteen colour swatches, a ramp of twelve steps and a row of locked slots",
      w: 720,
      h: 420,
    },
    spec: [
      ["Slots", "Sixteen by default, and a project may hold several palettes"],
      ["Ramps", "Built from two ends, then adjusted by hand"],
      ["Locking", "A locked slot keeps its value when the palette is edited"],
    ],
  },
  {
    id: "layers",
    label: "Layers",
    heading: "Layers",
    body: "Layers stack in the order a game draws them, and each one keeps its own grid. A collision layer is a layer like any other, so it can be edited with the same tools as the ground.",
    image: {
      src: "assets/panel-layers.svg",
      alt: "A drawn stack of four map layers shown as offset planes labelled ground, props, roofs and collision",
      w: 720,
      h: 420,
    },
    spec: [
      ["Order", "Bottom to top, matching the order the engine reads"],
      ["Opacity", "Per layer, for editing only, and never written to the sheet"],
      ["Locking", "A locked layer is visible but cannot be painted on"],
    ],
  },
  {
    id: "script",
    label: "Script",
    heading: "Scripting",
    body: "Anything the panels can do, a short script can do without opening the window. Scripts are plain text files kept beside the map, and they run in the order you give them.",
    image: {
      src: "assets/panel-script.svg",
      alt: "A drawn console panel: rows of coloured bars standing in for lines of output on a dark field",
      w: 720,
      h: 420,
    },
    spec: [
      ["Language", "A short list of commands rather than a general language"],
      ["Scope", "One project at a time, named on the command line"],
      ["Output", "Written next to the map, never anywhere else on the disk"],
    ],
  },
];

const tabButtons = tabs
  .map(
    (tab, index) =>
      `<button type="button" role="tab" id="tab-${tab.id}" aria-controls="panel-${tab.id}" aria-selected="${index === 0 ? "true" : "false"}" tabindex="${index === 0 ? "0" : "-1"}">${tab.label}</button>`,
  )
  .join("");

const tabPanels = tabs
  .map(
    (tab, index) => `<div class="tabpanel" role="tabpanel" id="panel-${tab.id}" aria-labelledby="tab-${tab.id}" tabindex="0"${index === 0 ? "" : " hidden"}>
<div class="tabpanel-split">
<div class="prose">
<h3>${tab.heading}</h3>
<p>${tab.body}</p>
<dl class="speclist">${tab.spec.map(([term, value]) => `<dt>${term}</dt><dd>${value}</dd>`).join("")}</dl>
</div>
<img src="${tab.image.src}" width="${tab.image.w}" height="${tab.image.h}" alt="${tab.image.alt}">
</div>
</div>`,
  )
  .join("\n");

const tour = page({
  file: "features.html",
  title: "The tour · Plumbline",
  description:
    "How the illustrative Plumbline editor works: the pipeline from tiles to sheet, a tabbed inspector covering canvas, palette, layers and scripting, and a drawn console.",
  heading: "Plumbline · The tour",
  status: ["Tour", "Four panels in the inspector", "Illustrative content throughout"],
  main: `<div class="section">
<p class="eyebrow">How it works</p>
<h1>Tiles, a map, one sheet.</h1>
<p class="lead">Plumbline holds one idea at each step and hands the result to the next one. Nothing is hidden in a project file you cannot open.</p>
${demoNote(
  "This tour describes an invented program. The steps and panels below are written to show how a real tool might explain itself, not to document software you can install.",
)}
<figure class="hero-figure">
<img src="assets/diagram-pipeline.svg" width="960" height="260" alt="A diagram of four boxes: tiles, map, sheet and game, joined left to right by arrows, with a dashed line returning from the sheet to the tiles">
<figcaption>Edits travel back along the dashed line, so a change to one tile never means exporting by hand twice.</figcaption>
</figure>
</div>

<div class="section">
<h2>The inspector</h2>
<p>The right hand panel changes with what you have selected. Each tab below is one page of it. Move between them with the arrow keys, or click.</p>
<div class="tabs">
<div class="tablist" role="tablist" aria-label="Inspector panels">${tabButtons}</div>
${tabPanels}
</div>
</div>

<div class="section">
<h2>The console</h2>
<p>The same commands the panels run are available as text. This is the one place in the template set in a monospaced face, because here the typing is the subject rather than the furniture.</p>
<div class="console">
<p class="console-line"><span class="prompt">$</span><span> plumb build map-01.pbl --sheet sheet.png</span></p>
<p class="console-line"><span class="muted">  reading 96 tiles from tiles.pbl</span></p>
<p class="console-line"><span class="muted">  packing 32 frames</span></p>
<p class="console-line"><span class="muted">  wrote sheet.png and sheet.index</span></p>
<p class="console-line"><span class="prompt">$</span><span> plumb watch map-01.pbl</span></p>
<p class="console-line"><span class="muted">  watching for changes</span><span class="caret" aria-hidden="true"></span></p>
</div>
<p class="demo-note">A drawn session, written into the page as text. No command runs, nothing is sent anywhere, and the caret holds still when a visitor has asked for reduced motion.</p>
</div>

<div class="section">
<h2>Export</h2>
<p>An export writes two files next to each other: one image holding every frame, and one index naming them. Engines that want a different layout can read the index and repack it.</p>
<figure class="hero-figure">
<img src="assets/screen-export.svg" width="960" height="520" alt="A drawn export view: thirty two frames arranged in a grid, an arrow, and a card standing for the written sheet file" loading="lazy">
<figcaption>Illustrative export view. The frame count shown is part of the drawing.</figcaption>
</figure>
</div>`,
});

/* ------------------------------------------------------------- versions -- */
const releases = [
  {
    version: "Version 2.4",
    date: "August 2026",
    notes: [
      "Layers can be locked, and a locked layer stays visible while it refuses paint.",
      "The palette keeps its scroll position when a project is reopened.",
      "Export writes the index beside the sheet rather than inside it.",
    ],
  },
  {
    version: "Version 2.3",
    date: "May 2026",
    notes: [
      "Selections keep their shape while being dragged across the canvas.",
      "The script runner reports the line it stopped on.",
    ],
  },
  {
    version: "Version 2.2",
    date: "February 2026",
    notes: [
      "Ramps are built from two ends and then adjusted by hand.",
      "Undo survives a save, so a mistake before saving is still recoverable.",
    ],
  },
  {
    version: "Version 2.1",
    date: "November 2025",
    notes: [
      "Maps hold several palettes, and a tile remembers which one it was drawn with.",
      "The status bar shows the tile under the pointer.",
    ],
  },
  {
    version: "Version 2.0",
    date: "July 2025",
    notes: [
      "The window was rebuilt around two panes, with the navigator on the left.",
      "Project files became plain text.",
    ],
  },
];

const versions = page({
  file: "versions.html",
  title: "Versions · Plumbline",
  description:
    "An illustrative download page and changelog for Plumbline: three build rows that are marked as not connected, and five invented releases written in the shape a real changelog takes.",
  heading: "Plumbline · Versions",
  status: ["Versions", "Five entries in the changelog", "Illustrative content throughout"],
  main: `<div class="section">
<p class="eyebrow">Downloads</p>
<h1>Versions and changes.</h1>
<p class="lead">A version page carries two things: something to fetch, and a plain account of what moved since last time. Both shapes are laid out below, ready for your own.</p>
${demoNote(
  "The builds and the changelog on this page are invented. No file is attached to any row here, and the version numbers and dates describe nothing that exists.",
)}
</div>

<div class="section">
<h2>Builds</h2>
<fieldset class="groupbox">
<legend>Choose a build</legend>
<ul class="rowlist">
<li>
<img class="row-icon" src="assets/icon-disk.svg" width="64" height="64" alt="">
<div class="row-body">
<h3>Desktop build</h3>
<p>The editor and the command line tool in one folder.</p>
</div>
<span class="badge is-quiet">Not connected</span>
</li>
<li>
<img class="row-icon" src="assets/icon-disk.svg" width="64" height="64" alt="">
<div class="row-body">
<h3>Portable build</h3>
<p>The same files, with settings kept beside the program instead of in your account.</p>
</div>
<span class="badge is-quiet">Not connected</span>
</li>
<li>
<img class="row-icon" src="assets/icon-folder.svg" width="64" height="64" alt="">
<div class="row-body">
<h3>Source archive</h3>
<p>Everything needed to build the program yourself.</p>
</div>
<span class="badge is-quiet">Not connected</span>
</li>
</ul>
<p class="demo-note">These rows are marked as not connected because the template ships no application files. Point them at your own releases when you publish.</p>
</fieldset>
</div>

<div class="section">
<h2>Changelog</h2>
<p>Newest first. Each entry names what changed in words a person can check, rather than a number to be impressed by.</p>
${releases
  .map(
    (release) => `<article class="release">
<div class="release-head">
<h3>${release.version}</h3>
<p class="release-date">${release.date}</p>
</div>
<ul>${release.notes.map((note) => `<li>${note}</li>`).join("")}</ul>
</article>`,
  )
  .join("\n")}
</div>

<div class="section">
<h2>How the notes are kept</h2>
<p>The changelog is generated from one plain text file in the project, so writing a release note and shipping it are the same act.</p>
<pre class="sample">version: 2.4
date: 2026-08-04
changes:
  - layers can be locked
  - palette keeps its scroll position
  - export writes the index beside the sheet</pre>
<p class="demo-note">An illustrative file format, shown as a code sample. It is the second and last monospaced block in this template.</p>
</div>`,
});

/* ----------------------------------------------------------------- help -- */
const questions = [
  {
    q: "What does Plumbline save?",
    a: [
      "A project folder holds the tiles, the palettes and one file per map. All of them are plain text except the exported sheet, which is an image.",
      "Nothing is stored anywhere else, and closing the program writes no other file.",
    ],
  },
  {
    q: "Can I open a map without the editor?",
    a: [
      "Yes. A map is a list of tiles and a list of layers, so a text editor shows it exactly as the program sees it.",
    ],
  },
  {
    q: "Does it need an account?",
    a: [
      "No. There is no sign in, no licence key to type at start up, and no part of the program asks for a network.",
    ],
  },
  {
    q: "How do I report a problem?",
    a: [
      "Write to the address below and attach the map file. A map is small and readable, which is usually enough to see what went wrong.",
    ],
  },
  {
    q: "Which parts of this website are illustrative?",
    a: [
      "All of them. Plumbline, Tin Roof Software, the screens, the versions and the answers on this page were written to fill a template.",
      "The window chrome, the navigator, the inspector and the keyboard behaviour are real and are yours to keep.",
    ],
  },
];

const help = page({
  file: "support.html",
  title: "Help · Plumbline",
  description:
    "An illustrative help page for Plumbline: five questions that open and close, a short list of known limits, and one honest way to get in touch by email.",
  heading: "Plumbline · Help",
  status: ["Help", "Five questions", "Illustrative content throughout"],
  main: `<div class="section">
<p class="eyebrow">Support</p>
<h1>Help, and what it cannot do.</h1>
<p class="lead">A small program should be able to say plainly where it stops. These answers are written in that spirit, and the limits are on the same page as the promises.</p>
${demoNote(
  "The questions and answers below are illustrative, written for an invented program. Replace them with your own before publishing.",
)}
</div>

<div class="section">
<h2>Questions</h2>
${questions
  .map(
    (item) => `<details class="faq">
<summary>${item.q}</summary>
<div class="faq-body">${item.a.map((paragraph) => `<p>${paragraph}</p>`).join("")}</div>
</details>`,
  )
  .join("\n")}
</div>

<div class="section">
<h2>Known limits</h2>
<div class="sunken">
<div class="prose">
<ul>
<li>One project is open at a time. Two maps from different projects cannot share a window.</li>
<li>A palette is fixed in size once tiles depend on it, and growing one means a new palette.</li>
<li>The script runner reads one project, named on the command line, and writes only beside that project.</li>
</ul>
</div>
</div>
</div>

<div class="section">
<h2>Getting in touch</h2>
<div class="grid">
<div class="card">
<img class="card-icon" src="assets/icon-mail.svg" width="64" height="64" alt="">
<h3>By email</h3>
<p>The only route this template connects. It opens your own mail program with an example address already filled in.</p>
<div class="actions">
<a class="pushbutton is-default" href="mailto:hello@example.com">Write to hello@example.com</a>
</div>
</div>
<div class="card">
<img class="card-icon" src="assets/icon-help.svg" width="64" height="64" alt="">
<h3>No form here</h3>
<p>There is no contact form, no chat widget and no tracker on any page. Nothing on this site sends a request anywhere.</p>
</div>
<div class="card">
<img class="card-icon" src="assets/icon-book.svg" width="64" height="64" alt="">
<h3>Before you write</h3>
<p>The tour answers most questions about how a map is built, and the versions page says what changed and when.</p>
</div>
</div>
</div>`,
});

/* ---------------------------------------------------------------- about -- */
const about = page({
  file: "about.html",
  title: "About and credits · Plumbline",
  description:
    "Credits for the Bevel studio edition: window chrome adapted from 7.css under the MIT licence at a pinned commit, bundled fonts under the Open Font License, and drawn SVG icons.",
  heading: "Plumbline · About and credits",
  status: ["About", "Credits and licences", "Illustrative content throughout"],
  main: `<div class="section">
<p class="eyebrow">Colophon</p>
<h1>What this is, and what it is made of.</h1>
<p class="lead">Bevel is a website wearing a desktop as a costume. The chrome is real CSS rather than a picture of a program, and everything the costume covers is still a plain, keyboard operable page.</p>
${demoNote(
  "Tin Roof Software and Plumbline are invented for this template. No studio, product, release or quotation on this site describes anything real.",
)}
</div>

<div class="section">
<h2>The studio</h2>
<div class="prose">
<p>Two people are supposed to work on Plumbline in this story: one who draws and one who writes the exporter. They ship when a thing is finished, they answer their own email, and they keep the program small enough that they can both hold it in their heads.</p>
<p>That is the sort of copy this page is for. Replace it with your own account of who you are and how you work.</p>
</div>
</div>

<div class="section">
<h2>How the chrome was built</h2>
<div class="prose">
<p>Adapted from 7.css by Khang Nguyen Duy, used under the MIT licence and pinned at commit 3e934439c7587e0e89cce12bb3179cd3f8fd187b. What was taken is the visual grammar: the window border and its lit inner rim, the title bar gradient, the two stop button fill, the sunken field borders, the group box, the tab strip that runs its edge under the selected tab, and the tree view with its dotted connectors.</p>
<p>What was left behind is everything else: the upstream icon images, the component set this page does not use, and the Windows 7 tribute framing. Every mark here is SVG drawn for this edition or a CSS gradient written for it. No screenshot of any operating system appears, no product logo is used, and no trademark belongs to anyone in this template.</p>
<p>The three window controls in each title bar are ornament. A web page cannot be minimised, so they are drawn shapes hidden from screen readers rather than buttons that announce an action they will not perform. Every control that is announced here does what it says.</p>
</div>
</div>

<div class="section">
<h2>Type</h2>
<div class="prose">
<p>7.css leaves the typeface to the system it imitates. This edition bundles one instead, so a page looks the same on a machine that has never held that system font: Noto Sans, a humanist sans under the SIL Open Font License, and the open face the upstream stack itself falls back to.</p>
<p>JetBrains Mono, also under the Open Font License, appears in exactly two places: the console on the tour and the file sample on the versions page. Navigation, headings and body copy are never set in a monospaced face.</p>
</div>
</div>

<div class="section">
<h2>Licences</h2>
<ul class="rowlist">
<li>
<img class="row-icon" src="assets/icon-folder.svg" width="64" height="64" alt="">
<div class="row-body">
<h3>7.css</h3>
<p>MIT licence, copyright 2021 Khang Nguyen Duy. Kept in full beside these pages.</p>
</div>
<a class="pushbutton" href="licenses/7css-MIT.txt">Read the notice</a>
</li>
<li>
<img class="row-icon" src="assets/icon-book.svg" width="64" height="64" alt="">
<div class="row-body">
<h3>Noto Sans</h3>
<p>SIL Open Font License 1.1, copyright the Noto Project Authors.</p>
</div>
<a class="pushbutton" href="licenses/noto-sans-OFL.txt">Read the licence</a>
</li>
<li>
<img class="row-icon" src="assets/icon-book.svg" width="64" height="64" alt="">
<div class="row-body">
<h3>JetBrains Mono</h3>
<p>SIL Open Font License 1.1, copyright JetBrains s.r.o.</p>
</div>
<a class="pushbutton" href="licenses/jetbrains-mono-OFL.txt">Read the licence</a>
</li>
<li>
<img class="row-icon" src="assets/icon-plumbline.svg" width="64" height="64" alt="">
<div class="row-body">
<h3>This edition</h3>
<p>MIT licence. The pages, the stylesheet, the script and every drawing in them.</p>
</div>
<a class="pushbutton" href="LICENSE">Read the notice</a>
</li>
</ul>
</div>

<div class="section">
<h2>Accessibility</h2>
<div class="prose">
<p>The costume is not allowed to cost anything here. The inspector is a real tab widget: arrow keys move along it, Home and End jump to its ends, and each panel is announced with the tab that opens it. The navigator and the question list are native disclosure elements, so they work before any script loads.</p>
<p>Focus is drawn as a solid ring rather than the faint dotted line the period is fond of, colours were chosen for contrast on the pale surfaces, and every animation stops when a visitor asks for reduced motion.</p>
</div>
</div>`,
});

const files = {
  "index.html": overview,
  "features.html": tour,
  "versions.html": versions,
  "support.html": help,
  "about.html": about,
};

for (const [name, content] of Object.entries(files)) {
  if (content.includes(String.fromCharCode(0x2014))) throw new Error("Em dash found in " + name);
  await writeFile(join(root, name), content, "utf8");
  console.log("wrote " + name);
}
