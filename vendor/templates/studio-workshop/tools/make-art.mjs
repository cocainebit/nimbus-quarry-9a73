/*
 * Fettle, a Plotform studio edition.
 *
 * Draws every hand drawn graphic in the edition ONCE, at build time, with
 * Rough.js, and writes plain static SVG files into assets/.
 *
 * Why build time and not run time: Rough.js re-rolls its strokes on every
 * render, so a page that draws at run time jitters on resize, on theme change
 * and on every re-render, and the source editor loses the leaf it had selected.
 * Every call below passes an explicit `seed`, so re-running this script writes
 * byte identical files, and the pages themselves ship no JavaScript drawing at
 * all: they load these SVG files like any other image.
 *
 * Run from the edition folder:  node tools/make-art.mjs
 *
 * Rough.js 4.6.6, MIT, copyright 2019 Preet Shihn. The bundled ES module is
 * vendored at tools/vendor/rough.esm.js and its notice at
 * licenses/roughjs-MIT.txt. Nothing here traces a photograph or a reference
 * site; every shape is geometry written out by hand and then roughened.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import rough from "./vendor/rough.esm.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "assets");
mkdirSync(out, { recursive: true });

const gen = rough.generator();

/* The edition's palette, kept in step with the :root tokens in style.css. */
const ink = "#26221d";
const pencil = "#8a8272";
const paper = "#f7f1e3";
const ochre = "#d8a12a";
const sap = "#4f7a4a";
const brick = "#bf4a2f";

/* Rough.js emits long floats. Rounding the path data to one decimal keeps the
   files small without moving a stroke anywhere a person could see. */
const trim = (d) => d.replace(/-?\d+\.\d+/g, (n) => String(Math.round(n * 10) / 10));

/* Turn one Rough.js drawable into SVG path elements. */
function draw(drawable) {
  return gen
    .toPaths(drawable)
    .map((p) => {
      const attrs = [`d="${trim(p.d)}"`];
      attrs.push(`fill="${p.fill && p.fill !== "none" ? p.fill : "none"}"`);
      if (p.stroke && p.stroke !== "none") {
        attrs.push(`stroke="${p.stroke}"`);
        attrs.push(`stroke-width="${p.strokeWidth}"`);
        attrs.push(`stroke-linecap="round"`, `stroke-linejoin="round"`);
      } else {
        attrs.push(`stroke="none"`);
      }
      return `<path ${attrs.join(" ")}/>`;
    })
    .join("\n");
}

