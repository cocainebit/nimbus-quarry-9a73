// Draws every image this edition ships. No photography, no generated imagery,
// no asset taken from any reference site: each file below is plain SVG written
// here and saved to assets/. Run with: node tools/make-art.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "assets");

const ink = "#1d252d";
const line = "#8e8f8f";
const surface = "#f0f0f0";
const paper = "#ffffff";
const blue = "#4580c4";
const deep = "#2b5b91";
const sky = "#bee6fd";
const amber = "#c8892b";
const moss = "#5f7f4f";
const clay = "#a9583f";

const svg = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img">\n${body}\n</svg>\n`;

const rect = (x, y, w, h, fill, stroke = "none", extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}"${extra ? " " + extra : ""}/>`;

const text = (x, y, value, size = 13, fill = ink, weight = 400, anchor = "start") =>
  `<text x="${x}" y="${y}" font-family="Noto Sans, Segoe UI, sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${value}</text>`;

// The chrome of a drawn window: a blue bar, three ornament controls, a body.
function frame(w, h, title, bodyFill = surface) {
  return [
    rect(0.5, 0.5, w - 1, h - 1, bodyFill, ink),
    rect(1.5, 1.5, w - 3, 30, blue, "none", 'opacity="0.92"'),
    rect(1.5, 1.5, w - 3, 15, "#ffffff", "none", 'opacity="0.22"'),
    text(14, 22, title, 14, "#0e1a26", 600),
    rect(w - 96, 7, 26, 18, "#ffffff", ink, 'opacity="0.55"'),
    rect(w - 66, 7, 26, 18, "#ffffff", ink, 'opacity="0.55"'),
    rect(w - 36, 7, 26, 18, clay, ink, 'opacity="0.85"'),
    rect(1.5, 31.5, w - 3, 1, ink),
  ].join("\n");
}

const tileColour = (x, y) => {
  const n = (x * 7 + y * 13) % 11;
  if (n < 3) return moss;
  if (n < 5) return amber;
  if (n < 7) return "#d7dde3";
  if (n < 9) return deep;
  return clay;
};

/* 1. The editor: tool column, tile canvas, palette, status strip. */
function screenEditor() {
  const w = 960;
  const h = 600;
  const parts = [frame(w, h, "Plumbline")];
  // tool column
  parts.push(rect(12, 44, 64, h - 92, paper, line));
  for (let i = 0; i < 10; i += 1) {
    const x = 20 + (i % 2) * 26;
    const y = 52 + Math.floor(i / 2) * 26;
    parts.push(rect(x, y, 20, 20, i === 2 ? sky : surface, line));
    if (i === 0) parts.push(`<path d="M${x + 5} ${y + 15} L${x + 15} ${y + 5}" stroke="${ink}" stroke-width="2" fill="none"/>`);
    if (i === 1) parts.push(rect(x + 5, y + 5, 10, 10, ink));
    if (i === 2) parts.push(`<circle cx="${x + 10}" cy="${y + 10}" r="5" fill="none" stroke="${ink}" stroke-width="2"/>`);
    if (i === 3) parts.push(`<path d="M${x + 4} ${y + 16} L${x + 10} ${y + 4} L${x + 16} ${y + 16} Z" fill="none" stroke="${ink}" stroke-width="2"/>`);
    if (i > 3) parts.push(rect(x + 5, y + 9, 10, 2, line));
  }
  // canvas
  const cx = 92;
  const cy = 44;
  const cell = 32;
  const cols = 16;
  const rows = 14;
  parts.push(rect(cx, cy, cols * cell + 2, rows * cell + 2, paper, ink));
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const ground = y >= rows - 3;
      const walls = x > 9 && x < 14 && y > 4 && y < 9;
      const prop = !ground && (x * 5 + y * 3) % 19 === 0;
      const filled = ground || walls || prop;
      const colour = ground ? (y === rows - 3 ? moss : "#cbd6c4") : walls ? "#d7dde3" : tileColour(x, y);
      parts.push(
        rect(cx + 1 + x * cell, cy + 1 + y * cell, cell, cell, filled ? colour : paper, "#d8dde2"),
      );
    }
  }
  // a drawn scene standing on the ground band
  const gy = cy + 1 + (rows - 3) * cell;
  parts.push(`<path d="M${cx + 1 + 3 * cell} ${gy} L${cx + 1 + 5 * cell} ${gy - 3.4 * cell} L${cx + 1 + 7 * cell} ${gy} Z" fill="${moss}" stroke="${ink}" stroke-width="2"/>`);
  parts.push(rect(cx + 1 + 4.6 * cell, gy - 26, 24, 26, clay, ink, 'stroke-width="2"'));
  parts.push(rect(cx + 1 + 10 * cell, gy - 2.6 * cell, cell * 3, cell * 2.6, "#e6ebf0", ink, 'stroke-width="2"'));
  parts.push(`<path d="M${cx + 1 + 9.4 * cell} ${gy - 2.6 * cell} L${cx + 1 + 11.5 * cell} ${gy - 3.9 * cell} L${cx + 1 + 13.6 * cell} ${gy - 2.6 * cell} Z" fill="${clay}" stroke="${ink}" stroke-width="2"/>`);
  parts.push(rect(cx + 1 + 11 * cell, gy - 1.5 * cell, 22, 34, deep, ink, 'stroke-width="2"'));
  // palette
  const px = cx + cols * cell + 16;
  parts.push(rect(px, 44, w - px - 12, h - 92, paper, line));
  parts.push(text(px + 12, 66, "Palette", 13, ink, 600));
  const swatches = [moss, amber, clay, deep, sky, "#d7dde3", "#8fa3b0", "#3f4a55", "#7d5a3c", "#b7c9a8", "#e3d7b8", "#4f6b8a"];
  swatches.forEach((colour, i) => {
    const x = px + 12 + (i % 4) * 34;
    const y = 78 + Math.floor(i / 4) * 34;
    parts.push(rect(x, y, 26, 26, colour, ink));
  });
  parts.push(text(px + 12, 210, "Layers", 13, ink, 600));
  ["Ground", "Props", "Roofs"].forEach((label, i) => {
    const y = 222 + i * 30;
    parts.push(rect(px + 12, y, 126, 24, i === 1 ? sky : surface, line));
    parts.push(text(px + 20, y + 16, label, 12));
  });
  parts.push(text(px + 12, 350, "Tile 46 of 96", 12, "#4d5a66"));
  // status strip
  parts.push(rect(12, h - 42, w - 24, 30, surface, line));
  parts.push(text(24, h - 22, "Ready", 12, "#3b4854"));
  parts.push(text(180, h - 22, "Grid 16 by 14", 12, "#3b4854"));
  parts.push(text(360, h - 22, "Illustrative screen, drawn as vector art", 12, "#4d5a66"));
  return svg(w, h, parts.join("\n"));
}

