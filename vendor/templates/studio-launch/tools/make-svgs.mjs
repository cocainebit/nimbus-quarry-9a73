// Generates the Deck product drawings for the Apogee studio edition.
// One drawing, two finishes, several viewBox crops. Output is plain SVG.
import { writeFileSync } from "node:fs";

const OUT = process.argv[2] || new URL("../assets/", import.meta.url).pathname;

const finishes = {
  graphite: {
    plate: "#141413", plateStroke: "#2a2a28",
    panelTop: "#252524", panelBot: "#1a1a19", panelStroke: "#353533", edgeHi: "#4a4a47",
    padFill: "#272726", padStroke: "#343432", padHi: "#3b3b39",
    knobA: "#3b3b39", knobB: "#1d1d1c", knobStroke: "#424240", ind: "#e8e4dc",
    btnFill: "#1e1e1d", btnStroke: "#3c3c3a", icon: "#e8e4dc",
    screen: "#060606", screenStroke: "#2b2b2a", tick: "#3c3c3a", bar: "#31312f",
    label: "#5a5a57",
  },
  bone: {
    plate: "#1a1918", plateStroke: "#2a2926",
    panelTop: "#e2dccf", panelBot: "#d0c9bb", panelStroke: "#b5ae9e", edgeHi: "#f3eee3",
    padFill: "#c7c0b1", padStroke: "#ada595", padHi: "#ded7c9",
    knobA: "#f0eadf", knobB: "#d5cec0", knobStroke: "#a9a291", ind: "#262523",
    btnFill: "#d4cdbf", btnStroke: "#a9a291", icon: "#262523",
    screen: "#070707", screenStroke: "#2a2a28", tick: "#3c3c3a", bar: "#31312f",
    label: "#8d8676",
  },
};

const amber = "#e5a73f", amberEdge = "#b9862c", amberDim = "#5c4420", amberDimEdge = "#7a5b2a";