const svg = (w, h, body, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${label}">\n${body}\n</svg>\n`;

const write = (name, content) => {
  writeFileSync(join(out, name), content);
  console.log(`wrote assets/${name} (${content.length} bytes)`);
};

/* Shared stroke recipes. A low `bowing` keeps long rules readable; the
   hachure angle stays constant so every filled shape looks like one hand. */
const pen = (o = {}) => ({
  roughness: 1.35,
  bowing: 1.1,
  stroke: ink,
  strokeWidth: 2,
  fill: "none",
  ...o,
});
const hatch = (colour, o = {}) => ({
  ...pen(o),
  fill: colour,
  fillStyle: "hachure",
  fillWeight: 1.6,
  hachureAngle: -41,
  hachureGap: 7,
  ...o,
});

/* ------------------------------------------------------------------ */
/* 1. The house mark: a bench with a vice, a pegboard and three tools. */
/* ------------------------------------------------------------------ */
{
  const parts = [];

  /* The pegboard: an outline and a light grid of holes, nothing filled, so the
     tools hanging on it stay the darkest thing in the upper half. */
  parts.push(draw(gen.rectangle(56, 34, 570, 232, pen({ seed: 11, strokeWidth: 2.6 }))));
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 10; c++) {
      parts.push(draw(gen.circle(86 + c * 58, 66 + r * 56, 6, pen({ seed: 200 + r * 10 + c, strokeWidth: 1, stroke: pencil, roughness: 0.8 }))));
    }
  }

  /* A handsaw: a tapered blade, a toothed edge and a closed handle. */
  parts.push(draw(gen.polygon([[112, 74], [300, 96], [300, 128], [112, 118]], pen({ seed: 21, fill: paper, fillStyle: "solid", strokeWidth: 2.4 }))));
  const teeth = [];
  for (let i = 0; i <= 15; i++) {
    const x = 118 + i * 12;
    teeth.push([x, 118 + i * 0.6], [x + 6, 128 + i * 0.6]);
  }
  parts.push(draw(gen.linearPath(teeth, pen({ seed: 22, strokeWidth: 1.6 }))));
  parts.push(draw(gen.path("M100 60 C 74 60, 66 92, 78 118 C 86 136, 112 136, 116 120 C 104 116, 96 96, 100 82 Z", pen({ seed: 23, fill: ochre, fillStyle: "solid", strokeWidth: 2.4 }))));

  /* A try square, hung square to the board. */
  parts.push(draw(gen.polygon([[382, 62], [412, 62], [412, 188], [500, 188], [500, 214], [382, 214]], pen({ seed: 24, fill: sap, fillStyle: "hachure", hachureGap: 7, fillWeight: 1.4, hachureAngle: -41, strokeWidth: 2.4 }))));

  /* A mallet, head on the board and handle hanging past it. */
  parts.push(draw(gen.rectangle(524, 58, 74, 46, hatch(brick, { seed: 25, hachureGap: 6, strokeWidth: 2.4 }))));
  parts.push(draw(gen.line(561, 104, 556, 236, pen({ seed: 26, strokeWidth: 5 }))));

  /* The bench: a thick top on two splayed legs with one stretcher. */
  parts.push(draw(gen.rectangle(22, 316, 640, 46, hatch(ochre, { seed: 31, hachureGap: 6, strokeWidth: 3.4 }))));
  parts.push(draw(gen.line(84, 362, 100, 506, pen({ seed: 32, strokeWidth: 4 }))));
  parts.push(draw(gen.line(600, 362, 584, 506, pen({ seed: 33, strokeWidth: 4 }))));
  parts.push(draw(gen.line(100, 452, 584, 452, pen({ seed: 34, strokeWidth: 2.4 }))));

  /* The vice, clamped on the near end with its handle sticking out. */
  parts.push(draw(gen.rectangle(34, 362, 104, 64, hatch(sap, { seed: 35, hachureGap: 6, strokeWidth: 2.6 }))));
  parts.push(draw(gen.line(46, 394, 12, 394, pen({ seed: 36, strokeWidth: 4 }))));
  parts.push(draw(gen.circle(12, 394, 30, pen({ seed: 37, fill: brick, fillStyle: "solid", strokeWidth: 2.4 }))));

  /* The work in hand: a spoon with its bowl hollowed, lying on the top. */
  parts.push(draw(gen.path("M232 306 C 244 282, 292 278, 306 300 C 318 320, 296 334, 272 332 C 246 330, 224 322, 232 306 Z", pen({ seed: 41, fill: paper, fillStyle: "solid", strokeWidth: 2.6 }))));
  parts.push(draw(gen.path("M248 304 C 258 292, 288 290, 296 302 C 302 312, 286 320, 270 318 C 256 316, 244 312, 248 304 Z", pen({ seed: 42, strokeWidth: 1.6, stroke: pencil }))));
  parts.push(draw(gen.path("M306 306 C 348 304, 402 300, 452 306 C 404 316, 350 318, 308 316 Z", pen({ seed: 43, fill: paper, fillStyle: "solid", strokeWidth: 2.6 }))));

  /* A ruler laid beyond it, and a curl of shaving just leaving the blade. */
  parts.push(draw(gen.rectangle(480, 300, 150, 16, pen({ seed: 44, fill: paper, fillStyle: "solid", strokeWidth: 2 }))));
  for (let i = 0; i < 7; i++) {
    parts.push(draw(gen.line(492 + i * 20, 300, 492 + i * 20, 308, pen({ seed: 45 + i, strokeWidth: 1.2, stroke: pencil, roughness: 0.7 }))));
  }

  /* Shavings on the floor under the bench. */
  for (let i = 0; i < 9; i++) {
    const x = 96 + i * 60;
    parts.push(draw(gen.path(`M${x} 518 C ${x + 12} 504, ${x + 26} 528, ${x + 42} 510`, pen({ seed: 60 + i, strokeWidth: 1.8, stroke: pencil }))));
  }

  write(
    "mark-fettle.svg",
    svg(680, 540, parts.join("\n"), "A hand drawn workbench with a vice at one end, a half carved spoon and a ruler on the top, shavings on the floor and a pegboard above holding a saw, a square and a mallet"),
  );
}

