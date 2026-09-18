/*
 * Plenum, a Plotform studio edition.
 *
 * Renders tools/programme-data.json into the time grid inside programme.html and
 * into the placement classes inside style.css. Both regions are bounded by
 * markers, so everything written by hand around them survives a rebuild.
 *
 *   node tools/build-programme.mjs
 *
 * No dependencies. The single schedule data file is the one idea borrowed from
 * jekyll-theme-conference (_data/program.yml); the renderer and the markup below
 * are written for this edition.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const data = JSON.parse(readFileSync(join(here, "programme-data.json"), "utf8"));
const slot = data.slotMinutes;

const minutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const clock = (total) => {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
};
const escape = (value) =>
  String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const trackName = (id) => (data.tracks.find((t) => t.id === id) || { name: "Break" }).name;

/* Each day gets its own bounds, rounded out to the hour, so a short day is a
 * short grid rather than a tall one with empty ends. */
function bounds(day) {
  const starts = day.sessions.map((s) => minutes(s.start));
  const ends = day.sessions.map((s) => minutes(s.end));
  const from = Math.floor(Math.min(...starts) / 60) * 60;
  const to = Math.ceil(Math.max(...ends) / 60) * 60;
  return { from, to, rows: (to - from) / slot };
}

const maxSpan = { value: 1 };
const maxRow = { value: 1 };
const maxCol = { value: 1 };

function renderDay(day, index) {
  const { from, to } = bounds(day);
  const cols = day.rooms.length;
  maxCol.value = Math.max(maxCol.value, cols);
  const lines = [];
  const selected = index === 0;

  lines.push(
    `<section class="panel" id="${day.id}" role="tabpanel" aria-labelledby="tab-${day.id}" data-day="${day.id}"${selected ? "" : " hidden"}>`,
  );
  lines.push(`<div class="panel-head">`);
  lines.push(`<h2 class="panel-title"><span class="panel-weekday">${escape(day.name)}</span><span class="panel-date">${escape(day.date)}</span></h2>`);
  lines.push(`<p class="panel-note">${escape(day.note)}</p>`);
  lines.push(`</div>`);
  lines.push(`<div class="grid cols-${cols}">`);

  // Hour rules first, so every card paints over them.
  for (let t = from; t < to; t += 60) {
    const row = (t - from) / slot + 2;
    maxRow.value = Math.max(maxRow.value, row + 4);
    lines.push(`<div class="hour-rule r-${row} s-4" role="presentation"></div>`);
  }

  // Room names across the head of the grid.
  lines.push(`<div class="grid-corner r-1 s-1 c-time" role="presentation"></div>`);
  day.rooms.forEach((room, i) => {
    lines.push(
      `<a class="room r-1 s-1 c-${i + 1}" href="venue.html#${escape(room.anchor)}">${escape(room.name)}</a>`,
    );
  });

  // Hour marks down the gutter.
  for (let t = from; t < to; t += 60) {
    const row = (t - from) / slot + 2;
    lines.push(`<span class="tick r-${row} s-4 c-time">${clock(t)}</span>`);
  }

  // Sessions, in clock order, so the grid reads top to bottom once it collapses
  // into a single column on a narrow screen.
  const ordered = [...day.sessions].sort((a, b) => {
    const d = minutes(a.start) - minutes(b.start);
    if (d) return d;
    const ra = a.room === "all" ? -1 : a.room;
    const rb = b.room === "all" ? -1 : b.room;
    return ra - rb;
  });

  for (const s of ordered) {
    const row = (minutes(s.start) - from) / slot + 2;
    const span = (minutes(s.end) - minutes(s.start)) / slot;
    maxSpan.value = Math.max(maxSpan.value, span);
    maxRow.value = Math.max(maxRow.value, row + span);
    const column = s.room === "all" ? "c-all" : `c-${s.room + 1}`;
    const room = s.room === "all" ? null : day.rooms[s.room];
    const classes = ["session", `t-${s.track}`, `r-${row}`, `s-${span}`, column].join(" ");
    const label = `${s.start} to ${s.end}${room ? ", " + room.name : ""}, ${trackName(s.track)}`;

    lines.push(`<article class="${classes}" data-track="${s.track}" aria-label="${escape(label)}">`);
    lines.push(
      `<p class="session-time"><span class="time-from">${s.start}</span><span class="time-join">to</span><span class="time-to">${s.end}</span><span class="session-track">${escape(trackName(s.track))}</span></p>`,
    );
    if (s.href) {
      lines.push(`<h3 class="session-title"><a href="${escape(s.href)}">${escape(s.title)}</a></h3>`);
    } else {
      lines.push(`<h3 class="session-title">${escape(s.title)}</h3>`);
    }
    if (s.by) lines.push(`<p class="session-by">${escape(s.by)}</p>`);
    // The room is named at the head of its column on a wide screen, so this line
    // is hidden there and carries the room once the columns are gone.
    if (room) {
      lines.push(
        `<p class="session-where"><a class="session-room" href="venue.html#${escape(room.anchor)}">${escape(room.name)}</a></p>`,
      );
    }
    lines.push(`</article>`);
  }

  lines.push(`</div>`);
  lines.push(`</section>`);
  return lines.join("\n");
}