function deck(finishName, viewBox, title, extra = "") {
  const F = finishes[finishName];
  const id = `${finishName}-${viewBox.replace(/\s+/g, "_")}`;
  const parts = [];
  parts.push(`<rect x="8" y="8" width="584" height="384" rx="28" fill="${F.plate}" stroke="${F.plateStroke}"/>`);
  parts.push(`<rect x="18" y="18" width="564" height="364" rx="20" fill="url(#panel-${id})" stroke="${F.panelStroke}"/>`);
  parts.push(`<path d="M44 18.5H556" stroke="${F.edgeHi}" stroke-opacity=".7"/>`);
  // display
  parts.push(`<rect x="40" y="40" width="300" height="72" rx="8" fill="${F.screen}" stroke="${F.screenStroke}"/>`);
  const heights = [10, 18, 26, 14, 30, 22, 12, 28, 20, 16, 26, 10, 18, 24];
  heights.forEach((h, i) => {
    const x = 54 + i * 12;
    parts.push(`<rect x="${x}" y="${84 - h}" width="6" height="${h}" rx="1" fill="${F.bar}"/>`);
  });
  for (let i = 0; i < 16; i++) {
    const x = 54 + i * 17.6;
    const lit = i === 5;
    parts.push(`<rect x="${x.toFixed(1)}" y="94" width="10" height="3" rx="1" fill="${lit ? amber : F.tick}"/>`);
  }
  parts.push(`<rect x="256" y="52" width="46" height="5" rx="1.5" fill="${F.tick}"/>`);
  parts.push(`<rect x="256" y="62" width="28" height="5" rx="1.5" fill="${F.tick}"/>`);
  parts.push(`<rect x="292" y="62" width="10" height="5" rx="1.5" fill="${F.tick}"/>`);
  // transport
  parts.push(`<circle cx="380" cy="76" r="18" fill="${F.btnFill}" stroke="${F.btnStroke}"/>`);
  parts.push(`<path d="M375 68v16l14-8z" fill="${F.icon}"/>`);
  parts.push(`<rect x="418" y="58" width="36" height="36" rx="10" fill="${F.btnFill}" stroke="${F.btnStroke}"/>`);
  parts.push(`<rect x="429" y="69" width="14" height="14" rx="2" fill="${F.icon}"/>`);
  parts.push(`<circle cx="494" cy="76" r="18" fill="${F.btnFill}" stroke="${F.btnStroke}"/>`);
  parts.push(`<circle cx="494" cy="76" r="6" fill="${F.icon}"/>`);
  parts.push(`<rect x="530" y="58" width="36" height="16" rx="5" fill="${F.btnFill}" stroke="${F.btnStroke}"/>`);
  parts.push(`<rect x="530" y="78" width="36" height="16" rx="5" fill="${F.btnFill}" stroke="${F.btnStroke}"/>`);
  // knobs
  const angles = [-100, -40, 20, 60, -70, 110, 0, -20];
  angles.forEach((a, i) => {
    const cx = 66 + i * 66.8, cy = 158, r = 24;
    const rad = (a * Math.PI) / 180;
    const x1 = cx + Math.sin(rad) * 8, y1 = cy - Math.cos(rad) * 8;
    const x2 = cx + Math.sin(rad) * 18, y2 = cy - Math.cos(rad) * 18;
    parts.push(`<circle cx="${cx.toFixed(1)}" cy="${cy}" r="${r}" fill="url(#knob-${id})" stroke="${F.knobStroke}"/>`);
    parts.push(`<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${F.ind}" stroke-width="3" stroke-linecap="round"/>`);
    parts.push(`<circle cx="${cx.toFixed(1)}" cy="${cy + 33}" r="1.6" fill="${F.label}"/>`);
  });
  // pads
  const litSteps = new Set([0, 4, 8, 12]);
  const current = 5;
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 8; i++) {
      const step = row * 8 + i;
      const x = 36 + i * 66, y = row ? 290 : 206;
      let fill = F.padFill, stroke = F.padStroke, hi = F.padHi;
      if (litSteps.has(step)) { fill = amber; stroke = amberEdge; hi = "#f2c46c"; }
      else if (step === current) { fill = amberDim; stroke = amberDimEdge; hi = "#7d5f2d"; }
      parts.push(`<rect x="${x}" y="${y}" width="58" height="72" rx="7" fill="${fill}" stroke="${stroke}"/>`);
      parts.push(`<path d="M${x + 9} ${y + 1.5}H${x + 49}" stroke="${hi}" stroke-opacity=".9"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-labelledby="title-${id}">
<title id="title-${id}">${title}</title>
<defs>
<linearGradient id="panel-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${F.panelTop}"/><stop offset="1" stop-color="${F.panelBot}"/></linearGradient>
<radialGradient id="knob-${id}" cx=".38" cy=".32" r=".75"><stop offset="0" stop-color="${F.knobA}"/><stop offset="1" stop-color="${F.knobB}"/></radialGradient>
</defs>
${parts.join("\n")}${extra}
</svg>
`;
}

function back(finishName) {
  const F = finishes[finishName];
  const parts = [];
  parts.push(`<rect x="8" y="14" width="584" height="112" rx="16" fill="${F.plate}" stroke="${F.plateStroke}"/>`);
  parts.push(`<rect x="18" y="24" width="564" height="92" rx="10" fill="url(#panel-back)" stroke="${F.panelStroke}"/>`);
  // power switch
  parts.push(`<rect x="44" y="58" width="34" height="18" rx="4" fill="${F.screen}" stroke="${F.screenStroke}"/>`);
  parts.push(`<rect x="47" y="61" width="14" height="12" rx="2" fill="${F.btnFill}"/>`);
  // usb-c
  parts.push(`<rect x="104" y="60" width="30" height="13" rx="6.5" fill="${F.screen}" stroke="${F.screenStroke}"/>`);
  // midi in / out (5 pin)
  [176, 236].forEach((cx) => {
    parts.push(`<circle cx="${cx}" cy="70" r="20" fill="${F.screen}" stroke="${F.screenStroke}"/>`);
    [-58, -29, 0, 29, 58].forEach((deg) => {
      const rad = ((deg - 90) * Math.PI) / 180;
      parts.push(`<circle cx="${(cx + Math.cos(rad) * 11).toFixed(1)}" cy="${(70 + Math.sin(rad) * 11).toFixed(1)}" r="2.2" fill="${F.tick}"/>`);
    });
  });
  // cv out x2, clock in/out (3.5 mm jacks)
  [300, 348, 412, 460].forEach((cx) => {
    parts.push(`<circle cx="${cx}" cy="70" r="12" fill="${F.btnFill}" stroke="${F.btnStroke}"/>`);
    parts.push(`<circle cx="${cx}" cy="70" r="5" fill="${F.screen}"/>`);
  });
  // headphone jack, larger
  parts.push(`<circle cx="530" cy="70" r="15" fill="${F.btnFill}" stroke="${F.btnStroke}"/>`);
  parts.push(`<circle cx="530" cy="70" r="6.5" fill="${F.screen}"/>`);
  // label stand-ins
  [[44, 34], [104, 20], [156, 40], [216, 40], [288, 24], [336, 24], [400, 24], [448, 24], [515, 30]].forEach(([x, w]) => {
    parts.push(`<rect x="${x}" y="98" width="${w}" height="4" rx="1.5" fill="${F.label}"/>`);
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 140" role="img" aria-labelledby="title-back">
<title id="title-back">The back of Deck: power, USB, MIDI in and out, two CV outputs, clock in and out, and a headphone jack</title>
<defs><linearGradient id="panel-back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${F.panelTop}"/><stop offset="1" stop-color="${F.panelBot}"/></linearGradient></defs>
${parts.join("\n")}
</svg>
`;
}

const files = {
  "deck-graphite.svg": deck("graphite", "0 0 600 400", "Deck in graphite, seen from above: a display, transport buttons, eight knobs and sixteen pads"),
  "deck-bone.svg": deck("bone", "0 0 600 400", "Deck in bone, seen from above: a display, transport buttons, eight knobs and sixteen pads"),
  "detail-pads.svg": deck("graphite", "28 198 276 184", "Close view of the first four pads in both rows, with the first and fifth steps lit"),
  "detail-knobs.svg": deck("graphite", "36 110 276 184", "Close view of four knobs above the first row of pads"),
  "detail-display.svg": deck("graphite", "30 28 322 215", "Close view of the display and the play button"),
  "detail-pattern.svg": deck("graphite", "26 196 548 190", "All sixteen pads with a four-to-the-floor pattern lit on steps one, five, nine and thirteen"),
  "deck-back.svg": back("graphite"),
};
for (const [name, svg] of Object.entries(files)) {
  writeFileSync(OUT + name, svg);
  console.log(name, svg.length, "bytes");
}
