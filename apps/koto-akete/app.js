/* ============================================================
   あけてね — a koto app by UT.
   送る系A方式：内容を JSON→base64url 化して URL の #c= に封入。
   バックエンド不要・中身はサーバーに送られない・相手はインストール不要。
   ============================================================ */
const BRAND = "koto.";

(function paintBrand() {
  const m = BRAND.match(/^(.*?)(\.)?$/);
  const html = `${m[1]}<span class="dot">${m[2] || ""}</span>`;
  document.querySelectorAll(".js-brand").forEach((el) => (el.innerHTML = html));
})();

/* 応援/ノート：実URLに差し替えるとフッターに自動表示（プレースホルダーのうちは非表示）。 */
const SUPPORT_STRIPE = "https://buy.stripe.com/00w3cx7aIeaK4lMdOCa3u00?client_reference_id=koto-akete";
const SUPPORT_NOTE   = "https://note.com/your-id";
(function paintFooter() {
  const foot = document.getElementById("footer");
  if (!foot) return;
  const ready = (u) => u && !/your-link|your-id/.test(u);
  const before = document.getElementById("copySep"); // 応援系は ©行の手前に差し込む
  const add = (label, url) => {
    if (!ready(url)) return;
    const sep = document.createElement("span"); sep.className = "sep"; sep.textContent = "·";
    const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener"; a.textContent = label;
    if (before) { foot.insertBefore(sep, before); foot.insertBefore(a, before); }
    else { foot.appendChild(sep); foot.appendChild(a); }
  };
  add("☕ 応援する", SUPPORT_STRIPE);
  add("制作ノート", SUPPORT_NOTE);
})();

/* ---- ラベルの雛形（白紙の不安を消す） ---- */
const TEMPLATES = [
  "会いたくなったら", "落ち込んだとき", "眠れない夜に", "がんばりたいとき",
  "元気がほしいとき", "わたしを思い出したくなったら", "誕生日に", "ありがとうを伝えたくなったら",
  "うまくいかない日に", "ひとりだと感じたら",
];
(function fillTemplates() {
  const dl = document.getElementById("labelTemplates");
  if (dl) TEMPLATES.forEach((t) => { const o = document.createElement("option"); o.value = t; dl.appendChild(o); });
})();

