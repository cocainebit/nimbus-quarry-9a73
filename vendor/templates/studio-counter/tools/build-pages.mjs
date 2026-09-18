/* Carafe, a Plotform studio edition.

   Assembles the six pages from one shared shopfront, footer and head block, the
   way AstroWind assembles its pages from a shared Layout, a Header widget and a
   Footer widget. Plain Node, no dependencies.

       node tools/build-pages.mjs [outputDirectory]

   The default output directory is the directory holding this file's parent, so
   running it with no argument rewrites the pages in place.

   Everything on these pages is invented for the template. The prices are
   illustrative sample values, and every page says so. */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const out = resolve(process.argv[2] || join(here, ".."));

const MAIL = "bookings@example.com";
const PHONE = "01632 960 114";

/* ---------- small builders ---------- */

const nav = [
  ["index.html", "Home"],
  ["menu.html", "Menu"],
  ["wine.html", "Wine"],
  ["room.html", "The room"],
  ["visit.html", "Visit"],
];

function navList(current, className) {
  const items = nav
    .map(
      ([href, label]) =>
        `<li><a href="${href}"${href === current ? ' aria-current="page"' : ""}>${label}</a></li>`,
    )
    .join("");
  return `<nav class="${className}" aria-label="Main navigation"><ul>${items}</ul></nav>`;
}

/* A menu row: the name, a leader, the price. The name, the note and the price
   are each their own leaf element, so the source editor can select every one of
   them. The leader carries no text and is hidden from assistive software. */
function dish(name, note, price, diet) {
  const mark = diet
    ? `<span class="dish-mark">${diet === "vegan" ? "vegan" : "veg"}</span>`
    : "";
  const diets =
    diet === "vegan" ? "vegan vegetarian" : diet === "vegetarian" ? "vegetarian" : "";
  return `<li class="dish" data-diet="${diets}">
<p class="dish-line"><span class="dish-head"><span class="dish-name">${name}</span>${mark}</span><span class="dish-leader" aria-hidden="true"></span><span class="dish-price">${price}</span></p>
<p class="dish-note">${note}</p>
</li>`;
}

/* A drinks row with two price columns. */
function pour(name, region, glass, bottle) {
  return `<li class="dish">
<p class="pour-line"><span class="dish-name">${name}</span><span class="dish-price">${glass}</span><span class="dish-price">${bottle}</span></p>
<p class="region">${region}</p>
</li>`;
}

/* A drinks row with one price and a leader. */
function single(name, note, price) {
  return `<li class="dish">
<p class="dish-line"><span class="dish-name">${name}</span><span class="dish-leader" aria-hidden="true"></span><span class="dish-price">${price}</span></p>
<p class="dish-note">${note}</p>
</li>`;
}

function course(id, title, note, rows, extra = "") {
  return `<section class="course" data-course="${id}" aria-labelledby="course-${id}">
<div class="course-head">
<h2 class="course-title" id="course-${id}">${title}</h2>
<p class="course-note">${note}</p>
</div>
${extra}<ul class="dishes">
${rows.join("\n")}
</ul>
</section>`;
}

/* Sunday is 0, to match the day numbers a browser gives. */
function hoursRow(days, label, time) {
  return `<li class="hours-row" data-days="${days}"><span class="hours-day">${label}</span><span class="hours-time">${time}</span></li>`;
}

const sprig = `<svg class="sprig" viewBox="0 0 120 26" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
<path d="M4 13 L44 13 M76 13 L116 13"/>
<path d="M60 4 Q52 13 60 22 Q68 13 60 4 Z"/>
<path d="M60 4 L60 22"/>
</svg>`;

const kitchenHours = [
  hoursRow("2 3 4", "Tuesday to Thursday", "18.00 to 22.00"),
  hoursRow("5", "Friday", "12.00 to 14.30, 18.00 to 22.30"),
  hoursRow("6", "Saturday", "12.00 to 15.00, 18.00 to 22.30"),
  hoursRow("0", "Sunday", "12.00 to 16.00"),
  hoursRow("1", "Monday", "Closed"),
];

const barHours = [
  hoursRow("2 3 4", "Tuesday to Thursday", "17.00 to 23.00"),
  hoursRow("5", "Friday", "12.00 to 00.30"),
  hoursRow("6", "Saturday", "12.00 to 00.30"),
  hoursRow("0", "Sunday", "12.00 to 18.00"),
  hoursRow("1", "Monday", "Closed"),
];

/* ---------- the page frame ---------- */

