/* Light/dark switch. The inline script in each <head> has already written data-theme on <html>
   (saved choice, otherwise the system setting), so the page paints in the right theme. This adds the
   button: an explicit choice is applied at once and remembered in localStorage ("abbydavid-theme").
   Until a choice is made, the page keeps following the system setting. */
(function () {
  var KEY = "abbydavid-theme";
  var root = document.documentElement;
  var btn = document.querySelector(".theme-toggle");
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  var COLORS = { light: "#f4eee1", dark: "#181512" };

  function saved() {
    try { var t = localStorage.getItem(KEY); return t === "light" || t === "dark" ? t : null; } catch (e) { return null; }
  }
  function apply(t) {
    root.setAttribute("data-theme", t);
    root.style.colorScheme = t;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", COLORS[t]);
    if (btn) {
      btn.setAttribute("aria-checked", t === "dark" ? "true" : "false");
      var state = btn.querySelector(".state");
      if (state) state.textContent = t === "dark" ? "On" : "Off";
    }
  }
  function current() { return root.getAttribute("data-theme") === "dark" ? "dark" : "light"; }

  if (btn) {
    var state = document.createElement("span");
    state.className = "state";
    state.setAttribute("aria-hidden", "true");
    btn.insertBefore(state, btn.querySelector(".track"));
    btn.hidden = false;
    btn.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem(KEY, next); } catch (e) { /* private mode: the choice lasts for this visit */ }
    });
  }

  function onSystemChange(e) { if (!saved()) apply(e.matches ? "dark" : "light"); }
  if (mq) {
    if (mq.addEventListener) mq.addEventListener("change", onSystemChange);
    else if (mq.addListener) mq.addListener(onSystemChange);
  }

  // Pages restored from the back/forward cache keep their old DOM, so re-read the saved choice.
  window.addEventListener("pageshow", function () { apply(saved() || (mq && mq.matches ? "dark" : "light")); });
  apply(saved() || (mq && mq.matches ? "dark" : "light"));
})();
