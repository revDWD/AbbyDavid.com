/* Light/dark switch. The page already follows the system setting through CSS; this only adds a manual
   override, remembered in localStorage ("abbydavid-theme": "light" | "dark"). The tiny inline script in
   each <head> applies a saved choice before first paint so there is no flash of the wrong theme. */
(function () {
  var KEY = "abbydavid-theme";
  var root = document.documentElement;
  var btn = document.querySelector(".theme-toggle");
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : { matches: false };
  var COLORS = { light: "#f4eee1", dark: "#181512" };

  function current() {
    var t = root.dataset.theme;
    return t === "light" || t === "dark" ? t : mq.matches ? "dark" : "light";
  }
  function sync() {
    var t = current(), meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", COLORS[t]);
    if (btn) btn.setAttribute("aria-checked", t === "dark" ? "true" : "false");
  }

  if (btn) {
    btn.hidden = false;
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem(KEY, next); } catch (e) { /* private mode: the choice just lasts for this visit */ }
      sync();
    });
  }
  if (mq.addEventListener) mq.addEventListener("change", sync);
  sync();
})();