function page({ file, title, description, body }) {
  return `<!doctype html>
<html lang="en" id="top">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${description}">
<meta name="theme-color" content="#f3ecde">
<title>${title}</title>
<link rel="preload" href="assets/source-serif-4-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/playfair-display-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="style.css">
<script src="script.js" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to the page</a>
<header class="shopfront" data-shopfront>
<div class="shell">
<div class="shopfront-top">
<p class="caps shopfront-note">Fell Street at Bower Lane, Tuesday to Sunday</p>
<div class="shopfront-actions">
<button class="control nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="shopfront-nav">Pages</button>
<a class="button button-solid" href="visit.html#book">Book a table</a>
</div>
</div>
</div>
<div class="shopfront-plate">
<a class="wordmark" href="index.html">Carafe</a>
<p class="wordmark-line">A counter restaurant and wine bar</p>
</div>
<div id="shopfront-nav">
${navList(file, "shopfront-nav")}
</div>
</header>
<main id="main">
${body}
</main>
<footer class="foot">
<div class="shell">
<div class="foot-grid">
<div>
<span class="foot-mark">Carafe</span>
<p class="caps">Where to find us</p>
<address class="address">
<p>41 Fell Street</p>
<p>at the corner of Bower Lane</p>
<p>${PHONE}</p>
</address>
<p><a class="text-link" href="mailto:${MAIL}">${MAIL}</a></p>
</div>
<div>
<h3>Kitchen hours</h3>
<ul class="foot-list">
<li>Tuesday to Thursday, 18.00 to 22.00</li>
<li>Friday and Saturday, lunch and dinner</li>
<li>Sunday, 12.00 to 16.00</li>
<li>Closed all day on Monday</li>
</ul>
</div>
<div>
<h3>Pages</h3>
<ul class="foot-list">
<li><a href="menu.html">The menu</a></li>
<li><a href="wine.html">Wine and drinks</a></li>
<li><a href="room.html">The room</a></li>
<li><a href="visit.html">Visit and hours</a></li>
<li><a href="credits.html">Credits and source</a></li>
</ul>
</div>
</div>
<div class="foot-bottom">
<p class="caps">Carafe, a Plotform studio edition</p>
<p class="caps"><a href="#top">Back to the top</a></p>
</div>
<p class="demo-note">The content of this template is illustrative. Carafe is not a real restaurant. The dishes, the wines, the people, the address, the telephone number and the email address were invented for this template, and every price shown is an invented sample value rather than a price anyone charges.</p>
</div>
</footer>
</body>
</html>
`;
}

/* ---------- the pages ---------- */

const pages = [];

/* ----- Front ----- */

pages.push({
  file: "index.html",
  title: "Carafe, a counter restaurant and wine bar",
  description:
    "Carafe is an illustrative template for a counter restaurant and wine bar: a real menu with prices, kitchen and bar hours kept apart, and a booking enquiry that is honest about not being connected.",
  body: `<section class="shell band opening">
<div>
<p class="caps claret">Fell Street at Bower Lane</p>
<h1>Nine stools, four tables and whatever the morning brought</h1>
<p class="lede">A small kitchen open to the room, a short menu written each afternoon, and a list of wine where every bottle can be had by the glass. Sit at the counter without booking. Tables are worth an email.</p>
<div class="opening-actions">
<a class="button button-solid" href="menu.html">Read the menu</a>
<a class="button" href="visit.html#book">Book a table</a>
</div>
</div>
<figure class="opening-figure">
<img src="assets/drawing-counter.svg" width="1000" height="620" alt="Line drawing of the counter seen from the door: three pendant lamps, two shelves of bottles, a carafe and a plate on the counter top and four stools in front of it">
<figcaption class="caps">Drawn for this template, since we have no photographs to show</figcaption>
</figure>
</section>

<div class="shell">
<hr class="rule-double">
</div>

<section class="shell band slate" aria-labelledby="tonight-title">
<div class="sheet sheet-framed">
<p class="caps claret">Tonight</p>
<h2 id="tonight-title">What is on</h2>
<p class="today-line" data-today-line>The kitchen and bar hours are set out on the visit page.</p>
<ul class="dishes">
${dish("Whipped cod's roe, radishes", "Smoked roe beaten with potato and lemon, radishes from the box that arrived this morning.", "8.50")}
${dish("Whole plaice, brown butter, capers", "One fish, one pan, brown butter and a spoon of capers. Enough for one hungry person.", "24.00")}
${dish("Burnt custard", "Set in the morning, burnt to order, eaten with a teaspoon.", "8.00", "vegetarian")}
</ul>
<p class="status">Prices on this page are illustrative sample values invented for the template.</p>
<p><a class="text-link" href="menu.html">The whole menu</a></p>
</div>
<div class="sheet" data-service="kitchen">
<p class="caps claret">Kitchen hours</p>
<h2>When we cook</h2>
<ul class="hours-list">
${kitchenHours.join("\n")}
</ul>
<p class="closed-line">Closed all day on Monday</p>
<p><a class="text-link" href="visit.html">Bar hours, the address and the map</a></p>
</div>
</section>

<div class="shell">
${sprig}
</div>

<section class="shell band cols-three" aria-label="How the place works">
<div class="note-block">
<h3>The counter first</h3>
<p>Nine stools run the length of the room and none of them can be booked. If the stools are full we will take a number and call when one is free.</p>
</div>
<div class="note-block">
<h3>The list is open</h3>
<p>Everything on the wine list can be poured by the glass on the night it is open, so a table of two can drink four different things without buying four bottles.</p>
</div>
<div class="note-block">
<h3>One sitting, one table</h3>
<p>A table is yours for the evening. We would rather serve fewer people well than turn the room twice and rush the second half of it.</p>
</div>
</section>

<section class="shell band" aria-labelledby="room-line">
<div class="sheet">
<blockquote class="quote">
<p id="room-line">The kitchen has no door, so the room hears everything: the pass, the pan, the person who ordered the fish.</p>
</blockquote>
<p class="caps quote-by">From the room, page two</p>
<p><a class="text-link" href="room.html">The room and how it came to be one</a></p>
</div>
</section>`,
});

