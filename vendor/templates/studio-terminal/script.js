/* Bevel: the one script this edition ships. No dependencies, no network calls,
   no storage. It drives the tabbed properties panels; the navigator tree and
   the question list are native details elements, which the browser already
   makes keyboard operable. */
(function () {
  "use strict";

  function setupTabs(tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    if (tabs.length < 2) return;

    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute("aria-controls"));
    });

    function select(index, moveFocus) {
      tabs.forEach(function (tab, i) {
        var selected = i === index;
        tab.setAttribute("aria-selected", selected ? "true" : "false");
        tab.tabIndex = selected ? 0 : -1;
        if (panels[i]) panels[i].hidden = !selected;
      });
      if (moveFocus) tabs[index].focus();
    }

    var start = tabs.findIndex(function (tab) {
      return tab.getAttribute("aria-selected") === "true";
    });
    select(start < 0 ? 0 : start, false);

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        select(index, false);
      });

      tab.addEventListener("keydown", function (event) {
        var last = tabs.length - 1;
        var next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") next = index === last ? 0 : index + 1;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = index === 0 ? last : index - 1;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = last;
        if (next === null) return;
        event.preventDefault();
        select(next, true);
      });
    });
  }

  function ready() {
    Array.prototype.forEach.call(document.querySelectorAll('[role="tablist"]'), setupTabs);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
