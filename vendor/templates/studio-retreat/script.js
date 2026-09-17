// Strand: season switcher (WAI-ARIA tabs) and the small-screen menu. No dependencies.
(function () {
  var tablist = document.querySelector('.season-switch[role="tablist"]');
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var select = function (tab, focus) {
      tabs.forEach(function (item) {
        var active = item === tab;
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
        var panel = document.getElementById(item.getAttribute('aria-controls'));
        if (panel) panel.hidden = !active;
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (event) {
        var next = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = tabs[(index + 1) % tabs.length];
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = tabs[(index - 1 + tabs.length) % tabs.length];
        else if (event.key === 'Home') next = tabs[0];
        else if (event.key === 'End') next = tabs[tabs.length - 1];
        if (next) { event.preventDefault(); select(next, true); }
      });
    });
    var initial = tabs.filter(function (tab) { return tab.getAttribute('aria-selected') === 'true'; })[0] || tabs[0];
    if (initial) select(initial, false);
  }

  var menu = document.getElementById('menu');
  var toggle = document.querySelector('.menu-toggle');
  if (menu && toggle && typeof menu.showModal === 'function') {
    toggle.addEventListener('click', function () { menu.showModal(); });
    menu.querySelectorAll('.menu-close, nav a').forEach(function (element) {
      element.addEventListener('click', function () { menu.close(); });
    });
  }
})();
