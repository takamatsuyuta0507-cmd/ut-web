/* ============================================================
   ブランド名はここ1行だけ。シリーズ全アプリ共通。
   ============================================================ */
const BRAND = "koto.";

(function paintBrand() {
  const m = BRAND.match(/^(.*?)(\.)?$/);
  const html = `${m[1]}<span class="dot">${m[2] || ""}</span>`;
  document.querySelectorAll(".js-brand").forEach((el) => (el.innerHTML = html));
  document.title = `${BRAND} 1Q`;
})();

/* 投げ銭リンク：実URLに差し替えると、フッターに自動表示されます（プレースホルダーのうちは非表示）。 */
const SUPPORT_STRIPE = "https://buy.stripe.com/00w3cx7aIeaK4lMdOCa3u00?client_reference_id=koto-pair"; // UT. を応援する
const SUPPORT_NOTE   = "";          // ← note のURL
(function paintFooter() {
  const foot = document.getElementById("footer");
  if (!foot) return;
  const ready = (u) => u && !/your-link|your-id/.test(u);
  const add = (label, url) => {
    if (!ready(url)) return;
    const sep = document.createElement("span");
    sep.className = "sep";
    sep.textContent = "·";
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = label;
    foot.appendChild(sep);
    foot.appendChild(a);
  };
  add("☕ 応援する", SUPPORT_STRIPE);
  add("制作ノート", SUPPORT_NOTE);
})();

/* ---- 質問バンク（軽い→踏み込む を混ぜる） ---- */
const QUESTIONS = [
  "最近、ありがとうと思ったのに言えてないことは？",
  "出会った日に戻れたら、最初に何て声をかける？",
  "5年後、どんな休日を一緒に過ごしてたい？",
  "私の口ぐせ、なんだと思う？",
  "最近、相手のどんなところに惚れ直した？",
  "来週、ふたりでやってみたい小さなことは？",
  "一緒に観た中で、いちばん好きな映画は？",
  "私の作る料理で、いちばん好きなのは？",
  "ケンカした後、本当はどうしてほしい？",
  "相手の笑顔で、好きな瞬間は？",
  "子どものころの夢、覚えてる？",
  "いま、いちばん一緒に行きたい場所は？",
  "最近のいちばん小さな幸せは？",
  "相手のどんな時間を、もっと増やしてあげたい？",
  "ふたりの思い出の曲をひとつ挙げるなら？",
  "今日、相手にいちばん感謝したことは？",
  "言葉にしてないけど、ずっと素敵だと思ってることは？",
  "もし一日入れ替われたら、まず何をする？",
  "最近、相手にしてもらって嬉しかったことは？",
  "ふたりで叶えたい、ちょっと先の目標は？",
  "相手の好きなところを3つ、すぐ言える？",
  "疲れた日に、いちばん癒やされる相手のしぐさは？",
  "次の記念日、どんなふうに過ごしたい？",
  "付き合って、いちばん笑った出来事は？",
  "ふたりの「定番」になってることは何？",
  "もっとこうしたいな、と思う二人の習慣は？",
  "相手のことで、最近知って驚いたことは？",
  "10年後、どんな二人でいたい？",
  "相手にいちばん見せたい景色は？",
  "今、伝えたい「好き」をひとことで。",
];

/* ---- base64url（日本語対応・依存ゼロ） ---- */
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

/* ---- 質問の選択（重複を避けて巡回・端末に保存。リレーのリンクに q があればそれを優先） ---- */
const QKEY_BAG = "koto-pair/bag";
const QKEY_CUR = "koto-pair/cur";
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function drawQuestion() {
  let bag;
  try { bag = JSON.parse(localStorage.getItem(QKEY_BAG)) || []; } catch { bag = []; }
  const last = Number(localStorage.getItem(QKEY_CUR));
  if (!Array.isArray(bag) || bag.length === 0) {
    bag = shuffle(QUESTIONS.map((_, i) => i));
    if (bag[bag.length - 1] === last && bag.length > 1) {
      [bag[bag.length - 1], bag[0]] = [bag[0], bag[bag.length - 1]];
    }
  }
  const idx = bag.pop();
  localStorage.setItem(QKEY_BAG, JSON.stringify(bag));
  localStorage.setItem(QKEY_CUR, String(idx));
  return idx;
}
function currentQuestion() {
  const cur = localStorage.getItem(QKEY_CUR);
  const n = Number(cur);
  return cur !== null && cur !== "" && Number.isInteger(n) ? n : drawQuestion();
}
function questionOf(data) {
  const i = data && Number.isInteger(data.q) ? data.q : currentQuestion();
  return QUESTIONS[((i % QUESTIONS.length) + QUESTIONS.length) % QUESTIONS.length];
}
let currentQ = currentQuestion();