/* ----- The menu ----- */

pages.push({
  file: "menu.html",
  title: "The menu, Carafe",
  description:
    "The Carafe menu: small plates, plates, sides, desserts and wine by the glass, each item with a description and an illustrative sample price.",
  body: `<section class="shell band opening">
<div>
<p class="caps claret">Written each afternoon</p>
<h1>The menu</h1>
<p class="lede">Short, because the kitchen is small and the fish comes once a day. Half of it changes every week and the rest has been there since we opened.</p>
<div class="menu-note">
<p>Prices are shown in pounds and are illustrative sample values invented for this template. They are not a price list and no figure on this page refers to anything a real kitchen charges.</p>
<p>Everything is cooked to order. If you tell us about an allergy when you sit down, the kitchen will tell you honestly what it can and cannot do.</p>
</div>
</div>
<figure class="opening-figure">
<img src="assets/drawing-dish.svg" width="600" height="600" alt="Line drawing of a plate seen from above: three folded slices, two sprigs of herb, a scatter of capers, a thread of oil and a spoon resting on the rim">
<figcaption class="caps">Drawn for this template. We would rather draw a plate than borrow a photograph of somebody else's.</figcaption>
</figure>
</section>

<section class="shell" aria-label="Filter the menu">
<div class="menu-card menu-bar">
<div class="filter" data-filter role="group" aria-label="Filter the dishes">
<p class="caps">Show</p>
<button class="control" type="button" data-filter-value="all" aria-pressed="true">All dishes</button>
<button class="control" type="button" data-filter-value="vegetarian" aria-pressed="false">Vegetarian</button>
<button class="control" type="button" data-filter-value="vegan" aria-pressed="false">Vegan</button>
</div>
<ul class="key">
<li>veg, made without meat or fish</li>
<li>vegan, made without animal products</li>
<li>125ml is the glass pour</li>
</ul>
<p class="status" id="menu-status" role="status" aria-live="polite"></p>
</div>
</section>

<section class="shell band">
<div class="sheet sheet-framed menu-card">
${course(
  "small",
  "Small plates",
  "To begin with, or four of them instead of a plate.",
  [
    dish(
      "Grilled bread, cultured butter",
      "Sourdough from the bakery on Mill Row, butter churned here on Mondays and salted at the last minute.",
      "4.50",
      "vegetarian",
    ),
    dish(
      "Olives, fennel and orange peel",
      "Warmed in oil with a strip of peel until the whole bar can smell the pan.",
      "5.00",
      "vegan",
    ),
    dish(
      "Anchovies, butter, sea salt",
      "Six of them, a cold slab of butter and bread to put them on. Nothing is cooked.",
      "7.50",
    ),
    dish(
      "Fried artichokes, aioli",
      "Trimmed in the morning, held in lemon water, fried twice and salted hard.",
      "8.00",
      "vegetarian",
    ),
    dish(
      "Whipped cod's roe, radishes",
      "Smoked roe beaten with potato and lemon until it is pale, with radishes to dig it out.",
      "8.50",
    ),
    dish(
      "Pickled mussels on toast",
      "Cooked in cider, dressed with their own liquor, eaten with your fingers.",
      "9.00",
    ),
    dish(
      "Chicory, walnut and blue cheese",
      "Bitter leaves, a sharp dressing and enough cheese to argue with both.",
      "9.50",
      "vegetarian",
    ),
    dish(
      "Potted beef, cornichons",
      "Slow shin under a lid of butter, sharpened with mustard and left in the cold room for a week.",
      "10.00",
    ),
  ],
)}

${course(
  "plates",
  "Plates",
  "One each, or two in the middle for three people who like sharing.",
  [
    dish(
      "Squash, lentils, burnt onion",
      "Roasted until it collapses, on lentils cooked in the same tray, with onion taken further than most kitchens dare.",
      "18.50",
      "vegan",
    ),
    dish(
      "Gnocchi, greens, aged cheese",
      "Rolled at four in the afternoon, cooked at seven, with whatever green is best that week.",
      "19.00",
      "vegetarian",
    ),
    dish(
      "Cured trout, cucumber, dill",
      "Cured for two days with salt and sugar, sliced to order, dressed with cucumber and its own oil.",
      "21.00",
    ),
    dish(
      "Whole plaice, brown butter, capers",
      "One fish, one pan, brown butter and a spoon of capers. It takes twenty minutes and it is worth the wait.",
      "24.00",
    ),
    dish(
      "Hogget shoulder, beans, salsa verde",
      "Cooked overnight, pulled into the beans, cut through with a green sauce made in the afternoon.",
      "26.00",
    ),
    dish(
      "Skirt steak, bone marrow, watercress",
      "Hung five weeks, cooked over a high flame, rested longer than it was cooked.",
      "27.00",
    ),
  ],
)}

${course(
  "sides",
  "Sides",
  "Not strictly necessary. Order them anyway.",
  [
    dish(
      "Green salad, shallot dressing",
      "Three leaves, a sharp dressing, made in the bowl it comes in.",
      "5.50",
      "vegan",
    ),
    dish(
      "Potatoes in dripping",
      "Boiled, crushed, roasted hard in beef dripping and salted twice.",
      "6.00",
    ),
    dish(
      "Buttered greens",
      "Whatever came from the grower on Thursday, with more butter than you would use at home.",
      "6.50",
      "vegetarian",
    ),
  ],
)}

${course(
  "puddings",
  "Desserts",
  "Three that never change and one that does.",
  [
    dish(
      "Burnt custard",
      "Set in the morning, burnt to order, eaten with a teaspoon while it is still warm on top.",
      "8.00",
      "vegetarian",
    ),
    dish(
      "Pear poached in red wine",
      "Poached in the end of a bottle with a strip of peel and a bay leaf.",
      "8.50",
      "vegan",
    ),
    dish(
      "Chocolate and olive oil",
      "Dark, loose, salted, and finished at the table with a spoon of oil.",
      "9.00",
      "vegetarian",
    ),
    dish(
      "Cheese from the counter, oatcakes",
      "Two pieces cut to order, kept at room temperature since lunchtime.",
      "11.00",
    ),
  ],
)}

${course(
  "glass",
  "Wine by the glass",
  "A short version of the list. The whole of it, by the glass and the bottle, is on the wine page.",
  [
    single(
      "Fino en rama, Jerez",
      "Straight from the barrel, unfiltered, cold enough to hurt your teeth.",
      "7.00",
    ),
    single(
      "Xarel-lo, Penedes 2022",
      "Chalky and dry, the glass to start with while you read the rest.",
      "8.50",
    ),
    single(
      "Aligote, Burgundy 2022",
      "Lean, high and a little salty. It goes with the cod's roe.",
      "9.00",
    ),
    single(
      "Gamay, Loire 2023",
      "Served cold, drunk quickly, the house red in all but name.",
      "9.50",
    ),
    single(
      "Riesling, Mosel 2021",
      "Off dry, low in alcohol, and the answer when the table cannot agree.",
      "10.00",
    ),
    single(
      "Trousseau, Jura 2021",
      "Pale, savoury and stubborn. Ask for it with the hogget.",
      "11.00",
    ),
  ],
  `<p class="course-note">Glass pours are 125ml. Prices below are illustrative sample values.</p>\n`,
)}
</div>
<p class="demo-note">This page is set to print: the browser's print command gives a clean copy with the navigation and the filters left off.</p>
</section>`,
});