/* ------------------------------------------------------------------ */
/* 2. Rules and an underline, used as CSS backgrounds for dividers.    */
/* ------------------------------------------------------------------ */
{
  /* A ruled line long enough to cross the page needs more than roughness: a
     straight line roughened is still a straight line. These run through a
     fixed sequence of points that drift up and down, so the rule reads as one
     drawn by somebody holding a pencil rather than a straight edge. The offsets
     are written out rather than random, so the file never changes. */
  const drift = [0, -2.1, 1.4, -1.1, 2.6, -0.4, 1.9, -2.4, 0.8, 2.2, -1.6, 0.5, -2.8, 1.2, 0];
  const wobble = (y, amplitude) =>
    drift.map((d, i) => [6 + (i * 1188) / (drift.length - 1), y + d * amplitude]);

  const twin = [
    draw(gen.curve(wobble(11, 1.5), pen({ seed: 71, strokeWidth: 2.6, roughness: 1.1 }))),
    draw(gen.curve(wobble(21, 1.2), pen({ seed: 72, strokeWidth: 1.4, roughness: 1.6, stroke: pencil }))),
  ].join("\n");
  write("rule.svg", svg(1200, 30, twin, "A hand drawn double rule"));

  const single = draw(gen.curve(wobble(12, 1.6), pen({ seed: 73, strokeWidth: 2.2, roughness: 1.2 })));
  write("rule-thin.svg", svg(1200, 24, single, "A hand drawn rule"));

  const swash = [
    draw(gen.path("M6 20 C 140 6, 320 30, 480 14 C 620 2, 740 26, 794 16", pen({ seed: 74, strokeWidth: 5, stroke: ochre, bowing: 1.6 }))),
    draw(gen.path("M20 30 C 180 20, 340 38, 520 26 C 660 16, 740 34, 780 28", pen({ seed: 75, strokeWidth: 2.4, stroke: ochre, bowing: 2 }))),
  ].join("\n");
  write("underline.svg", svg(800, 40, swash, "A hand drawn underline in ochre"));
}

/* ------------------------------------------------------------------ */
/* 3. Frames and callouts, used as CSS border-image and backgrounds.   */
/* ------------------------------------------------------------------ */
{
  /* Frames are drawn once at 400 by 400 and then sliced as a CSS border-image,
     40 units from each edge. The four corners are used at their own size and
     never distort; only the straight runs between them stretch, which is what
     a long pencil line does anyway. That is how one drawn rectangle can sit
     around a box of any shape on the page. */
  const frame = draw(gen.rectangle(20, 20, 360, 360, pen({ seed: 81, strokeWidth: 2.6, roughness: 1.15, bowing: 0.9 })));
  write("frame.svg", svg(400, 400, frame, "A hand drawn rectangular frame"));

  const frameDouble = [
    draw(gen.rectangle(18, 18, 364, 364, pen({ seed: 82, strokeWidth: 3.2, roughness: 1.1, bowing: 0.8 }))),
    draw(gen.rectangle(28, 28, 344, 344, pen({ seed: 83, strokeWidth: 1.3, stroke: pencil, roughness: 1.5, bowing: 1.1 }))),
  ].join("\n");
  write("frame-double.svg", svg(400, 400, frameDouble, "A hand drawn double rectangular frame"));

  /* The callout frame carries a torn looking edge on the left, so a note reads
     as a page pulled out of a pad rather than another box. */
  const noteFrame = [
    draw(gen.rectangle(20, 20, 360, 360, pen({ seed: 84, fill: "#fffaf0", fillStyle: "solid", strokeWidth: 2.8, roughness: 1.3, bowing: 0.9 }))),
    draw(gen.line(34, 26, 34, 374, pen({ seed: 85, strokeWidth: 1.4, stroke: brick, roughness: 2.4 }))),
  ].join("\n");
  write("note-frame.svg", svg(400, 400, noteFrame, "A hand drawn note frame with a red margin rule down the left"));

  /* The drawing pin that holds a callout to the wall. */
  const pin = [
    draw(gen.circle(40, 40, 46, pen({ seed: 86, fill: brick, fillStyle: "solid", strokeWidth: 2.4 }))),
    draw(gen.circle(34, 34, 14, pen({ seed: 87, fill: paper, fillStyle: "solid", strokeWidth: 1.2 }))),
  ].join("\n");
  write("pin.svg", svg(80, 80, pin, "A hand drawn red drawing pin"));
}

