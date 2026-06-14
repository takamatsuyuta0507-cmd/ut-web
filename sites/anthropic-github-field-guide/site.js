/* =========================================================================
   Anthropic GitHub Field Guide — site.js
   共有チャーム（ヘッダー/フッター）・カード描画・カタログ絞り込み・演出
   data.js（window.GUIDE）に依存
   ========================================================================= */
(function(){
  const G = window.GUIDE;
  const REPO_BY_NAME = Object.fromEntries(G.REPOS.map(r => [r.n, r]));
  const repoUrl = n => 'https://github.com/anthropics/' + n;

  /* ---- helpers ---- */
  function fmtStars(s){
    if(s >= 1000){
      const v = s/1000;
      return (v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/,'')) + 'k';
    }
    return String(s);
  }
  const LANG_COLOR = {
    'Python':'#3572A5','TypeScript':'#3178C6','JavaScript':'#F1E05A','Go':'#00ADD8',
    'Rust':'#DEA584','Ruby':'#701516','C#':'#178600','PHP':'#4F5D95','Kotlin':'#A97BFF',
    'Swift':'#F05138','C++':'#F34B7D','Shell':'#89E051','Java':'#B07219','Svelte':'#FF3E00',
    'HTML':'#E34C26','Jupyter Notebook':'#DA5B0B','Nix':'#7E7EFF','Markdown':'#083FA1',
    'Data':'#A89E92','Paper':'#A89E92'
  };
  function el(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstChild; }
  function esc(s){ return (s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

  const STAR_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 .5l2.06 4.6 5.02.5-3.77 3.34 1.1 4.94L8 11.8l-4.41 2.58 1.1-4.94L.92 5.6l5.02-.5z"/></svg>';

  /* ---- repo card ---- */
  function repoCard(r){
    const lc = LANG_COLOR[r.l] || '#A89E92';
    const tags = (r.t||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('');
    const useHtml = r.u ? `<div class="use"><b>実務</b>　${esc(r.u)}</div>` : '';
    const mirror = r.o===false ? `<span class="mirror">ミラー</span>` : '';
    return el(`
      <article class="repo reveal" data-name="${esc(r.n)}" data-cat="${r.c}" data-lvl="${r.v}" data-off="${r.o!==false}">
        <div class="top">
          <h3><a href="${repoUrl(r.n)}" target="_blank" rel="noopener">${esc(r.n)}</a></h3>
          <span class="star">${STAR_SVG}${fmtStars(r.s)}</span>
        </div>
        <div class="desc">${esc(r.j)}</div>
        ${useHtml}
        <div class="tags">${tags}</div>
        <div class="foot">
          <span class="lang" style="--lc:${lc}">${esc(r.l)}</span>
          <span style="display:flex;gap:6px;align-items:center">${mirror}<span class="lvl lvl-${r.v}">${r.v}</span></span>
        </div>
      </article>`);
  }

  function renderGrid(container, repos){
    container.innerHTML = '';
    repos.forEach(r => container.appendChild(repoCard(r)));
    observeReveals(container);
  }

  /* ---- mount points: [data-repos="cat1,cat2"] renders those categories ---- */
  function mountGrids(){
    document.querySelectorAll('[data-repos]').forEach(node=>{
      const cats = node.getAttribute('data-repos').split(',').map(s=>s.trim());
      const sort = node.getAttribute('data-sort') || 'stars';
      let list = G.REPOS.filter(r => cats.includes(r.c));
      if(sort==='stars') list = list.slice().sort((a,b)=>b.s-a.s);
      renderGrid(node, list);
    });
  }

  /* ---- header / footer ---- */
  const NAV = [
    ['index.html','ホーム'],
    ['build.html','つくる'],
    ['use.html','つかう'],
    ['learn.html','まなぶ'],
    ['research.html','しらべる'],
    ['catalog.html','カタログ'],
    ['paths.html','ロードマップ'],
  ];
  function buildChrome(){
    const here = (location.pathname.split('/').pop() || 'index.html');
    const navHtml = NAV.map(([h,l])=>`<a href="${h}"${h===here?' class="active"':''}>${l}</a>`).join('');
    const header = el(`
      <header class="site-header">
        <div class="wrap bar">
          <a class="brand" href="index.html">UT<span class="dot">.</span><span class="sub">Field Guide</span></a>
          <button class="nav-toggle" aria-label="メニュー"><span></span><span></span><span></span></button>
          <nav class="nav">${navHtml}</nav>
        </div>
      </header>`);
    const hh = document.getElementById('site-header');
    if(hh) hh.replaceWith(header);

    const footer = el(`
      <footer class="site-footer">
        <div class="wrap">
          <div class="foot-grid">
            <div>
              <div class="brand">UT<span class="dot">.</span> <span style="font-weight:600;font-size:.7em;color:var(--ink-faint)">Field Guide</span></div>
              <p class="tagline">AnthropicのGitHub（全90リポジトリ）を、網羅的に学んで実務に活かすための非公式ガイド。</p>
            </div>
            <div class="foot-links">
              <div class="foot-col">
                <h5>Explore</h5>
                <a href="build.html">つくる</a>
                <a href="use.html">つかう</a>
                <a href="learn.html">まなぶ</a>
                <a href="research.html">しらべる</a>
              </div>
              <div class="foot-col">
                <h5>Guide</h5>
                <a href="catalog.html">全リポジトリ</a>
                <a href="paths.html">ロードマップ</a>
              </div>
              <div class="foot-col">
                <h5>Source</h5>
                <a href="https://github.com/anthropics" target="_blank" rel="noopener">github.com/anthropics ↗</a>
                <a href="https://docs.anthropic.com" target="_blank" rel="noopener">Anthropic Docs ↗</a>
              </div>
            </div>
          </div>
          <div class="foot-bottom">
            <span>非公式の学習ガイド / Built with Claude Code</span>
            <span>データ取得: 2026-06 時点の公開リポジトリ</span>
          </div>
        </div>
      </footer>`);
    const ff = document.getElementById('site-footer');
    if(ff) ff.replaceWith(footer);

    // mobile nav toggle
    const toggle = header.querySelector('.nav-toggle');
    const nav = header.querySelector('.nav');
    if(toggle) toggle.addEventListener('click', ()=> nav.classList.toggle('open'));
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));
  }

  /* ---- reveal on scroll ---- */
  let io;
  function observeReveals(scope){
    if(!('IntersectionObserver' in window)){ (scope||document).querySelectorAll('.reveal').forEach(e=>e.classList.add('in')); return; }
    if(!io){
      io = new IntersectionObserver((entries)=>{
        entries.forEach(en=>{ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target); } });
      }, { rootMargin:'0px 0px -8% 0px', threshold:.08 });
    }
    (scope||document).querySelectorAll('.reveal:not(.in)').forEach(e=>io.observe(e));
  }

  /* ---- fill template counts (data-count="catkey" / data-count-pillar / data-count-total) ---- */
  function fillCounts(){
    document.querySelectorAll('[data-count-total]').forEach(n=> n.textContent = G.REPOS.length);
    document.querySelectorAll('[data-count]').forEach(n=>{
      const cats = n.getAttribute('data-count').split(',').map(s=>s.trim());
      n.textContent = G.REPOS.filter(r=>cats.includes(r.c)).length;
    });
    document.querySelectorAll('[data-count-pillar]').forEach(n=>{
      const pid = n.getAttribute('data-count-pillar');
      const pillar = G.PILLARS.find(p=>p.id===pid);
      const cats = pillar ? pillar.cats : [];
      n.textContent = G.REPOS.filter(r=>cats.includes(r.c)).length;
    });
  }

  /* ---- catalog page ---- */
  function initCatalog(){
    const grid = document.getElementById('catalog-grid');
    if(!grid) return;
    const countEl = document.getElementById('result-count');
    const searchEl = document.getElementById('search-input');
    const catWrap = document.getElementById('filter-cat');
    const lvlWrap = document.getElementById('filter-lvl');

    const state = { q:'', cat:'all', lvl:'all' };

    // build category chips
    const catKeys = Object.keys(G.CATS);
    catWrap.appendChild(chip('all','すべて', G.REPOS.length, true, v=>{state.cat=v; sync(catWrap,v); apply();}));
    catKeys.forEach(k=>{
      const c = G.REPOS.filter(r=>r.c===k).length;
      catWrap.appendChild(chip(k, G.CATS[k].label, c, false, v=>{state.cat=v; sync(catWrap,v); apply();}));
    });
    // level chips
    const levels = ['入門','実践','応用','研究','参考'];
    lvlWrap.appendChild(chip('all','すべて', G.REPOS.length, true, v=>{state.lvl=v; sync(lvlWrap,v); apply();}));
    levels.forEach(lv=>{
      const c = G.REPOS.filter(r=>r.v===lv).length;
      lvlWrap.appendChild(chip(lv, lv, c, false, v=>{state.lvl=v; sync(lvlWrap,v); apply();}));
    });

    searchEl.addEventListener('input', ()=>{ state.q = searchEl.value.trim().toLowerCase(); apply(); });

    function chip(val,label,count,on,cb){
      const c = el(`<button class="chip${on?' on':''}" data-val="${val}">${esc(label)}<span class="n">${count}</span></button>`);
      c.addEventListener('click', ()=>cb(val));
      return c;
    }
    function sync(wrap,val){ wrap.querySelectorAll('.chip').forEach(c=>c.classList.toggle('on', c.dataset.val===val)); }

    function apply(){
      const list = G.REPOS.filter(r=>{
        if(state.cat!=='all' && r.c!==state.cat) return false;
        if(state.lvl!=='all' && r.v!==state.lvl) return false;
        if(state.q){
          const hay = (r.n+' '+r.j+' '+(r.u||'')+' '+(r.t||[]).join(' ')+' '+r.l).toLowerCase();
          if(!hay.includes(state.q)) return false;
        }
        return true;
      }).sort((a,b)=>b.s-a.s);
      countEl.textContent = list.length + ' 件';
      if(list.length===0){ grid.innerHTML = '<div class="empty">該当するリポジトリがありません。条件を変えてみてください。</div>'; }
      else renderGrid(grid, list);
    }
    apply();
  }

  /* ---- boot ---- */
  document.addEventListener('DOMContentLoaded', ()=>{
    buildChrome();
    fillCounts();
    mountGrids();
    initCatalog();
    observeReveals(document);
  });

  // expose a couple helpers for inline page scripts
  window.GUIDE_UTIL = { fmtStars, repoUrl, REPO_BY_NAME, esc, el, observe:observeReveals, repoCard };
})();
