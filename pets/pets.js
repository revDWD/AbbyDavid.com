/* The pets' living room. Plain JavaScript, no libraries, no backend.
   Visitors' data lives only in their own browser (localStorage).

   To add a real photo for a pet: put the file in /assets/pets/<name>/ and set `photo` below.
   To change a pet's pixel art, edit/replace /assets/pets/<name>.svg (8 frames of 32x24, two rows: right, left). */
(function () {
  "use strict";

  var PETS = [
    { id: "jack",     name: "Jack",     kind: "Chihuahua", species: "dog", photo: "" },
    { id: "albert",   name: "Albert",   kind: "Cat",       species: "cat", photo: "" },
    { id: "elda",     name: "Elda",     kind: "Cat",       species: "cat", photo: "" },
    { id: "svetlana", name: "Svetlana", kind: "Cat",       species: "cat", photo: "" }
  ];
  var SISTERS = ["elda", "svetlana"];

  var KEY = "abbydavid-pets-v1";
  var WKEY = "abbydavid-weather-v1";
  var MAX_HEARTS = 5, MAX_VISITS = 999;
  var RENAMED = { shetland: "svetlana" };   // saved under an old id? carry it over

  // Things the pets can turn up. Found by chance; nothing is ever required.
  var FINDS = ["a single sock", "a bottle cap", "a very small leaf", "a paper clip", "a rubber band", "a button", "a jingle bell", "a bit of yarn"];
  var WINDOW_FIND = "a feather from the windowsill";
  var EVENT_FINDS = ["a four-leaf clover", "a tiny acorn", "a smooth pebble"];
  var SCRAPBOOK = FINDS.concat([WINDOW_FIND], EVENT_FINDS);

  var LINES = {
    dog: { pet: ["{n} wags and wags.", "{n} leans into your hand."], feed: ["Crunch.", "{n} finished that in no time."], play: ["{n} chases the ball.", "{n} pounces on it."] },
    cat: { pet: ["{n} leans in.", "{n} starts purring."], feed: ["Crunch.", "{n} finished that in no time."], play: ["{n} bats the ball.", "{n} pounces on it."] }
  };
  var EVENTS = [
    { text: "A leaf blew in through the window.", find: "a very small leaf" },
    { text: "Something tiny rolled out from under the bed.", find: "a smooth pebble" },
    { text: "A sunbeam landed right on the floor.", find: "" }
  ];

  // Places pets like to be. fx = across the room (0-1), ft = depth on the floor (0 back wall, 1 front).
  var SPOTS = {
    window: { fx: 0.21, ft: 0.1,  pose: "sit" },
    plant:  { fx: 0.58, ft: 0.12, pose: "sit" },
    rug:    { fx: 0.48, ft: 0.55, pose: "sit" },
    bed:    { fx: 0.80, ft: 0.76, pose: "lie" },
    bowls:  { fx: 0.27, ft: 0.8,  pose: "stand", dir: -1 },
    front:  { fx: 0.5,  ft: 0.9,  pose: "stand" }
  };
  var HOMES = [
    { fx: 0.24, ft: 0.72, pose: "stand", dir: 1 },
    { fx: 0.5,  ft: 0.5,  pose: "lie",   dir: 1 },
    { fx: 0.52, ft: 0.1,  pose: "sit",   dir: -1 },
    { fx: 0.8,  ft: 0.76, pose: "lie",   dir: -1 }
  ];

  var HEART = '<svg viewBox="0 0 7 6" shape-rendering="crispEdges" class="HC"><path d="M1 0h2v1h-2zM4 0h2v1h-2zM0 1h7v2h-7zM1 3h5v1h-5zM2 4h3v1h-3zM3 5h1v1h-1z"/></svg>';

  var $ = function (id) { return document.getElementById(id); };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var pick = function (list) { return list[Math.floor(Math.random() * list.length)]; };
  var clamp = function (n, lo, hi) { n = Math.floor(Number(n)); return isNaN(n) ? lo : Math.max(lo, Math.min(hi, n)); };

  /* ---------- saved data ---------- */
  var state = load();

  // Reads saved data defensively: anything missing, malformed or out of range falls back to defaults.
  function load() {
    var out = { pets: {}, found: [], last: 0, sel: "", visits: 0 };
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (!s || typeof s !== "object" || Array.isArray(s)) return out;
      var saved = (s.pets && typeof s.pets === "object" && !Array.isArray(s.pets)) ? s.pets : {};
      Object.keys(saved).forEach(function (k) {
        var id = RENAMED[k] || k;
        if (PETS.some(function (p) { return p.id === id; })) out.pets[id] = Math.max(out.pets[id] || 0, clamp(saved[k], 0, MAX_HEARTS));
      });
      if (Array.isArray(s.found)) s.found.forEach(function (f) { if (SCRAPBOOK.indexOf(f) >= 0 && out.found.indexOf(f) < 0) out.found.push(f); });
      out.last = clamp(s.last, 0, 8.64e15);
      out.visits = clamp(s.visits, 0, MAX_VISITS);
      out.sel = typeof s.sel === "string" ? (RENAMED[s.sel] || s.sel) : "";
    } catch (e) {}
    return out;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  /* ---------- elements and layout ---------- */
  var room = $("room"), stage = $("stage"), app = $("app");
  if (!room || !stage || !app) return;
  var W = 0, H = 0, U = 4, floorTop = 0, floorH = 0;
  var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var reduce = mq.matches;
  var paused = false;
  var pets = [], sel = null;

  function measure() {
    W = stage.clientWidth; H = stage.clientHeight;
    U = Math.max(2, Math.round(W / 128));
    floorTop = H * 0.52; floorH = H * 0.48;
    stage.style.setProperty("--u", U);
  }
  function footY(p) { return floorTop + p.ft * floorH; }
  function place(p) {
    var x = Math.max(0, Math.min(W - 32 * U, p.fx * W - 16 * U));
    var y = footY(p) - 22 * U;
    p.el.style.transform = "translate3d(" + Math.round(x) + "px," + Math.round(y) + "px,0)";
  }
  function setZ(p) { p.el.style.zIndex = 10 + Math.round(footY(p)); }
  function jump(p) { p.el.style.transitionDuration = "0s"; place(p); setZ(p); }

  /* ---------- pets ---------- */
  function setPose(p, pose) {
    p.pose = pose;
    p.px.dataset.pose = pose;
    p.asleep = false; p.el.classList.remove("asleep");
  }
  function setDir(p, d) { p.dir = d; p.px.style.setProperty("--r", d > 0 ? 0 : 1); }
  function sleep(p) { setPose(p, "lie"); p.asleep = true; p.el.classList.add("asleep"); }

  function buildPets() {
    PETS.forEach(function (def, i) {
      var el = document.createElement("div");
      el.className = "pet"; el.dataset.id = def.id;
      el.innerHTML = '<span class="shadow"></span><span class="px ' + def.id + '" data-pose="stand"></span><span class="zzz">z</span>';
      stage.insertBefore(el, $("ball"));
      var h = HOMES[i];
      var p = { def: def, el: el, px: el.querySelector(".px"), fx: h.fx, ft: h.ft, dir: 1, pose: "stand", asleep: false,
                moving: false, busy: false, nextAt: Date.now() + rand(3000, 12000), timer: 0, token: 0, taps: [] };
      p.px.style.setProperty("--d", (-rand(0, 5)).toFixed(1) + "s");
      setPose(p, h.pose); setDir(p, h.dir);
      if (periodNow() === "night" && h.pose !== "lie" && !reduce && Math.random() < 0.5) sleep(p);
      pets.push(p);
    });
  }
  function byId(id) { for (var i = 0; i < pets.length; i++) if (pets[i].def.id === id) return pets[i]; return pets[0]; }

  // Where a pet is right now (mid-walk included), read back from the screen.
  function syncPos(p) {
    var r = p.el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    p.fx = (r.left + r.width / 2 - s.left) / W;
    p.ft = Math.max(0.1, Math.min(0.95, (r.top + 22 * U - s.top - floorTop) / floorH));
  }

  function walkTo(p, fx, ft, done) {
    clearTimeout(p.timer);
    var half = 16 * U / W;
    fx = Math.max(half + 0.01, Math.min(1 - half - 0.01, fx));
    ft = Math.max(0.1, Math.min(0.95, ft));
    if (p.moving) { syncPos(p); jump(p); void p.el.offsetWidth; }
    var dx = (fx - p.fx) * W, dy = (ft - p.ft) * floorH;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (Math.abs(dx) > 2 * U) setDir(p, dx > 0 ? 1 : -1);
    p.fx = fx; p.ft = ft;
    if (reduce || dist < U) {
      jump(p); p.moving = false;
      p.timer = setTimeout(function () { if (done) done(); }, 0);
      return;
    }
    var dur = Math.max(0.5, dist / (U * 18));
    p.moving = true; p.asleep = false; p.el.classList.remove("asleep");
    p.pose = "walk"; p.px.dataset.pose = "walk";
    p.el.style.transitionDuration = dur.toFixed(2) + "s";
    var now = p.el.getBoundingClientRect().bottom - stage.getBoundingClientRect().top;
    p.el.style.zIndex = 10 + Math.round(Math.max(footY(p), now));
    place(p);
    p.timer = setTimeout(function () { p.moving = false; setZ(p); if (done) done(); }, dur * 1000 + 40);
  }

  // Picks a spot not too close to where other pets are headed.
  function freeSpot(p, tries) {
    var best = null;
    for (var i = 0; i < (tries || 8); i++) {
      var s = { fx: rand(0.14, 0.86), ft: rand(0.12, 0.92) };
      var ok = pets.every(function (o) {
        if (o === p) return true;
        var dx = (s.fx - o.fx) * W, dy = (s.ft - o.ft) * floorH * 1.6;
        return Math.sqrt(dx * dx + dy * dy) > 26 * U;
      });
      if (ok) return s;
      best = s;
    }
    return best;
  }
  function spotTaken(p, name) {
    var s = SPOTS[name];
    return pets.some(function (o) { return o !== p && Math.abs(o.fx - s.fx) * W < 18 * U && Math.abs(o.ft - s.ft) * floorH < 12 * U; });
  }
  function settle(p, pose, dir) {
    if (dir) setDir(p, dir);
    setPose(p, pose || (periodNow() === "night" && Math.random() < 0.5 ? "lie" : Math.random() < 0.7 ? "sit" : "stand"));
  }
  // Idle pets near a spot step aside when someone is heading there.
  function makeRoom(p, fx, ft) {
    pets.forEach(function (o) {
      if (o === p || o.busy) return;
      if (Math.abs(o.fx - fx) * W < 20 * U && Math.abs(o.ft - ft) * floorH < 14 * U) {
        var s = freeSpot(o); if (s) { o.nextAt = Date.now() + rand(8000, 16000); walkTo(o, s.fx, s.ft, function () { settle(o); }); }
      }
    });
  }
  function goSpot(p, name, then) {
    var s = SPOTS[name];
    walkTo(p, s.fx, s.ft, function () { settle(p, s.pose, s.dir); if (then) then(); });
  }

  /* ---------- calm autonomous behavior ---------- */
  var noteTimer = 0, lastNote = "";
  function note(text) {
    var el = $("note");
    if (!text || text === lastNote) return;
    lastNote = text; el.textContent = text;
    clearTimeout(noteTimer);
    noteTimer = setTimeout(function () { el.textContent = ""; lastNote = ""; }, 9000);
  }

  function think(p) {
    var now = Date.now();
    if (p.busy || p.moving || now < p.nextAt) return;
    if (p.asleep) {                       // wake up on their own schedule
      setPose(p, "sit"); p.nextAt = now + rand(10000, 25000); return;
    }
    var night = periodNow() === "night";
    var movers = pets.filter(function (o) { return o.moving; }).length;
    var table = [["nothing", 3], ["sit", 2], ["lie", night ? 3 : 2], ["sleep", night ? 4 : 1], ["look", 2],
                 ["wander", night ? 1.5 : 3], ["window", 1.5], ["sniff", 1.5], ["buddy", 1.5]];
    var total = table.reduce(function (a, r) { return a + r[1]; }, 0), roll = Math.random() * total, act = "nothing";
    for (var i = 0; i < table.length; i++) { roll -= table[i][1]; if (roll <= 0) { act = table[i][0]; break; } }
    var travels = act === "wander" || act === "window" || act === "sniff" || act === "buddy";
    if (travels && movers >= 2) act = "nothing";
    p.nextAt = now + (Math.random() < 0.3 ? rand(20000, 40000) : rand(6000, 18000));

    if (act === "sit") setPose(p, "sit");
    else if (act === "lie") setPose(p, "lie");
    else if (act === "look") { setDir(p, -p.dir); }
    else if (act === "sleep") {
      p.nextAt = now + rand(40000, 90000);
      if (!spotTaken(p, "bed") && Math.random() < 0.5) goSpot(p, "bed", function () { sleep(p); });
      else sleep(p);
    } else if (act === "wander") {
      var s = freeSpot(p); walkTo(p, s.fx, s.ft, function () { settle(p); });
    } else if (act === "window") {
      if (!spotTaken(p, "window")) goSpot(p, "window");
    } else if (act === "sniff") {
      var name = pick(["rug", "plant", "bowls"]);
      if (!spotTaken(p, name)) goSpot(p, name, function () {
        if (Math.random() < 0.5) note(p.def.name + " " + { rug: "is checking out the rug.", plant: "is looking at the plant.", bowls: "is visiting the bowls." }[name]);
      });
    } else if (act === "buddy") buddy(p);
  }

  function buddy(p) {
    var others = pets.filter(function (o) { return o !== p && !o.busy && !o.moving; });
    if (!others.length) return;
    var o = pick(others), side = o.fx > 0.5 ? -1 : 1;
    walkTo(p, o.fx + side * 17 * U / W, o.ft + 0.02, function () {
      settle(p, o.asleep || o.pose === "lie" ? "lie" : "sit", -side);
      o.nextAt = Math.max(o.nextAt, Date.now() + rand(15000, 25000));
      var sisters = SISTERS.indexOf(p.def.id) >= 0 && SISTERS.indexOf(o.def.id) >= 0;
      note(sisters ? "Elda and Svetlana are resting side by side." : p.def.name + " is keeping " + o.def.name + " company.");
    });
  }

  function tick() {
    if (paused || reduce) return;
    pets.slice().sort(function () { return Math.random() - 0.5; }).forEach(think);
  }

  /* ---------- selection and interactions ---------- */
  function renderChips() {
    var box = $("chips"); box.innerHTML = "";
    PETS.forEach(function (def) {
      var b = document.createElement("button");
      b.type = "button"; b.dataset.id = def.id;
      b.setAttribute("aria-label", "Select " + def.name);
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = '<span class="px ' + def.id + '" data-pose="stand" aria-hidden="true"></span><span></span>';
      b.lastChild.textContent = def.name;
      b.addEventListener("click", function () { select(def.id); });
      box.appendChild(b);
    });
  }
  function renderHearts() {
    var a = state.pets[sel.def.id] || 0, html = "";
    for (var i = 0; i < MAX_HEARTS; i++) html += HEART.replace("HC", i < a ? "heart on" : "heart");
    $("hearts").innerHTML = html;
    $("hearts").setAttribute("aria-label", sel.def.name + " happiness: " + a + " of " + MAX_HEARTS);
  }
  function select(id) {
    sel = byId(id);
    pets.forEach(function (p) { p.el.classList.toggle("sel", p === sel); });
    Array.prototype.forEach.call($("chips").children, function (b) { b.setAttribute("aria-pressed", b.dataset.id === sel.def.id ? "true" : "false"); });
    var n = sel.def.name;
    $("who").textContent = n; $("kind").textContent = sel.def.kind;
    var labels = { pet: "Pet " + n, feed: "Feed " + n, play: "Play with " + n };
    Array.prototype.forEach.call($("actions").children, function (b) { b.setAttribute("aria-label", labels[b.dataset.act]); });
    $("say").textContent = "";
    var ph = $("photo");
    if (sel.def.photo) { ph.src = sel.def.photo; ph.alt = "Photo of " + n; ph.hidden = false; } else { ph.hidden = true; ph.removeAttribute("src"); }
    renderHearts();
    state.sel = sel.def.id; save();
  }

  function heartFx(p, count) {
    var fx = $("fx");
    for (var i = 0; i < count; i++) (function (i) {
      setTimeout(function () {
        var h = document.createElement("span");
        h.innerHTML = HEART.replace("HC", "float-heart");
        var svg = h.firstChild;
        svg.style.left = Math.round(p.fx * W - 10 + (i - 1) * 16) + "px";
        svg.style.top = Math.round(footY(p) - 22 * U - 4) + "px";
        fx.appendChild(svg);
        setTimeout(function () { if (svg.parentNode) svg.parentNode.removeChild(svg); }, 1400);
      }, i * 220);
    })(i);
  }
  function addFind(item) {
    if (!item || state.found.indexOf(item) >= 0) return false;
    state.found.push(item); save(); renderScrapbook(); return true;
  }
  function maybeFind(p) {
    var left = FINDS.filter(function (f) { return state.found.indexOf(f) < 0; });
    if (left.length && Math.random() < 0.16) { var f = pick(left); addFind(f); return " " + p.def.name + " turned up " + f + "."; }
    return "";
  }
  function engage(p) {
    p.token++; p.busy = true; clearTimeout(p.timer);
    p.el.classList.remove("hop", "munch");
    setPose(p, "stand");
    return p.token;
  }
  function release(p, tk) {
    if (p.token !== tk) return;
    p.busy = false; p.nextAt = Date.now() + rand(10000, 25000);
    setPose(p, "sit");
  }
  function cheer(p, kind) {
    var n = p.def.name, a = state.pets[p.def.id] || 0;
    if (a < MAX_HEARTS) state.pets[p.def.id] = a + 1;
    state.last = Date.now(); save();
    if (p === sel) renderHearts();
    $("say").textContent = pick(LINES[p.def.species][kind]).replace("{n}", n) + maybeFind(p);
    if (Math.random() < 0.08) { var ev = pick(EVENTS); note(ev.text); if (ev.find) addFind(ev.find); }
  }
  function hop(p, ms) {
    setPose(p, "happy"); p.el.classList.add("hop");
    setTimeout(function () { p.el.classList.remove("hop"); }, ms || 1100);
  }

  function actPet(p) {
    var tk = engage(p), s = freeSpot(p, 10) || SPOTS.front;
    var spot = spotTaken(p, "front") ? s : SPOTS.front;
    makeRoom(p, spot.fx, spot.ft);
    walkTo(p, spot.fx, spot.ft, function () {
      if (p.token !== tk) return;
      hop(p, 1100); heartFx(p, 3); cheer(p, "pet");
      setTimeout(function () { release(p, tk); }, 2600);
    });
  }
  function actFeed(p) {
    var tk = engage(p), food = $("food");
    food.classList.add("full");
    var s = SPOTS.bowls;
    makeRoom(p, s.fx, s.ft);
    walkTo(p, s.fx, s.ft, function () {
      if (p.token !== tk) { food.classList.remove("full"); return; }
      setDir(p, -1); setPose(p, "stand"); p.el.classList.add("munch");
      cheer(p, "feed");
      setTimeout(function () {
        p.el.classList.remove("munch"); food.classList.remove("full"); release(p, tk);
      }, reduce ? 800 : 2000);
    });
  }
  function actPlay(p) {
    var tk = engage(p), ball = $("ball"), s1 = freeSpot(p, 10) || SPOTS.rug, s2 = freeSpot(p, 10) || SPOTS.front;
    function ballTo(s) {
      var bx = Math.round(s.fx * W - 2.5 * U), by = Math.round(floorTop + s.ft * floorH - 4 * U);
      ball.style.zIndex = 10 + Math.round(floorTop + s.ft * floorH) - 1;
      ball.style.transitionDuration = reduce ? "0s" : "1s";
      ball.style.transform = "translate3d(" + bx + "px," + by + "px,0)";
    }
    syncPos(p);
    ball.style.transitionDuration = "0s"; ball.hidden = false;
    ball.style.transform = "translate3d(" + Math.round(p.fx * W) + "px," + Math.round(footY(p) - 6 * U) + "px,0)";
    void ball.offsetWidth;
    ballTo(s1);
    var watcher = pets.filter(function (o) { return o !== p && !o.busy && !o.moving && !o.asleep; })[0];
    if (watcher) {
      setDir(watcher, s1.fx > watcher.fx ? 1 : -1);
      if (watcher.pose !== "lie") setPose(watcher, "sit");
      watcher.nextAt = Math.max(watcher.nextAt, Date.now() + 9000);
      note(watcher.def.name + " watches " + p.def.name + " play.");
    }
    walkTo(p, s1.fx - 12 * U / W, s1.ft, function () {
      if (p.token !== tk) { ball.hidden = true; return; }
      hop(p, 800); ballTo(s2);
      setTimeout(function () {
        if (p.token !== tk) { ball.hidden = true; return; }
        walkTo(p, s2.fx - 12 * U / W, s2.ft, function () {
          if (p.token !== tk) { ball.hidden = true; return; }
          hop(p, 1100); cheer(p, "play");
          setTimeout(function () { ball.hidden = true; release(p, tk); }, 2600);
        });
      }, reduce ? 0 : 500);
    });
  }
  var ACTS = { pet: actPet, feed: actFeed, play: actPlay };

  /* ---------- scrapbook ---------- */
  function renderScrapbook() {
    var ul = $("scrap"); ul.innerHTML = "";
    SCRAPBOOK.forEach(function (name) {
      if (state.found.indexOf(name) < 0) return;
      var li = document.createElement("li"); li.textContent = name; ul.appendChild(li);
    });
  }

  /* ---------- quiet secrets: nothing here is listed, counted or tracked ---------- */
  var windowTaps = [];
  function tapSecrets(e) {
    var t = e.target, pet = t.closest && t.closest(".pet");
    if (pet) {
      var p = byId(pet.dataset.id), now = Date.now();
      if (p !== sel) select(p.def.id);
      else if (!p.busy) ACTS.pet(p);
      p.taps = p.taps.filter(function (x) { return now - x < 3000; }); p.taps.push(now);
      if (p.taps.length >= 5 && !reduce) { p.taps = []; spin(p); }
      return;
    }
    if (t.closest("#window")) {
      var n = Date.now();
      windowTaps = windowTaps.filter(function (x) { return n - x < 4000; }); windowTaps.push(n);
      if (windowTaps.length >= 3) {
        windowTaps = [];
        var b = $("bird"); b.classList.remove("fly"); void b.offsetWidth; b.classList.add("fly");
        note(addFind(WINDOW_FIND) ? "A bird flew past and left a feather on the sill." : "A bird flew past the window.");
      }
    } else if (t.closest("#plant")) {
      var lf = document.createElement("span"); lf.className = "float-leaf";
      lf.style.left = Math.round(W * 0.74) + "px"; lf.style.top = Math.round(H * 0.3) + "px";
      $("fx").appendChild(lf); setTimeout(function () { if (lf.parentNode) lf.parentNode.removeChild(lf); }, 1900);
      if (addFind("a very small leaf")) note("A leaf drifted down from the plant.");
    } else if (t.closest("#lamp")) {
      room.dataset.lamp = room.dataset.lamp === "on" ? "off" : "on";
    } else if (t.closest("#bed")) {
      var p2 = sel, tk = engage(p2);
      goSpot(p2, "bed", function () {
        if (p2.token !== tk) return;
        sleep(p2); p2.busy = false; p2.nextAt = Date.now() + rand(40000, 70000);
        note(p2.def.name + " is having a nap.");
      });
    }
  }
  function spin(p) {
    var i = 0, iv = setInterval(function () { setDir(p, -p.dir); if (++i >= 6) clearInterval(iv); }, 160);
  }

  /* ---------- time of day (St. Louis), season ---------- */
  function periodNow() {
    var h;
    try { h = parseInt(new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", hour: "numeric", hourCycle: "h23" }).format(new Date()), 10) % 24; } catch (e) { h = new Date().getHours(); }
    if (isNaN(h)) h = new Date().getHours();
    return h >= 6 && h < 10 ? "morning" : h >= 10 && h < 17 ? "day" : h >= 17 && h < 20 ? "evening" : "night";
  }
  var weather = null;
  function applyRoom() {
    var period = periodNow();
    room.dataset.period = period;
    var night = weather ? weather.day === 0 : period === "night";
    room.dataset.sky = night ? "night" : period === "evening" ? "dusk" : "day";
  }
  // Tiny seasonal details from the visitor's own calendar date.
  function applySeason() {
    var d = new Date(), m = d.getMonth() + 1, day = d.getDate();
    room.dataset.season = m >= 3 && m <= 5 ? "spring" : m >= 6 && m <= 8 ? "summer" : m >= 9 && m <= 11 ? "autumn" : "winter";
    var ev = "";
    if (m === 10 && day >= 24) ev = "halloween";
    else if (m === 12 || (m === 1 && day <= 6)) ev = "lights";
    else if (m === 4 || m === 5) ev = "flowers";
    else if ((m === 9 && day >= 22) || m === 10 || m === 11) ev = "leaves";
    room.dataset.event = ev;
  }

  /* ---------- St. Louis weather (Open-Meteo, no key, no geolocation) ---------- */
  var URL_WX = "https://api.open-meteo.com/v1/forecast?latitude=38.627&longitude=-90.199&current=temperature_2m,weather_code,is_day,cloud_cover&temperature_unit=fahrenheit&timezone=America%2FChicago";
  var TTL = 30 * 60 * 1000, STALE = 12 * 60 * 60 * 1000;
  function validWx(w) {
    return !!w && typeof w === "object" && isFinite(w.code) && w.code >= 0 && w.code <= 99 && isFinite(w.temp) && w.temp > -60 && w.temp < 140 &&
      (w.day === 0 || w.day === 1) && isFinite(w.cloud) && w.cloud >= 0 && w.cloud <= 100;
  }
  function readCache() {
    try { var w = JSON.parse(localStorage.getItem(WKEY)); return validWx(w) && isFinite(w.t) ? w : null; } catch (e) { return null; }
  }
  function classify(code) {
    if (code <= 1) return ["clear", code ? "Mostly clear" : "Clear"];
    if (code === 2) return ["partly", "Partly cloudy"];
    if (code === 3) return ["cloudy", "Cloudy"];
    if (code === 45 || code === 48) return ["fog", "Fog"];
    if (code >= 51 && code <= 57) return ["rain", "Drizzle"];
    if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return ["rain", "Rain"];
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return ["snow", "Snow"];
    if (code >= 95) return ["storm", "Thunderstorms"];
    return ["cloudy", "Cloudy"];
  }
  function showWeather(w) {
    weather = w;
    var c = classify(w.code);
    room.dataset.wx = c[0];
    $("wx-line").textContent = "St. Louis · " + Math.round(w.temp) + "°F · " + c[1];
    applyRoom();
  }
  function weatherFailed() { if (!weather) $("wx-line").textContent = "Weather unavailable"; }
  function loadWeather() {
    var c = readCache(), now = Date.now();
    if (c && now - c.t >= 0 && now - c.t < TTL) { showWeather(c); return; }
    var fallback = function () { if (c && now - c.t >= 0 && now - c.t < STALE) showWeather(c); else weatherFailed(); };
    if (typeof fetch !== "function" || navigator.onLine === false) { fallback(); return; }
    var ctl = typeof AbortController === "function" ? new AbortController() : null;
    var to = setTimeout(function () { if (ctl) ctl.abort(); }, 6000);
    fetch(URL_WX, { signal: ctl ? ctl.signal : undefined, referrerPolicy: "no-referrer" })
      .then(function (r) { if (!r.ok) throw new Error("http"); return r.json(); })
      .then(function (j) {
        var k = j && j.current;
        var w = k && { t: Date.now(), code: Number(k.weather_code), temp: Number(k.temperature_2m), day: Number(k.is_day), cloud: Number(k.cloud_cover) };
        if (!validWx(w)) throw new Error("bad");
        try { localStorage.setItem(WKEY, JSON.stringify(w)); } catch (e) {}
        showWeather(w);
      })
      .catch(fallback)
      .then(function () { clearTimeout(to); });
  }

  /* ---------- pause when not visible ---------- */
  var onScreen = true;
  function updatePaused() {
    paused = document.hidden || !onScreen;
    room.classList.toggle("paused", paused);
  }

  /* ---------- go ---------- */
  function init() {
    measure(); applySeason(); applyRoom();
    renderChips(); buildPets(); renderScrapbook();
    state.visits = Math.min(MAX_VISITS, state.visits + 1); state.last = Date.now();
    select(state.sel || "jack");
    app.hidden = false;
    measure(); pets.forEach(jump);

    stage.addEventListener("click", tapSecrets);
    $("actions").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (b && ACTS[b.dataset.act]) ACTS[b.dataset.act](sel);
    });
    $("reset").addEventListener("click", function () {
      if (!window.confirm("Reset saved pet data? Hearts and scrapbook finds will be cleared.")) return;
      try { localStorage.removeItem(KEY); } catch (e) {}
      state = load(); renderScrapbook(); select("jack");
    });

    if (typeof ResizeObserver === "function") new ResizeObserver(function () { measure(); pets.forEach(jump); }).observe(stage);
    else window.addEventListener("resize", function () { measure(); pets.forEach(jump); });
    if (typeof IntersectionObserver === "function") new IntersectionObserver(function (en) { onScreen = en[en.length - 1].isIntersecting; updatePaused(); }).observe(stage);
    document.addEventListener("visibilitychange", updatePaused);
    if (mq.addEventListener) mq.addEventListener("change", function () {
      reduce = mq.matches;
      if (reduce) pets.forEach(function (p) { if (p.moving) { clearTimeout(p.timer); p.moving = false; jump(p); setPose(p, "sit"); } });
    });

    setInterval(tick, 1500);
    setInterval(applyRoom, 60000);
    loadWeather();
    setInterval(function () { if (!paused) loadWeather(); }, TTL);
    window.addEventListener("online", loadWeather);
  }
  init();
})();
