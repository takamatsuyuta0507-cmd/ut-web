/* ============================================================
   ブランド名はここ1行だけ。シリーズ全アプリで共通。
   例: "koto." / "dot." / "mono." ピリオドが自動でオレンジに。
   ============================================================ */
const BRAND = "koto.";

/* ---- brand wordmark ---- */
(function paintBrand() {
  const el = document.getElementById("wordmark");
  const m = BRAND.match(/^(.*?)(\.)?$/);
  el.innerHTML = `${m[1]}<span class="dot">${m[2] || ""}</span>`;
  document.title = `${BRAND} Last`;
})();

/* 投げ銭リンク：アカウント作成後、この2つのURLを差し替えるだけ。 */
const SUPPORT_STRIPE = "https://buy.stripe.com/00w3cx7aIeaK4lMdOCa3u00?client_reference_id=koto-last"; // UT. を応援する
const SUPPORT_NOTE   = "https://note.com/your-id";          // ← note のURL
(function paintFooter() {
  const ready = (u) => u && !/your-link|your-id/.test(u);
  const wire = (id, url) => {
    const a = document.getElementById(id);
    if (!a) return;
    if (ready(url)) {
      a.href = url;
    } else {
      const sep = a.previousElementSibling;
      if (sep && sep.classList.contains("sep")) sep.remove();
      a.remove();
    }
  };
  wire("supportLink", SUPPORT_STRIPE);
  wire("noteLink", SUPPORT_NOTE);
})();

/* ---- storage ---- */
const KEY = "koto-last/items";
let items = load();

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}
function save() {
  localStorage.setItem(KEY, JSON.stringify(items));
}
function uid() {
  return (crypto.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random());
}

/* ---- dates ---- */
function todayISO() {
  return toISO(new Date());
}
function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function daysSince(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const then = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - then) / 86400000);
}
function elapsedLabel(n) {
  if (n <= 0) return { num: "今日", unit: "" };
  if (n === 1) return { num: "昨日", unit: "" };
  return { num: String(n), unit: "日前" };
}

/* ---- elements ---- */
const listEl = document.getElementById("list");
const emptyEl = document.getElementById("empty");
const sheet = document.getElementById("sheet");
const backdrop = document.getElementById("backdrop");
const toast = document.getElementById("toast");
const toastMsg = document.getElementById("toastMsg");

const fName = document.getElementById("fName");
const fEmoji = document.getElementById("fEmoji");
const fInterval = document.getElementById("fInterval");
const fDate = document.getElementById("fDate");
const sheetTitle = document.getElementById("sheetTitle");
const deleteBtn = document.getElementById("deleteBtn");
const intervalChips = document.getElementById("intervalChips");

let editingId = null;

/* ---- render ---- */
function sortItems(list) {
  const withDue = list.map((it) => {
    const days = daysSince(it.lastDone);
    const overdueBy =
      it.interval != null && days >= it.interval ? days - it.interval : null;
    return { it, days, overdueBy };
  });
  withDue.sort((a, b) => {
    const ao = a.overdueBy != null, bo = b.overdueBy != null;
    if (ao && bo) return b.overdueBy - a.overdueBy;
    if (ao !== bo) return ao ? -1 : 1;
    return b.days - a.days;
  });
  return withDue;
}

function render() {
  const rows = sortItems(items);
  listEl.innerHTML = "";
  emptyEl.hidden = items.length > 0;

  for (const { it, days } of rows) {
    const due = it.interval != null && days >= it.interval;
    const lab = elapsedLabel(days);

    const li = document.createElement("li");
    li.className = "card" + (due ? " is-due" : "");
    li.dataset.id = it.id;

    const ico = it.emoji
      ? `<span class="emoji">${it.emoji}</span>`
      : `<span class="dot-ico"></span>`;

    const hint =
      it.interval != null
        ? `<div class="hint">${due ? "そろそろ" : "目安"} ${it.interval}日</div>`
        : "";

    li.innerHTML = `
      ${ico}
      <div class="body">
        <div class="name">${escapeHtml(it.name)}</div>
        <div class="count"><span class="num">${lab.num}</span><span class="unit">${lab.unit}</span></div>
        ${hint}
      </div>
      <button class="did" type="button">やった</button>
    `;

    li.querySelector(".did").addEventListener("click", (e) => {
      e.stopPropagation();
      markDone(it.id, e.currentTarget);
    });
    li.addEventListener("click", () => openEdit(it.id));
    listEl.appendChild(li);
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

/* ---- やった（リセット） + Undo ---- */
let undoState = null;
let toastTimer = null;

function markDone(id, btn) {
  const it = items.find((x) => x.id === id);
  if (!it) return;
  undoState = { id, lastDone: it.lastDone, history: it.history.slice() };

  const today = todayISO();
  it.lastDone = today;
  it.history.push(today);
  save();

  if (btn) {
    btn.classList.add("flash");
    setTimeout(() => render(), 220);
  } else {
    render();
  }
  showToast(`「${it.name}」を今日に記録`);
}

function showToast(msg) {
  toastMsg.textContent = msg;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.hidden = true), 5000);
}