/* ---- base64url（日本語対応・依存ゼロ） ---- */
function b64urlEncode(str) {
  const utf8 = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  return btoa(utf8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const pct = Array.from(bin).map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
  return decodeURIComponent(pct);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function buildURL(data) {
  return location.origin + location.pathname + "#c=" + b64urlEncode(JSON.stringify(data));
}

/* ---- toast / share ---- */
function toast(msg) {
  const t = document.getElementById("toast"); if (!t) return;
  document.getElementById("toastMsg").textContent = msg;
  t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => (t.hidden = true), 2600);
}
async function shareLink(url, title) {
  if (navigator.share) { try { await navigator.share({ title, text: "あなたに手紙を束ねたよ。", url }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
  try { await navigator.clipboard.writeText(url); toast("リンクをコピーしました ✓"); }
  catch { prompt("このリンクを送ってください", url); }
}

/* ============================================================
   ① つくる
   ============================================================ */
const secCreate = document.getElementById("mode-create");
const secOpen = document.getElementById("mode-open");
const lettersEl = document.getElementById("letters");

function letterRow(label, body, date) {
  const row = document.createElement("div");
  row.className = "letter-row";
  row.innerHTML = `
    <div class="row-head">
      <input class="lr-label" list="labelTemplates" maxlength="20" placeholder="開けてほしいとき（ラベル）" />
      <button type="button" class="lr-del" aria-label="削除">×</button>
    </div>
    <textarea class="lr-body" rows="3" maxlength="280" placeholder="その時のあなたへ、ひとこと…"></textarea>
    <label class="lr-date"><span>いつ開ける？（任意）</span><input type="date" class="lr-date-in" /></label>
  `;
  row.querySelector(".lr-label").value = label || "";
  row.querySelector(".lr-body").value = body || "";
  row.querySelector(".lr-date-in").value = date || "";
  row.querySelector(".lr-del").addEventListener("click", () => {
    if (lettersEl.querySelectorAll(".letter-row").length <= 1) { toast("最低1通は必要です"); return; }
    row.remove(); updateGauge();
  });
  row.querySelectorAll("input, textarea").forEach((el) => el.addEventListener("input", updateGauge));
  return row;
}
function addRow(label, body, date) {
  if (lettersEl.querySelectorAll(".letter-row").length >= 7) { toast("無料版は7通までです"); return; }
  lettersEl.appendChild(letterRow(label, body, date));
  updateGauge();
}

function readDraft() {
  const from = (document.getElementById("fromName").value || "").trim();
  const ls = [];
  lettersEl.querySelectorAll(".letter-row").forEach((row) => {
    const l = row.querySelector(".lr-label").value.trim();
    const b = row.querySelector(".lr-body").value.trim();
    const d = row.querySelector(".lr-date-in").value;
    if (b) { const o = { l: l || "そのときに", b }; if (d) o.d = d; ls.push(o); }
  });
  return { f: from, ls };
}

function updateGauge() {
  const fill = document.getElementById("gaugeFill");
  const label = document.getElementById("gaugeLabel");
  const data = readDraft();
  if (!data.ls.length) { fill.style.width = "0%"; label.textContent = "手紙を書くと、容量の目安が出ます。"; label.className = "gauge-label"; return; }
  const url = buildURL(data);
  const len = url.length;
  // 安全圏 ~5000 / 余裕 ~8000 / 警告
  const pct = Math.min(100, Math.round((len / 8000) * 100));
  fill.style.width = pct + "%";
  let tier = "ok", msg = `${data.ls.length}通・リンク約${len.toLocaleString()}文字：ゆったり届きます。`;
  if (len > 8000) { tier = "warn"; msg = `${data.ls.length}通・約${len.toLocaleString()}文字：長すぎるかも。通数を減らすか短く。`; }
  else if (len > 5000) { tier = "mid"; msg = `${data.ls.length}通・約${len.toLocaleString()}文字：まだ大丈夫（QRには長め）。`; }
  fill.dataset.tier = tier;
  label.textContent = msg;
  label.className = "gauge-label " + tier;
}

document.getElementById("addLetter").addEventListener("click", () => addRow());
document.getElementById("makeLink").addEventListener("click", () => {
  const data = readDraft();
  if (!data.ls.length) { toast("手紙を1通は書いてください"); return; }
  if (buildURL(data).length > 9000) { toast("長すぎます。通数を減らすか短くしてください"); return; }
  shareLink(buildURL(data), "あけてね");
});

function showCreate() {
  secOpen.hidden = true; secCreate.hidden = false;
  if (!lettersEl.querySelectorAll(".letter-row").length) { addRow(); addRow(); }
}

/* ============================================================
   ② 届いた束 ＋ ③ 1通を開く
   ============================================================ */
function bundleKey() {
  const m = location.hash.match(/c=([^&]+)/); const c = m ? m[1] : "";
  let h = 0; for (let i = 0; i < c.length; i++) h = (h * 31 + c.charCodeAt(i)) >>> 0;
  return "akete/" + h;
}
function getOpened() { try { return JSON.parse(localStorage.getItem(bundleKey())) || []; } catch { return []; } }
function markOpened(i) { const o = getOpened(); if (!o.includes(i)) { o.push(i); localStorage.setItem(bundleKey(), JSON.stringify(o)); } }

function isLocked(d) {
  if (!d) return false;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t = new Date(d + "T00:00:00");
  return !isNaN(t) && today < t;
}
function fmtDate(d) {
  const t = new Date(d + "T00:00:00"); if (isNaN(t)) return d;
  return `${t.getFullYear()}年${t.getMonth() + 1}月${t.getDate()}日`;
}

let CURRENT = null;
function showOpen(data) {
  CURRENT = data;
  secCreate.hidden = true; secOpen.hidden = false;
  const from = data.f ? escapeHtml(data.f) + "さん" : "だれか";
  document.getElementById("fromHead").innerHTML = `<b>${from}</b>から、手紙が届きました`;
  const grid = document.getElementById("envelopes");
  grid.innerHTML = "";
  const opened = getOpened();
  data.ls.forEach((lt, i) => {
    const env = document.createElement("button");
    env.type = "button";
    env.className = "envelope" + (opened.includes(i) ? " read" : "") + (isLocked(lt.d) ? " locked" : "");
    env.innerHTML = `
      <span class="env-seal" aria-hidden="true"></span>
      <span class="env-label">${escapeHtml(lt.l || "そのときに")}</span>
      <span class="env-meta">${opened.includes(i) ? "ひらいた" : (isLocked(lt.d) ? fmtDate(lt.d) + "に" : "ひらく")}</span>
    `;
    env.addEventListener("click", () => openLetter(i));
    grid.appendChild(env);
  });
  document.getElementById("makeOwn").href = location.origin + location.pathname;
}

const opener = document.getElementById("opener");
const openerBody = document.getElementById("openerBody");
const openerClose = document.getElementById("openerClose");
const openerTitle = document.getElementById("openerTitle");
let lastFocused = null; // 開封元の封筒（閉じたら戻す）
openerClose.addEventListener("click", closeOpener);
opener.addEventListener("click", (e) => { if (e.target === opener) closeOpener(); });
opener.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { e.preventDefault(); closeOpener(); return; }
  if (e.key === "Tab") trapTab(e); // ダイアログ内にフォーカスを留める
});
function focusables() {
  return Array.from(opener.querySelectorAll('button, a[href], input, [tabindex]:not([tabindex="-1"])'))
    .filter((el) => !el.disabled && el.offsetParent !== null);
}
function trapTab(e) {
  const f = focusables(); if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}
function closeOpener() {
  opener.hidden = true; openerBody.innerHTML = "";
  if (lastFocused && document.body.contains(lastFocused)) lastFocused.focus();
  lastFocused = null;
}

function openLetter(i) {
  const lt = CURRENT.ls[i];
  lastFocused = document.querySelectorAll("#envelopes .envelope")[i] || document.activeElement;
  opener.hidden = false;
  if (isLocked(lt.d)) {
    openerTitle.textContent = "まだ早いみたい";
    openerBody.innerHTML = `
      <p class="notyet-title">まだ早いみたい。</p>
      <p class="notyet-date">${fmtDate(lt.d)}に開けてね。</p>
      <button type="button" class="btn-ghost" id="openAnyway">それでも今、開ける</button>`;
    document.getElementById("openAnyway").addEventListener("click", () => reveal(i));
    openerClose.focus();
    return;
  }
  reveal(i);
}
function reveal(i) {
  const lt = CURRENT.ls[i];
  markOpened(i);
  openerTitle.textContent = lt.l || "そのときに";
  openerBody.innerHTML = `
    <div class="seal-break" aria-hidden="true"></div>
    <article class="paper">
      <p class="paper-label">${escapeHtml(lt.l || "そのときに")}</p>
      <p class="paper-body">${escapeHtml(lt.b).replace(/\n/g, "<br />")}</p>
      <p class="paper-from">${CURRENT.f ? "— " + escapeHtml(CURRENT.f) : ""}</p>
    </article>`;
  openerClose.focus();
  // 開いた印を一覧にも反映
  const env = document.querySelectorAll("#envelopes .envelope")[i];
  if (env) { env.classList.add("read"); const meta = env.querySelector(".env-meta"); if (meta) meta.textContent = "ひらいた"; }
}

/* ---- ルーティング ---- */
function init() {
  const m = location.hash.match(/c=([^&]+)/);
  if (m) {
    try {
      const data = JSON.parse(b64urlDecode(m[1]));
      if (data && Array.isArray(data.ls) && data.ls.length) return showOpen(data);
    } catch (e) { /* デコード不能 → つくるへ */ }
  }
  showCreate();
}
window.addEventListener("hashchange", init);
init();
