/*
 * Overtone, a Plotform studio edition.
 *
 * Draws every SVG the edition ships: twelve catalogue covers, a spectrum band
 * and a signal-path diagram. Everything is geometry written here, so there is
 * no generated imagery and no asset taken from another site.
 *
 * Run from the edition folder:  node tools/make-art.mjs
 * Writes into ./assets.
 */
import { mkdir, writeFile } from "node:fs/promises";

const OUT = new URL("../assets/", import.meta.url);

/* A tiny deterministic generator, so a rebuild produces identical files. */
function seeded(seed) {
  let state = seed >>> 0 || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

const round = (n) => Math.round(n * 100) / 100;

/* Flat colour fields. Each pair is a ground and the ink drawn on it. */
const FIELDS = {
  acid: { field: "#d9ff3f", ink: "#0a0b0c" },
  orange: { field: "#ff5b2e", ink: "#140503" },
  blue: { field: "#1a2ef0", ink: "#eef0ff" },
  bone: { field: "#ece5d8", ink: "#101112" },
  carbon: { field: "#101114", ink: "#d9ff3f" },
  magenta: { field: "#ff2f87", ink: "#150109" },
  teal: { field: "#12c3b0", ink: "#04120f" },
  violet: { field: "#7b4bff", ink: "#f2efff" },
  slate: { field: "#2b303a", ink: "#ece5d8" },
  ember: { field: "#c3341b", ink: "#ffe9d6" },
  forest: { field: "#123f31", ink: "#e8f3ec" },
  ash: { field: "#5c6068", ink: "#0a0b0c" },
};

const S = 600; /* every cover is square */

/* Each construction returns the drawn shapes for one cover. */
const CONSTRUCTIONS = {
  /* Squares rotated around one corner, so the field tiles into itself. */
  tessellate(ink, rand) {
    const parts = [];
    for (let i = 0; i < 9; i += 1) {
      const size = 420 - i * 42;
      const angle = round(i * 7.5);
      parts.push(
        `<rect x="${round(300 - size / 2)}" y="${round(300 - size / 2)}" width="${size}" height="${size}" fill="none" stroke="${ink}" stroke-width="${i % 3 === 0 ? 8 : 2}" transform="rotate(${angle} 300 300)"/>`,
      );
    }
    parts.push(`<circle cx="300" cy="300" r="${round(18 + rand() * 10)}" fill="${ink}"/>`);
    return parts;
  },

  /* A stack of sine lines that slowly falls out of phase. */
  standing(ink) {
    const parts = [];
    for (let row = 0; row < 14; row += 1) {
      const y = 80 + row * 32;
      const amplitude = 10 + row * 2.2;
      const phase = row * 0.42;
      let d = "";
      for (let x = 60; x <= 540; x += 8) {
        const value = y + Math.sin((x / 60) + phase) * amplitude;
        d += `${d ? "L" : "M"}${round(x)} ${round(value)}`;
      }
      parts.push(`<path d="${d}" fill="none" stroke="${ink}" stroke-width="${row % 4 === 0 ? 9 : 3.5}" stroke-linecap="round"/>`);
    }
    return parts;
  },

  /* Vertical bars of varying width, read as a spectrum frozen mid-frame. */
  bars(ink, rand) {
    const parts = [];
    let x = 70;
    while (x < 530) {
      const width = 6 + Math.floor(rand() * 26);
      const height = 90 + rand() * 360;
      parts.push(
        `<rect x="${round(x)}" y="${round(480 - height)}" width="${width}" height="${round(height)}" fill="${ink}"/>`,
      );
      x += width + 6 + Math.floor(rand() * 14);
    }
    parts.push(`<rect x="70" y="486" width="460" height="6" fill="${ink}"/>`);
    return parts;
  },

  /* Rings at an uneven rhythm, cropped by the frame. */
  rings(ink, rand) {
    const parts = [];
    let radius = 40;
    let i = 0;
    while (radius < 330) {
      parts.push(
        `<circle cx="${round(240 + rand() * 30)}" cy="${round(300 - i * 4)}" r="${round(radius)}" fill="none" stroke="${ink}" stroke-width="${i % 3 === 0 ? 7 : 2}"/>`,
      );
      radius += 22 + rand() * 26;
      i += 1;
    }
    return parts;
  },

  /* A hatch with one wide silence cut through it. */
  hatch(ink, rand) {
    const parts = [
      `<defs><clipPath id="frame"><rect x="60" y="60" width="480" height="480"/></clipPath></defs>`,
    ];
    const lines = [];
    for (let i = -20; i < 40; i += 1) {
      const x = i * 26;
      lines.push(
        `<line x1="${round(x)}" y1="0" x2="${round(x + 600)}" y2="600" stroke="${ink}" stroke-width="${i % 5 === 0 ? 9 : 3}"/>`,
      );
    }
    parts.push(`<g clip-path="url(#frame)">${lines.join("")}</g>`);
    const gap = round(200 + rand() * 60);
    parts.push(`<rect x="60" y="${gap}" width="480" height="76" class="cut"/>`);
    return parts;
  },

  /* A stair of blocks, each step held a beat longer. */
  steps(ink) {
    const parts = [`<rect x="70" y="70" width="10" height="460" fill="${ink}"/>`];
    for (let i = 0; i < 9; i += 1) {
      const width = 70 + i * 42;
      const y = 84 + i * 50;
      parts.push(`<rect x="80" y="${round(y)}" width="${round(width)}" height="${i % 2 ? 38 : 26}" fill="${ink}"/>`);
      parts.push(
        `<rect x="${round(80 + width + 12)}" y="${round(y)}" width="${round(Math.max(8, 420 - width))}" height="${i % 2 ? 38 : 26}" fill="none" stroke="${ink}" stroke-width="3"/>`,
      );
    }
    return parts;
  },

  /* Spokes from one off-centre point. */
  spokes(ink, rand) {
    const parts = [];
    const cx = 300;
    const cy = 320;
    for (let i = 0; i < 26; i += 1) {
      const angle = (i / 26) * Math.PI * 2 + rand() * 0.04;
      const length = 130 + rand() * 180;
      parts.push(
        `<line x1="${cx}" y1="${cy}" x2="${round(cx + Math.cos(angle) * length)}" y2="${round(cy + Math.sin(angle) * length)}" stroke="${ink}" stroke-width="${i % 4 === 0 ? 8 : 2}" stroke-linecap="round"/>`,
      );
    }
    parts.push(`<circle cx="${cx}" cy="${cy}" r="26" fill="none" stroke="${ink}" stroke-width="8"/>`);
    return parts;
  },

  /* A dot grid whose weight falls away across the field. */
  dots(ink) {
    const parts = [];
    for (let row = 0; row < 11; row += 1) {
      for (let column = 0; column < 11; column += 1) {
        const radius = round(2 + ((10 - row) + (10 - column)) * 0.75);
        parts.push(
          `<circle cx="${70 + column * 46}" cy="${70 + row * 46}" r="${radius}" fill="${ink}"/>`,
        );
      }
    }
    return parts;
  },

  /* Two circles overlapping, with the overlap left open. */
  overlap(ink) {
    return [
      `<circle cx="230" cy="290" r="170" fill="none" stroke="${ink}" stroke-width="10"/>`,
      `<circle cx="372" cy="330" r="170" fill="none" stroke="${ink}" stroke-width="10"/>`,
      `<circle cx="230" cy="290" r="96" fill="${ink}"/>`,
      `<rect x="60" y="500" width="480" height="8" fill="${ink}"/>`,
    ];
  },

  /* Horizontal rules whose thickness reads as a level. */
  rules(ink, rand) {
    const parts = [];
    let y = 90;
    while (y < 510) {
      const weight = round(2 + rand() * 22);
      const width = round(200 + rand() * 300);
      parts.push(`<rect x="70" y="${round(y)}" width="${width}" height="${weight}" fill="${ink}"/>`);
      y += weight + 10 + rand() * 20;
    }
    return parts;
  },

  /* Triangles tiled across a half field. */
  triangles(ink) {
    const parts = [];
    for (let row = 0; row < 7; row += 1) {
      for (let column = 0; column < 7; column += 1) {
        const x = 70 + column * 66;
        const y = 90 + row * 62;
        const up = (row + column) % 2 === 0;
        const points = up
          ? `${x},${y + 56} ${x + 33},${y} ${x + 66},${y + 56}`
          : `${x},${y} ${x + 66},${y} ${x + 33},${y + 56}`;
        parts.push(
          up
            ? `<polygon points="${points}" fill="${ink}"/>`
            : `<polygon points="${points}" fill="none" stroke="${ink}" stroke-width="3"/>`,
        );
      }
    }
    return parts;
  },

  /* Arc segments swung from one edge. */
  arcs(ink) {
    const parts = [];
    for (let i = 0; i < 9; i += 1) {
      const radius = 80 + i * 46;
      parts.push(
        `<path d="M60 ${round(540 - radius)} A ${radius} ${radius} 0 0 1 ${round(60 + radius)} 540" fill="none" stroke="${ink}" stroke-width="${i % 3 === 0 ? 10 : 3}"/>`,
      );
    }
    parts.push(`<circle cx="60" cy="540" r="16" fill="${ink}"/>`);
    return parts;
  },
};

/* The catalogue. Titles, formats and years are illustrative. */
export const CATALOGUE = [
  { code: "OVT-014", slug: "ovt-014", title: "Tessellate", field: "acid", build: "tessellate" },
  { code: "OVT-013", slug: "ovt-013", title: "Standing Wave", field: "blue", build: "standing" },
  { code: "OVT-012", slug: "ovt-012", title: "Dry Signal", field: "carbon", build: "bars" },
  { code: "OVT-011", slug: "ovt-011", title: "Room Tone", field: "bone", build: "rings" },
  { code: "OVT-010", slug: "ovt-010", title: "Half Step", field: "orange", build: "hatch" },
  { code: "OVT-009", slug: "ovt-009", title: "Grid Nine", field: "slate", build: "steps" },
  { code: "OVT-008", slug: "ovt-008", title: "Slow Attack", field: "magenta", build: "spokes" },
  { code: "OVT-007", slug: "ovt-007", title: "Cold Start", field: "teal", build: "dots" },
  { code: "OVT-006", slug: "ovt-006", title: "Parallel Fifths", field: "violet", build: "overlap" },
  { code: "OVT-005", slug: "ovt-005", title: "Dead Air", field: "ash", build: "rules" },
  { code: "OVT-004", slug: "ovt-004", title: "Long Decay", field: "forest", build: "triangles" },
  { code: "OVT-003", slug: "ovt-003", title: "Pressure Plate", field: "ember", build: "arcs" },
];

function cover(entry) {
  const { field, ink } = FIELDS[entry.field];
  const rand = seeded(Number(entry.code.slice(4)) * 7919 + 13);
  const shapes = CONSTRUCTIONS[entry.build](ink, rand)
    .join("")
    .replaceAll('class="cut"', `fill="${field}"`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" role="img">
<rect width="${S}" height="${S}" fill="${field}"/>
${shapes}
</svg>
`;
}

/* A wide band of bars, used once on the home page as a flat motif. */
function spectrum() {
  const rand = seeded(9173);
  const ink = "#d9ff3f";
  const dim = "#3a3d44";
  const bars = [];
  for (let i = 0; i < 96; i += 1) {
    const x = 8 + i * 10;
    const shape = Math.sin(i / 7) * 0.5 + Math.sin(i / 2.3) * 0.28 + 0.5;
    const height = Math.max(6, round(shape * 150 + rand() * 24));
    bars.push(
      `<rect x="${x}" y="${round(180 - height)}" width="6" height="${height}" fill="${i % 8 === 0 ? ink : dim}"/>`,
    );
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 968 200" width="968" height="200" role="img">
<rect width="968" height="200" fill="#0b0c0e"/>
${bars.join("")}
<rect x="8" y="182" width="952" height="2" fill="#23252a"/>
</svg>
`;
}

/* The routing drawing on the studio page: boxes, lines and one loop. */
function signalPath() {
  const ink = "#ece5d8";
  const accent = "#d9ff3f";
  const box = (x, y, w, h, stroke) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${stroke}" stroke-width="3"/>`;
  const line = (x1, y1, x2, y2, stroke, weight) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${weight}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 400" width="900" height="400" role="img">
<rect width="900" height="400" fill="#0b0c0e"/>
${box(40, 150, 140, 100, ink)}
${box(260, 90, 140, 100, ink)}
${box(260, 230, 140, 100, ink)}
${box(480, 150, 140, 100, accent)}
${box(700, 150, 160, 100, ink)}
${line(180, 200, 260, 140, ink, 3)}
${line(180, 200, 260, 280, ink, 3)}
${line(400, 140, 480, 200, ink, 3)}
${line(400, 280, 480, 200, ink, 3)}
${line(620, 200, 700, 200, accent, 5)}
<path d="M550 250 C 550 350, 330 350, 330 330" fill="none" stroke="${accent}" stroke-width="3" stroke-dasharray="10 8"/>
<circle cx="180" cy="200" r="7" fill="${ink}"/>
<circle cx="620" cy="200" r="7" fill="${accent}"/>
<circle cx="860" cy="200" r="7" fill="${ink}"/>
${line(40, 370, 860, 370, "#23252a", 2)}
</svg>
`;
}

await mkdir(OUT, { recursive: true });
for (const entry of CATALOGUE) {
  await writeFile(new URL(`cover-${entry.slug}.svg`, OUT), cover(entry));
}
await writeFile(new URL("spectrum.svg", OUT), spectrum());
await writeFile(new URL("signal-path.svg", OUT), signalPath());
console.log(`Wrote ${CATALOGUE.length + 2} drawings into assets/`);