const tabs = data.days
  .map(
    (day, i) =>
      `<button class="daytab" type="button" role="tab" id="tab-${day.id}" aria-controls="${day.id}" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-day="${day.id}"><span class="daytab-weekday">${escape(day.name)}</span><span class="daytab-date">${escape(day.short)}</span></button>`,
  )
  .join("\n");

const filterButtons = [{ id: "all", name: "All" }, ...data.tracks]
  .map(
    (track, i) =>
      `<button class="filter" type="button" data-filter="${track.id}" aria-pressed="${i === 0}">${escape(track.name)}</button>`,
  )
  .join("\n");

// The status line is written out with the first day already counted, so the
// page reads correctly before the script has run.
const firstDay = data.days[0];
const firstCount = firstDay.sessions.filter((s) => s.track !== "break").length;
const controls = [
  `<div class="controls">`,
  `<div class="filters" role="group" aria-label="Filter the grid by track">`,
  filterButtons,
  `</div>`,
  `<p class="status" id="programme-status" role="status">${escape(firstDay.name)}: showing ${firstCount} of ${firstCount} sessions, all tracks</p>`,
  `</div>`,
].join("\n");

const panels = data.days.map(renderDay).join("\n\n");
const grid = `<div class="daytabs" role="tablist" aria-label="Congress days">\n${tabs}\n</div>\n\n${controls}\n\n${panels}`;

// Placement classes. Mechanical, so they are generated rather than hand kept.
const css = [];
css.push(`/* Generated by tools/build-programme.mjs. Placement only. */`);
for (let r = 1; r <= maxRow.value; r += 1) css.push(`.grid .r-${r}{grid-row-start:${r}}`);
for (let s = 1; s <= maxSpan.value; s += 1) css.push(`.grid .s-${s}{grid-row-end:span ${s}}`);
css.push(`.grid .c-time{grid-column:1}`);
for (let c = 1; c <= maxCol.value; c += 1) css.push(`.grid .c-${c}{grid-column:${c + 1}}`);
css.push(`.grid .c-all{grid-column:2 / -1}`);
for (let c = 1; c <= maxCol.value; c += 1) {
  css.push(`.grid.cols-${c}{--cols:${c}}`);
}

function replaceRegion(file, open, close, body) {
  const path = join(root, file);
  const text = readFileSync(path, "utf8");
  const start = text.indexOf(open);
  const end = text.indexOf(close);
  if (start < 0 || end < 0) throw new Error(`Markers ${open} and ${close} not found in ${file}`);
  const next = text.slice(0, start + open.length) + "\n" + body + "\n" + text.slice(end);
  writeFileSync(path, next);
  return next.length;
}

replaceRegion("programme.html", "<!-- grid:start -->", "<!-- grid:end -->", grid);
replaceRegion("style.css", "/* grid:start */", "/* grid:end */", css.join("\n"));
console.log(
  `Wrote ${data.days.length} days, ${data.days.reduce((n, d) => n + d.sessions.length, 0)} sessions, rows up to ${maxRow.value}.`,
);
