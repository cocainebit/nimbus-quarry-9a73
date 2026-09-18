/* Threshold, a Plotform studio edition.
   ==================================================================
   THE MODEL
   ==================================================================
   This file is the one place the figures get their numbers from. It is
   loaded before script.js on every page that carries a figure, and the
   page builder in tools/build-pages.mjs reads this same file, so the
   drawings, the readouts and the numbers written into the sentences
   cannot drift apart.

   Change a value here and both figures change. You do not need to read
   script.js to do it.

   None of these numbers were measured. They are illustrative, invented
   for this template, and every page says so. If you publish a version of
   this page, put your own numbers here and write your own notes page
   explaining where they came from.
   ================================================================== */

var FIGURES = {
  /* Figure one: one counter, and how long the queue behind it gets.
     "Load" is how much of the day is already booked, out of 100. */
  counter: {
    minutesPerVisit: 12, // how long one person takes at the counter
    lowestLoad: 40, // the left hand end of the slider and the chart
    highestLoad: 99, // the right hand end of the slider
    startingLoad: 70, // where the slider sits when the page opens
    chartTopMinutes: 240, // the top of the drawn chart, in minutes
    mostPeopleDrawn: 18, // how many little figures the queue can draw
    markedLoads: [40, 50, 60, 70, 80, 90, 100], // the labels under the chart
    kneeLoad: 95, // the load the third step of the essay points at
  },

  /* Figure two: a morning of appointments, and what one late visit does
     to everybody booked behind it. */
  morning: {
    firstAppointmentMinute: 480, // 480 minutes past midnight, so 08:00
    minutesPerAppointment: 20, // how long each appointment is meant to take
    appointmentsPerHour: 3, // three twenty minute slots fill an hour exactly
    freeSlotMinutes: 20, // how much delay an empty slot can absorb
    keepFreeEvery: 3, // in the kinder morning, one slot in every three is left empty
    overrunMinutes: [0, 5, 0, 10, 5, 0, 15, 0, 5, 10, 0, 5], // minutes each visit ran over
    chartEndMinute: 780, // the right hand end of the drawn timeline, so 13:00
  },
};

/* ==================================================================
   THE TWO RULES
   ==================================================================
   Two short pieces of arithmetic. They are textbook queue arithmetic
   for the simplest possible queue, not a finding, and they are written
   out in words on the notes page.
   ================================================================== */

/* How long the average person waits before reaching the counter. */
FIGURES.counter.waitMinutes = function (load) {
  var busy = load / 100;
  if (busy >= 1) return Infinity;
  return FIGURES.counter.minutesPerVisit * (busy / (1 - busy));
};

/* How many people are standing in the queue on average. */
FIGURES.counter.peopleWaiting = function (load) {
  var busy = load / 100;
  if (busy >= 1) return Infinity;
  return (busy * busy) / (1 - busy);
};

/* Walk one morning, slot by slot. Pass true to keep one slot in every
   few empty. Returns one entry per slot, in order. */
FIGURES.morning.walk = function (keepSlotsFree) {
  var m = FIGURES.morning;
  var steps = [];
  var delay = 0;
  var waited = 0;
  var seen = 0;
  var longest = 0;
  for (var i = 0; i < m.overrunMinutes.length; i += 1) {
    var planned = m.firstAppointmentMinute + i * m.minutesPerAppointment;
    var isFree = Boolean(keepSlotsFree) && (i + 1) % m.keepFreeEvery === 0;
    if (isFree) {
      delay = Math.max(0, delay - m.freeSlotMinutes);
      steps.push({
        slot: i,
        planned: planned,
        free: true,
        wait: 0,
        seenAt: null,
        delayAfter: delay,
        waitedSoFar: waited,
        peopleSoFar: seen,
        longestSoFar: longest,
      });
    } else {
      var wait = delay;
      waited += wait;
      seen += 1;
      if (wait > longest) longest = wait;
      delay += m.overrunMinutes[i];
      steps.push({
        slot: i,
        planned: planned,
        free: false,
        wait: wait,
        seenAt: planned + wait,
        delayAfter: delay,
        waitedSoFar: waited,
        peopleSoFar: seen,
        longestSoFar: longest,
      });
    }
  }
  return steps;
};

/* The whole morning in one line, for the sentences and the last panel. */
FIGURES.morning.total = function (keepSlotsFree) {
  var steps = FIGURES.morning.walk(keepSlotsFree);
  var last = steps[steps.length - 1];
  return {
    people: last.peopleSoFar,
    waited: last.waitedSoFar,
    longest: last.longestSoFar,
    steps: steps,
  };
};
