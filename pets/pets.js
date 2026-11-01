/* The pet toy. No dependencies, no network. Visitors' state lives only in their own browser. */

/* To add a real photo for a pet, drop the file in /assets/pets/ and set `photo`,
   e.g. photo: "/assets/pets/jack.jpg". To use custom pixel art, set `sprite` to the
   name of a new sheet in /assets/pets/ (4 frames of 16x16: idle, blink, happy, sleepy)
   and add a matching `.sprite.name` rule in styles.css. */
var PETS = [
  { id: "jack",     name: "Jack",     kind: "Chihuahua", sprite: "dog", photo: "" },
  { id: "albert",   name: "Albert",   kind: "Cat",       sprite: "cat", photo: "" },
  { id: "elda",     name: "Elda",     kind: "Cat",       sprite: "cat", photo: "" },
  { id: "shetland", name: "Shetland", kind: "Cat",       sprite: "cat", photo: "" }
];

var KEY = "abbydavid-pets-v1";
var MAX_HEARTS = 5;
var FINDS = ["a single sock", "a bottle cap", "a very small leaf", "a paper clip", "a rubber band", "a button"];
var HEART = '<svg viewBox="0 0 7 6" shape-rendering="crispEdges" class="HC"><path d="M1 0h2v1h-2zM4 0h2v1h-2zM0 1h7v2h-7zM1 3h5v1h-5zM2 4h3v1h-3zM3 5h1v1h-1z"/></svg>';

var state = load();
var current = 0;
var streak = { id: "", n: 0 };
var timers = [];

function load() {
  var fresh = { pets: {}, found: [], crew: false, last: 0 };
  try {
    var s = JSON.parse(localStorage.getItem(KEY));
    if (s && typeof s === "object") { return { pets: s.pets || {}, found: s.found || [], crew: !!s.crew, last: s.last || 0 }; }
  } catch (e) {}
  return fresh;
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
    b.innerHTML = '<span class="sprite ' + p.sprite + '" aria-hidden="true"></span><span class="mono"></span>';
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

function renderFound() {
  if (!state.found.length) { els.found.hidden = true; return; }
  els.found.hidden = false;
  els.found.textContent = "Found so far: " + state.found.join(", ");
}

function select(i) {
  clearTimers();
  current = i;
  var p = PETS[i];
  els.sprite.className = "sprite " + p.sprite;
  els.kind.textContent = p.name + " · " + p.kind;
  els.toy.hidden = true; els.bowl.hidden = true; els.toy.classList.remove("roll");
  Array.prototype.forEach.call(els.picker.children, function (b, n) {
    b.setAttribute("aria-pressed", n === i ? "true" : "false");
  });
  els.photo.hidden = !p.photo;
  if (p.photo) { els.photo.src = p.photo; els.photo.alt = p.name; }
  renderHearts();
}

function say(text) { els.say.textContent = text; }

function mood(cls, ms) {
  els.sprite.classList.remove("happy", "hop", "munch", "near");
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

function warm(p, by) {
  var before = affection(p);
  state.pets[p.id] = Math.min(MAX_HEARTS, before + by);
  state.last = Date.now();
  renderHearts();
  var all = PETS.every(function (q) { return affection(q) > 0; });
  if (all && !state.crew) {
    state.crew = true;
    els.stamp.hidden = false;
    later(function () { say("Everyone's been said hello to."); }, 1800);
  }
  save();
}

function act(kind) {
  var p = PETS[current], n = p.name;
  clearTimers();
  els.toy.hidden = true; els.bowl.hidden = true; els.toy.classList.remove("roll");

  if (streak.id === p.id + kind) streak.n++; else streak = { id: p.id + kind, n: 1 };

  if (kind === "pet") {
    mood("happy hop near", 1100);
    hearts(streak.n > 3 ? 5 : 3);
    warm(p, 1);
    if (streak.n === 4) say(n + " has decided this is the best part of today.");
    else if (Math.random() < 0.06) say(n + " stares at nothing for a while. Then back to you.");
    else say(pick([n + " leans in.", "Very good. Thank you.", n + " accepts this.", "Happy noises."]));
  }

  if (kind === "feed") {
    els.bowl.hidden = false;
    mood("munch near", 1600);
    later(function () { els.bowl.hidden = true; mood("happy", 700); hearts(1); }, 1600);
    warm(p, 1);
    say(Math.random() < 0.07 ? n + " was not actually hungry, but accepts it." : pick(["Crunch.", "Gone in seconds.", n + " checks the bowl again, just in case."]));
  }

  if (kind === "play") {
    els.toy.hidden = false;
    els.toy.classList.remove("roll"); void els.toy.getBoundingClientRect(); els.toy.classList.add("roll");
    mood("hop", 1700);
    later(function () { els.toy.hidden = true; mood("happy", 800); }, 1700);
    warm(p, 1);
    if (Math.random() < 0.1) {
      var item = pick(FINDS);
      if (state.found.indexOf(item) < 0) { state.found.push(item); save(); renderFound(); }
      say(n + " found " + item + ".");
    } else {
      say(pick([n + " chases the toy.", "Pounce.", "Toy: caught."]));
    }
  }
}

function init() {
  els = {
    picker: $("picker"), hearts: $("hearts"), kind: $("kind"), sprite: $("sprite"), stage: $("stage"),
    toy: $("toy"), bowl: $("bowl"), fx: $("fx"), say: $("say"), found: $("found"), stamp: $("stamp"), photo: $("photo")
  };
  renderPicker();
  select(0);
  renderFound();
  els.stamp.hidden = !state.crew;
  say(state.last ? "Welcome back." : "Pick someone.");
  Array.prototype.forEach.call(document.querySelectorAll("[data-act]"), function (b) {
    b.addEventListener("click", function () { act(b.getAttribute("data-act")); });
  });
  els.sprite.addEventListener("click", function () { act("pet"); });
  $("app").hidden = false;
}

init();
