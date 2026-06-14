/* ============================================================
   ブランド名はここ1行だけ。シリーズ全アプリ共通。
   例: "koto." / "dot." / "mono." ピリオドが自動でオレンジに。
   ============================================================ */
const BRAND = "koto.";

/* ---- brand wordmark（複数箇所に描画） ---- */
(function paintBrand() {
  const m = BRAND.match(/^(.*?)(\.)?$/);
  const html = `${m[1]}<span class="dot">${m[2] || ""}</span>`;
  document.querySelectorAll(".js-brand").forEach((el) => (el.innerHTML = html));
  document.title = `${BRAND} Ticket`;
})();

/* 投げ銭リンク：アカウント作成後、この2つのURLを差し替えるだけ。 */
const SUPPORT_STRIPE = "https://buy.stripe.com/00w3cx7aIeaK4lMdOCa3u00?client_reference_id=koto-ticket"; // UT. を応援する
const SUPPORT_NOTE   = "";          // ← note のURL
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

/* ---- テンプレート ---- */
const TEMPLATES = {
  katatataki: { emoji: "💆", title: "肩たたき券" },
  kaji:       { emoji: "🧹", title: "家事代行券" },
  hug:        { emoji: "🤗", title: "ハグ券" },
  otsukai:    { emoji: "🛍️", title: "おつかい券" },
  wagamama:   { emoji: "🎫", title: "わがまま券" },
  free:       { emoji: "🎟️", title: "" },
};

/* ---- base64url（日本語・絵文字対応・依存ゼロ） ---- */
function b64urlEncode(str) {
  const utf8 = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, h) =>
    String.fromCharCode(parseInt(h, 16))
  );
  return btoa(utf8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const pct = Array.from(bin)
    .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
  return decodeURIComponent(pct);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}
function shortHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/* ---- ticket の描画 ---- */
function resolved(obj) {
  const tpl = TEMPLATES[obj.t] || TEMPLATES.free;
  const title = obj.t === "free" ? obj.ti || "チケット" : tpl.title;
  return { emoji: tpl.emoji, title };
}
function dotsHTML(count, used) {
  if (!count) return `<span class="inf">∞</span>`;
  let out = "";
  for (let i = 0; i < count; i++) {
    out += `<span class="${i < count - used ? "" : "spent"}">●</span>`;
  }
  return out;
}
function ticketInner(obj, used) {
  const { emoji, title } = resolved(obj);
  const count = obj.c || 0;
  const msg = obj.m ? `<div class="t-msg">「${escapeHtml(obj.m)}」</div>` : "";
  const from = obj.f ? `<div class="t-from">from ${escapeHtml(obj.f)}</div>` : "";
  return `
    <span class="t-emoji">${emoji}</span>
    <div class="t-title">${escapeHtml(title)}</div>
    <div class="t-dots">${dotsHTML(count, used)}</div>
    ${msg}${from}
    <div class="t-brand">${BRAND} TICKET</div>
  `;
}

/* ============================================================
   つくる モード
   ============================================================ */
const createEl = document.getElementById("create");
const receiveEl = document.getElementById("receive");
const preview = document.getElementById("preview");
const tplChips = document.getElementById("tplChips");
const countChips = document.getElementById("countChips");
const fTitle = document.getElementById("fTitle");
const fFrom = document.getElementById("fFrom");
const fMsg = document.getElementById("fMsg");

const state = { tpl: "katatataki", count: 3 };

function currentObj() {
  const obj = { t: state.tpl, c: state.count, f: fFrom.value.trim(), m: fMsg.value.trim() };
  if (state.tpl === "free") obj.ti = fTitle.value.trim();
  return obj;
}
function updatePreview() {
  preview.innerHTML = ticketInner(currentObj(), 0);
}
function buildURL(obj) {
  return (
    location.origin + location.pathname + "#c=" + b64urlEncode(JSON.stringify(obj))
  );
}

tplChips.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  [...tplChips.children].forEach((c) => c.classList.remove("is-active"));
  chip.classList.add("is-active");
  state.tpl = chip.dataset.tpl;
  fTitle.hidden = state.tpl !== "free";
  updatePreview();
});
countChips.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  [...countChips.children].forEach((c) => c.classList.remove("is-active"));
  chip.classList.add("is-active");
  state.count = Number(chip.dataset.c);
  updatePreview();
});
[fTitle, fFrom, fMsg].forEach((el) => el.addEventListener("input", updatePreview));

/* 共有・コピー */
function toast(msg) {
  const t = document.getElementById("toast");
  document.getElementById("toastMsg").textContent = msg;
  t.hidden = false;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => (t.hidden = true), 2600);
}

document.getElementById("copyBtn").addEventListener("click", async () => {
  const url = buildURL(currentObj());
  try {
    await navigator.clipboard.writeText(url);
    toast("リンクをコピーしました ✓");
  } catch {
    prompt("このリンクをコピーして送ってください", url);
  }
});

