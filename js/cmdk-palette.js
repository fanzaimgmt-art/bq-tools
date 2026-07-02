/* BQ ⌘K palette — fast tool search across the site.
   Drop in via <script src="/js/cmdk-palette.js" defer></script>.
   Triggers: Cmd+K (Mac) / Ctrl+K (Win/Linux) / search button if `.cmdk-trigger` exists.
*/

(function () {
  if (window.__bqCmdKMounted) return;
  window.__bqCmdKMounted = true;

  // Tool catalog — same as Brain knowledge but grouped + filterable
  const TOOLS = [
    { name: 'Pusher Beta',          path: '/tools/pusher.html',         icon: '🎯', tag: 'NEW',  cat: 'Sales',   desc: 'Buyer-intent FB lead engine' },
    { name: 'AI Video',             path: '/tools/ai-video.html',       icon: '🎬', tag: '',     cat: 'Content', desc: 'Cinematic video prompt builder' },
    { name: 'Ad Creator',           path: '/tools/ad-creator.html',     icon: '🎨', tag: '',     cat: 'Content', desc: 'Generate ad creative' },
    { name: 'Social Post',          path: '/tools/social-post.html',    icon: '📱', tag: '',     cat: 'Content', desc: 'Generate social posts' },
    { name: 'Moodboard',            path: '/tools/moodboard.html',      icon: '💖', tag: '',     cat: 'Content', desc: 'Visual moodboard generator' },
    { name: 'Quick Sketch',         path: '/tools/sketch.html',         icon: '✏️', tag: '',     cat: 'Content', desc: 'Quick visual sketches' },
    { name: 'AI Chat',              path: '/chat.html',                 icon: '💬', tag: '',     cat: 'Content', desc: 'Multi-model AI chat' },
    { name: 'Compare',              path: '/tools/compare.html',        icon: '🔀', tag: 'FREE', cat: 'Sales',   desc: 'Side-by-side comparison' },
    { name: 'Quick Report',         path: '/tools/report.html',         icon: '📄', tag: '',     cat: 'Sales',   desc: 'Quick reports' },
    { name: 'Smart Estimate',       path: '/tools/estimate.html',       icon: '💰', tag: '',     cat: 'Sales',   desc: 'Smart cost estimate' },
    { name: 'Quote',                path: '/tools/quote.html',          icon: '📝', tag: '',     cat: 'Business',desc: 'Quote generator' },
    { name: 'Invoice',              path: '/tools/invoice.html',        icon: '🧾', tag: '',     cat: 'Business',desc: 'Invoice generator' },
    { name: 'Contract',             path: '/tools/contract.html',       icon: '📜', tag: '',     cat: 'Business',desc: 'Contract generator' },
    { name: 'Client Page',          path: '/tools/client-page.html',    icon: '🔗', tag: 'FREE', cat: 'Sales',   desc: 'Personalized client page' },
    { name: 'Review Request',       path: '/tools/review.html',         icon: '⭐', tag: '',     cat: 'Sales',   desc: 'Review request messages' },
    { name: 'Social Analysis',      path: '/tools/social-analysis.html',icon: '📊', tag: '',     cat: 'Research',desc: 'Social media analysis' },
    { name: 'Content Spy',          path: '/tools/content-spy.html',    icon: '🔍', tag: '',     cat: 'Research',desc: 'Competitor content research' },
    { name: 'Downloader',           path: '/tools/downloader.html',     icon: '📥', tag: '',     cat: 'Research',desc: 'Download / extract content' },
    { name: 'Import AI Memory',     path: '/tools/import-memory.html',  icon: '🧠', tag: 'NEW',  cat: 'Personal',desc: 'Import memory from another AI' },
    { name: 'Dashboard',            path: '/dashboard.html',            icon: '📊', tag: '',     cat: 'Personal',desc: 'Your activity dashboard' },
    { name: 'Pusher Setup',         path: '/tools/pusher-setup.html',   icon: '⚙️', tag: '',     cat: 'Sales',   desc: 'Configure Pusher (after payment)' },
    { name: 'Admin Pusher',         path: '/admin-pusher.html',         icon: '🛠', tag: 'ADMIN',cat: 'Admin',   desc: 'Pusher admin dashboard' },
    { name: 'Admin Security',       path: '/admin-security.html',       icon: '🛡️',tag: 'ADMIN',cat: 'Admin',   desc: 'Security incident dashboard' },
  ];

  const i18n = (document.documentElement.lang || 'en').startsWith('he') ? 'he' : 'en';
  const t = i18n === 'he'
    ? { placeholder: 'חפש כלי…', empty: 'אין תוצאות', hint: 'הקש Esc לסגור · ⌘K לפתיחה', ask: 'או שאל את ה-Brain' }
    : { placeholder: 'Search tools…', empty: 'No results', hint: 'Press Esc to close · ⌘K to open', ask: 'Or ask the Brain' };

  // CSS
  const css = `
    .cmdk-overlay {
      position: fixed; inset: 0; z-index: 10001;
      background: rgba(5,5,10,0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: flex-start; justify-content: center;
      padding: 14vh 16px 16px;
      opacity: 0; pointer-events: none; transition: opacity .2s;
    }
    .cmdk-overlay.open { opacity: 1; pointer-events: auto; }
    .cmdk-modal {
      width: min(640px, 100%); max-height: 70vh;
      background: linear-gradient(180deg, #16161c 0%, #0c0c10 100%);
      border: 1px solid rgba(232,197,71,0.18); border-radius: 18px;
      box-shadow: 0 30px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,197,71,0.05);
      display: flex; flex-direction: column;
      transform: translateY(-20px) scale(0.98); transition: transform .25s cubic-bezier(.34,1.56,.64,1);
      overflow: hidden;
    }
    .cmdk-overlay.open .cmdk-modal { transform: translateY(0) scale(1); }
    .cmdk-search {
      padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex; align-items: center; gap: 12px;
    }
    .cmdk-search-icon { font-size: 20px; opacity: .6; }
    .cmdk-input {
      flex: 1; background: transparent; border: 0; outline: none;
      color: #f0f0f0; font-size: 17px; font-family: inherit;
    }
    .cmdk-input::placeholder { color: #666; }
    .cmdk-kbd {
      font-size: 10px; padding: 3px 7px; border-radius: 4px;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
      color: #888; font-family: ui-monospace, monospace;
    }
    .cmdk-chips {
      display: flex; gap: 6px; padding: 10px 16px; overflow-x: auto;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      scrollbar-width: none; -ms-overflow-style: none;   /* hide the ugly OS scrollbar */
    }
    .cmdk-chips::-webkit-scrollbar { display: none; height: 0; }
    .cmdk-chip {
      padding: 5px 12px; font-size: 12px; cursor: pointer; white-space: nowrap;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 100px; color: #aaa; transition: all .2s; flex-shrink: 0;
    }
    .cmdk-chip:hover { color: #e8c547; border-color: rgba(232,197,71,0.3); }
    .cmdk-chip.active { background: rgba(232,197,71,0.15); border-color: rgba(232,197,71,0.4); color: #e8c547; }
    .cmdk-list {
      flex: 1; overflow-y: auto; padding: 8px 6px;
      scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent;
    }
    .cmdk-list::-webkit-scrollbar { width: 8px; }
    .cmdk-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 4px; }
    .cmdk-list::-webkit-scrollbar-track { background: transparent; }
    .cmdk-item {
      display: flex; align-items: center; gap: 12px; padding: 10px 14px;
      border-radius: 10px; cursor: pointer; transition: background .12s;
    }
    .cmdk-item.active, .cmdk-item:hover { background: rgba(255,255,255,0.05); }
    .cmdk-item.active { background: rgba(232,197,71,0.12); }
    .cmdk-icon { font-size: 22px; flex-shrink: 0; }
    .cmdk-text { flex: 1; min-width: 0; }
    .cmdk-name { font-size: 14px; font-weight: 600; color: #f0f0f0; }
    .cmdk-desc { font-size: 12px; color: #777; margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cmdk-tag {
      font-size: 9px; font-weight: 700; padding: 3px 7px; border-radius: 4px; letter-spacing: .04em;
      text-transform: uppercase; flex-shrink: 0;
    }
    .cmdk-tag-NEW   { background: rgba(34,197,94,0.15); color: rgb(74,222,128); }
    .cmdk-tag-FREE  { background: rgba(74,184,255,0.15); color: rgb(116,185,255); }
    .cmdk-tag-ADMIN { background: rgba(239,68,68,0.15); color: rgb(248,113,113); }
    .cmdk-cat { font-size: 10px; color: #555; text-transform: uppercase; letter-spacing: .08em; padding: 12px 18px 4px; }
    .cmdk-empty { padding: 30px 20px; text-align: center; color: #888; font-size: 14px; }
    .cmdk-empty button {
      display: block; margin: 12px auto 0; padding: 8px 16px;
      background: rgba(232,197,71,0.1); border: 1px solid rgba(232,197,71,0.3);
      color: #e8c547; border-radius: 8px; font-size: 12px; cursor: pointer;
    }
    .cmdk-foot {
      padding: 8px 16px; border-top: 1px solid rgba(255,255,255,0.05);
      font-size: 11px; color: #555; display: flex; justify-content: space-between; align-items: center;
    }
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // DOM
  const overlay = document.createElement('div');
  overlay.className = 'cmdk-overlay';
  overlay.innerHTML = `
    <div class="cmdk-modal" role="dialog" aria-modal="true" aria-label="Search tools">
      <div class="cmdk-search">
        <span class="cmdk-search-icon">🔍</span>
        <input class="cmdk-input" type="text" placeholder="${escapeAttr(t.placeholder)}" />
        <span class="cmdk-kbd">esc</span>
      </div>
      <div class="cmdk-chips" id="cmdk-chips"></div>
      <div class="cmdk-list" id="cmdk-list"></div>
      <div class="cmdk-foot"><span>${escapeHtml(t.hint)}</span><span class="cmdk-kbd">↵</span></div>
    </div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector('.cmdk-input');
  const list = overlay.querySelector('#cmdk-list');
  const chips = overlay.querySelector('#cmdk-chips');

  let filter = 'All';
  let activeIdx = 0;
  let visible = [];

  // Categories
  const cats = ['All', 'NEW', 'FREE', ...Array.from(new Set(TOOLS.map(t => t.cat)))];
  chips.innerHTML = cats.map(c => `<button class="cmdk-chip${c === 'All' ? ' active' : ''}" data-cat="${escapeAttr(c)}">${escapeHtml(c)}</button>`).join('');
  chips.querySelectorAll('.cmdk-chip').forEach(c => {
    c.addEventListener('click', () => {
      chips.querySelectorAll('.cmdk-chip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      filter = c.dataset.cat;
      render();
    });
  });

  function matches(tool, q) {
    const txt = (tool.name + ' ' + tool.desc + ' ' + tool.cat + ' ' + tool.tag).toLowerCase();
    return q.split(/\s+/).every(part => txt.includes(part));
  }

  function render() {
    const q = input.value.trim().toLowerCase();
    visible = TOOLS.filter(tool => {
      if (filter === 'All') return q ? matches(tool, q) : true;
      if (filter === 'NEW' || filter === 'FREE' || filter === 'ADMIN') return tool.tag === filter && (q ? matches(tool, q) : true);
      return tool.cat === filter && (q ? matches(tool, q) : true);
    });

    if (visible.length === 0) {
      list.innerHTML = `<div class="cmdk-empty">${escapeHtml(t.empty)}<button onclick="window.BQBrain && window.BQBrain.ask('${q ? escapeHtml(escapeJs(input.value)) : 'recommend a tool'}')">${escapeHtml(t.ask)} →</button></div>`;
      return;
    }

    // Group by category if no search
    if (!q && filter === 'All') {
      const byCat = {};
      visible.forEach(tool => { (byCat[tool.cat] = byCat[tool.cat] || []).push(tool); });
      list.innerHTML = Object.keys(byCat).map(cat => `
        <div class="cmdk-cat">${escapeHtml(cat)}</div>
        ${byCat[cat].map((tool, i) => itemHtml(tool, visible.indexOf(tool))).join('')}
      `).join('');
    } else {
      list.innerHTML = visible.map((tool, i) => itemHtml(tool, i)).join('');
    }

    activeIdx = 0;
    syncActive();
    list.querySelectorAll('.cmdk-item').forEach(el => {
      el.addEventListener('click', () => navigate(parseInt(el.dataset.idx, 10)));
      el.addEventListener('mouseenter', () => { activeIdx = parseInt(el.dataset.idx, 10); syncActive(); });
    });
  }

  function itemHtml(tool, idx) {
    return `<div class="cmdk-item" data-idx="${idx}" role="option">
      <span class="cmdk-icon">${escapeHtml(tool.icon)}</span>
      <div class="cmdk-text">
        <div class="cmdk-name">${escapeHtml(tool.name)}</div>
        <div class="cmdk-desc">${escapeHtml(tool.desc)}</div>
      </div>
      ${tool.tag ? `<span class="cmdk-tag cmdk-tag-${escapeAttr(tool.tag)}">${escapeHtml(tool.tag)}</span>` : ''}
    </div>`;
  }

  function syncActive() {
    list.querySelectorAll('.cmdk-item').forEach((el, i) => {
      const idx = parseInt(el.dataset.idx, 10);
      el.classList.toggle('active', idx === activeIdx);
      if (idx === activeIdx) el.scrollIntoView({ block: 'nearest' });
    });
  }

  function navigate(idx) {
    const tool = visible[idx];
    if (!tool) return;
    close();
    location.href = tool.path;
  }

  function open() {
    overlay.classList.add('open');
    setTimeout(() => input.focus(), 50);
    render();
  }
  function close() {
    overlay.classList.remove('open');
    input.value = '';
    activeIdx = 0;
  }

  // Keyboard
  document.addEventListener('keydown', e => {
    const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const cmdK = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k';
    if (cmdK) { e.preventDefault(); overlay.classList.contains('open') ? close() : open(); return; }
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = Math.min(activeIdx + 1, visible.length - 1); syncActive(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = Math.max(activeIdx - 1, 0); syncActive(); }
    else if (e.key === 'Enter') { e.preventDefault(); navigate(activeIdx); }
  });

  input.addEventListener('input', render);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  // External triggers — any element with .cmdk-trigger opens the palette
  document.addEventListener('click', e => {
    const trigger = e.target.closest('.cmdk-trigger');
    if (trigger) { e.preventDefault(); open(); }
  });

  // Public API
  window.BQCmdK = { open, close };

  // Helpers
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }
  function escapeJs(s) {
    return String(s || '').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n').replace(/"/g,'\\"');
  }
})();