/* ------------------------------------------------------------------ */
/* 4. Tool sketches for the what to bring list.                        */
/* ------------------------------------------------------------------ */
{
  const tool = (name, label, build) => {
    const parts = build();
    write(`tool-${name}.svg`, svg(220, 220, parts.join("\n"), label));
  };

  tool("knife", "A hand drawn carving knife with a wooden handle", () => [
    draw(gen.path("M36 150 C 70 120, 118 92, 176 70 C 182 82, 176 96, 160 110 C 128 136, 84 158, 48 168 Z", pen({ seed: 91, fill: pencil, fillStyle: "hachure", hachureGap: 6, fillWeight: 1.4, hachureAngle: -41 }))),
    draw(gen.path("M36 150 C 26 160, 24 182, 40 192 C 56 200, 74 188, 78 172 Z", pen({ seed: 92, fill: ochre, fillStyle: "solid" }))),
    draw(gen.line(50, 160, 150, 100, pen({ seed: 93, strokeWidth: 1.2, stroke: ink }))),
  ]);

  tool("gouge", "A hand drawn hook gouge with a curved blade", () => [
    draw(gen.path("M64 176 C 64 120, 96 84, 140 84 C 176 84, 190 116, 168 132 C 152 144, 136 128, 146 114", pen({ seed: 94, strokeWidth: 4 }))),
    draw(gen.path("M52 178 C 44 190, 50 206, 66 206 C 82 206, 88 190, 78 178 Z", pen({ seed: 95, fill: ochre, fillStyle: "solid" }))),
    draw(gen.line(64, 176, 52, 182, pen({ seed: 96, strokeWidth: 2 }))),
  ]);

  tool("apron", "A hand drawn workshop apron with a front pocket", () => [
    draw(gen.path("M70 44 C 70 74, 46 88, 46 124 L 46 190 L 174 190 L 174 124 C 174 88, 150 74, 150 44 Z", hatch(sap, { seed: 97, hachureGap: 8 }))),
    draw(gen.path("M70 44 C 90 58, 130 58, 150 44", pen({ seed: 98, strokeWidth: 2 }))),
    draw(gen.rectangle(76, 128, 68, 40, pen({ seed: 99, strokeWidth: 2 }))),
    draw(gen.line(46, 62, 20, 44, pen({ seed: 100, strokeWidth: 2 }))),
    draw(gen.line(174, 62, 200, 44, pen({ seed: 101, strokeWidth: 2 }))),
  ]);

  tool("notebook", "A hand drawn notebook with a pencil across it", () => [
    draw(gen.rectangle(46, 50, 116, 146, pen({ seed: 102, fill: paper, fillStyle: "solid", strokeWidth: 2.6 }))),
    ...[0, 1, 2, 3].map((i) => draw(gen.line(62, 86 + i * 26, 146, 86 + i * 26, pen({ seed: 110 + i, strokeWidth: 1.4, stroke: pencil })))),
    draw(gen.line(120, 190, 196, 42, pen({ seed: 120, strokeWidth: 6, stroke: ochre }))),
    draw(gen.polygon([[196, 42], [206, 30], [200, 54]], pen({ seed: 121, fill: ink, fillStyle: "solid", strokeWidth: 1.6 }))),
  ]);

  tool("glasses", "A hand drawn pair of safety glasses", () => [
    draw(gen.path("M40 96 C 40 80, 76 76, 92 88 C 98 92, 100 112, 92 120 C 78 134, 44 128, 40 108 Z", pen({ seed: 122, fill: paper, fillStyle: "solid", strokeWidth: 2.4 }))),
    draw(gen.path("M128 88 C 144 76, 180 80, 180 96 L 180 108 C 176 128, 142 134, 128 120 C 120 112, 122 92, 128 88 Z", pen({ seed: 123, fill: paper, fillStyle: "solid", strokeWidth: 2.4 }))),
    draw(gen.line(92, 96, 128, 96, pen({ seed: 124, strokeWidth: 2.4 }))),
    draw(gen.line(40, 92, 18, 76, pen({ seed: 125, strokeWidth: 2.4 }))),
    draw(gen.line(180, 92, 202, 76, pen({ seed: 126, strokeWidth: 2.4 }))),
  ]);

  tool("log", "A hand drawn split log showing its growth rings", () => [
    draw(gen.ellipse(110, 96, 140, 92, pen({ seed: 127, fill: ochre, fillStyle: "solid", strokeWidth: 2.6 }))),
    draw(gen.ellipse(110, 96, 96, 62, pen({ seed: 128, strokeWidth: 1.6, stroke: ink }))),
    draw(gen.ellipse(110, 96, 52, 34, pen({ seed: 129, strokeWidth: 1.6, stroke: ink }))),
    draw(gen.path("M40 96 L 40 164 C 60 186, 160 186, 180 164 L 180 96", pen({ seed: 130, strokeWidth: 2.6 }))),
    draw(gen.line(70, 150, 78, 180, pen({ seed: 131, strokeWidth: 1.4, stroke: pencil }))),
    draw(gen.line(112, 152, 112, 184, pen({ seed: 132, strokeWidth: 1.4, stroke: pencil }))),
    draw(gen.line(150, 150, 144, 180, pen({ seed: 133, strokeWidth: 1.4, stroke: pencil }))),
  ]);
}

