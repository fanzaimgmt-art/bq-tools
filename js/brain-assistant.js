/* Obra Assistant Assistant — floating AI helper for the whole site.
   Drop in <script src="/js/brain-assistant.js" defer></script> on any page.
   Auto-mounts a rotating 3D brain bottom-right + opens a chat modal on click.

   API: POST /api/brain/chat { question, history } → { answer }
*/

(function () {
  if (window.__bqBrainMounted) return;
  window.__bqBrainMounted = true;
  // Floating brain orb removed at Moshe's request (2026-07-03) — Tony on /home + /tony is the assistant now.
  // Early-return keeps the file harmless everywhere it's still included; delete the <script> tags later to save the fetch.
  return;

  const API = window.API_URL || 'https://bq-tools-api.fanzai-mgmt.workers.dev';
  const STORAGE_KEY = 'bq_brain_history';
  const MAX_HISTORY = 12; // keep last 12 turns in storage

  const i18n = {
    he: {
      tip: 'שאל אותי הכל על Obra',
      placeholder: 'שאל על Pusher, AI Video, מחירים…',
      send: 'שלח',
      welcome: 'אהלן 👋\nאני המוח של Obra.\nכל מה שתרצה לדעת על הכלים, מחירים, או איך להתחיל — אני פה.\n\nכמה רעיונות:',
      ideas: ['איזה כלי מתאים לי?', 'איך עובד Pusher?', 'איך מתחילים לעשות AI Video?', 'מה זה הdashboard?'],
      thinking: 'חושב...',
      error: 'משהו השתבש. נסה שוב.',
      clear: 'נקה',
    },
    en: {
      tip: 'Ask me anything about Obra',
      placeholder: 'Ask about Pusher, AI Video, pricing…',
      send: 'Send',
      welcome: 'Hey 👋\nI\'m Obra\'s brain.\nAsk me about any tool, pricing, or how to get started.\n\nA few ideas:',
      ideas: ['Which tool fits me?', 'How does Pusher work?', 'How do I start with AI Video?', 'What\'s in the dashboard?'],
      thinking: 'Thinking...',
      error: 'Something went wrong. Try again.',
      clear: 'Clear',
    },
  };
  const lang = (document.documentElement.lang || 'en').startsWith('he') ? 'he' : 'en';
  const t = i18n[lang];

  // ── CSS injection ──
  const css = `
    .bq-brain-fab {
      position: fixed; bottom: 22px; right: 22px; z-index: 9999;
      width: 64px; height: 64px; border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, rgba(232,197,71,0.35), rgba(232,197,71,0.08) 60%, transparent 80%);
      border: 1px solid rgba(232,197,71,0.4);
      backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      font-size: 32px; line-height: 1;
      box-shadow: 0 0 0 1px rgba(232,197,71,0.15), 0 8px 32px rgba(232,197,71,0.25), 0 4px 16px rgba(0,0,0,0.4);
      transition: transform .25s cubic-bezier(.34,1.56,.64,1), box-shadow .3s;
      perspective: 600px;
    }
    .bq-brain-fab:hover {
      transform: scale(1.08);
      box-shadow: 0 0 0 1px rgba(232,197,71,0.35), 0 12px 40px rgba(232,197,71,0.45), 0 4px 16px rgba(0,0,0,0.5);
    }
    .bq-brain-fab .brain-emoji {
      display: inline-block;
      transform-style: preserve-3d;
      animation: bq-brain-rotate 4.5s linear infinite;
      filter: drop-shadow(0 0 8px rgba(232,197,71,0.6));
    }
    @keyframes bq-brain-rotate {
      0%   { transform: rotateY(0deg) rotateX(8deg); }
      50%  { transform: rotateY(180deg) rotateX(-8deg); }
      100% { transform: rotateY(360deg) rotateX(8deg); }
    }
    .bq-brain-fab::before {
      content: ''; position: absolute; inset: -3px; border-radius: 50%;
      background: conic-gradient(from 0deg, rgba(232,197,71,0.6), transparent 30%, rgba(232,197,71,0.6) 50%, transparent 80%, rgba(232,197,71,0.6));
      filter: blur(6px); opacity: .55; z-index: -1;
      animation: bq-brain-aura 3s linear infinite;
    }
    @keyframes bq-brain-aura {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    .bq-brain-fab .pulse-ring {
      position: absolute; inset: 0; border-radius: 50%;
      border: 2px solid rgba(232,197,71,0.4);
      animation: bq-brain-pulse 2.4s ease-out infinite;
      pointer-events: none;
    }
    @keyframes bq-brain-pulse {
      0%   { transform: scale(1); opacity: 0.7; }
      100% { transform: scale(1.6); opacity: 0; }
    }
    .bq-brain-fab .tip {
      position: absolute; bottom: 50%; right: 80px; transform: translateY(50%);
      background: rgba(20,20,24,0.95); backdrop-filter: blur(8px);
      border: 1px solid rgba(232,197,71,0.3); color: #f0f0f0;
      padding: 8px 14px; border-radius: 8px; font-size: 13px;
      white-space: nowrap; pointer-events: none;
      opacity: 0; transition: opacity .25s, transform .25s;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    }
    .bq-brain-fab:hover .tip {
      opacity: 1; transform: translateY(50%) translateX(-4px);
    }
    .bq-brain-fab .tip::after {
      content: ''; position: absolute; top: 50%; right: -6px;
      width: 0; height: 0;
      border-left: 6px solid rgba(20,20,24,0.95);
      border-top: 6px solid transparent;
      border-bottom: 6px solid transparent;
      transform: translateY(-50%);
    }

    .bq-brain-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(5,5,10,0.6); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: flex-end; justify-content: flex-end;
      padding: 22px;
      opacity: 0; pointer-events: none; transition: opacity .25s;
    }
    .bq-brain-overlay.open { opacity: 1; pointer-events: auto; }
    .bq-brain-modal {
      width: min(420px, 100%); max-height: min(640px, 80vh);
      background: linear-gradient(180deg, #16161c 0%, #0c0c10 100%);
      border: 1px solid rgba(232,197,71,0.18); border-radius: 18px;
      box-shadow: 0 20px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(232,197,71,0.06);
      display: flex; flex-direction: column;
      transform: translateY(20px) scale(0.98);
      transition: transform .3s cubic-bezier(.34,1.56,.64,1);
      overflow: hidden;
    }
    .bq-brain-overlay.open .bq-brain-modal { transform: translateY(0) scale(1); }
    @media (max-width: 600px) {
      .bq-brain-overlay { align-items: stretch; padding: 0; }
      .bq-brain-modal { width: 100%; max-height: 100vh; border-radius: 0; }
    }

    .bq-brain-header {
      display: flex; align-items: center; gap: 10px;
      padding: 16px 18px; border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .bq-brain-header .em {
      font-size: 22px; filter: drop-shadow(0 0 4px rgba(232,197,71,0.5));
    }
    .bq-brain-header .title {
      flex: 1; font-size: 14px; font-weight: 700; letter-spacing: 0.02em;
    }
    .bq-brain-header .title small {
      display: block; font-size: 11px; font-weight: 400; color: #888; margin-top: 2px;
    }
    .bq-brain-header button {
      background: transparent; border: 0; color: #888; font-size: 22px; cursor: pointer;
      width: 32px; height: 32px; border-radius: 6px;
    }
    .bq-brain-header button:hover { background: rgba(255,255,255,0.05); color: #f0f0f0; }

    .bq-brain-body {
      flex: 1; overflow-y: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px;
    }
    .bq-brain-msg { display: flex; gap: 8px; }
    .bq-brain-msg.user { justify-content: flex-end; }
    .bq-brain-msg .bubble {
      max-width: 85%; padding: 10px 14px; border-radius: 12px;
      font-size: 13.5px; line-height: 1.55; white-space: pre-wrap; word-wrap: break-word;
    }
    .bq-brain-msg.bot .bubble {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.05);
      color: #f0f0f0;
    }
    .bq-brain-msg.user .bubble {
      background: linear-gradient(135deg, rgba(232,197,71,0.18), rgba(232,197,71,0.08));
      border: 1px solid rgba(232,197,71,0.25); color: #f0f0f0;
    }
    .bq-brain-msg.bot.thinking .bubble {
      color: #888; font-style: italic;
    }
    .bq-brain-msg .bubble a {
      color: #e8c547; text-decoration: underline;
    }

    .bq-brain-ideas { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
    .bq-brain-idea {
      padding: 7px 12px; font-size: 12px; cursor: pointer;
      background: rgba(232,197,71,0.08); border: 1px solid rgba(232,197,71,0.2);
      border-radius: 16px; color: #e8c547; transition: background .2s;
    }
    .bq-brain-idea:hover { background: rgba(232,197,71,0.18); }

    .bq-brain-input-wrap {
      padding: 12px 14px; border-top: 1px solid rgba(255,255,255,0.06);
      display: flex; gap: 8px; align-items: center;
    }
    .bq-brain-input {
      flex: 1; padding: 10px 14px; background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 10px;
      color: #f0f0f0; font-size: 14px; outline: none;
      transition: border-color .2s, background .2s;
    }
    .bq-brain-input:focus {
      border-color: rgba(232,197,71,0.4); background: rgba(255,255,255,0.06);
    }
    .bq-brain-send {
      padding: 10px 16px; background: rgba(232,197,71,1); color: #000;
      border: 0; border-radius: 10px; font-weight: 700; font-size: 13px; cursor: pointer;
      transition: opacity .2s;
    }
    .bq-brain-send:hover { opacity: 0.9; }
    .bq-brain-send:disabled { opacity: 0.4; cursor: not-allowed; }
    .bq-brain-clear {
      padding: 4px 8px; background: transparent; border: 0; color: #666;
      font-size: 11px; cursor: pointer;
    }
    .bq-brain-clear:hover { color: #aaa; }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ── DOM ──
  const fab = document.createElement('button');
  fab.className = 'bq-brain-fab';
  fab.setAttribute('aria-label', t.tip);
  fab.innerHTML = `
    <span class="pulse-ring"></span>
    <span class="brain-emoji">🧠</span>
    <span class="tip">${escapeHtml(t.tip)}</span>
  `;
  document.body.appendChild(fab);

  const overlay = document.createElement('div');
  overlay.className = 'bq-brain-overlay';
  overlay.innerHTML = `
    <div class="bq-brain-modal" role="dialog" aria-modal="true" aria-label="Obra Assistant">
      <div class="bq-brain-header">
        <span class="em">🧠</span>
        <div class="title">Obra Assistant<small>${escapeHtml(t.tip)}</small></div>
        <button class="bq-brain-clear" aria-label="${escapeHtml(t.clear)}" title="${escapeHtml(t.clear)}">↺</button>
        <button class="bq-brain-close" aria-label="Close">✕</button>
      </div>
      <div class="bq-brain-body" id="bq-brain-body"></div>
      <div class="bq-brain-input-wrap">
        <input class="bq-brain-input" type="text" placeholder="${escapeAttr(t.placeholder)}" />
        <button class="bq-brain-send">${escapeHtml(t.send)}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const body = overlay.querySelector('#bq-brain-body');
  const input = overlay.querySelector('.bq-brain-input');
  const send = overlay.querySelector('.bq-brain-send');
  const closeBtn = overlay.querySelector('.bq-brain-close');
  const clearBtn = overlay.querySelector('.bq-brain-clear');

  // ── State ──
  let history = [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) history = JSON.parse(saved);
  } catch {}

  function saveHistory() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY))); } catch {}
  }

  function addBubble(role, text, opts = {}) {
    const m = document.createElement('div');
    m.className = `bq-brain-msg ${role}${opts.thinking ? ' thinking' : ''}`;
    const b = document.createElement('div');
    b.className = 'bubble';
    if (opts.html) b.innerHTML = text;
    else b.textContent = text;
    m.appendChild(b);
    body.appendChild(m);
    body.scrollTop = body.scrollHeight;
    return m;
  }

  function renderInitial() {
    body.innerHTML = '';
    if (history.length === 0) {
      addBubble('bot', t.welcome);
      const ideas = document.createElement('div');
      ideas.className = 'bq-brain-ideas';
      t.ideas.forEach(idea => {
        const b = document.createElement('button');
        b.className = 'bq-brain-idea';
        b.textContent = idea;
        b.onclick = () => { input.value = idea; ask(); };
        ideas.appendChild(b);
      });
      body.appendChild(ideas);
    } else {
      history.forEach(turn => {
        addBubble(turn.role === 'user' ? 'user' : 'bot', turn.content);
      });
    }
  }

  // ── Open/close ──
  function open() {
    overlay.classList.add('open');
    setTimeout(() => input.focus(), 250);
  }
  function close() {
    overlay.classList.remove('open');
  }
  fab.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });

  clearBtn.addEventListener('click', () => {
    history = [];
    saveHistory();
    renderInitial();
  });

  // ── Send ──
  async function ask() {
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    send.disabled = true;
    addBubble('user', q);
    history.push({ role: 'user', content: q });
    const thinkingNode = addBubble('bot', t.thinking, { thinking: true });

    try {
      const r = await fetch(`${API}/api/brain/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          history: history.slice(-MAX_HISTORY * 2),
          lang,
          page: location.pathname,
        }),
      });
      const d = await r.json();
      thinkingNode.remove();
      if (r.ok && d.answer) {
        addBubble('bot', d.answer);
        history.push({ role: 'assistant', content: d.answer });
        saveHistory();
      } else {
        addBubble('bot', d.error || t.error);
      }
    } catch (e) {
      thinkingNode.remove();
      addBubble('bot', t.error);
    } finally {
      send.disabled = false;
      input.focus();
    }
  }

  send.addEventListener('click', ask);
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } });

  // ── Init ──
  renderInitial();

  // Helpers
  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // Public API
  window.BQBrain = { open, close, ask: (q) => { input.value = q; ask(); } };
})();