function buildURL(data) {
  return location.origin + location.pathname + "#c=" + b64urlEncode(JSON.stringify(data));
}

/* ---- 共有 ---- */
function toast(msg) {
  const t = document.getElementById("toast");
  document.getElementById("toastMsg").textContent = msg;
  t.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => (t.hidden = true), 2600);
}
async function shareLink(url, title) {
  if (navigator.share) {
    try { await navigator.share({ title, text: "今日の1問だよ", url }); } catch {}
  } else {
    try { await navigator.clipboard.writeText(url); toast("リンクをコピーしました ✓"); }
    catch { prompt("このリンクを送ってください", url); }
  }
}

/* ---- sections ---- */
const secCreate = document.getElementById("mode-create");
const secAnswer = document.getElementById("mode-answer");
const secBoth = document.getElementById("mode-both");

/* ============ ① つくる ============ */
function showCreate() {
  secAnswer.hidden = true; secBoth.hidden = true; secCreate.hidden = false;
  document.getElementById("q1").textContent = QUESTIONS[currentQ];
}
document.getElementById("send1").addEventListener("click", () => {
  const a = document.getElementById("a1").value.trim();
  if (!a) { document.getElementById("a1").focus(); return; }
  const data = { q: currentQ, a, af: document.getElementById("name1").value.trim() };
  shareLink(buildURL(data), `${BRAND} 1Q`);
  // 送ったら次の質問へ（同じ問題に戻らないように）
  currentQ = drawQuestion();
  document.getElementById("a1").value = "";
  document.getElementById("q1").textContent = QUESTIONS[currentQ];
  toast("送りました。次の質問にしました ✓");
});

/* べつの質問にする */
(function () {
  const btn = document.getElementById("shuffleQ");
  if (!btn) return;
  btn.addEventListener("click", () => {
    currentQ = drawQuestion();
    document.getElementById("a1").value = "";
    document.getElementById("q1").textContent = QUESTIONS[currentQ];
  });
})();

/* ============ ② 相手から届いた ============ */
function showAnswer(data) {
  secCreate.hidden = true; secBoth.hidden = true; secAnswer.hidden = false;
  const from = data.af ? `${escapeHtml(data.af)}さん` : "パートナー";
  document.getElementById("fromhead").innerHTML = `<b>${from}</b>から 今日の1問`;
  document.getElementById("q2").textContent = questionOf(data);

  document.getElementById("answer2").onclick = () => {
    const b = document.getElementById("a2").value.trim();
    if (!b) { document.getElementById("a2").focus(); return; }
    const full = { q: data.q, a: data.a, af: data.af, b, bf: document.getElementById("name2").value.trim() };
    showBoth(full, true);
  };
}

/* ============ ③ ふたりの答え ============ */
function showBoth(data, canSendBack) {
  secCreate.hidden = true; secAnswer.hidden = true; secBoth.hidden = false;
  secBoth.classList.remove("fade"); void secBoth.offsetWidth; secBoth.classList.add("fade");

  document.getElementById("q3").textContent = questionOf(data);
  document.getElementById("nameA").textContent = data.af ? `${data.af}` : "パートナー";
  document.getElementById("textA").textContent = data.a || "";
  document.getElementById("nameB").textContent = data.bf ? `${data.bf}` : "あなた";
  document.getElementById("textB").textContent = data.b || "";

  const back = document.getElementById("sendBack");
  back.hidden = !canSendBack;
  if (canSendBack) {
    back.onclick = () => shareLink(buildURL(data), `${BRAND} 1Q`);
  }
  document.getElementById("makeOwn").href = location.origin + location.pathname;
}

/* ---- ルーティング ---- */
function init() {
  const m = location.hash.match(/c=([^&]+)/);
  if (m) {
    try {
      const data = JSON.parse(b64urlDecode(m[1]));
      if (data.a != null && data.b != null) return showBoth(data, false);
      if (data.a != null) return showAnswer(data);
    } catch (e) { /* デコード不能 → つくるへ */ }
  }
  showCreate();
}
window.addEventListener("hashchange", init);
init();
