/* Takamatsu Yuta — portfolio behavior (vanilla, tweak-independent) */
(function () {
  var header = document.getElementById('siteHeader');

  function onScroll() {
    if (header) {
      if (window.scrollY > 24) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    }
    checkReveal();
  }

  // Reveal-on-scroll via rect test (reliable in all environments,
  // including iframes where IntersectionObserver may not fire).
  function checkReveal() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var els = document.querySelectorAll('.reveal:not(.in-view)');
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      // skip hidden hero variants
      if (el.offsetParent === null && el.getClientRects().length === 0) continue;
      var r = el.getBoundingClientRect();
      if (r.height === 0 && r.width === 0) continue;
      if (r.top < vh * 0.92 && r.bottom > 0) {
        el.classList.add('in-view');
        scheduleShow(el);
      }
    }
  }

  // After the transition would have finished, force the end-state in case the
  // transition was throttled (e.g. background/inactive iframe). setTimeout still
  // fires when rAF/transitions are paused, so content is never stuck hidden.
  function scheduleShow(el) {
    if (el.__showTimer) return;
    el.__showTimer = setTimeout(function () {
      el.classList.add('is-shown');
    }, 1150);
  }

  var ticking = false;
  function onScrollThrottled() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(function () { onScroll(); ticking = false; });
    }
  }

  window.addEventListener('scroll', onScrollThrottled, { passive: true });
  window.addEventListener('resize', onScrollThrottled, { passive: true });
  window.addEventListener('load', onScroll);

  // when hero variant changes, the newly shown reveals must be re-checked
  window.__refreshReveal = function () {
    requestAnimationFrame(checkReveal);
  };

  function init() { onScroll(); requestAnimationFrame(onScroll); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ---- mobile nav drawer (details/summary) ----
  var navToggle = document.getElementById('navToggle');
  if (navToggle) {
    // close the drawer after tapping a link
    navToggle.querySelectorAll('.nav-menu a').forEach(function (a) {
      a.addEventListener('click', function () { navToggle.removeAttribute('open'); });
    });
    // close on outside click / Escape
    document.addEventListener('click', function (e) {
      if (navToggle.hasAttribute('open') && !navToggle.contains(e.target)) {
        navToggle.removeAttribute('open');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') navToggle.removeAttribute('open');
    });
  }

  // ---- contact form (Web3Forms) ----
  var form = document.getElementById('cform');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var btn = form.querySelector('button[type="submit"]');
      var err = document.getElementById('cformErr');
      btn.disabled = true;
      btn.textContent = '送信中…';
      err.hidden = true;
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (r) { return r.json(); }).then(function (res) {
        if (!res.success) throw new Error(res.message || 'failed');
        form.hidden = true;
        var done = document.getElementById('cformDone');
        done.hidden = false;
        done.classList.add('in-view', 'is-shown');
      }).catch(function () {
        err.hidden = false;
        btn.disabled = false;
        btn.innerHTML = '送信する <span class="arrow">→</span>';
      });
    });
  }
})();
