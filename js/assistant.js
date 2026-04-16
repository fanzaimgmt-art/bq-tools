// ── BQ Tools — AI Assistant (floating chat) ──

(function() {
  // Don't load on admin page
  if (window.location.pathname === '/admin.html') return;

  const SYSTEM_PROMPT = `You are BQ Assistant, an AI helper for contractors and remodelers. You help them use BQ Tools efficiently. You can navigate them to tools, answer questions about construction/remodeling, and help them market their work. Keep answers short and actionable (max 3 sentences).

Available tools:
- Compare: /tools/compare.html — before/after slider (FREE)
- AI Analysis: /tools/compare.html — AI scores and compares photos (1 credit)
- Quick Report: /tools/report.html — AI generates project report (1 credit)
- Smart Estimate: /tools/estimate.html — AI estimates costs from photo (1 credit)
- Client Page: /tools/client-page.html — shareable project page (FREE, 1 free)
- Social Post: /tools/social-post.html — AI writes captions (1 credit)
- Review Request: /tools/review.html — AI writes review request messages (1 credit)
- Quick Sketch: /tools/sketch.html — AI cleans up sketches (1 credit)
- Gallery: /gallery.html — all saved projects
- Dashboard: /dashboard.html — usage stats

If the user asks to do something, tell them which tool to use and offer to open it.
If they mention a name or project, include it as context.
Answer construction/remodeling questions concisely.`;

  const MAX_HISTORY = 50;

  // Inject CSS
  const style = document.createElement('style');
  style.textContent = `
    .chat-fab {
      position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px;
      border-radius: 50%; background: var(--ac); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(232,197,71,.3); z-index: 150;
      transition: all .2s; color: var(--bg); font-size: 24px;
    }
    .chat-fab:hover { transform: scale(1.08); box-shadow: 0 6px 30px rgba(232,197,71,.5); }
    .chat-fab.pulse { animation: fabPulse 2s ease-in-out 3; }
    @keyframes fabPulse {
      0%, 100% { box-shadow: 0 4px 20px rgba(232,197,71,.3); }
      50% { box-shadow: 0 4px 30px rgba(232,197,71,.6); }
    }

    .chat-panel {
      position: fixed; bottom: 90px; right: 24px; width: 360px; max-height: 500px;
      background: var(--sf); border: 1px solid var(--bd); border-radius: 16px;
      display: none; flex-direction: column; z-index: 150;
      box-shadow: 0 8px 40px rgba(0,0,0,.4); overflow: hidden;
    }
    .chat-panel.open { display: flex; animation: fadeIn .2s ease; }

    .chat-header {
      padding: 14px 16px; border-bottom: 1px solid var(--bd);
      display: flex; align-items: center; justify-content: space-between;
    }
    .chat-header h3 { font-size: 15px; font-weight: 700; color: var(--ac); }
    .chat-header-btns { display: flex; gap: 4px; }
    .chat-header-btns button {
      background: none; border: none; color: var(--txd); cursor: pointer;
      width: 36px; height: 36px; border-radius: 8px; font-size: 16px;
      display: flex; align-items: center; justify-content: center;
    }
    .chat-header-btns button:hover { background: var(--bg); color: var(--tx); }

    .chat-messages {
      flex: 1; overflow-y: auto; padding: 12px 16px; max-height: 340px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .chat-msg {
      max-width: 85%; padding: 10px 14px; border-radius: 12px;
      font-size: 14px; line-height: 1.5; word-wrap: break-word;
    }
    .chat-msg.user {
      align-self: flex-end; background: var(--acd); color: var(--tx);
      border-bottom-right-radius: 4px;
    }
    .chat-msg.ai {
      align-self: flex-start; background: var(--bg); color: var(--tx);
      border-bottom-left-radius: 4px;
    }
    .chat-msg.ai a { color: var(--ac); text-decoration: underline; }
    .chat-msg.typing { color: var(--txd); font-style: italic; }

    .chat-suggestions {
      padding: 8px 16px; display: flex; gap: 6px; flex-wrap: wrap;
    }
    .chat-suggest-btn {
      padding: 6px 12px; border: 1px solid var(--bd); border-radius: 8px;
      background: var(--bg); color: var(--txd); font-size: 12px;
      cursor: pointer; transition: all .2s; font-family: inherit;
      min-height: 36px;
    }
    .chat-suggest-btn:hover { border-color: var(--ac); color: var(--ac); }

    .chat-input-bar {
      padding: 12px 16px; border-top: 1px solid var(--bd);
      display: flex; gap: 8px; align-items: center;
    }
    .chat-input {
      flex: 1; padding: 10px 14px; border: 1px solid var(--bd); border-radius: 10px;
      background: var(--bg); color: var(--tx); font-family: 'Heebo', sans-serif;
      font-size: 14px; outline: none; min-height: 44px;
    }
    .chat-input:focus { border-color: var(--ac); }
    .chat-send {
      width: 44px; height: 44px; border-radius: 10px; border: none;
      background: var(--ac); color: var(--bg); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; transition: all .2s; flex-shrink: 0;
    }
    .chat-send:hover { filter: brightness(1.1); }
    .chat-send:disabled { opacity: .5; cursor: not-allowed; }

    @media (max-width: 600px) {
      .chat-panel {
        bottom: 0; right: 0; left: 0; width: 100%; max-height: 70vh;
        border-radius: 16px 16px 0 0;
      }
      .chat-fab { bottom: 16px; right: 16px; }
    }
  `;
  document.head.appendChild(style);

  // Inject HTML
  const fab = document.createElement('button');
  fab.className = 'chat-fab' + (localStorage.getItem('bq_chat_seen') ? '' : ' pulse');
  fab.innerHTML = '💬';
  fab.onclick = toggleChat;
  document.body.appendChild(fab);

  const panel = document.createElement('div');
  panel.className = 'chat-panel';
  panel.id = 'chatPanel';
  panel.innerHTML = `
    <div class="chat-header">
      <h3>BQ Assistant</h3>
      <div class="chat-header-btns">
        <button onclick="clearChatHistory()" title="Clear">🗑️</button>
        <button onclick="toggleChat()" title="Close">✕</button>
      </div>
    </div>
    <div class="chat-messages" id="chatMessages"></div>
    <div class="chat-suggestions" id="chatSuggestions"></div>
    <div class="chat-input-bar">
      <input class="chat-input" id="chatInput" placeholder="${lang === 'he' ? 'מה תרצה לעשות?' : 'What do you want to do?'}" autocomplete="off">
      <button class="chat-send" id="chatSend" onclick="sendChatMessage()">→</button>
    </div>
  `;
  document.body.appendChild(panel);

  // Load history
  const history = JSON.parse(localStorage.getItem('bq_chat_history') || '[]');
  const messagesEl = document.getElementById('chatMessages');

  if (history.length === 0) {
    addMessage('ai', lang === 'he'
      ? 'היי! אני BQ Assistant. מה תרצה לעשות?'
      : "Hi! I'm BQ Assistant. What do you want to do?");
  } else {
    history.forEach(m => addMessage(m.role, m.text, true));
  }

  // Smart suggestions based on last action
  renderSuggestions();

  // Enter to send
  document.getElementById('chatInput').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  function toggleChat() {
    const p = document.getElementById('chatPanel');
    p.classList.toggle('open');
    fab.classList.remove('pulse');
    localStorage.setItem('bq_chat_seen', '1');
    if (p.classList.contains('open')) {
      document.getElementById('chatInput').focus();
    }
  }
  window.toggleChat = toggleChat;

  function addMessage(role, text, noSave) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + role;

    // Parse links in AI messages
    if (role === 'ai') {
      div.innerHTML = text.replace(/(\/tools\/\S+\.html|\/gallery\.html|\/dashboard\.html)/g,
        '<a href="$1" onclick="toggleChat()">$1</a>');
    } else {
      div.textContent = text;
    }

    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    if (!noSave) {
      const hist = JSON.parse(localStorage.getItem('bq_chat_history') || '[]');
      hist.push({ role, text });
      if (hist.length > MAX_HISTORY) hist.splice(0, hist.length - MAX_HISTORY);
      localStorage.setItem('bq_chat_history', JSON.stringify(hist));
    }
  }

  function renderSuggestions() {
    const el = document.getElementById('chatSuggestions');
    const last = typeof getLastAction === 'function' ? getLastAction() : null;
    const suggestions = [];

    if (last && Date.now() - last.timestamp < 3600000) { // within 1 hour
      if (last.tool === 'compare') {
        suggestions.push({ text: lang === 'he' ? 'צור דוח מהפרויקט' : 'Generate a report', msg: 'Generate a report from my last comparison' });
        suggestions.push({ text: lang === 'he' ? 'כתוב פוסט' : 'Write a social post', msg: 'Write a social media post about my last project' });
      } else if (last.tool === 'report') {
        suggestions.push({ text: lang === 'he' ? 'צור פוסט מהדוח' : 'Create social post', msg: 'Create a social post from my report' });
      } else if (last.tool === 'estimate') {
        suggestions.push({ text: lang === 'he' ? 'צור עמוד לקוח' : 'Create Client Page', msg: 'Create a client page for this estimate' });
      }
    }

    if (suggestions.length === 0) {
      suggestions.push(
        { text: lang === 'he' ? 'השווה תמונות' : 'Compare photos', msg: 'I want to compare two photos' },
        { text: lang === 'he' ? 'כמה קרדיטים יש לי?' : 'How many credits?', msg: 'How many credits do I have?' },
      );
    }

    el.innerHTML = suggestions.map(s =>
      `<button class="chat-suggest-btn" onclick="sendPreset('${s.msg.replace(/'/g, "\\'")}')">${s.text}</button>`
    ).join('');
  }

  window.sendPreset = function(msg) {
    document.getElementById('chatInput').value = msg;
    sendChatMessage();
  };

  window.sendChatMessage = async function() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    addMessage('user', text);

    // Check for quick answers (no credit needed)
    const quickAnswer = getQuickAnswer(text);
    if (quickAnswer) {
      addMessage('ai', quickAnswer);
      renderSuggestions();
      return;
    }

    // Check login + credits
    if (!isLoggedIn()) {
      addMessage('ai', lang === 'he'
        ? 'צריך להתחבר קודם. לך ל- /auth.html'
        : 'You need to log in first. Go to /auth.html');
      return;
    }

    if (getCredits() <= 0) {
      addMessage('ai', lang === 'he'
        ? 'אין לך קרדיטים. קנה חבילה ב- /auth.html'
        : "You're out of credits. Buy a pack at /auth.html");
      return;
    }

    // Confirm credit
    const ok = await confirmCredit(lang === 'he' ? 'הודעה ל-Assistant' : 'AI Assistant message');
    if (!ok) return;

    // Show typing
    const typing = document.createElement('div');
    typing.className = 'chat-msg ai typing';
    typing.textContent = '...';
    messagesEl.appendChild(typing);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    const sendBtn = document.getElementById('chatSend');
    sendBtn.disabled = true;

    try {
      const user = getCachedUser();
      const context = `User: ${user?.businessName || 'contractor'}. Credits: ${user?.credits || 0}. Language: ${lang}.`;
      const fullPrompt = `${SYSTEM_PROMPT}\n\nContext: ${context}\n\nUser says: ${text}`;

      const response = await callWorkerAI('AI Assistant', fullPrompt, [], 'Chat');
      typing.remove();
      addMessage('ai', response);
    } catch (err) {
      typing.remove();
      addMessage('ai', '❌ ' + (err.message || 'Error'));
    }

    sendBtn.disabled = false;
    renderSuggestions();
  };

  function getQuickAnswer(text) {
    const t = text.toLowerCase();

    // Credits question
    if (t.includes('credit') || t.includes('קרדיט')) {
      const credits = getCredits();
      return lang === 'he'
        ? `יש לך ⚡ ${credits} קרדיטים.`
        : `You have ⚡ ${credits} credits.`;
    }

    // Navigation shortcuts
    if (t.includes('compare') || t.includes('השוואה') || t.includes('השווה')) {
      return lang === 'he'
        ? 'פתח את כלי ההשוואה: /tools/compare.html'
        : 'Open the Compare tool: /tools/compare.html';
    }
    if (t.includes('report') || t.includes('דוח')) {
      return lang === 'he'
        ? 'פתח את הדוח המהיר: /tools/report.html'
        : 'Open Quick Report: /tools/report.html';
    }
    if (t.includes('estimate') || t.includes('הערכה') || t.includes('עלות')) {
      return lang === 'he'
        ? 'פתח הערכת עלות: /tools/estimate.html'
        : 'Open Smart Estimate: /tools/estimate.html';
    }
    if (t.includes('gallery') || t.includes('גלריה')) {
      return lang === 'he'
        ? 'פתח את הגלריה: /gallery.html'
        : 'Open Gallery: /gallery.html';
    }
    if (t.includes('dashboard') || t.includes('דשבורד') || t.includes('stats') || t.includes('סטטיסטיק')) {
      return lang === 'he'
        ? 'פתח את הדשבורד: /dashboard.html'
        : 'Open Dashboard: /dashboard.html';
    }
    if (t.includes('most used') || t.includes('הכלי הכי')) {
      return lang === 'he'
        ? 'בדוק בדשבורד: /dashboard.html'
        : 'Check your Dashboard: /dashboard.html';
    }

    return null; // Not a quick answer → use AI
  }

  window.clearChatHistory = function() {
    localStorage.removeItem('bq_chat_history');
    messagesEl.innerHTML = '';
    addMessage('ai', lang === 'he'
      ? 'היסטוריה נמחקה. מה תרצה לעשות?'
      : 'History cleared. What do you want to do?');
    renderSuggestions();
  };
})();
