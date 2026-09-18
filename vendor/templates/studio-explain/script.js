/* Threshold, a Plotform studio edition.

   Two figures, written in plain JavaScript against the SVG in the page. No
   chart library, no framework, no dependency of any kind. Every number comes
   from model.js, which is loaded first.

   The chaptered reading, and the idea of swapping one small widget per step
   rather than writing another paragraph, are adapted from ncase/trust by
   Nicky Case (CC0). The figures themselves, the way a chart is drawn from the
   numbers as SVG and the hand drawn annotation arrow, follow roadtolarissa by
   Adam Pearce (MIT).

   Both figures work from the keyboard, both announce their state, and both
   keep a visible sentence saying what they currently show. With JavaScript
   switched off the page still carries every drawing and every number,
   because tools/build-pages.mjs writes the opening state into the HTML. */

/* ---- shared drawing, also read by tools/build-pages.mjs ---- */
var GEOMETRY = {
  plot: {
    width: 760,
    height: 360,
    left: 22,
    right: 738,
    top: 44,
    bottom: 300,
    markerSize: 13,
    markedMinutes: [0, 60, 120, 180, 240],
  },
  timeline: {
    width: 760,
    height: 172,
    left: 22,
    right: 738,
    hourTop: 16,
    plannedY: 20,
    actualY: 80,
    laneHeight: 34,
    axisY: 138,
  },
};

