/* Plinth, a Plotform studio edition.
   Draws every graphic in the edition: five abstract marks and one floor plan.
   Plain Node, no dependencies: `node tools/make-marks.mjs` writes into assets/.
   Nothing here traces a photograph or a reference site; every shape is geometry
   written out by hand, so the whole identity stays editable vector art. */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "assets");
mkdirSync(out, { recursive: true });

const ink = "#16150f";
const paper = "#f3f0e9";
const vermilion = "#d93a1e";
const ash = "#d5cfc0";

const round = (n) => Math.round(n * 100) / 100;
const svg = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}">\n${body}\n</svg>\n`;
const write = (name, content) => {
  writeFileSync(join(out, name), content);
  console.log("wrote assets/" + name);
};

/* 1. Hero composition: a quarter disc, a ruled field and one long diagonal. */
{
  const lines = [];
  for (let i = 0; i < 26; i++) {
    const x = round(60 + i * i * 1.15 + i * 8);
    if (x > 700) break;
    lines.push(
      `<line x1="${x}" y1="70" x2="${x}" y2="${round(70 + 300 - i * 6)}" stroke="${ink}" stroke-width="2"/>`,
    );
  }
  const body = [
    `<rect x="0" y="0" width="1200" height="560" fill="${paper}"/>`,
    `<rect x="610" y="46" width="470" height="320" fill="${ash}" transform="rotate(-3.5 845 206)"/>`,
    `<path d="M1200 560 L1200 140 A420 420 0 0 0 780 560 Z" fill="${vermilion}"/>`,
    lines.join("\n"),
    `<line x1="0" y1="470" x2="1200" y2="196" stroke="${ink}" stroke-width="3"/>`,
    `<circle cx="352" cy="404" r="86" fill="none" stroke="${ink}" stroke-width="3"/>`,
    `<rect x="60" y="480" width="232" height="18" fill="${ink}"/>`,
  ].join("\n");
  write(
    "mark-plinth.svg",
    svg(
      1200,
      560,
      body,
      "Abstract composition: a ruled field of vertical strokes, an outlined circle, a tilted grey panel and a large red quarter disc",
    ),
  );
}

/* 2. Field Notation: a tick grid with one row carried over in red. */
{
  const parts = [`<rect x="0" y="0" width="600" height="600" fill="${paper}"/>`];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const x = round(70 + col * 52);
      const y = round(70 + row * 52);
      const length = row === 4 ? 30 : 18 + ((col * 3) % 14);
      const colour = row === 4 ? vermilion : ink;
      parts.push(
        `<line x1="${x}" y1="${y}" x2="${x}" y2="${round(y + length)}" stroke="${colour}" stroke-width="${row === 4 ? 4 : 2}"/>`,
      );
    }
  }
  parts.push(
    `<circle cx="470" cy="450" r="150" fill="none" stroke="${ink}" stroke-width="3"/>`,
    `<rect x="0" y="540" width="600" height="60" fill="${ink}"/>`,
  );
  write(
    "mark-field-notation.svg",
    svg(
      600,
      600,
      parts.join("\n"),
      "Abstract mark: a grid of short strokes with one red row, an outlined circle and a solid bar across the foot",
    ),
  );
}

/* 3. Slow Signals: rings spreading from a corner. */
{
  const parts = [
    `<rect x="0" y="0" width="600" height="600" fill="${ash}"/>`,
    `<rect x="0" y="0" width="600" height="300" fill="${paper}"/>`,
  ];
  for (let i = 1; i <= 13; i++) {
    const r = round(i * i * 2.6 + i * 22);
    if (r > 720) break;
    parts.push(
      `<circle cx="60" cy="560" r="${r}" fill="none" stroke="${i === 6 ? vermilion : ink}" stroke-width="${i === 6 ? 6 : 2}"/>`,
    );
  }
  parts.push(
    `<rect x="392" y="0" width="16" height="600" fill="${ink}"/>`,
    `<path d="M600 0 L600 170 L430 0 Z" fill="${vermilion}"/>`,
  );
  write(
    "mark-slow-signals.svg",
    svg(
      600,
      600,
      parts.join("\n"),
      "Abstract mark: rings spreading from the lower left corner, one of them red, cut by a vertical bar and a red triangle",
    ),
  );
}