/* ----- Wine and drinks ----- */

pages.push({
  file: "wine.html",
  title: "Wine and drinks, Carafe",
  description:
    "The Carafe drinks list: wine by the glass and the bottle, sherry, vermouth, beer, cider and drinks without alcohol, with illustrative sample prices.",
  body: `<section class="shell band opening">
<div>
<p class="caps claret">The list</p>
<h1>Wine, and the things we drink when it is not wine</h1>
<p class="lede">Growers we can telephone, bottles we can afford to open, nothing on the list that we would not drink standing up at the end of a shift.</p>
<div class="menu-note">
<p>Prices are shown in pounds and are illustrative sample values invented for this template. They are not a real wine list and no figure on this page refers to anything anyone charges.</p>
<p>Anything on the list can be poured by the glass on the night it is open. The glass pour is 125ml.</p>
</div>
</div>
<figure class="opening-figure">
<img src="assets/drawing-carafe.svg" width="640" height="560" alt="Line drawing of a carafe half full of red wine, a filled wine glass and an empty tumbler standing on a table line">
<figcaption class="caps">Drawn for this template</figcaption>
</figure>
</section>

<section class="shell band">
<div class="sheet sheet-framed menu-card">
${course(
  "sparkling",
  "Sparkling",
  "Two, both made by someone who also drives the tractor.",
  [
    pour("Petillant naturel, Loire 2023", "Chenin blanc, bottled cloudy", "10.00", "44.00"),
    pour("Blanc de blancs, Champagne", "Chardonnay, three years on lees", "16.00", "78.00"),
  ],
  `<p class="pour-head"><span>Wine</span><span>Glass</span><span>Bottle</span></p>\n`,
)}

${course(
  "white",
  "White",
  "Cold, dry, and in one case older than the restaurant.",
  [
    pour("Xarel-lo, Penedes 2022", "Chalk, sea air, no oak", "8.50", "36.00"),
    pour("Aligote, Burgundy 2022", "Lean and salty, a counter wine", "9.00", "40.00"),
    pour("Riesling, Mosel 2021", "Off dry, low in alcohol", "10.00", "44.00"),
    pour("Savagnin, Jura 2020", "Under a veil of yeast, savoury", "12.00", "56.00"),
    pour("Chenin blanc, Loire 2019", "Quince and wool, the oldest bottle here", "13.50", "64.00"),
  ],
  `<p class="pour-head"><span>Wine</span><span>Glass</span><span>Bottle</span></p>\n`,
)}

${course(
  "orange",
  "Skin contact",
  "Made like a red and drunk like a white. Ask before you commit.",
  [
    pour("Rkatsiteli, Kakheti 2021", "Six months on skins in clay", "10.50", "46.00"),
    pour("Pinot grigio, Friuli 2022", "Copper coloured, faintly bitter", "11.00", "48.00"),
    pour("Muscat, Alentejo 2022", "Grapey, dry, unexpectedly firm", "10.00", "44.00"),
  ],
  `<p class="pour-head"><span>Wine</span><span>Glass</span><span>Bottle</span></p>\n`,
)}

${course(
  "red",
  "Red",
  "Most of them are better with twenty minutes in the fridge, whatever you have been told.",
  [
    pour("Gamay, Loire 2023", "Served cold, the house red", "9.50", "42.00"),
    pour("Trousseau, Jura 2021", "Pale, savoury, stubborn", "11.00", "50.00"),
    pour("Frappato, Sicily 2022", "Light, red fruited, a little wild", "10.50", "46.00"),
    pour("Mencia, Ribeira Sacra 2021", "Slate and violets, grown on a cliff", "12.00", "54.00"),
    pour("Nebbiolo, Alto Piemonte 2019", "Tannin, tar and patience", "14.00", "68.00"),
  ],
  `<p class="pour-head"><span>Wine</span><span>Glass</span><span>Bottle</span></p>\n`,
)}

${course(
  "fortified",
  "Sherry and vermouth",
  "By the glass only, poured from bottles we open every day.",
  [
    single("Fino en rama, Jerez", "Unfiltered, bone dry, straight from the cold room.", "7.00"),
    single("Amontillado, Sanlucar", "Nutty and dry, the glass to end on.", "8.00"),
    single("Vermouth on ice, red", "Made twenty miles away, with a strip of orange.", "6.50"),
  ],
)}

${course(
  "beer",
  "Beer and cider",
  "Three, all from within an hour of here.",
  [
    single("Pale ale, on tap", "Half a pint or a pint, poured soft.", "5.50"),
    single("Dark mild, bottled", "Brown, gentle and lower in alcohol than it looks.", "5.00"),
    single("Dry cider, bottled", "Still, cloudy and sharp enough to wake you up.", "6.00"),
  ],
)}

${course(
  "soft",
  "Without alcohol",
  "Made with the same attention as the rest, and not an afterthought.",
  [
    single("Verjus and soda", "The juice of unripe grapes, long, sharp and cold.", "4.50"),
    single("House lemonade", "Pressed in the afternoon, barely sweet.", "4.00"),
    single("Coffee", "One origin, ground to order, served black or with milk.", "3.50"),
  ],
)}
</div>
<p class="demo-note">The bottle prices sit beside the glass prices so a table can see both at once. Every figure on this page is an invented sample value.</p>
</section>`,
});

