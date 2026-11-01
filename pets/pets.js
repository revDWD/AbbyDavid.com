/* The pet toy. No dependencies, no network. Visitors' state lives only in their own browser. */

/* To add a real photo for a pet, drop the file in /assets/pets/ and set `photo`,
   e.g. photo: "/assets/pets/jack.jpg". To use custom pixel art, set `sprite` to the
   name of a new sheet in /assets/pets/ (4 frames of 16x16: idle, blink, happy, sleepy)
   and add a matching `.sprite.name` rule in styles.css. `skin` picks the per-pet color sheet. */
var PETS = [
  { id: "jack",     name: "Jack",     kind: "Chihuahua", species: "dog", sprite: "dog", skin: "jack",     photo: "" },
  { id: "albert",   name: "Albert",   kind: "Cat",       species: "cat", sprite: "cat", skin: "albert",   photo: "" },
  { id: "elda",     name: "Elda",     kind: "Cat",       species: "cat", sprite: "cat", skin: "elda",     photo: "" },
  { id: "svetlana", name: "Svetlana", kind: "Cat",       species: "cat", sprite: "cat", skin: "svetlana", photo: "" }
];

var KEY = "abbydavid-pets-v1";
var MAX_HEARTS = 5;
var MAX_VISITS = 999;
var RENAMED = { shetland: "svetlana" };   // saved under an old id? carry it over

// Everything that can go in the scrapbook: found while playing, by a window visit, or by chance.
var FINDS = ["a single sock", "a bottle cap", "a very small leaf", "a paper clip", "a rubber band", "a button"];
var WINDOW_FIND = "a feather from the windowsill";
var EVENT_FINDS = ["a four-leaf clover", "a tiny acorn", "a smooth pebble"];
var SCRAPBOOK = FINDS.concat([WINDOW_FIND], EVENT_FINDS);

var LINES = {
  dog: { pet: ["wags and wags.", "leans into your hand."], feed: ["Crunch.", "Bowl: empty. Spirits: high."], play: ["chases the toy in circles.", "pounces on it."] },
  cat: { pet: ["leans in.", "starts purring."], feed: ["Crunch.", "Gone in seconds."], play: ["bats the toy.", "pounces on it."] }
};
var EVENTS = [
  { text: "A leaf blew in through the window.", find: "a very small leaf" },
  { text: "Something tiny rolled out from under the cushion.", find: "a smooth pebble" },
  { text: "A sunbeam landed right on the floor. Perfect spot.", find: "" },
  { text: "The room is quiet. Everyone is comfortable.", find: "" }
];
var HEART = '<svg viewBox="0 0 7 6" shape-rendering="crispEdges" class="HC"><path d="M1 0h2v1h-2zM4 0h2v1h-2zM0 1h7v2h-7zM1 3h5v1h-5zM2 4h3v1h-3zM3 5h1v1h-1z"/></svg>';

var state = load();
var current = Math.max(0, PETS.map(function (p) { return p.id; }).indexOf(state.sel));
var streak = { id: "", n: 0 };
var windowTaps = 0;
var timers = [];
var napTimer = 0;

function clamp(n, lo, hi) { n = Math.floor(Number(n)); return isNaN(n) ? lo : Math.max(lo, Math.min(hi, n)); }

// Reads saved data defensively: anything missing, malformed or out of range falls back to defaults.
function load() {
  var out = { pets: {}, found: [], crew: false, last: 0, sel: "", visits: 0 };
  try {
    var s = JSON.parse(localStorage.getItem(KEY));
    if (!s || typeof s !== "object" || Array.isArray(s)) return out;
    var saved = (s.pets && typeof s.pets === "object" && !Array.isArray(s.pets)) ? s.pets : {};
    Object.keys(saved).forEach(function (k) {
      var id = RENAMED[k] || k;
      if (PETS.some(function (p) { return p.id === id; })) out.pets[id] = Math.max(out.pets[id] || 0, clamp(saved[k], 0, MAX_HEARTS));
    });
    if (Array.isArray(s.found)) s.found.forEach(function (f) { if (SCRAPBOOK.indexOf(f) >= 0 && out.found.indexOf(f) < 0) out.found.push(f); });
    out.crew = !!s.crew && PETS.every(function (p) { return out.pets[p.id] > 0; });
    out.last = clamp(s.last, 0, 8.64e15);
    out.visits = clamp(s.visits, 0, MAX_VISITS);
    out.sel = typeof s.sel === "string" ? (RENAMED[s.sel] || s.sel) : "";
  } catch (e) {}
  return out;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
}