/* ------------------------------------------------------------------ */
/* 5. The floor plan. Deliberately text free, so every room label on   */
/*    the page stays editable HTML next to a number.                   */
/* ------------------------------------------------------------------ */
{
  const parts = [];
  const W = 1000;
  const H = 640;
  // Outer shell.
  parts.push(draw(gen.rectangle(28, 28, W - 56, H - 56, pen({ seed: 141, strokeWidth: 4, bowing: 0.7 }))));
  // The long bench room, ten benches in two rows.
  for (let i = 0; i < 5; i++) {
    parts.push(draw(gen.rectangle(70 + i * 96, 96, 70, 42, hatch(ochre, { seed: 150 + i, hachureGap: 6 }))));
    parts.push(draw(gen.rectangle(70 + i * 96, 196, 70, 42, hatch(ochre, { seed: 160 + i, hachureGap: 6 }))));
  }
  // Partition between the bench room and the machine bay.
  parts.push(draw(gen.line(560, 28, 560, 300, pen({ seed: 170, strokeWidth: 3 }))));
  parts.push(draw(gen.line(560, 300, 560, 420, pen({ seed: 171, strokeWidth: 1.4, stroke: pencil }))));
  // Machine bay: three machines drawn as hatched blocks.
  parts.push(draw(gen.rectangle(610, 80, 150, 90, hatch(sap, { seed: 172, hachureGap: 8 }))));
  parts.push(draw(gen.rectangle(790, 80, 140, 90, hatch(sap, { seed: 173, hachureGap: 8 }))));
  parts.push(draw(gen.rectangle(610, 200, 320, 70, hatch(sap, { seed: 174, hachureGap: 8 }))));
  // Extraction duct, a dashed run along the wall.
  parts.push(draw(gen.line(600, 60, 940, 60, pen({ seed: 175, strokeWidth: 2, stroke: pencil }))));
  // Timber store, hatched the other way.
  parts.push(draw(gen.rectangle(610, 320, 150, 250, hatch(pencil, { seed: 176, hachureGap: 12, hachureAngle: 41 }))));
  // The washing up and the kettle.
  parts.push(draw(gen.rectangle(790, 320, 140, 90, pen({ seed: 177, strokeWidth: 2.4 }))));
  parts.push(draw(gen.circle(860, 365, 44, pen({ seed: 178, strokeWidth: 2 }))));
  // Sharpening corner.
  parts.push(draw(gen.rectangle(790, 450, 140, 120, hatch(brick, { seed: 179, hachureGap: 9 }))));
  // The yard, below the bench room, hatched loosely.
  parts.push(draw(gen.rectangle(70, 330, 440, 240, hatch(pencil, { seed: 180, hachureGap: 20, fillWeight: 1, strokeWidth: 2 }))));
  // Three stools and a table in the yard.
  parts.push(draw(gen.circle(160, 400, 44, pen({ seed: 181, strokeWidth: 2 }))));
  parts.push(draw(gen.circle(240, 440, 44, pen({ seed: 182, strokeWidth: 2 }))));
  parts.push(draw(gen.circle(170, 490, 44, pen({ seed: 183, strokeWidth: 2 }))));
  parts.push(draw(gen.rectangle(330, 400, 140, 110, pen({ seed: 184, strokeWidth: 2 }))));
  // The doorway on the south wall, a gap with a drawn swing.
  parts.push(draw(gen.line(240, 584, 350, 584, pen({ seed: 185, strokeWidth: 5, stroke: paper }))));
  parts.push(draw(gen.path("M240 584 C 240 636, 300 640, 350 584", pen({ seed: 186, strokeWidth: 2, stroke: brick }))));
  parts.push(draw(gen.line(240, 584, 240, 612, pen({ seed: 187, strokeWidth: 3, stroke: brick }))));
  // North arrow, because a plan without one is a rectangle.
  parts.push(draw(gen.line(950, 560, 950, 486, pen({ seed: 188, strokeWidth: 2.4 }))));
  parts.push(draw(gen.polygon([[950, 470], [942, 496], [958, 496]], pen({ seed: 189, fill: ink, fillStyle: "solid", strokeWidth: 1.6 }))));
  write(
    "plan.svg",
    svg(W, H, parts.join("\n"), "A hand drawn floor plan: ten benches in a long room, a machine bay, a timber store, a sharpening corner and a yard with stools"),
  );
}

