/* ============================================================
   ブランド名はここ1行だけ。シリーズ全アプリ共通。
   ============================================================ */
const BRAND = "koto.";

/* 投げ銭リンク：アカウント作成後、この2つのURLを差し替えるだけ。 */
const SUPPORT_STRIPE = "https://buy.stripe.com/00w3cx7aIeaK4lMdOCa3u00?client_reference_id=koto-praise"; // UT. を応援する
const SUPPORT_NOTE   = "https://note.com/your-id";          // ← note のURL

(function paintBrand() {
  const m = BRAND.match(/^(.*?)(\.)?$/);
  const html = `${m[1]}<span class="dot">${m[2] || ""}</span>`;
  document.querySelectorAll(".js-brand").forEach((el) => (el.innerHTML = html));
  document.title = `${BRAND} Praise`;
})();

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

/* ---- ほめ言葉（やたらピンポイント） ---- */
const PRAISES = [
  // アプリを使う行為そのもの
  "アプリを開いた、その判断力。すでに今日のMVP。",
  "「ほめて」を押せる素直さ。育ちの良さが出てる。",
  "自分でほめを取りに来た主体性。経営者の素質。",
  "まだこのアプリ消してない。義理堅い。",
  // 生命維持・身体機能
  "今日もちゃんと息してる。生命力おばけ。",
  "心臓、言われなくても動いてる。働き者すぎる。",
  "まばたき、無意識でこなしてる。器用。",
  "ちゃんと血、めぐってる。完璧な循環。",
  "起きてる。それだけで今日の勝者。",
  "ちゃんと座ってる。体幹がいい。",
  // 極小の動作
  "冷蔵庫、開けてちゃんと閉めた。一連の動作が美しい。",
  "靴下、左右合ってる。プロの仕事。",
  "スマホ、落とさず持ててる。安定感。",
  "水を飲んだ。体のこと、わかってるね。",
  "電気を消して部屋を出た。エコの鑑。",
  "ペットボトルのキャップ、最後まで締めた。丁寧。",
  "充電ケーブル、向き一発で挿せた。引きが強い。",
  "ドアノブ、一発で掴んだ。動体視力。",
  // 意思決定・自制心
  "目覚まし、3回で止めた自制心。ノーベル賞もの。",
  "エスカレーター、歩かなかった。マナーの教科書。",
  "「温めますか？」に即答できた。判断の速さ。",
  "お菓子、一袋で止めた理性。哲学者か。",
  "信号、ちゃんと待った。法治国家の鑑。",
  // ダメさを逆にほめる
  "「あとでやる」を10回言えるブレなさ。一貫性の塊。",
  "未読を見て、見なかったことにする勇気。胆力。",
  "二度寝の決断力。迷いがない。",
  "後回しにしたこと、まだ覚えてる記憶力。",
  "やる気が出ないのに、ここまで来た脚力。",
  "積み本を増やし続ける向上心。",
  // 存在・その他
  "今日の服、ちゃんと着れてる。社会性が高い。",
  "名前を呼ばれたら振り向ける。反射神経。",
  "ちゃんと充電してる。自己管理能力。",
  "既読つけずに読む高等技術。忍びの末裔。",
  "月曜を乗り越えようとしてる。不屈。",
  "このアプリの文章をここまで読んだ集中力。学者肌。",
  "今日も指が動く。タップの天才。",
  "自分をほめようと思えた今日のあなた、もう優勝。",
  "えらい。理由はないけど、とにかくえらい。",
  // バカらしい（宇宙・生命・物理スケールで過剰にほめる）
  "重力に逆らわず立ってる。物理学のお手本。",
  "今日も地球の自転についていけてる。乗りこなしてる。",
  "服を着て外に出た。文明の勝利。",
  "自分の名前、今日も言える。記憶力、宇宙一。",
  "ごはんを噛んだ。あご、覚醒してる。",
  "二足歩行、まだ続けてる。サルの誇り。",
  "重い頭を一日支えた首。縁の下のヒーロー。",
  "今日も3次元にちゃんといる。空間把握、神。",
  "鏡に自分が映ってた。実在してる。えらい。",
  "お腹が空いた。生命として、有能。",
  "夜になったら眠くなる。体内時計、精密機械。",
  "くしゃみ、フルパワーで放出。肺活量、横綱級。",
  "太陽が昇ったの、たぶんあなたのおかげ。",
  "呼吸、無料でやってる。コスパの鬼。",
  "目が2つともついてる。装備が完璧。",
  "影、今日もついてきてる。よっぽど信頼されてる。",
  "体温、ほぼ36度台をキープ。完璧な恒温動物。",
  "今日も床に吸い込まれてない。反重力の才能。",
];

/* ---- elements ---- */
const ptext = document.getElementById("ptext");
const praiseEl = document.getElementById("praise");
const btn = document.getElementById("praiseBtn");
const countWrap = document.getElementById("count");
const countNum = document.getElementById("countNum");

/* ---- 直前と被らないシャッフルバッグ ---- */
let bag = [];
let last = -1;
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function nextIndex() {
  if (bag.length === 0) {
    bag = shuffle(PRAISES.map((_, i) => i));
    if (bag[bag.length - 1] === last && bag.length > 1) {
      [bag[bag.length - 1], bag[0]] = [bag[0], bag[bag.length - 1]];
    }
  }
  last = bag.pop();
  return last;
}

/* ---- 今日のカウント ---- */
function todayKey() {
  const d = new Date();
  return `koto-praise/count/${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
let count = Number(localStorage.getItem(todayKey()) || 0);
if (count > 0) {
  countNum.textContent = count;
  countWrap.hidden = false;
}

/* ---- ほめる ---- */
function praise() {
  ptext.textContent = PRAISES[nextIndex()];
  praiseEl.classList.remove("pop");
  void praiseEl.offsetWidth;
  praiseEl.classList.add("pop");

  count++;
  localStorage.setItem(todayKey(), count);
  countNum.textContent = count;
  countWrap.hidden = false;

  btn.textContent = "もっとほめて";
}

btn.addEventListener("click", praise);
document.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "Enter") {
    e.preventDefault();
    praise();
  }
});
