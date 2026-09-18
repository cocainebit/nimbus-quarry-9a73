/* Carafe, a Plotform studio edition.

   Four small behaviours, all plain DOM, all keyboard operable, none of them
   talking to a service:

   1. The navigation toggle on narrow screens. The aria contract follows
      AstroWind's Header.astro: one button that flips aria-expanded and an
      "is-open" class on the header.
   2. Today's line in the hours block. Each row carries the day numbers it
      covers, so the row for today is marked and a sentence is written from
      the rows themselves. Nothing is invented and no clock arithmetic is
      done: the page says what is printed in the table, for today.
   3. The menu filter, which hides dishes that are not vegetarian and any
      course left with nothing in it.
   4. The booking enquiry, which is not connected to anything. Submitting it
      says so rather than pretending to send. */

(function () {
  "use strict";

  var DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  /* ---- 1. The navigation on narrow screens ---- */

  var shopfront = document.querySelector("[data-shopfront]");
  var navToggle = document.querySelector("[data-nav-toggle]");
  if (shopfront && navToggle) {
    navToggle.addEventListener("click", function () {
      var open = shopfront.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.textContent = open ? "Close" : "Pages";
    });
  }

  /* ---- 2. Today, in the hours block ---- */

  var todayIndex = new Date().getDay();
  var rows = document.querySelectorAll("[data-days]");
  for (var i = 0; i < rows.length; i += 1) {
    var covered = (rows[i].getAttribute("data-days") || "").split(" ");
    if (covered.indexOf(String(todayIndex)) !== -1) {
      rows[i].setAttribute("data-today", "");
    }
  }

  function serviceToday(name) {
    var block = document.querySelector('[data-service="' + name + '"]');
    if (!block) return null;
    var row = block.querySelector("[data-today] .hours-time");
    if (!row) return null;
    return row.textContent.trim();
  }

  var lines = document.querySelectorAll("[data-today-line]");
  if (lines.length) {
    var kitchen = serviceToday("kitchen");
    var bar = serviceToday("bar");
    var open = [];
    if (kitchen && kitchen.toLowerCase().indexOf("closed") === -1) {
      open.push("the kitchen serves " + kitchen);
    }
    if (bar && bar.toLowerCase().indexOf("closed") === -1) {
      open.push("the bar is open " + bar);
    }
    var sentence = "Today is " + DAYS[todayIndex] + ". ";
    if (open.length === 0) {
      sentence += "We are closed all day.";
    } else if (open.length === 1) {
      sentence += open[0].charAt(0).toUpperCase() + open[0].slice(1) + ".";
    } else {
      sentence +=
        open[0].charAt(0).toUpperCase() +
        open[0].slice(1) +
        " and " +
        open[1] +
        ".";
    }
    for (var j = 0; j < lines.length; j += 1) {
      lines[j].textContent = sentence;
    }
  }

  /* ---- 3. The menu filter ---- */

  var filter = document.querySelector("[data-filter]");
  if (filter) {
    var dishes = Array.prototype.slice.call(
      document.querySelectorAll("[data-diet]"),
    );
    var courses = Array.prototype.slice.call(
      document.querySelectorAll("[data-course]"),
    );
    var status = document.getElementById("menu-status");

    var apply = function (value) {
      var shown = 0;
      dishes.forEach(function (dish) {
        var diet = dish.getAttribute("data-diet") || "";
        var match = value === "all" || diet.split(" ").indexOf(value) !== -1;
        dish.hidden = !match;
        if (match) shown += 1;
      });
      courses.forEach(function (course) {
        /* A course with nothing dietary in it, the wine, is never filtered. */
        if (!course.querySelectorAll("[data-diet]").length) return;
        var left = course.querySelectorAll("[data-diet]:not([hidden])").length;
        course.hidden = left === 0;
      });
      var buttons = filter.querySelectorAll("[data-filter-value]");
      for (var k = 0; k < buttons.length; k += 1) {
        buttons[k].setAttribute(
          "aria-pressed",
          buttons[k].getAttribute("data-filter-value") === value
            ? "true"
            : "false",
        );
      }
      if (status) {
        status.textContent =
          value === "all"
            ? "Showing all " + dishes.length + " items."
            : "Showing " + shown + " of " + dishes.length + " items.";
      }
    };

    filter.addEventListener("click", function (event) {
      var button = event.target.closest
        ? event.target.closest("[data-filter-value]")
        : null;
      if (!button) return;
      apply(button.getAttribute("data-filter-value"));
    });

    apply("all");
  }

  /* ---- 4. The booking enquiry, which is not connected ---- */

  var enquiry = document.querySelector("[data-enquiry]");
  if (enquiry) {
    enquiry.addEventListener("submit", function (event) {
      event.preventDefault();
      var said = document.getElementById("enquiry-status");
      if (said) {
        said.textContent =
          "Nothing was sent. This form is a demonstration and is not connected to any service. Send the same details to bookings@example.com and a person will answer.";
      }
    });
  }
})();