/* ----- The room ----- */

pages.push({
  file: "room.html",
  title: "The room, Carafe",
  description:
    "How the Carafe room works: a counter of nine stools, four tables, an open kitchen, and the people who run it. Illustrative content with a drawn plan.",
  body: `<section class="shell band narrow">
<p class="caps claret">Since the spring</p>
<h1>The room</h1>
<p class="lede">One room, one counter, one kitchen with no door on it. Everything about the way we serve follows from those three facts.</p>
</section>

<section class="shell band visit-grid" aria-labelledby="plan-title">
<div class="prose">
<h2 id="plan-title">What is where</h2>
<p>The building was a haberdasher's for sixty years and a launderette for eleven. When we took it the floor was tiled in two different patterns, which we kept, so the join runs under the third table and nobody notices until they do.</p>
<p>The counter is one piece of ash, nine stools long, cut and joined by a man in the next street who told us it would move for two years. It has. The kitchen behind it is four metres wide. That is the reason the menu is short, and it is also the reason the room smells of the pan by seven.</p>
<p>There are four tables. Three of them seat two, the round one seats four, and if you are six we will put two together and it will be tight and loud and probably the best table in the room.</p>
<p>We stop the music at ten, because by then the room makes enough noise on its own.</p>
</div>
<figure class="plan-figure">
<img src="assets/plan-room.svg" width="1000" height="660" alt="Plan drawing of the room: a long counter with nine stools, four tables with chairs, a hatched kitchen behind a red pass, a washroom and a door on to the street">
<figcaption class="caps">The plan, drawn for this template</figcaption>
<ol class="keyed">
<li>The counter, nine stools, never booked</li>
<li>The pass, where the kitchen hands the plates over</li>
<li>The kitchen, four metres of it</li>
<li>Four tables, three for two and one for four</li>
<li>The washroom, one, on the flat</li>
<li>The stair down to the cellar, staff only</li>
</ol>
</figure>
</section>

<div class="shell">
${sprig}
</div>

<section class="shell band" aria-labelledby="people-title">
<div class="section-head">
<h2 id="people-title">Who is here</h2>
<p class="caps">Three of us, most nights</p>
</div>
<ul class="people">
<li>
<span class="name">Nell Abara</span>
<span class="role caps">Cooks</span>
<span class="line">Writes the menu at four in the afternoon and will not tell anyone what is on it until it is finished.</span>
</li>
<li>
<span class="name">Ivo Petran</span>
<span class="role caps">Pours</span>
<span class="line">Buys the wine, opens too many bottles, and can be talked into pouring you a taste of anything.</span>
</li>
<li>
<span class="name">Rae Sandoval</span>
<span class="role caps">Runs the room</span>
<span class="line">Knows who is waiting, who is celebrating and who wants to be left alone with a book.</span>
</li>
</ul>
<p class="demo-note">These people are invented for this template, as is everything else on this page.</p>
</section>

<section class="shell band" aria-labelledby="how-title">
<div class="sheet menu-card">
<h2 id="how-title">How a night goes</h2>
<div class="prose">
<p>The stools fill first, usually by half past six, and they turn over twice. The tables are booked and are yours until you leave. If the room is full we take a name and a telephone number and call when a stool comes free, which is usually sooner than anyone expects.</p>
<p>Large groups are hard here. Six is the most we can do, and only at the two tables nearest the window. We would rather say so than squeeze you in and spend the evening apologising.</p>
</div>
<p><a class="text-link" href="visit.html#book">Book a table, or ask us a question</a></p>
</div>
</section>`,
});