/* 2. The map view: a small world drawn from a repeating rule. */
function screenMap() {
  const w = 960;
  const h = 600;
  const parts = [frame(w, h, "Plumbline: map")];
  const cell = 26;
  const cols = 32;
  const rows = 18;
  const ox = 20;
  const oy = 52;
  parts.push(rect(ox - 2, oy - 2, cols * cell + 4, rows * cell + 4, paper, ink));
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const road = y === 9 || x === 12;
      const colour = road ? "#cfd6dc" : tileColour(x, y);
      parts.push(rect(ox + x * cell, oy + y * cell, cell, cell, colour, "#e6eaee", 'stroke-width="0.6"'));
    }
  }
  parts.push(rect(ox + 6 * cell, oy + 4 * cell, cell * 6, cell * 5, "none", "#0e1a26", 'stroke-width="3" stroke-dasharray="6 4"'));
  parts.push(rect(ox, oy + rows * cell + 12, 200, 24, surface, line));
  parts.push(text(ox + 10, oy + rows * cell + 29, "Selection: 6 by 5 tiles", 12, "#3b4854"));
  return svg(w, h, parts.join("\n"));
}

/* 3. The export sheet: frames packed into one image, then written out. */
function screenExport() {
  const w = 960;
  const h = 520;
  const parts = [frame(w, h, "Plumbline: export")];
  const cell = 74;
  const ox = 24;
  const oy = 60;
  for (let y = 0; y < 4; y += 1) {
    for (let x = 0; x < 8; x += 1) {
      parts.push(rect(ox + x * cell, oy + y * cell, cell - 6, cell - 6, paper, line));
      parts.push(rect(ox + x * cell + 12, oy + y * cell + 12, cell - 30, cell - 30, tileColour(x + 1, y + 2), ink));
      parts.push(text(ox + x * cell + 6, oy + y * cell + cell - 14, String(y * 8 + x + 1), 11, "#586674"));
    }
  }
  const bx = 640;
  parts.push(`<path d="M${bx - 20} ${oy + 150} L${bx + 40} ${oy + 150}" stroke="${ink}" stroke-width="3" fill="none"/>`);
  parts.push(`<path d="M${bx + 40} ${oy + 150} L${bx + 28} ${oy + 143} L${bx + 28} ${oy + 157} Z" fill="${ink}"/>`);
  parts.push(rect(bx + 60, oy + 96, 220, 112, surface, ink));
  parts.push(rect(bx + 60, oy + 96, 220, 24, blue, "none", 'opacity="0.9"'));
  parts.push(text(bx + 72, oy + 113, "sheet.png", 13, "#0e1a26", 600));
  parts.push(text(bx + 72, oy + 146, "32 frames", 13));
  parts.push(text(bx + 72, oy + 168, "One sheet, one index", 13, "#4d5a66"));
  parts.push(text(bx + 72, oy + 190, "Illustrative output", 12, "#4d5a66"));
  return svg(w, h, parts.join("\n"));
}

