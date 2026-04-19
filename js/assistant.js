// ── BQ Tools — AI Assistant (floating chat) ──

(function() {
  // Don't load on admin page
  if (window.location.pathname === '/admin.html') return;

  const SYSTEM_PROMPT = `You are BQ Assistant. You can do ANYTHING the user asks within BQ Tools. You have full control over their account and tools. Keep answers short and actionable (max 3 sentences). Always confirm before making changes. Every message costs 1 credit.

You can:
- UPDATE PROFILE: "Change my business name to X" → tell them you'll update it, then respond with ACTION:UPDATE_PROFILE:{"businessName":"X"}
- ADD PHONE: "Add my phone: 310-555-1234" → ACTION:UPDATE_PROFILE:{"phone":"310-555-1234"}
- SHOW CREDITS: "How many credits?" → answer from context data
- NAVIGATE: "Create a report" → link to /tools/report.html
- NAVIGATE: "Compare photos" → link to /tools/compare.html
- NAVIGATE: "Upload a project" → link to /tools/compare.html
- ADD LOCATION: "Add work location: 123 Main St, LA" → ACTION:ADD_LOCATION:{"address":"123 Main St, LA"}
- CHANGE LANGUAGE: "Switch to Hebrew" → ACTION:SET_LANG:he
- BUY CREDITS: "Buy credits" → ACTION:SHOW_BUY
- LIST COMMANDS: "What can I do?" → list all capabilities
- CONSTRUCTION Q&A: answer any construction/remodeling question concisely

Available tools:
- Compare: /tools/compare.html (FREE slider, 1 credit for AI analysis)
- Quick Report: /tools/report.html (1 credit)
- Smart Estimate: /tools/estimate.html (1 credit)
- Client Page: /tools/client-page.html (FREE)
- Social Post: /tools/social-post.html (1 credit)
- Review Request: /tools/review.html (1 credit)
- Quick Sketch: /tools/sketch.html (1 credit)
- Gallery: /gallery.html
- Dashboard: /dashboard.html
- Profile: /profile.html
- Directory: /directory.html

When performing an action, include the ACTION: tag at the END of your response on its own line. Only one action per response.`;

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
      background: var(--bg); color: var(--tx); font-family: var(--font-en);
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

    .chat-mic {
      width: 44px; height: 44px; border-radius: 10px; border: 1px solid var(--bd);
      background: var(--bg); color: var(--txd); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; transition: all .2s; flex-shrink: 0;
    }
    .chat-mic:hover { border-color: var(--ac); color: var(--ac); }
    .chat-mic.recording { background: var(--red); border-color: var(--red); color: #fff; animation: micPulse 1s ease-in-out infinite; }
    @keyframes micPulse { 0%,100%{ box-shadow:0 0 0 0 rgba(255,107,107,.4); } 50%{ box-shadow:0 0 0 8px rgba(255,107,107,0); } }

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
      <button class="chat-mic" id="chatMic" onclick="toggleVoice()" title="Voice input">🎤</button>
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
    const ok = await confirmCredit('assistant', lang === 'he' ? 'הודעה ל-Assistant' : 'AI Assistant message');
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
      const context = `User: ${user?.businessName || 'contractor'}, email: ${user?.email || '?'}, Credits: ${user?.credits || 0}, Plan: ${user?.isPro ? 'Pro' : 'Free'}, Language: ${lang}. Business type: ${user?.businessType || 'unknown'}, Phone: ${user?.phone || 'not set'}.`;
      const fullPrompt = `${SYSTEM_PROMPT}\n\nContext: ${context}\n\nUser says: ${text}`;

      const response = await callWorkerAI('AI Assistant', fullPrompt, [], 'Chat');
      typing.remove();

      // Parse and execute ACTION tags
      const actionMatch = response.match(/ACTION:(\w+):?(.*)/);
      const displayText = response.replace(/ACTION:\w+:?.*/g, '').trim();
      addMessage('ai', displayText || response);

      if (actionMatch) {
        const [, action, payload] = actionMatch;
        await executeAction(action, payload);
      }
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
    if (t.includes('what can') || t.includes('help') || t.includes('מה אפשר') || t.includes('עזרה')) {
      return lang === 'he'
        ? 'אני יכול:\n• לעדכן פרופיל (שם, טלפון, שפה)\n• לנווט לכלים\n• להוסיף מיקום ל-Directory\n• להראות קרדיטים\n• לענות על שאלות בנייה/שיפוצים\n• לקנות קרדיטים\n\nפשוט תגיד מה אתה צריך!'
        : "I can:\n• Update your profile (name, phone, language)\n• Navigate to any tool\n• Add work locations to Directory\n• Show your credits\n• Answer construction/remodeling questions\n• Help you buy credits\n\nJust tell me what you need!";
    }
    if (t.includes('buy') || t.includes('purchase') || t.includes('קנה') || t.includes('רכישה')) {
      if (typeof showNoCreditModal === 'function') showNoCreditModal();
      return lang === 'he' ? 'פתחתי את חלון הרכישה!' : 'Opened the purchase window!';
    }
    if (t.includes('profile') || t.includes('פרופיל')) {
      return lang === 'he'
        ? 'ערוך את הפרופיל שלך: /profile.html'
        : 'Edit your profile: /profile.html';
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

  // ── Voice Input (Web Speech API) ──
  let _recognition = null;
  let _isRecording = false;

  window.toggleVoice = function() {
    if (_isRecording) { stopVoice(); return; }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast(lang === 'he' ? 'הדפדפן לא תומך בזיהוי קול' : 'Browser does not support voice input', 'err');
      return;
    }

    _recognition = new SpeechRecognition();
    _recognition.lang = lang === 'he' ? 'he-IL' : 'en-US';
    _recognition.interimResults = true;
    _recognition.continuous = false;

    const micBtn = document.getElementById('chatMic');
    const input = document.getElementById('chatInput');

    _recognition.onstart = () => {
      _isRecording = true;
      micBtn.classList.add('recording');
      micBtn.innerHTML = '⏹';
      input.placeholder = lang === 'he' ? '...מקשיב' : 'Listening...';
    };

    _recognition.onresult = (e) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      input.value = transcript;
    };

    _recognition.onend = () => {
      _isRecording = false;
      micBtn.classList.remove('recording');
      micBtn.innerHTML = '🎤';
      input.placeholder = lang === 'he' ? 'מה תרצה לעשות?' : 'What do you want to do?';
      // Auto-send if we got text
      if (input.value.trim()) {
        sendChatMessage();
      }
    };

    _recognition.onerror = (e) => {
      _isRecording = false;
      micBtn.classList.remove('recording');
      micBtn.innerHTML = '🎤';
      if (e.error !== 'no-speech') {
        showToast('Voice error: ' + e.error, 'err');
      }
    };

    _recognition.start();
  };

  function stopVoice() {
    if (_recognition) { _recognition.stop(); }
    _isRecording = false;
    const micBtn = document.getElementById('chatMic');
    if (micBtn) { micBtn.classList.remove('recording'); micBtn.innerHTML = '🎤'; }
  }

  // ── Action Executor ──
  async function executeAction(action, payload) {
    try {
      switch (action) {
        case 'UPDATE_PROFILE': {
          const data = JSON.parse(payload);
          await updateUserProfile(data);
          addMessage('ai', lang === 'he' ? '✓ הפרופיל עודכן!' : '✓ Profile updated!');
          break;
        }
        case 'ADD_LOCATION': {
          const data = JSON.parse(payload);
          // Ensure directory listing exists
          const user = getCachedUser();
          await apiCall('/api/directory/update', { method: 'POST', body: { businessName: user?.businessName || '' } });
          await apiCall('/api/directory/location', { method: 'POST', body: data });
          addMessage('ai', lang === 'he' ? '✓ מיקום נוסף למפה!' : '✓ Location added to map!');
          break;
        }
        case 'SET_LANG': {
          const l = payload.trim();
          if (l === 'he' || l === 'en') {
            setLang(l);
            await updateUserProfile({ language: l });
            addMessage('ai', l === 'he' ? '✓ שפה שונתה לעברית!' : '✓ Language changed to English!');
          }
          break;
        }
        case 'SHOW_BUY': {
          if (typeof showNoCreditModal === 'function') showNoCreditModal();
          break;
        }
      }
    } catch (err) {
      addMessage('ai', '❌ ' + (err.message || 'Action failed'));
    }
  }
})();