/* ----- Visit ----- */

pages.push({
  file: "visit.html",
  title: "Visit, hours and booking, Carafe",
  description:
    "Where Carafe is, how to get there, the kitchen and bar hours set out apart, the day we close, what happens on public holidays, and a booking enquiry that is not connected to any service.",
  body: `<section class="shell band narrow">
<p class="caps claret">Fell Street at Bower Lane</p>
<h1>Visit</h1>
<p class="lede">Ten minutes from the station on foot, on the corner with the green door. The stools are first come. The tables take an email.</p>
<p class="today-line" data-today-line>The hours are set out below, kitchen and bar apart.</p>
</section>

<section class="shell band visit-grid" aria-labelledby="where-title">
<div>
<h2 id="where-title">Getting here</h2>
<address class="address">
<p>41 Fell Street</p>
<p>at the corner of Bower Lane</p>
<p><a class="text-link" href="tel:+441632960114">${PHONE}</a></p>
</address>
<ol class="keyed">
<li>Carafe, on the corner, green door and one window</li>
<li>The station, about eight minutes on foot along Fell Street</li>
<li>The bus stop on Fell Street, four routes, both directions</li>
<li>The park, where the market sets up on a Saturday morning</li>
</ol>
<p class="caps">Bicycles</p>
<p>There are hoops outside the park gate. The lamp post by the door is not one, whatever the last person to lock a bicycle to it believed.</p>
</div>
<figure class="map-figure">
<img src="assets/map-corner.svg" width="1000" height="690" alt="Drawn map of the corner: Fell Street crossing Bower Lane, the restaurant marked as a filled block on the corner, the railway and station to the north, a bus stop and a hatched park to the west">
<figcaption class="caps">Drawn for this template. The bar at the foot of the drawing is about one hundred metres.</figcaption>
</figure>
</section>

<div class="shell">
<hr class="rule-double">
</div>

<section class="shell band" aria-labelledby="hours-title">
<div class="section-head">
<h2 id="hours-title">Hours</h2>
<p class="caps">The kitchen and the bar keep different time</p>
</div>
<div class="services">
<div class="service" data-service="kitchen">
<h3>Kitchen</h3>
<ul class="hours-list">
${kitchenHours.join("\n")}
</ul>
<p class="closed-line">Closed all day on Monday</p>
<p class="holiday-note">Last orders are half an hour before the kitchen closes, and the pass stops for good when it stops. If you are running late, telephone rather than hope.</p>
</div>
<div class="service" data-service="bar">
<h3>Bar</h3>
<ul class="hours-list">
${barHours.join("\n")}
</ul>
<p class="closed-line">Closed all day on Monday</p>
<p class="holiday-note">The bar keeps going after the kitchen stops, with cheese, olives and whatever is open. On Friday and Saturday the last drink is poured at midnight.</p>
</div>
</div>
<div class="menu-note">
<p>Public holidays: we open on most of them and keep Sunday hours, and we close for the week between Christmas and the new year. A holiday that falls on a Monday is still a Monday, so we are closed. The answerphone carries the current message.</p>
</div>
</section>

<section class="shell band" id="book" aria-labelledby="book-title">
<div class="sheet sheet-framed">
<p class="caps claret">Booking</p>
<h2 id="book-title">Ask for a table</h2>
<div class="notice">
<p>This template is not connected to a reservation system. There is no booking service behind this page, nothing is stored and nothing is sent.</p>
<p>The honest version of a booking page is an email address and a person who reads it.</p>
</div>
<p class="lede">Write to us with a day, a time and a number of people. We answer every enquiry, usually the same day, and we say no when the room is full rather than keeping you waiting.</p>
<p><a class="button button-solid" href="mailto:${MAIL}?subject=Table%20enquiry">Email ${MAIL}</a></p>
<p class="caps">Or fill this in and copy it into an email</p>
<form class="enquiry" data-enquiry novalidate>
<div class="fields-two">
<div class="field">
<label for="enquiry-name">Your name</label>
<input id="enquiry-name" name="name" type="text" autocomplete="name">
</div>
<div class="field">
<label for="enquiry-email">Your email</label>
<input id="enquiry-email" name="email" type="email" autocomplete="email">
</div>
<div class="field">
<label for="enquiry-date">Day</label>
<input id="enquiry-date" name="date" type="date">
</div>
<div class="field">
<label for="enquiry-people">How many of you</label>
<input id="enquiry-people" name="people" type="number" min="1" max="6" step="1">
</div>
</div>
<div class="field">
<label for="enquiry-note">Anything we should know</label>
<textarea id="enquiry-note" name="note" rows="4"></textarea>
</div>
<div class="enquiry-foot">
<button class="button button-solid" type="submit">Send this enquiry</button>
<p class="caps">Nothing leaves this page</p>
</div>
<p class="status" id="enquiry-status" role="status" aria-live="polite"></p>
</form>
</div>
</section>

<section class="shell band questions" aria-labelledby="questions-title">
<h2 id="questions-title">Before you come</h2>
<details>
<summary>Allergies and what the kitchen can do</summary>
<p>Tell us when you book and again when you sit down. The kitchen is four metres wide and everything is cooked in it, so we will tell you plainly what we can change and what we cannot.</p>
</details>
<details>
<summary>Groups</summary>
<p>Six is the most we can seat together, at the two tables by the window. Larger than that and we will happily point you somewhere with a bigger room.</p>
</details>
<details>
<summary>Children and dogs</summary>
<p>Both are welcome at the tables, before nine. The stools are high and the counter is hot on the kitchen side, so they are not the place for either.</p>
</details>
<details>
<summary>Getting in</summary>
<p>There is one step at the door, about fifteen centimetres, and the washroom is on the flat once you are inside. The counter is high. Say the word when you book and we will keep a table rather than a stool.</p>
</details>
</section>`,
});