function $(id) { return document.getElementById(id); }
function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
function affection(p) { return state.pets[p.id] || 0; }
function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); }
function clearTimers() { timers.forEach(clearTimeout); timers = []; }

var els = {};

function renderPicker() {
  els.picker.innerHTML = "";
  PETS.forEach(function (p, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-pressed", i === current ? "true" : "false");
    b.innerHTML = '<span class="sprite ' + p.sprite + ' ' + p.skin + '" aria-hidden="true"></span><span class="mono"></span>';
    b.lastChild.textContent = p.name;
    b.addEventListener("click", function () { select(i); });
    els.picker.appendChild(b);
  });
}

function renderHearts() {
  var p = PETS[current], a = affection(p), html = "";
  for (var i = 0; i < MAX_HEARTS; i++) html += HEART.replace("HC", i < a ? "heart on" : "heart");
  els.hearts.innerHTML = html;
  els.hearts.setAttribute("aria-label", p.name + " happiness: " + a + " of " + MAX_HEARTS);
}

function renderScrapbook() {
  els.scrap.innerHTML = "";
  SCRAPBOOK.forEach(function (name) {
    var li = document.createElement("li"), got = state.found.indexOf(name) >= 0;
    li.className = got ? "got" : "";
    li.textContent = got ? name : "Not found yet";
    els.scrap.appendChild(li);
  });
  els.scrapCount.textContent = state.found.length + " of " + SCRAPBOOK.length;
}

function timeOfDay() {
  var h = new Date().getHours();
  return h >= 7 && h < 17 ? "day" : h >= 17 && h < 20 ? "evening" : "night";
}

function wake() {
  els.sprite.classList.remove("sleep");
  clearTimeout(napTimer);
  napTimer = setTimeout(function () { els.sprite.classList.add("sleep"); }, 20000);
}

function select(i) {
  clearTimers();
  current = i;
  var p = PETS[i];
  state.sel = p.id; save();
  els.sprite.className = "sprite " + p.sprite + " " + p.skin;
  els.kind.textContent = p.name + " · " + p.kind;
  els.toy.hidden = true; els.bowl.hidden = true; els.toy.classList.remove("roll");
  Array.prototype.forEach.call(els.picker.children, function (b, n) {
    b.setAttribute("aria-pressed", n === i ? "true" : "false");
  });
  els.photo.hidden = !p.photo;
  if (p.photo) { els.photo.src = p.photo; els.photo.alt = p.name; }
  renderHearts();
  wake();
}

function say(text) { els.say.textContent = text; }

function mood(cls, ms) {
  els.sprite.classList.remove("happy", "hop", "munch", "near", "sleep");
  if (cls) els.sprite.classList.add.apply(els.sprite.classList, cls.split(" "));
  later(function () { els.sprite.classList.remove("happy", "hop", "munch", "near"); }, ms);
}

function hearts(n) {
  for (var i = 0; i < n; i++) {
    (function (i) {
      later(function () {
        var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        s.setAttribute("viewBox", "0 0 7 6");
        s.setAttribute("class", "float-heart");
        s.setAttribute("shape-rendering", "crispEdges");
        s.innerHTML = '<path d="M1 0h2v1h-2zM4 0h2v1h-2zM0 1h7v2h-7zM1 3h5v1h-5zM2 4h3v1h-3zM3 5h1v1h-1z"/>';
        s.style.left = (40 + Math.random() * 20) + "%";
        els.fx.appendChild(s);
        later(function () { s.remove(); }, 1300);
      }, i * 180);
    })(i);
  }
}

function collect(item) {
  if (item && state.found.indexOf(item) < 0) { state.found.push(item); save(); renderScrapbook(); return true; }
  return false;
}

function warm(p, by) {
  state.pets[p.id] = Math.min(MAX_HEARTS, affection(p) + by);
  state.last = Date.now();
  renderHearts();
  if (!state.crew && PETS.every(function (q) { return affection(q) > 0; })) {
    state.crew = true;
    els.stamp.hidden = false;
    later(function () { say("Everyone's been said hello to."); }, 1800);
  }
  save();
}