document.getElementById("undoBtn").addEventListener("click", () => {
  if (!undoState) return;
  const it = items.find((x) => x.id === undoState.id);
  if (it) {
    it.lastDone = undoState.lastDone;
    it.history = undoState.history;
    save();
    render();
  }
  undoState = null;
  toast.hidden = true;
});

/* ---- sheet (add / edit) ---- */
function openSheet() {
  backdrop.hidden = false;
  sheet.hidden = false;
}
function closeSheet() {
  backdrop.hidden = true;
  sheet.hidden = true;
  editingId = null;
}

function resetForm() {
  fName.value = "";
  fEmoji.value = "";
  fInterval.value = "";
  fDate.value = todayISO();
  setIntervalChip("");
}

function openAdd() {
  editingId = null;
  sheetTitle.textContent = "あたらしく追加";
  deleteBtn.hidden = true;
  resetForm();
  openSheet();
  fName.focus();
}

function openEdit(id) {
  const it = items.find((x) => x.id === id);
  if (!it) return;
  editingId = id;
  sheetTitle.textContent = "編集";
  deleteBtn.hidden = false;
  fName.value = it.name;
  fEmoji.value = it.emoji || "";
  fInterval.value = it.interval != null ? it.interval : "";
  fDate.value = it.lastDone;
  setIntervalChip(it.interval != null ? String(it.interval) : "");
  openSheet();
}

function setIntervalChip(days) {
  let matched = false;
  [...intervalChips.children].forEach((c) => {
    const on = c.dataset.days === days;
    c.classList.toggle("is-active", on);
    if (on) matched = true;
  });
  // カスタム値はチップに無い → なしを非アクティブ、数値はそのまま
  if (!matched) {
    [...intervalChips.children].forEach((c) => c.classList.remove("is-active"));
  }
}

intervalChips.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  [...intervalChips.children].forEach((c) => c.classList.remove("is-active"));
  chip.classList.add("is-active");
  fInterval.value = chip.dataset.days; // "" for なし
});

fInterval.addEventListener("input", () => {
  // 手入力したらチップ選択を解除（一致するものがあれば点灯）
  setIntervalChip(fInterval.value.trim());
});

/* emoji suggestions */
document.getElementById("emojiSuggest").addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") fEmoji.value = e.target.textContent;
});

/* seed chips on empty state */
document.getElementById("seed").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  items.push(makeItem(chip.dataset.name, chip.dataset.emoji, null, todayISO()));
  save();
  render();
});

function makeItem(name, emoji, interval, lastDone) {
  return {
    id: uid(),
    name,
    emoji: emoji || "",
    interval: interval, // number | null
    lastDone,
    history: [lastDone],
    createdAt: todayISO(),
  };
}

/* save */
document.getElementById("saveBtn").addEventListener("click", () => {
  const name = fName.value.trim();
  if (!name) {
    fName.focus();
    fName.style.borderColor = "var(--orange)";
    return;
  }
  const emoji = fEmoji.value.trim();
  const ivRaw = fInterval.value.trim();
  const interval = ivRaw === "" ? null : Math.max(1, Math.min(999, Number(ivRaw)));
  const date = fDate.value || todayISO();

  if (editingId) {
    const it = items.find((x) => x.id === editingId);
    if (it) {
      it.name = name;
      it.emoji = emoji;
      it.interval = interval;
      if (it.lastDone !== date) {
        it.lastDone = date;
        it.history.push(date);
      }
    }
  } else {
    items.push(makeItem(name, emoji, interval, date));
  }
  save();
  render();
  closeSheet();
});

/* delete */
deleteBtn.addEventListener("click", () => {
  if (!editingId) return;
  items = items.filter((x) => x.id !== editingId);
  save();
  render();
  closeSheet();
});

document.getElementById("cancelBtn").addEventListener("click", closeSheet);
backdrop.addEventListener("click", closeSheet);
document.getElementById("addBtn").addEventListener("click", openAdd);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !sheet.hidden) closeSheet();
});

/* ---- init ---- */
render();

/* ---- service worker (offline) ---- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