/* ----- Credits ----- */

pages.push({
  file: "credits.html",
  title: "Credits and source, Carafe",
  description:
    "What Carafe was adapted from, what was reused, the typefaces and their licences, why there are no photographs, and where to get the complete source.",
  body: `<section class="shell band narrow">
<p class="caps claret">Provenance</p>
<h1>Credits and source</h1>
<p class="lede">This edition was authored for Plotform on an open source foundation. Here is what came from where, and what was invented.</p>
</section>

<section class="shell band narrow prose" aria-labelledby="adaptation-title">
<h2 id="adaptation-title">The adaptation</h2>
<p>Adapted from AstroWind by onWidget, MIT licensed, pinned at commit 14e1a691f80548dcc36370847b1a02c0d0b12821. The complete pinned upstream is archived inside the source download, and its licence is kept in the licenses folder.</p>
<p>What was reused: the multi page static site architecture with a shared header and footer; the single custom property token block that CustomStyles.astro sets on the root element, rewritten here as the token block at the top of style.css; the header pattern from Header.astro, one button that flips aria-expanded and an open class for narrow screens; the native details accordion from FAQs.astro; the footer with link columns above a secondary line; and the shape of the form in Form.astro, which posts to nothing.</p>
<p>What was not reused: Astro, Tailwind, the typography plugin and the npm toolchain; the blog, the search and the feed; the dark mode switch; the icon set; the hosting configuration; every upstream photograph; and every line of upstream copy.</p>
<p>The new work in this edition is licensed MIT, and the licence sits beside this page.</p>
</section>

<section class="shell band narrow prose" aria-labelledby="type-title">
<h2 id="type-title">Typefaces</h2>
<p>Playfair Display by the Playfair Display project authors, led by Claus Eggers Sørensen, SIL Open Font License 1.1, used for the wordmark and the headings. Source Serif 4 by Frank Griesshammer for Adobe, SIL Open Font License 1.1, used for everything that has to be read, including every price and every time on the site, which are set with tabular figures so the columns line up.</p>
<p>Both are bundled with the template as woff2 files and both licences travel with them. Nothing is loaded from a font service, and there is no monospace anywhere on the site.</p>
</section>

<section class="shell band narrow prose" aria-labelledby="pictures-title">
<h2 id="pictures-title">Why there are no photographs</h2>
<p>A restaurant template that depends on photographs of food is useless until someone has paid a photographer, and stock pictures of other kitchens are worse than none. So this edition carries no photographs at all.</p>
<p>The identity is carried by the type, the paper colour, the rules and five drawings made for this template: the counter seen from the door, a plate from above, a carafe and two glasses, the plan of the room and the map of the corner. Every one of them is an SVG drawn for this edition. The paper texture is made from CSS gradients. No image here was generated, and none came from a reference site.</p>
</section>

<section class="shell band narrow prose" aria-labelledby="invented-title">
<h2 id="invented-title">The invented content, and the prices</h2>
<p>Carafe is not a real restaurant. The dishes, the wines, the people, the street, the telephone number and the email address were all invented for this template.</p>
<p>The prices are illustrative sample values. They exist so that the menu can be designed properly, with leaders, aligned columns and tabular figures, and the menu page says so at the top. They are not a price list, they are not an estimate of what anything costs, and they should be replaced before this template is published.</p>
<p>The booking form is not connected to any service. It has no action, it sends nothing, it stores nothing, and submitting it says exactly that.</p>
</section>

<section class="shell band narrow" aria-labelledby="source-title">
<div class="sheet">
<h2 id="source-title">The source</h2>
<p>The complete adapted source ships beside the built pages, with the licences and the provenance file.</p>
<ul class="foot-list">
<li><a href="source.zip">Download the complete source archive</a></li>
<li><a href="SOURCE.json">SOURCE.json, the provenance record</a></li>
<li><a href="VENDOR-NOTES.md">Vendor notes</a></li>
<li><a href="licenses/astrowind-MIT.md">AstroWind, MIT</a></li>
<li><a href="licenses/playfair-display-OFL.txt">Playfair Display, OFL 1.1</a></li>
<li><a href="licenses/source-serif-4-OFL.txt">Source Serif 4, OFL 1.1</a></li>
<li><a href="LICENSE">This edition, MIT</a></li>
</ul>
</div>
</section>`,
});

/* ---------- write ---------- */

mkdirSync(out, { recursive: true });
for (const spec of pages) {
  writeFileSync(join(out, spec.file), page(spec), "utf8");
  console.log("wrote " + join(out, spec.file));
}