document.getElementById("shareBtn").addEventListener("click", async () => {
  const obj = currentObj();
  const url = buildURL(obj);
  const { title } = resolved(obj);
  if (navigator.share) {
    try {
      await navigator.share({ title: `${title}（${BRAND} TICKET）`, text: "券がとどきました", url });
    } catch { /* キャンセルは無視 */ }
  } else {
    try {
      await navigator.clipboard.writeText(url);
      toast("共有未対応のためリンクをコピーしました");
    } catch {
      prompt("このリンクをコピーして送ってください", url);
    }
  }
});

/* 画像で保存（canvas → PNG） */
function drawCanvas(obj) {
  const { emoji, title } = resolved(obj);
  const count = obj.c || 0;
  const c = document.createElement("canvas");
  c.width = 1000; c.height = 620;
  const x = c.getContext("2d");
  x.fillStyle = "#FAF9F7"; x.fillRect(0, 0, c.width, c.height);
  // card
  roundRect(x, 70, 70, 860, 480, 36);
  x.fillStyle = "#FFFFFF"; x.fill();
  x.lineWidth = 2; x.strokeStyle = "#ECEAE6"; x.stroke();
  x.textAlign = "center";
  x.fillStyle = "#1B1B1B"; x.font = "92px sans-serif";
  x.fillText(emoji, 500, 230);
  x.fillStyle = "#FF5C1A"; x.font = "bold 56px 'Zen Kaku Gothic New', sans-serif";
  x.fillText(title, 500, 320);
  // dots
  x.font = "40px sans-serif";
  if (!count) { x.fillText("∞", 500, 388); }
  else {
    const gap = 46, total = (count - 1) * gap, startX = 500 - total / 2;
    for (let i = 0; i < count; i++) { x.fillStyle = "#FF5C1A"; x.fillText("●", startX + i * gap, 392); }
  }
  if (obj.m) { x.fillStyle = "#1B1B1B"; x.font = "30px 'Zen Kaku Gothic New', sans-serif"; x.fillText(`「${obj.m}」`, 500, 452); }
  if (obj.f) { x.fillStyle = "#767676"; x.font = "26px 'Zen Kaku Gothic New', sans-serif"; x.fillText(`from ${obj.f}`, 500, 498); }
  x.fillStyle = "#c5c2bb"; x.font = "22px sans-serif"; x.fillText(`${BRAND} TICKET`, 500, 538);
  return c;
}
function roundRect(x, X, Y, w, h, r) {
  x.beginPath();
  x.moveTo(X + r, Y);
  x.arcTo(X + w, Y, X + w, Y + h, r);
  x.arcTo(X + w, Y + h, X, Y + h, r);
  x.arcTo(X, Y + h, X, Y, r);
  x.arcTo(X, Y, X + w, Y, r);
  x.closePath();
}
document.getElementById("imgBtn").addEventListener("click", () => {
  const c = drawCanvas(currentObj());
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = "ticket.png";
  a.click();
  toast("画像を保存しました ✓");
});

/* ============================================================
   もらう モード
   ============================================================ */
const rticket = document.getElementById("rticket");
const useBtn = document.getElementById("useBtn");
const undoUse = document.getElementById("undoUse");

function showReceive(obj) {
  createEl.hidden = true;
  receiveEl.hidden = false;

  const count = obj.c || 0;
  const key = "koto-ticket/used/" + shortHash(JSON.stringify(obj));
  let used = Number(localStorage.getItem(key) || 0);

  function paint() {
    rticket.innerHTML = ticketInner(obj, used);
    if (count && used >= count) {
      useBtn.disabled = true;
      useBtn.textContent = "つかいきった";
    } else {
      useBtn.disabled = false;
      useBtn.textContent = "つかう";
    }
    undoUse.hidden = used <= 0;
  }

  useBtn.onclick = () => {
    if (count && used >= count) return;
    used++;
    localStorage.setItem(key, used);
    rticket.classList.remove("flash");
    void rticket.offsetWidth;
    rticket.classList.add("flash");
    paint();
  };
  undoUse.onclick = () => {
    if (used > 0) { used--; localStorage.setItem(key, used); paint(); }
  };

  document.getElementById("makeOwn").href = location.origin + location.pathname;
  paint();
}

function showCreate() {
  receiveEl.hidden = true;
  createEl.hidden = false;
  updatePreview();
}

/* ---- init / ルーティング ---- */
function init() {
  const m = location.hash.match(/c=([^&]+)/);
  if (m) {
    try {
      const obj = JSON.parse(b64urlDecode(m[1]));
      showReceive(obj);
      return;
    } catch (e) {
      /* デコード不能 → つくるモードへ */
    }
  }
  showCreate();
}
window.addEventListener("hashchange", init);
init();
