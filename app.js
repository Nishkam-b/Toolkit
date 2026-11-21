(function () {
  'use strict';

  const PAGE = 24;
  const SHEET_CSV = 'https://docs.google.com/spreadsheets/d/1gvSuKOJV9yhQauLXgwOgxfuhmj1j6cGUp8B2hGkKuuM/gviz/tq?tqx=out:csv';
  const SHORT = {
    'Learning, Courses & Books': 'Learning',
    'Video, Audio & 3D AI': 'Video & Audio',
    'Design, Photo & Visuals': 'Design',
    'AI Assistants & Writing': 'AI & Writing',
    'Research & Academic': 'Research',
    'PDF & File Utilities': 'PDF & Files',
    'Productivity & Focus': 'Productivity',
    'Business, Life & Web Gems': 'Web Gems',
    'Career, Jobs & Resumes': 'Careers',
    'Interactive Fun & Games': 'Fun',
    'Exam Prep & Current Affairs': 'Exam Prep',
    'Coding & Tech Skills': 'Coding'
  };

  const state = { items: (window.VAULT || []).slice(), tab: 'all', cat: 'all', q: '', shown: PAGE };
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : '#');

  /* ---------- Theme ---------- */
  $('themeBtn').addEventListener('click', () => {
    const root = document.documentElement;
    const current = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try { localStorage.setItem('nb_theme', next); } catch (e) {}
  });

  /* ---------- Toast & copy ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2000);
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard'), () => fallback());
    } else fallback();
    function fallback() {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast('Copied to clipboard'); } catch (e) { toast('Select the text and copy it manually'); }
      ta.remove();
    }
  }

  /* ---------- Filtering ---------- */
  function filtered() {
    const q = state.q.trim().toLowerCase();
    const reel = q.match(/^#?(\d{1,4})$/);
    let list = state.items.filter((x) => {
      if (state.tab !== 'all' && x.type !== state.tab) return false;
      if (state.cat !== 'all' && x.category !== state.cat) return false;
      if (!q) return true;
      if (reel) return x.igNumber === Number(reel[1]);
      return [x.title, x.description, x.domain, x.category, x.model, (x.tags || []).join(' ')].join(' ').toLowerCase().includes(q);
    });
    const rank = (x) => (x.pinned ? 3 : x.type === 'prompt' ? 2 : x.type === 'tutorial' ? 1 : 0);
    return list.sort((a, b) => rank(b) - rank(a) || (a.igNumber || 9999) - (b.igNumber || 9999));
  }

  function card(x) {
    const cat = SHORT[x.category] || x.category || '';
    const reel = x.igNumber ? `<span class="reel">Reel #${x.igNumber}</span>` : '';
    if (x.type === 'prompt') {
      return `<button type="button" class="card is-prompt" data-prompt="${esc(x.id)}">
        <div class="card-top"><span>Prompt · ${esc(x.model || 'Any AI')}</span>${reel}</div>
        <h3>${esc(x.title)}</h3>
        <p>${esc(x.description)}</p>
        <div class="card-foot"><span>${esc(cat)}</span><span class="go">Open prompt →</span></div>
      </button>`;
    }
    const label = x.type === 'tutorial' ? 'Watch ↗' : 'Visit ↗';
    return `<a class="card" href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener">
      <div class="card-top"><span>${esc(x.type === 'tutorial' ? 'Tutorial' : cat)}</span>${reel}</div>
      <h3>${esc(x.title)}</h3>
      <p>${esc(x.description)}</p>
      <div class="card-foot"><span>${esc(x.domain || '')}</span><span class="go">${label}</span></div>
    </a>`;
  }

  function renderChips() {
    const counts = {};
    state.items.forEach((x) => { if (state.tab === 'all' || x.type === state.tab) counts[x.category] = (counts[x.category] || 0) + 1; });
    const cats = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    if (state.cat !== 'all' && !counts[state.cat]) state.cat = 'all';
    $('chips').innerHTML = [`<button type="button" class="chip" data-cat="all" aria-pressed="${state.cat === 'all'}">All topics</button>`]
      .concat(cats.map((c) => `<button type="button" class="chip" data-cat="${esc(c)}" aria-pressed="${state.cat === c}">${esc(SHORT[c] || c)}</button>`))
      .join('');
  }

  function render() {
    document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === state.tab)));
    renderChips();
    const list = filtered();
    const shown = list.slice(0, state.shown);
    $('grid').innerHTML = shown.map(card).join('');
    $('empty').hidden = list.length > 0;
    $('moreBtn').parentElement.hidden = shown.length >= list.length;
    $('count').textContent = list.length
      ? `Showing ${shown.length} of ${list.length}`
      : '';
    $('statTotal').textContent = state.items.length;
  }

  /* ---------- Events ---------- */
  document.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]'); if (!b) return;
    state.tab = b.dataset.tab; state.shown = PAGE; render();
  });
  $('chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    state.cat = b.dataset.cat; state.shown = PAGE; render();
  });
  let qTimer;
  $('search').addEventListener('input', (e) => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { state.q = e.target.value; state.shown = PAGE; render(); }, 120);
  });
  $('moreBtn').addEventListener('click', () => { state.shown += PAGE; render(); });
  $('resetBtn').addEventListener('click', () => {
    state.tab = 'all'; state.cat = 'all'; state.q = ''; state.shown = PAGE; $('search').value = ''; render();
  });
  document.querySelectorAll('[data-jump]').forEach((a) => a.addEventListener('click', () => {
    state.tab = a.dataset.jump; state.cat = 'all'; state.shown = PAGE; render();
  }));
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault(); $('search').focus();
    }
  });

  /* ---------- Prompt dialog ---------- */
  let baseText = '';
  $('grid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-prompt]'); if (!b) return;
    const x = state.items.find((i) => i.id === b.dataset.prompt); if (!x) return;
    baseText = x.promptText || '';
    $('pdModel').textContent = x.model || 'AI prompt';
    $('pdTitle').textContent = x.title;
    $('pdDesc').textContent = x.description || '';
    $('pdText').value = baseText;
    const tokens = Array.from(new Set(baseText.match(/\[[^\[\]\n]{2,48}\]/g) || []));
    const vars = $('pdVars');
    vars.hidden = tokens.length === 0;
    vars.innerHTML = tokens.map((t) => `<label>${esc(t.slice(1, -1))}<input data-token="${esc(t)}" placeholder="${esc(t.slice(1, -1))}" /></label>`).join('');
    $('promptDialog').showModal();
  });
  $('pdVars').addEventListener('input', () => {
    let txt = baseText;
    $('pdVars').querySelectorAll('input').forEach((inp) => {
      const v = inp.value.trim();
      if (v) txt = txt.split(inp.dataset.token).join(v);
    });
    $('pdText').value = txt;
  });
  $('pdCopy').addEventListener('click', () => copy($('pdText').value));
  $('promptDialog').addEventListener('click', (e) => { if (e.target === e.currentTarget) e.currentTarget.close(); });

  /* ---------- Live Google Sheet sync (new rows appear automatically) ---------- */
  function parseCSV(text) {
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i], n = text[i + 1];
      if (q) {
        if (c === '"' && n === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && n === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += c;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    return rows;
  }
  const norm = (u) => (u || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  fetch(SHEET_CSV).then((r) => (r.ok ? r.text() : '')).then((csv) => {
    if (!csv) return;
    const seen = new Set(state.items.map((x) => norm(x.url)).filter(Boolean));
    let added = 0;
    parseCSV(csv).slice(1).forEach((r, i) => {
      const title = (r[0] || '').trim(), desc = (r[1] || '').trim();
      let u = (r[2] || '').trim();
      if (!title || !u || !u.includes('.') || /not in caption/i.test(u)) return;
      if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
      const n = norm(u); if (seen.has(n)) return; seen.add(n);
      state.items.unshift({ id: 'sheet-' + i, type: 'website', igNumber: null, title, url: u, domain: n.split('/')[0],
        category: 'Business, Life & Web Gems', tags: ['New'], pricing: /free/i.test(desc) ? 'Free' : 'Freemium', description: desc || title });
      added++;
    });
    if (added) render();
  }).catch(() => {});

  /* ---------- Vibe coded projects ---------- */
  const projects = window.PROJECTS || [];
  if (!projects.length) $('projects').hidden = true;
  $('projectList').innerHTML = projects.map((p, i) => {
    const num = String(i + 1).padStart(2, '0');
    // All tools share one even 3x3-style grid (3 per row on desktop, 2 on tablet, 1 on phone).
    const wide = false;
    return `<a class="project${wide ? ' is-featured' : ''}" href="${esc(safeUrl(p.url))}" target="_blank" rel="noopener">
      <div class="project-shot"><img src="${esc(p.image)}" alt="Screenshot of ${esc(p.title)}" loading="lazy" /></div>
      <div class="project-body">
        <div class="project-meta"><span class="reel">#${num}</span>${p.date ? `<span>${esc(p.date)}</span>` : ''}</div>
        <h3>${esc(p.title)}</h3>
        <p>${esc(p.description)}</p>
        <ul class="tags">${(p.tags || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        <span class="btn btn-primary project-cta">Open tool ↗</span>
      </div>
    </a>`;
  }).join('');

  $('year').textContent = new Date().getFullYear();
  render();
})();
