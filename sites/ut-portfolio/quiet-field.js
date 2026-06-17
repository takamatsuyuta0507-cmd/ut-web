/* =========================================================
   UT. — 点描の余白 (Quiet Field)
   Canonical hero back-layer. Self-contained IIFE, decoration only.
   Decoupled from behavior.js; never blocks content (pointer-events:none).

   Usage:
     <canvas id="hero-field" aria-hidden="true"
             data-gap="46" data-dot="0.10" data-reach="130"
             data-push="16" data-radius="1.1"></canvas>
     <script src="./quiet-field.js"></script>
   The canvas must sit inside (or be) a positioned hero element; the script
   measures its nearest hero container. By default it looks for #heroes, then
   the canvas's offsetParent, then the canvas's parent.

   data-* config (all optional — defaults = ut-portfolio reference values):
     data-gap     grid spacing in px (46). Larger = sparser, quieter.
     data-dot     ink opacity of a resting dot, 0–1 (0.10). Lower = fainter.
     data-radius  base dot radius in px (1.1).
     data-reach   cursor influence radius in px (130).
     data-push    how far dots lean from the cursor, px (16). Lower = calmer.
     data-wide-gap grid spacing on wide (>1400px) screens (defaults gap+8).

   JS off  → no canvas drawing; hero text is fully readable (canvas is empty).
   reduced-motion → a single still grid, no animation.
   off-screen (IntersectionObserver) → animation pauses.
   ========================================================= */
(function () {
  var canvas = document.getElementById('hero-field');
  if (!canvas) return;
  var ctx = canvas.getContext && canvas.getContext('2d');
  if (!ctx) return;

  // hero container to measure: #heroes (portfolio) → offsetParent → parent
  var hero = document.getElementById('heroes') ||
             canvas.offsetParent ||
             canvas.parentElement;
  if (!hero) return;

  function num(name, fallback) {
    var v = parseFloat(canvas.getAttribute(name));
    return isNaN(v) ? fallback : v;
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 2);

  // --- config (data-* with portfolio-reference defaults) ---
  var GAP   = num('data-gap', 46);        // grid spacing
  var R0    = num('data-radius', 1.1);    // base dot radius
  var DOT   = num('data-dot', 0.10);      // resting ink opacity
  var REACH = num('data-reach', 130);     // cursor influence radius
  var PUSH  = num('data-push', 16);       // lean-away strength
  var WIDE_GAP = num('data-wide-gap', GAP + 8); // sparser on wide screens
  var INK = 'rgba(27,27,27,' + DOT + ')'; // 墨 — resting colour

  var W = 0, H = 0, dots = [];
  var pointer = { x: -9999, y: -9999, on: false };
  var t = 0, running = false, raf = null, idle = 0, visible = true;

  function build() {
    var r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    if (W <= 0 || H <= 0) return;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    dots = [];
    // keep dot count light even on wide screens
    var gap = W > 1400 ? WIDE_GAP : GAP;
    var cols = Math.ceil(W / gap) + 1, rows = Math.ceil(H / gap) + 1;
    for (var j = 0; j < rows; j++) {
      for (var i = 0; i < cols; i++) {
        var x = i * gap, y = j * gap;
        dots.push({ x: x, y: y, bx: x, by: y, ph: (i * 0.6 + j * 0.9) });
      }
    }
  }

  if (!reduce) {
    window.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; pointer.on = true;
      idle = 0; ensureRun();
    }, { passive: true });
    window.addEventListener('pointerleave', function () { pointer.on = false; });
  }

  function frame() {
    t += 0.012;
    ctx.clearRect(0, 0, W, H);
    var moved = false;
    for (var k = 0; k < dots.length; k++) {
      var d = dots[k];
      var sw = Math.sin(t + d.ph) * 1.6;           // slow ambient breathing
      var tx = d.bx, ty = d.by + sw;
      var a = 0;
      if (pointer.on) {
        var dx = d.bx - pointer.x, dy = d.by - pointer.y, dist = Math.hypot(dx, dy);
        if (dist < REACH) {
          var push = (1 - dist / REACH);
          tx += (dx / (dist || 1)) * push * PUSH;   // lean away from cursor
          ty += (dy / (dist || 1)) * push * PUSH;
          a = push;                                  // closeness → orange warmth
        }
      }
      d.x += (tx - d.x) * 0.12; d.y += (ty - d.y) * 0.12;  // spring back
      if (Math.abs(tx - d.x) > 0.3 || Math.abs(ty - d.y) > 0.3) moved = true;
      var r = R0 + a * 1.4;
      if (a > 0.04) {
        ctx.fillStyle = 'rgba(255,92,26,' + (0.12 + a * 0.6) + ')';
      } else {
        ctx.fillStyle = INK;
      }
      ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, Math.PI * 2); ctx.fill();
    }
    if (pointer.on || moved) idle = 0; else idle++;
    if (idle > 240) { running = false; raf = null; return; }   // coast to a stop
    raf = requestAnimationFrame(frame);
  }

  function ensureRun() {
    if (reduce || !visible) return;
    if (!running) { running = true; raf = requestAnimationFrame(frame); }
  }

  function paintStill() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = INK;
    for (var k = 0; k < dots.length; k++) {
      ctx.beginPath(); ctx.arc(dots[k].bx, dots[k].by, R0, 0, Math.PI * 2); ctx.fill();
    }
  }

  if (window.IntersectionObserver) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        visible = en.isIntersecting;
        if (visible) { ensureRun(); }
        else if (raf) { cancelAnimationFrame(raf); raf = null; running = false; }
      });
    }, { threshold: 0 });
    io.observe(hero);
  }

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      build();
      if (reduce) paintStill(); else { idle = 0; ensureRun(); }
    }, 150);
  }, { passive: true });

  function start() {
    build();
    if (reduce) paintStill(); else ensureRun();
  }
  // defer init until after first paint so the hero text never waits on us
  if (document.readyState === 'complete') { requestAnimationFrame(start); }
  else { window.addEventListener('load', function () { requestAnimationFrame(start); }); }
})();
