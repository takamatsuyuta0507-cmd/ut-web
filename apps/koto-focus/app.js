/* ============================================================
   ブランド名はここ1行だけ。シリーズ全アプリで共通の設定。
   例: "koto." / "dot." / "mono." など。
   ピリオドは自動でオレンジのドットになります。
   ============================================================ */
const BRAND = "koto.";

/* ---- brand wordmark を描画（ピリオドだけオレンジ） ---- */
(function paintBrand() {
  const el = document.getElementById("wordmark");
  const m = BRAND.match(/^(.*?)(\.)?$/);
  const head = m[1];
  const dot = m[2] || "";
  el.innerHTML = `${head}<span class="dot">${dot}</span>`;
  document.title = `${BRAND} Focus`;
})();

/* ---- elements ---- */
const ring = document.getElementById("ringFill");
const timeEl = document.getElementById("time");
const stateEl = document.getElementById("stateLabel");
const toggleBtn = document.getElementById("toggle");
const resetBtn = document.getElementById("reset");
const presets = document.getElementById("presets");

/* ---- ring geometry ---- */
const R = 104;
const C = 2 * Math.PI * R;
ring.style.strokeDasharray = `${C}`;
ring.style.strokeDashoffset = "0";

/* ---- state ---- */
let durationMs = 25 * 60 * 1000;
let remainingMs = durationMs;
let running = false;
let endTime = 0;
let ticker = null;

/* ---- helpers ---- */
function fmt(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function render() {
  timeEl.textContent = fmt(remainingMs);
  const frac = durationMs > 0 ? remainingMs / durationMs : 0;
  ring.style.strokeDashoffset = `${C * (1 - frac)}`;
}

function setState(text) {
  stateEl.textContent = text;
}

/* ---- core ---- */
function start() {
  if (running || remainingMs <= 0) return;
  running = true;
  endTime = Date.now() + remainingMs;
  toggleBtn.textContent = "一時停止";
  setState("集中中…");
  document.body.classList.remove("is-done");
  unlockAudio();
  ticker = setInterval(tick, 200);
}

function pause() {
  if (!running) return;
  running = false;
  remainingMs = Math.max(0, endTime - Date.now());
  clearInterval(ticker);
  toggleBtn.textContent = "再開";
  setState("一時停止中");
  render();
}

function reset() {
  running = false;
  clearInterval(ticker);
  remainingMs = durationMs;
  endTime = 0;
  toggleBtn.textContent = "スタート";
  setState("集中する準備はいい？");
  document.body.classList.remove("is-done");
  render();
}

function complete() {
  running = false;
  clearInterval(ticker);
  remainingMs = 0;
  toggleBtn.textContent = "もう一度";
  setState("おつかれさま。");
  document.body.classList.add("is-done");
  render();
  chime();
}

function tick() {
  remainingMs = Math.max(0, endTime - Date.now());
  render();
  if (remainingMs <= 0) complete();
}

/* ---- interactions ---- */
toggleBtn.addEventListener("click", () => {
  if (remainingMs <= 0) {
    reset();
    return;
  }
  running ? pause() : start();
});

resetBtn.addEventListener("click", reset);

presets.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  [...presets.children].forEach((c) => c.classList.remove("is-active"));
  chip.classList.add("is-active");
  durationMs = Number(chip.dataset.min) * 60 * 1000;
  reset();
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (remainingMs <= 0) return reset();
    running ? pause() : start();
  } else if (e.key.toLowerCase() === "r") {
    reset();
  }
});

/* ---- gentle chime (WebAudio, no asset) ---- */
let actx = null;
function unlockAudio() {
  if (!actx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) actx = new AC();
  }
  if (actx && actx.state === "suspended") actx.resume();
}
function chime() {
  if (!actx) return;
  const notes = [880, 1108.73]; // A5, C#6
  notes.forEach((f, i) => {
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = "sine";
    o.frequency.value = f;
    const t = actx.currentTime + i * 0.18;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(g).connect(actx.destination);
    o.start(t);
    o.stop(t + 0.6);
  });
}

/* ---- init ---- */
render();

/* ---- service worker ---- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
