/*
 * Fettle, a Plotform studio edition.
 *
 * Writes the people. Every figure on this site is an Open Peeps drawing by
 * Pablo Stanley (https://www.openpeeps.com), a hand drawn illustration library
 * released into the public domain under CC0: the site states "The library is
 * in the public domain under the CC0 License", so no attribution is required.
 * It is credited here and on credits.html anyway, because it deserves to be.
 * That library is how this edition shows a room full of people without a
 * single photograph.
 *
 * The machine readable copy of the artwork is react-peeps 0.1.10 by
 * Emre Cakir (MIT, notice at licenses/react-peeps-MIT.txt), archived at
 * upstream/react-peeps-0.1.10.tgz. This script renders its components once,
 * at build time, into plain static SVG files in assets/. The pages themselves
 * ship no React and no drawing code: they load these files like any image.
 *
 * Run from the edition folder:  node tools/make-people.mjs
 * It needs `react` and `react-dom` resolvable (they are devDependencies of the
 * Plotform repository this edition lives in) and `tar` on the path. The
 * produced SVG files are committed, so a person editing this template never
 * has to run it.
 */
import { writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const out = join(root, "assets");
mkdirSync(out, { recursive: true });

/* Unpack the pinned react-peeps tarball into a scratch folder. It has to sit
   inside this repository rather than in the system temporary directory, so
   that the package's own `require("react")` resolves against the repository's
   node_modules. The folder is removed again at the end of this script. */
const work = join(here, ".open-peeps-build");
if (existsSync(work)) rmSync(work, { recursive: true, force: true });
mkdirSync(work, { recursive: true });
execFileSync("tar", ["xzf", join(root, "upstream", "react-peeps-0.1.10.tgz"), "-C", work]);

const require = createRequire(import.meta.url);
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const peeps = require(join(work, "package", "lib", "peeps", "index.js"));
const Peep = peeps.default;

const ink = "#26221d";

/* Rounding the path data to one decimal halves the file size and moves no
   stroke anywhere a person could see. */
const trim = (svg) => svg.replace(/-?\d+\.\d{2,}/g, (n) => String(Math.round(Number(n) * 10) / 10));

/* Rough bounding box from the path coordinates, so each figure gets a viewBox
   cut to its own drawing instead of the library's 850 by 1200 bust window. */
function bounds(markup) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let tx = 0;
  let ty = 0;
  for (const chunk of markup.split(/(<g transform="translate\([^"]+\)">)/)) {
    const move = chunk.match(/^<g transform="translate\((-?[\d.]+) (-?[\d.]+)\)">$/);
    if (move) {
      tx = Number(move[1]);
      ty = Number(move[2]);
      continue;
    }
    for (const attr of chunk.matchAll(/ d="([^"]+)"/g)) {
      const numbers = attr[1].match(/-?\d+(\.\d+)?/g) || [];
      for (let i = 0; i < numbers.length - 1; i += 2) {
        const x = Number(numbers[i]) + tx;
        const y = Number(numbers[i + 1]) + ty;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY };
}

/* `crop: "bust"` keeps the head and shoulders; "full" keeps the whole figure. */
function person(file, options, label, crop = "bust") {
  const props = {
    strokeColor: ink,
    backgroundColor: options.tone,
    viewBox: { x: "0", y: "0", width: "100", height: "100" },
    body: options.body,
    face: options.face,
    hair: options.hair,
    facialHair: options.facialHair || "None",
    accessory: options.accessory || "None",
  };
  const markup = renderToStaticMarkup(React.createElement(Peep, props));
  const pad = 40;
  let x;
  let y;
  let width;
  let height;
  if (crop === "bust") {
    /* Every head in the library sits at the same place, so a portrait is a
       fixed window rather than a measurement: head, shoulders and a little
       air, wide enough that no folded arm is cut off at the edge. */
    x = 80;
    y = -70;
    width = 700;
    height = 720;
  } else {
    const box = bounds(markup);
    x = Math.round(box.minX - pad);
    y = Math.round(box.minY - pad);
    width = Math.round(box.maxX - box.minX + pad * 2);
    height = Math.round(box.maxY - box.minY + pad * 2);
  }
  const inner = markup.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${height}" ` +
    `width="${width}" height="${height}" role="img" aria-label="${label}">\n${inner}\n</svg>\n`;
  const trimmed = trim(svg);
  writeFileSync(join(out, file), trimmed);
  console.log(`wrote assets/${file} (${trimmed.length} bytes)`);
}

/* The tutors. Names, subjects and the descriptions below are illustrative.
   Skin and clothing tones are set here rather than in CSS, because the library
   fills the pieces with one colour per figure. */
person(
  "person-nour.svg",
  { body: "ShirtBW", face: "Smile", hair: "Hijab", tone: "#e8c39a" },
  "A hand drawn figure in a headscarf, smiling, drawn in the Open Peeps style",
);
person(
  "person-wes.svg",
  { body: "BlazerBW", face: "Cheeky", hair: "ShortMessy", facialHair: "Full", tone: "#f0dcc4" },
  "A hand drawn figure with a full beard and untidy hair, drawn in the Open Peeps style",
);
person(
  "person-ada.svg",
  { body: "ShirtWB", face: "SmileBig", hair: "BunCurly", tone: "#c68b5e" },
  "A hand drawn figure with curly hair tied in a bun, laughing, drawn in the Open Peeps style",
);
person(
  "person-ivor.svg",
  { body: "BlazerWB", face: "OldAged", hair: "GrayShort", accessory: "GlassRound", tone: "#f0dcc4" },
  "A hand drawn older figure in round glasses, drawn in the Open Peeps style",
);
person(
  "person-fen.svg",
  { body: "CrossedArmsBW", face: "Explaining", hair: "CornRows", tone: "#8d5a3b" },
  "A hand drawn figure with cornrows and folded arms, mid explanation, drawn in the Open Peeps style",
);
person(
  "person-tam.svg",
  { body: "ShirtPantsBW", face: "Calm", hair: "ShortVolumed", accessory: "GlassRoundThick", tone: "#e8c39a" },
  "A hand drawn figure in thick round glasses, calm, drawn in the Open Peeps style",
);
person(
  "person-jo.svg",
  { body: "PolkaDots", face: "Cute", hair: "Bangs", tone: "#f0dcc4" },
  "A hand drawn figure with a fringe in a spotted top, drawn in the Open Peeps style",
);
person(
  "person-bram.svg",
  { body: "ShirtBW", face: "Serious", hair: "Bald", facialHair: "Chin", tone: "#c68b5e" },
  "A hand drawn figure with a shaved head and a chin beard, drawn in the Open Peeps style",
);

/* Three whole figures for the class and the space. */
person(
  "figure-bench.svg",
  { body: "RestingWB", face: "Calm", hair: "MediumBangs", tone: "#e8c39a" },
  "A hand drawn figure standing with their weight on one leg, drawn in the Open Peeps style",
  "full",
);
person(
  "figure-wheels.svg",
  { body: "WheelChair", face: "SmileTeeth", hair: "Twists", tone: "#8d5a3b" },
  "A hand drawn figure using a wheelchair, smiling, drawn in the Open Peeps style",
  "full",
);
person(
  "figure-showing.svg",
  { body: "PointingFingerWB", face: "Explaining", hair: "ShortCurly", tone: "#f0dcc4" },
  "A hand drawn figure pointing at something while explaining it, drawn in the Open Peeps style",
  "full",
);

rmSync(work, { recursive: true, force: true });
console.log("done");