/* ------------------------------------------------------------------ */
/* 6. The chart. Bars and axes only: every number and label stays on   */
/*    the page as HTML, and a table beside it carries the same figures.*/
/* ------------------------------------------------------------------ */
{
  // Illustrative figures, repeated as text in the table on space.html.
  const bars = [
    { label: "Tuesday", value: 9 },
    { label: "Wednesday", value: 10 },
    { label: "Thursday", value: 7 },
    { label: "Friday", value: 4 },
    { label: "Saturday", value: 10 },
    { label: "Sunday", value: 3 },
  ];
  const W = 760;
  const H = 360;
  const left = 56;
  const bottom = H - 48;
  const top = 30;
  const max = 10;
  const slot = (W - left - 30) / bars.length;
  const parts = [];
  // Baseline and the upright.
  parts.push(draw(gen.line(left, bottom, W - 20, bottom, pen({ seed: 191, strokeWidth: 2.6, bowing: 1.6 }))));
  parts.push(draw(gen.line(left, bottom, left, top, pen({ seed: 192, strokeWidth: 2.6, bowing: 1.6 }))));
  // Gridlines at every other bench.
  for (let v = 2; v <= max; v += 2) {
    const y = bottom - ((bottom - top) * v) / max;
    parts.push(draw(gen.line(left, y, W - 20, y, pen({ seed: 200 + v, strokeWidth: 1, stroke: pencil, bowing: 3 }))));
    parts.push(draw(gen.line(left - 10, y, left, y, pen({ seed: 220 + v, strokeWidth: 1.8 }))));
  }
  bars.forEach((bar, i) => {
    const h = ((bottom - top) * bar.value) / max;
    const x = left + i * slot + slot * 0.2;
    const w = slot * 0.6;
    parts.push(
      draw(
        gen.rectangle(x, bottom - h, w, h, hatch(bar.value === max ? sap : ochre, { seed: 240 + i, hachureGap: 7, strokeWidth: 2.4 })),
      ),
    );
  });
  write(
    "chart-benches.svg",
    svg(W, H, parts.join("\n"), "A hand drawn bar chart of how many of the ten benches are taken on each day of an illustrative week"),
  );
}

console.log("done");