/* 4. Palette tab art. */
function panelPalette() {
  const w = 720;
  const h = 420;
  const parts = [rect(0.5, 0.5, w - 1, h - 1, paper, line)];
  const swatches = [moss, amber, clay, deep, sky, "#d7dde3", "#8fa3b0", "#3f4a55", "#7d5a3c", "#b7c9a8", "#e3d7b8", "#4f6b8a", "#2f3a45", "#c9b79c", "#6f8f7a", "#96545a"];
  swatches.forEach((colour, i) => {
    const x = 32 + (i % 8) * 80;
    const y = 48 + Math.floor(i / 8) * 80;
    parts.push(rect(x, y, 64, 64, colour, ink));
    parts.push(rect(x + 4, y + 4, 56, 8, "#ffffff", "none", 'opacity="0.3"'));
  });
  parts.push(text(32, 236, "Ramp", 14, ink, 600));
  for (let i = 0; i < 12; i += 1) {
    const t = i / 11;
    const r = Math.round(46 + t * 180);
    const g = Math.round(62 + t * 160);
    const b = Math.round(84 + t * 120);
    parts.push(rect(32 + i * 52, 250, 48, 44, `rgb(${r},${g},${b})`, ink));
  }
  parts.push(text(32, 330, "Locked slots keep old tiles readable", 14, "#3b4854"));
  for (let i = 0; i < 6; i += 1) {
    parts.push(rect(32 + i * 52, 344, 44, 44, i < 2 ? surface : paper, line));
    if (i < 2) parts.push(`<path d="M${44 + i * 52} 366 l8 8 l14 -18" stroke="${ink}" stroke-width="3" fill="none"/>`);
  }
  return svg(w, h, parts.join("\n"));
}

/* 5. Layers tab art. */
function panelLayers() {
  const w = 720;
  const h = 420;
  const parts = [rect(0.5, 0.5, w - 1, h - 1, paper, line)];
  const planes = [
    { y: 250, fill: moss, label: "Ground" },
    { y: 190, fill: amber, label: "Props" },
    { y: 130, fill: deep, label: "Roofs" },
    { y: 70, fill: clay, label: "Collision" },
  ];
  planes.forEach((plane) => {
    parts.push(
      `<path d="M120 ${plane.y} L400 ${plane.y - 60} L620 ${plane.y} L340 ${plane.y + 60} Z" fill="${plane.fill}" fill-opacity="0.22" stroke="${ink}" stroke-width="2"/>`,
    );
    parts.push(text(30, plane.y + 6, plane.label, 14, ink, 600));
  });
  for (let i = 0; i < 4; i += 1) {
    parts.push(`<path d="M400 ${330 - i * 60} L400 ${296 - i * 60}" stroke="${line}" stroke-width="2" stroke-dasharray="4 4"/>`);
  }
  parts.push(text(30, 380, "Each layer keeps its own grid and its own opacity", 14, "#3b4854"));
  return svg(w, h, parts.join("\n"));
}

/* 6. Script tab art: a drawn console, not a live one. */
function panelScript() {
  const w = 720;
  const h = 420;
  const parts = [rect(0.5, 0.5, w - 1, h - 1, "#101820")];
  const widths = [220, 300, 160, 380, 250, 120, 330, 200, 280, 140];
  widths.forEach((width, i) => {
    const y = 40 + i * 32;
    parts.push(rect(28, y, 14, 14, i % 3 === 0 ? "#8fd18a" : "#6f8496"));
    parts.push(rect(52, y + 2, width, 10, i % 4 === 0 ? "#cfe3f5" : "#7f94a6"));
  });
  parts.push(rect(52, 360, 12, 18, "#8fd18a"));
  parts.push(text(28, 400, "Drawn console, no live session", 13, "#7f94a6"));
  return svg(w, h, parts.join("\n"));
}