// Now and then, something small and nice happens. Never anything bad.
function maybeEvent() {
  if (Math.random() > 0.07) return false;
  var e = pick(EVENTS), isNew = collect(e.find);
  later(function () { say(e.text + (isNew ? " (Added to the scrapbook.)" : "")); }, 1900);
  return true;
}

function act(kind) {
  var p = PETS[current], n = p.name, L = LINES[p.species];
  clearTimers();
  wake();
  els.toy.hidden = true; els.bowl.hidden = true; els.toy.classList.remove("roll");

  if (streak.id === p.id + kind) streak.n++; else streak = { id: p.id + kind, n: 1 };

  if (kind === "pet") {
    mood("happy hop near", 1100);
    hearts(streak.n > 3 ? 5 : 3);
    warm(p, 1);
    if (streak.n === 4) say(n + " has decided this is the best part of today.");
    else if (Math.random() < 0.06) say(n + " stares at nothing for a while. Then back to you.");
    else say(n + " " + pick(L.pet));
  }

  if (kind === "feed") {
    els.bowl.hidden = false;
    mood("munch near", 1600);
    later(function () { els.bowl.hidden = true; mood("happy", 700); hearts(1); }, 1600);
    warm(p, 1);
    say(Math.random() < 0.07 ? n + " was not actually hungry, but accepts it." : pick(L.feed));
  }

  if (kind === "play") {
    els.toy.hidden = false;
    els.toy.classList.remove("roll"); void els.toy.getBoundingClientRect(); els.toy.classList.add("roll");
    mood("hop", 1700);
    later(function () { els.toy.hidden = true; mood("happy", 800); }, 1700);
    warm(p, 1);
    if (Math.random() < 0.1) {
      var item = pick(FINDS), isNew = collect(item);
      say(n + " found " + item + "." + (isNew ? " (Added to the scrapbook.)" : ""));
    } else {
      say(n + " " + pick(L.play));
    }
  }
  maybeEvent();
}

// Secret one: tap the window a few times and a bird goes by.
function lookOut() {
  windowTaps++;
  if (windowTaps % 3 !== 0) { say("Nice view."); return; }
  els.bird.classList.remove("fly"); void els.bird.offsetWidth; els.bird.classList.add("fly");
  var isNew = collect(WINDOW_FIND);
  say(PETS[current].name + " watches a bird go by." + (isNew ? " It left a feather. (Added to the scrapbook.)" : ""));
}

// Secret two: the cushion is for naps.
function nap() {
  clearTimers();
  els.sprite.classList.remove("happy", "hop", "munch", "near");
  els.sprite.classList.add("sleep");
  clearTimeout(napTimer);
  napTimer = setTimeout(function () { els.sprite.classList.remove("sleep"); }, 6000);
  say(PETS[current].name + " has a little nap. Zzz.");
}

function resetAll() {
  if (!window.confirm("Clear the saved pet data in this browser? Hearts and the scrapbook will start over.")) return;
  try { localStorage.removeItem(KEY); } catch (e) {}
  state = load();
  els.stamp.hidden = true;
  renderScrapbook();
  select(current);
  say("All clean. Pick someone.");
}

function init() {
  els = {
    picker: $("picker"), hearts: $("hearts"), kind: $("kind"), sprite: $("sprite"), stage: $("stage"),
    toy: $("toy"), bowl: $("bowl"), fx: $("fx"), say: $("say"), stamp: $("stamp"), photo: $("photo"),
    room: $("room"), bird: $("bird"), scrap: $("scrap"), scrapCount: $("scrap-count")
  };
  els.room.setAttribute("data-time", timeOfDay());
  state.visits = Math.min(MAX_VISITS, state.visits + 1);
  renderPicker();
  select(current);
  renderScrapbook();
  els.stamp.hidden = !state.crew;
  say(state.last ? "Welcome back." : "Pick someone.");
  Array.prototype.forEach.call(document.querySelectorAll("[data-act]"), function (b) {
    b.addEventListener("click", function () { act(b.getAttribute("data-act")); });
  });
  els.sprite.addEventListener("click", function () { act("pet"); });
  $("window").addEventListener("click", lookOut);
  $("cushion").addEventListener("click", nap);
  $("reset").addEventListener("click", resetAll);
  $("app").hidden = false;
  save();
}

init();