/* 4. A Line Repeated: rules that tighten, then a block that stops them. */
{
  const parts = [`<rect x="0" y="0" width="600" height="600" fill="${paper}"/>`];
  let y = 60;
  let gap = 44;
  while (y < 560) {
    parts.push(
      `<line x1="40" y1="${round(y)}" x2="560" y2="${round(y)}" stroke="${ink}" stroke-width="2"/>`,
    );
    y += gap;
    gap = Math.max(11, gap * 0.9);
  }
  parts.push(
    `<rect x="300" y="150" width="260" height="210" fill="${paper}"/>`,
    `<rect x="330" y="180" width="200" height="150" fill="${vermilion}"/>`,
    `<line x1="40" y1="112" x2="560" y2="112" stroke="${vermilion}" stroke-width="8"/>`,
  );
  write(
    "mark-a-line-repeated.svg",
    svg(
      600,
      600,
      parts.join("\n"),
      "Abstract mark: horizontal rules that tighten towards the foot, one thick red rule near the top and a red rectangle held clear of them",
    ),
  );
}

/* 5. Ground Plane: stacked planes with hatching. */
{
  const parts = [`<rect x="0" y="0" width="600" height="600" fill="${paper}"/>`];
  for (let i = 0; i < 5; i++) {
    const y = 120 + i * 82;
    const x = 70 + i * 34;
    parts.push(
      `<path d="M${x} ${y} L${round(x + 330)} ${round(y - 56)} L${round(x + 330)} ${round(y + 26)} L${x} ${round(y + 82)} Z" fill="${i === 2 ? vermilion : "none"}" stroke="${ink}" stroke-width="2"/>`,
    );
  }
  for (let i = 0; i < 22; i++) {
    const x = round(40 + i * 24);
    parts.push(
      `<line x1="${x}" y1="560" x2="${round(x + 40)}" y2="520" stroke="${ink}" stroke-width="1.5"/>`,
    );
  }
  parts.push(`<rect x="0" y="0" width="600" height="26" fill="${ink}"/>`);
  write(
    "mark-ground-plane.svg",
    svg(
      600,
      600,
      parts.join("\n"),
      "Abstract mark: five stacked planes seen at an angle with the middle one filled red, above a band of diagonal hatching",
    ),
  );
}

/* 6. Floor plan: six spaces, an entrance gap, stairs and a hatched courtyard.
   Deliberately text free, so the room numbers stay editable HTML on the page. */
{
  const wall = 6;
  const room = (x, y, w, h, fill) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${ink}" stroke-width="${wall}"/>`;
  const parts = [
    `<rect x="0" y="0" width="1000" height="640" fill="${paper}"/>`,
    room(40, 40, 310, 280, paper),
    room(350, 40, 310, 280, paper),
    room(660, 40, 300, 280, paper),
    room(40, 320, 310, 280, paper),
    room(350, 320, 310, 280, paper),
    room(660, 320, 300, 280, paper),
  ];
  // Courtyard hatching, lower left, clipped to the room it belongs to.
  parts.push(`<g clip-path="url(#court)">`);
  for (let i = -12; i < 24; i++) {
    const x = 40 + i * 26;
    parts.push(
      `<line x1="${x}" y1="600" x2="${round(x + 280)}" y2="320" stroke="${ink}" stroke-width="1.5" opacity="0.5"/>`,
    );
  }
  parts.push(`</g>`);
  // Stairs in the middle lower space.
  for (let i = 0; i < 9; i++) {
    const y = round(370 + i * 22);
    parts.push(
      `<line x1="395" y1="${y}" x2="545" y2="${y}" stroke="${ink}" stroke-width="2"/>`,
    );
  }
  parts.push(
    `<rect x="393" y="368" width="154" height="180" fill="none" stroke="${ink}" stroke-width="3"/>`,
    // Door openings: paper gaps painted over the walls.
    `<rect x="160" y="${320 - wall / 2}" width="86" height="${wall}" fill="${paper}"/>`,
    `<rect x="${350 - wall / 2}" y="130" width="${wall}" height="86" fill="${paper}"/>`,
    `<rect x="${660 - wall / 2}" y="130" width="${wall}" height="86" fill="${paper}"/>`,
    `<rect x="${660 - wall / 2}" y="430" width="${wall}" height="86" fill="${paper}"/>`,
    `<rect x="460" y="${320 - wall / 2}" width="86" height="${wall}" fill="${paper}"/>`,
    // Entrance: a gap in the south wall with a red threshold outside it.
    `<rect x="120" y="${600 - wall / 2}" width="110" height="${wall}" fill="${paper}"/>`,
    `<rect x="120" y="604" width="110" height="16" fill="${vermilion}"/>`,
    `<line x1="175" y1="620" x2="175" y2="638" stroke="${ink}" stroke-width="3"/>`,
  );
  const defs = `<defs><clipPath id="court"><rect x="43" y="323" width="304" height="274"/></clipPath></defs>`;
  write(
    "floor-plan.svg",
    svg(
      1000,
      640,
      defs + "\n" + parts.join("\n"),
      "Floor plan drawing: six rectangular spaces around a hatched courtyard, a stair run in the centre and a red threshold at the entrance",
    ),
  );
}