/* 7. The pipeline diagram. */
function diagramPipeline() {
  const w = 960;
  const h = 260;
  const boxes = [
    ["Tiles", "drawn one by one"],
    ["Map", "tiles placed on layers"],
    ["Sheet", "packed for the engine"],
    ["Game", "your own code reads it"],
  ];
  const parts = [rect(0.5, 0.5, w - 1, h - 1, surface, line)];
  boxes.forEach((box, i) => {
    const x = 32 + i * 232;
    parts.push(rect(x, 60, 190, 96, paper, ink));
    parts.push(rect(x, 60, 190, 10, blue, "none", 'opacity="0.8"'));
    parts.push(text(x + 16, 100, box[0], 17, ink, 600));
    parts.push(text(x + 16, 126, box[1], 13, "#3b4854"));
    if (i < boxes.length - 1) {
      const ax = x + 190;
      parts.push(`<path d="M${ax + 6} 108 L${ax + 34} 108" stroke="${ink}" stroke-width="3" fill="none"/>`);
      parts.push(`<path d="M${ax + 40} 108 L${ax + 28} 101 L${ax + 28} 115 Z" fill="${ink}"/>`);
    }
  });
  parts.push(`<path d="M700 170 L700 200 L128 200 L128 170" stroke="${ink}" stroke-width="2" fill="none" stroke-dasharray="7 5"/>`);
  parts.push(`<path d="M128 156 L121 172 L135 172 Z" fill="${ink}"/>`);
  parts.push(text(330, 222, "Edits travel back to the tiles, so nothing is exported twice by hand", 14, "#3b4854"));
  return svg(w, h, parts.join("\n"));
}

/* 8 to 12. Icons, all drawn here. */
function iconShell(inner, bg = surface) {
  return svg(
    64,
    64,
    [
      rect(2, 2, 60, 60, bg, ink, 'stroke-width="2"'),
      rect(4, 4, 56, 12, "#ffffff", "none", 'opacity="0.55"'),
      inner,
    ].join("\n"),
  );
}

const iconPlumbline = () =>
  iconShell(
    [
      `<path d="M32 14 L32 34" stroke="${ink}" stroke-width="3"/>`,
      `<path d="M22 34 L42 34 L32 54 Z" fill="${blue}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`,
      `<path d="M14 14 L50 14" stroke="${ink}" stroke-width="3"/>`,
    ].join("\n"),
  );

const iconDisk = () =>
  iconShell(
    [
      rect(12, 12, 40, 40, paper, ink, 'stroke-width="3"'),
      rect(20, 12, 24, 16, "#8fa3b0", ink, 'stroke-width="2"'),
      rect(26, 15, 6, 10, paper),
      rect(18, 34, 28, 18, surface, ink, 'stroke-width="2"'),
      rect(22, 39, 20, 2, line),
      rect(22, 44, 14, 2, line),
    ].join("\n"),
    sky,
  );

const iconBook = () =>
  iconShell(
    [
      `<path d="M14 16 L32 22 L50 16 L50 48 L32 54 L14 48 Z" fill="${paper}" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`,
      `<path d="M32 22 L32 54" stroke="${ink}" stroke-width="3"/>`,
      `<path d="M20 28 L28 30" stroke="${line}" stroke-width="2"/>`,
      `<path d="M36 30 L44 28" stroke="${line}" stroke-width="2"/>`,
    ].join("\n"),
  );

const iconHelp = () =>
  iconShell(
    [
      `<circle cx="32" cy="34" r="19" fill="${paper}" stroke="${ink}" stroke-width="3"/>`,
      `<path d="M25 28 a7 7 0 1 1 8 10 l0 4" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
      `<circle cx="33" cy="46" r="2.6" fill="${ink}"/>`,
    ].join("\n"),
  );

const iconMail = () =>
  iconShell(
    [
      rect(12, 22, 40, 28, paper, ink, 'stroke-width="3"'),
      `<path d="M12 22 L32 38 L52 22" fill="none" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`,
    ].join("\n"),
  );

const iconFolder = () =>
  iconShell(
    [
      `<path d="M12 20 L28 20 L32 26 L52 26 L52 48 L12 48 Z" fill="${amber}" fill-opacity="0.45" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>`,
    ].join("\n"),
  );

const files = {
  "screen-editor.svg": screenEditor(),
  "screen-map.svg": screenMap(),
  "screen-export.svg": screenExport(),
  "panel-palette.svg": panelPalette(),
  "panel-layers.svg": panelLayers(),
  "panel-script.svg": panelScript(),
  "diagram-pipeline.svg": diagramPipeline(),
  "icon-plumbline.svg": iconPlumbline(),
  "icon-disk.svg": iconDisk(),
  "icon-book.svg": iconBook(),
  "icon-help.svg": iconHelp(),
  "icon-mail.svg": iconMail(),
  "icon-folder.svg": iconFolder(),
};

await mkdir(out, { recursive: true });
for (const [name, content] of Object.entries(files)) {
  await writeFile(join(out, name), content, "utf8");
  console.log("wrote assets/" + name);
}