var DRAW = {
  round: function (value) {
    return Math.round(value * 100) / 100;
  },

  /* Figure one: load across the width, minutes of waiting up the page. */
  plotX: function (load) {
    var g = GEOMETRY.plot;
    var c = FIGURES.counter;
    return g.left + ((load - c.lowestLoad) / (100 - c.lowestLoad)) * (g.right - g.left);
  },
  plotY: function (minutes) {
    var g = GEOMETRY.plot;
    var top = FIGURES.counter.chartTopMinutes;
    var value = Math.max(0, Math.min(minutes, top));
    return g.bottom - (value / top) * (g.bottom - g.top);
  },
  curvePath: function () {
    var c = FIGURES.counter;
    var points = [];
    for (var load = c.lowestLoad; load <= 100.0001; load += 0.25) {
      var wait = c.waitMinutes(load);
      if (wait > c.chartTopMinutes) break;
      points.push(DRAW.round(DRAW.plotX(load)) + "," + DRAW.round(DRAW.plotY(wait)));
    }
    return "M " + points.join(" L ");
  },

  /* A swooping annotation arrow: one quadratic curve bent off the straight
     line between two points, with a head aimed along the tangent. */
  swoopPath: function (x1, y1, x2, y2, bend) {
    var cx = (x1 + x2) / 2 + (y2 - y1) * bend;
    var cy = (y1 + y2) / 2 - (x2 - x1) * bend;
    return (
      "M " + DRAW.round(x1) + "," + DRAW.round(y1) +
      " Q " + DRAW.round(cx) + "," + DRAW.round(cy) +
      " " + DRAW.round(x2) + "," + DRAW.round(y2)
    );
  },
  swoopHead: function (x1, y1, x2, y2, bend, size) {
    var cx = (x1 + x2) / 2 + (y2 - y1) * bend;
    var cy = (y1 + y2) / 2 - (x2 - x1) * bend;
    var dx = x2 - cx;
    var dy = y2 - cy;
    var length = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= length;
    dy /= length;
    var baseX = x2 - dx * size;
    var baseY = y2 - dy * size;
    var wing = size * 0.42;
    return [
      DRAW.round(x2) + "," + DRAW.round(y2),
      DRAW.round(baseX - dy * wing) + "," + DRAW.round(baseY + dx * wing),
      DRAW.round(baseX + dy * wing) + "," + DRAW.round(baseY - dx * wing),
    ].join(" ");
  },
  /* Where the annotation on the counter chart starts and ends. */
  annotation: function () {
    var c = FIGURES.counter;
    var knee = c.kneeLoad;
    return {
      fromX: DRAW.plotX(knee) - 170,
      fromY: DRAW.plotY(c.chartTopMinutes * 0.46),
      toX: DRAW.plotX(knee) - 9,
      toY: DRAW.plotY(c.waitMinutes(knee)) + 6,
      bend: 0.24,
    };
  },

  /* Figure two: minutes of the morning across the width. */
  timeX: function (minute) {
    var g = GEOMETRY.timeline;
    var m = FIGURES.morning;
    var span = m.chartEndMinute - m.firstAppointmentMinute;
    return g.left + ((minute - m.firstAppointmentMinute) / span) * (g.right - g.left);
  },
  /* One slot in the "what happened" lane. */
  actualBlock: function (step) {
    var m = FIGURES.morning;
    var startMinute = step.free ? step.planned : step.planned + step.wait;
    var lengthMinutes = step.free
      ? m.minutesPerAppointment
      : m.minutesPerAppointment + m.overrunMinutes[step.slot];
    return {
      x: DRAW.timeX(startMinute),
      width: DRAW.timeX(startMinute + lengthMinutes) - DRAW.timeX(startMinute),
    };
  },
  clockLabel: function (minute) {
    var hour = Math.floor(minute / 60);
    var rest = Math.round(minute % 60);
    return (hour < 10 ? "0" : "") + hour + ":" + (rest < 10 ? "0" : "") + rest;
  },
  plural: function (count, one, many) {
    return count === 1 ? one : many;
  },
};
/* ---- end shared drawing ---- */

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var sideBySide = window.matchMedia("(min-width: 900px)");

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  /* ================================================================
     Figure one: one counter, and the queue behind it
     ================================================================ */

  var counterFigure = document.getElementById("figure-counter");
  if (counterFigure) {
    var input = document.getElementById("counter-input");
    var curve = document.getElementById("counter-curve");
    var markerLine = document.getElementById("counter-marker-line");
    var markerDot = document.getElementById("counter-marker-dot");
    var arrowPath = document.getElementById("counter-arrow");
    var arrowHead = document.getElementById("counter-arrow-head");
    var peeps = Array.prototype.slice.call(
      counterFigure.querySelectorAll("[data-peep]")
    );
    var readerHasTakenOver = false;

    /* Redraw from model.js, so that changing a number there changes the
       drawing rather than only the readout. */
    if (curve) curve.setAttribute("d", DRAW.curvePath());
    if (arrowPath && arrowHead) {
      var note = DRAW.annotation();
      arrowPath.setAttribute(
        "d",
        DRAW.swoopPath(note.fromX, note.fromY, note.toX, note.toY, note.bend)
      );
      arrowHead.setAttribute(
        "points",
        DRAW.swoopHead(note.fromX, note.fromY, note.toX, note.toY, note.bend, 11)
      );
    }
    if (input) {
      input.min = String(FIGURES.counter.lowestLoad);
      input.max = String(FIGURES.counter.highestLoad);
    }

    var renderCounter = function (load) {
      var c = FIGURES.counter;
      var wait = c.waitMinutes(load);
      var queue = c.peopleWaiting(load);
      var waitMinutes = Math.round(wait);
      var queuePeople = Math.round(queue);
      var drawn = Math.min(queuePeople, c.mostPeopleDrawn);

      if (markerLine) {
        markerLine.setAttribute("x1", String(DRAW.round(DRAW.plotX(load))));
        markerLine.setAttribute("x2", String(DRAW.round(DRAW.plotX(load))));
        markerLine.setAttribute("y1", String(DRAW.round(DRAW.plotY(wait))));
        markerLine.setAttribute("y2", String(GEOMETRY.plot.bottom));
      }
      if (markerDot) {
        var size = GEOMETRY.plot.markerSize;
        markerDot.setAttribute("x", String(DRAW.round(DRAW.plotX(load) - size / 2)));
        markerDot.setAttribute("y", String(DRAW.round(DRAW.plotY(wait) - size / 2)));
      }

      peeps.forEach(function (peep, index) {
        peep.hidden = index >= drawn;
      });

      setText("counter-wait", waitMinutes + " " + DRAW.plural(waitMinutes, "minute", "minutes"));
      setText("counter-queue", String(queuePeople));
      setText(
        "counter-load",
        load + " of 100"
      );
      setText(
        "queue-caption",
        queuePeople === 0
          ? "Waiting: usually nobody"
          : queuePeople > c.mostPeopleDrawn
            ? "Waiting: about " + queuePeople + " people, the first " + c.mostPeopleDrawn + " of them drawn"
            : "Waiting: about " + queuePeople + " " + DRAW.plural(queuePeople, "person", "people")
      );

      var queuePhrase =
        queuePeople === 0
          ? "the queue is usually empty"
          : "about " + queuePeople + " " +
            DRAW.plural(queuePeople, "person is", "people are") + " in the queue";
      var sentence =
        "With " + load + " minutes of every 100 already booked, the average person waits " +
        waitMinutes + " " + DRAW.plural(waitMinutes, "minute", "minutes") + " and " +
        queuePhrase + ". One visit takes " + c.minutesPerVisit + " minutes.";
      setText("counter-summary", sentence);

      if (input) {
        input.setAttribute(
          "aria-valuetext",
          load + " out of 100 booked. Average wait " + waitMinutes + " " +
            DRAW.plural(waitMinutes, "minute", "minutes") + ", " +
            (queuePeople === 0
              ? "the queue usually empty."
              : "about " + queuePeople + " " +
                DRAW.plural(queuePeople, "person", "people") + " waiting.")
        );
      }
    };

    if (input) {
      input.addEventListener("input", function () {
        readerHasTakenOver = true;
        renderCounter(Number(input.value));
      });
      renderCounter(Number(input.value));
    }

    /* The three steps beside the figure move it, until the reader does. */
    var steps = Array.prototype.slice.call(
      document.querySelectorAll("[data-step-load]")
    );
    var showStep = function (step) {
      steps.forEach(function (other) {
        other.setAttribute("data-active", other === step ? "true" : "false");
      });
      counterFigure.setAttribute(
        "data-annotation",
        step.getAttribute("data-step-annotation") === "on" ? "on" : "off"
      );
      if (readerHasTakenOver || reducedMotion.matches || !sideBySide.matches) return;
      if (input) {
        input.value = step.getAttribute("data-step-load");
        renderCounter(Number(input.value));
      }
    };

    if (steps.length && "IntersectionObserver" in window) {
      var stepObserver = new IntersectionObserver(
        function (entries) {
          if (reducedMotion.matches) return;
          entries.forEach(function (entry) {
            if (entry.isIntersecting) showStep(entry.target);
          });
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
      );
      steps.forEach(function (step) {
        stepObserver.observe(step);
      });
    }
  }

  /* ================================================================
     Figure two: a morning of appointments, slot by slot
     ================================================================ */

  var morningFigure = document.getElementById("figure-morning");
  if (morningFigure) {
    var timeline = document.getElementById("morning-timeline");
    var actualRects = Array.prototype.slice.call(
      morningFigure.querySelectorAll("[data-actual-slot]")
    );
    var plannedRects = Array.prototype.slice.call(
      morningFigure.querySelectorAll("[data-planned-slot]")
    );
    var dropLine = document.getElementById("morning-drop");
    var modeButtons = Array.prototype.slice.call(
      morningFigure.querySelectorAll("[data-mode-value]")
    );
    var slotCount = FIGURES.morning.overrunMinutes.length;
    var currentStep = 0;
    var keepSlotsFree = false;

    var renderMorning = function () {
      var walk = FIGURES.morning.walk(keepSlotsFree);
      var step = walk[currentStep];
      var g = GEOMETRY.timeline;

      if (timeline) timeline.setAttribute("data-mode", keepSlotsFree ? "keep" : "packed");

      actualRects.forEach(function (rect, index) {
        var entry = walk[index];
        var block = DRAW.actualBlock(entry);
        rect.setAttribute("x", String(DRAW.round(block.x)));
        rect.setAttribute("width", String(DRAW.round(block.width)));
        rect.setAttribute("data-free", entry.free ? "true" : "false");
        rect.setAttribute(
          "data-state",
          index < currentStep ? "past" : index === currentStep ? "current" : "future"
        );
      });
      plannedRects.forEach(function (rect, index) {
        rect.setAttribute(
          "data-state",
          index < currentStep ? "past" : index === currentStep ? "current" : "future"
        );
      });

      if (dropLine) {
        var block = DRAW.actualBlock(step);
        var plannedMiddle = DRAW.timeX(step.planned + FIGURES.morning.minutesPerAppointment / 2);
        dropLine.setAttribute("x1", String(DRAW.round(plannedMiddle)));
        dropLine.setAttribute("y1", String(g.plannedY + g.laneHeight));
        dropLine.setAttribute("x2", String(DRAW.round(block.x + block.width / 2)));
        dropLine.setAttribute("y2", String(g.actualY));
      }

      setText("morning-people", String(step.peopleSoFar));
      setText("morning-waited", step.waitedSoFar + " " + DRAW.plural(step.waitedSoFar, "minute", "minutes"));
      setText("morning-longest", step.longestSoFar + " " + DRAW.plural(step.longestSoFar, "minute", "minutes"));

      var sentence;
      if (step.free) {
        sentence =
          "Slot " + (currentStep + 1) + " of " + slotCount + ", planned for " +
          DRAW.clockLabel(step.planned) + ", left empty on purpose. Lateness carried in from earlier " +
          "dies in this gap, so the next person starts on time. So far " + step.peopleSoFar +
          " " + DRAW.plural(step.peopleSoFar, "person has", "people have") + " been seen and " +
          step.waitedSoFar + " " + DRAW.plural(step.waitedSoFar, "minute", "minutes") + " of waiting has been spent.";
      } else {
        sentence =
          "Slot " + (currentStep + 1) + " of " + slotCount + ", planned for " +
          DRAW.clockLabel(step.planned) + ", seen at " + DRAW.clockLabel(step.seenAt) +
          " after waiting " + step.wait + " " + DRAW.plural(step.wait, "minute", "minutes") +
          ". This visit ran over by " + FIGURES.morning.overrunMinutes[step.slot] +
          " " + DRAW.plural(FIGURES.morning.overrunMinutes[step.slot], "minute", "minutes") +
          ". So far " + step.peopleSoFar + " " +
          DRAW.plural(step.peopleSoFar, "person has", "people have") + " been seen and " +
          step.waitedSoFar + " " + DRAW.plural(step.waitedSoFar, "minute", "minutes") +
          " of waiting has been spent.";
      }
      setText("morning-summary", sentence);

      if (timeline) {
        timeline.setAttribute(
          "aria-label",
          "A morning of " + slotCount + " slots drawn twice, as planned and as it happened. " + sentence
        );
      }

      modeButtons.forEach(function (button) {
        var value = button.getAttribute("data-mode-value");
        button.setAttribute(
          "aria-pressed",
          (value === "keep") === keepSlotsFree ? "true" : "false"
        );
      });
    };

    var goTo = function (index) {
      var next = Math.max(0, Math.min(index, slotCount - 1));
      if (next === currentStep) return;
      currentStep = next;
      renderMorning();
    };

    morningFigure.addEventListener("click", function (event) {
      var target = event.target;
      if (!target || !target.closest) return;
      var mover = target.closest("[data-step-move]");
      if (mover) {
        goTo(currentStep + Number(mover.getAttribute("data-step-move")));
        return;
      }
      var mode = target.closest("[data-mode-value]");
      if (mode) {
        keepSlotsFree = mode.getAttribute("data-mode-value") === "keep";
        renderMorning();
      }
    });

    morningFigure.addEventListener("keydown", function (event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        goTo(currentStep + 1);
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        goTo(currentStep - 1);
      } else if (event.key === "Home") {
        goTo(0);
      } else if (event.key === "End") {
        goTo(slotCount - 1);
      } else {
        return;
      }
      event.preventDefault();
    });

    renderMorning();
  }

  /* ================================================================
     The chapter rail, adapted from the chapter dots in ncase/trust
     ================================================================ */

  var railLinks = Array.prototype.slice.call(
    document.querySelectorAll("[data-rail-for]")
  );
  if (railLinks.length && "IntersectionObserver" in window) {
    var mark = function (id) {
      railLinks.forEach(function (link) {
        if (link.getAttribute("data-rail-for") === id) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };
    var chapterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) mark(entry.target.id);
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
    );
    railLinks.forEach(function (link) {
      var section = document.getElementById(link.getAttribute("data-rail-for"));
      if (section) chapterObserver.observe(section);
    });
  }
})();
