// ── BQ Tools — Shared AI Functions ──

function getAISettings() {
  return {
    geminiKey: localStorage.getItem('bq_gk') || '',
    claudeKey: localStorage.getItem('bq_ck') || '',
    geminiModel: localStorage.getItem('bq_gm') || 'gemini-2.5-flash',
    claudeModel: localStorage.getItem('bq_cm') || 'claude-sonnet-4-20250514',
    mode: localStorage.getItem('bq_mode') || 'both',
  };
}

function saveAISettings(s) {
  if (s.geminiKey !== undefined) localStorage.setItem('bq_gk', s.geminiKey);
  if (s.claudeKey !== undefined) localStorage.setItem('bq_ck', s.claudeKey);
  if (s.geminiModel !== undefined) localStorage.setItem('bq_gm', s.geminiModel);
  if (s.claudeModel !== undefined) localStorage.setItem('bq_cm', s.claudeModel);
  if (s.mode !== undefined) localStorage.setItem('bq_mode', s.mode);
}

// Resize image for API (keeps quality, reduces payload)
function resizeForAPI(dataUrl, maxSize = 1024) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w <= maxSize && h <= maxSize) { resolve(dataUrl.split(',')[1]); return; }
      const scale = Math.min(maxSize / w, maxSize / h);
      w = Math.round(w * scale); h = Math.round(h * scale);
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL('image/jpeg', 0.85).split(',')[1]);
    };
    img.src = dataUrl;
  });
}

// Call Gemini API
async function callGemini(apiKey, model, parts) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] })
    }
  );
  const data = await res.json();
  if (data.error) throw new Error('Gemini: ' + data.error.message);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error('Gemini returned empty');
  return text;
}

// Call Claude API
async function callClaude(apiKey, model, messages, maxTokens = 1500) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages })
  });
  const data = await res.json();
  if (data.error) throw new Error('Claude: ' + (data.error?.message || JSON.stringify(data.error)));
  const text = data.content?.map(c => c.text || '').join('') || '';
  if (!text) throw new Error('Claude returned empty');
  return text;
}

// Parse JSON from AI response (strips markdown fences)
function parseAIJSON(text) {
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

// Call AI with auto-routing (gemini+claude or claude-only)
async function callAI(prompt, images, opts = {}) {
  const s = getAISettings();
  const mode = opts.mode || s.mode;

  if (!s.claudeKey) throw new Error(lang === 'he' ? 'הכנס Claude API key בהגדרות' : 'Enter Claude API key in Settings');
  if (mode === 'both' && !s.geminiKey) throw new Error(lang === 'he' ? 'הכנס Gemini API key בהגדרות' : 'Enter Gemini API key in Settings');

  // Build image parts
  const imgParts = [];
  for (const img of (images || [])) {
    const b64 = await resizeForAPI(img);
    imgParts.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: b64 } });
  }

  // Claude call
  const content = [...imgParts, { type: 'text', text: prompt }];
  const text = await callClaude(s.claudeKey, s.claudeModel, [{ role: 'user', content }], opts.maxTokens || 1500);
  return parseAIJSON(text);
}

// Settings modal HTML (reusable)
function openAISettings() {
  const old = document.getElementById('aiSettingsModal');
  if (old) old.remove();

  const s = getAISettings();
  const m = document.createElement('div');
  m.id = 'aiSettingsModal';
  m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal-card" style="max-width:440px;">
      <h3 style="color:var(--ac);margin-bottom:14px;" data-en="AI Settings" data-he="הגדרות AI">AI Settings</h3>

      <label style="font-size:11px;color:var(--txd);font-weight:700;">Gemini API Key</label>
      <input type="text" id="ai_gk" value="${s.geminiKey}" placeholder="AIzaSy..." style="width:100%;padding:8px;border:1px solid var(--bd);border-radius:6px;background:var(--bg);color:var(--tx);font-family:monospace;font-size:12px;margin-bottom:4px;">
      <div style="font-size:9px;color:var(--txd);margin-bottom:10px;"><a href="https://aistudio.google.com/apikey" target="_blank" style="color:var(--ac);">Get free Gemini key →</a></div>

      <label style="font-size:11px;color:var(--txd);font-weight:700;">Claude API Key</label>
      <input type="text" id="ai_ck" value="${s.claudeKey}" placeholder="sk-ant-..." style="width:100%;padding:8px;border:1px solid var(--bd);border-radius:6px;background:var(--bg);color:var(--tx);font-family:monospace;font-size:12px;margin-bottom:4px;">
      <div style="font-size:9px;color:var(--txd);margin-bottom:10px;"><a href="https://console.anthropic.com" target="_blank" style="color:var(--ac);">Get Claude key →</a></div>

      <label style="font-size:11px;color:var(--txd);font-weight:700;" data-en="Claude Model" data-he="מודל Claude">Claude Model</label>
      <select id="ai_cm" style="width:100%;padding:8px;border:1px solid var(--bd);border-radius:6px;background:var(--bg);color:var(--tx);font-size:12px;margin-bottom:12px;font-family:inherit;">
        <option value="claude-sonnet-4-20250514" ${s.claudeModel==='claude-sonnet-4-20250514'?'selected':''}>Sonnet 4 (recommended)</option>
        <option value="claude-opus-4-20250514" ${s.claudeModel==='claude-opus-4-20250514'?'selected':''}>Opus 4 (best)</option>
        <option value="claude-3-5-haiku-20241022" ${s.claudeModel==='claude-3-5-haiku-20241022'?'selected':''}>Haiku 3.5 (fastest)</option>
      </select>

      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button onclick="this.closest('.modal-overlay').remove()" class="btn" style="min-height:44px;" data-en="Cancel" data-he="ביטול">Cancel</button>
        <button onclick="saveAISettingsFromModal()" class="btn btn-primary" style="min-height:44px;" data-en="Save" data-he="שמור">Save</button>
      </div>
    </div>`;
  document.body.appendChild(m);
  requestAnimationFrame(() => m.classList.add('open'));
  setLang(lang);
}

function saveAISettingsFromModal() {
  saveAISettings({
    geminiKey: document.getElementById('ai_gk').value.trim(),
    claudeKey: document.getElementById('ai_ck').value.trim(),
    claudeModel: document.getElementById('ai_cm').value,
  });
  document.getElementById('aiSettingsModal').remove();
  showToast(lang === 'he' ? 'נשמר!' : 'Saved!', 'ok');
}
