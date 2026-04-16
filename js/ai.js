// ── BQ Tools — AI Functions (Worker Proxy) ──
// All AI calls go through the Worker. No user API keys.

const API_URL = 'https://bq-tools-api.fanzai-mgmt.workers.dev';

// Get auth token from localStorage
function getToken() {
  return localStorage.getItem('bq_token') || '';
}

// Get cached user data
function getCachedUser() {
  try {
    return JSON.parse(localStorage.getItem('bq_user') || 'null');
  } catch { return null; }
}

function setCachedUser(user) {
  localStorage.setItem('bq_user', JSON.stringify(user));
}

// Get credits from cache
function getCredits() {
  const u = getCachedUser();
  return u ? u.credits : 0;
}

function isPro() {
  const u = getCachedUser();
  return u ? u.isPro : false;
}

function isLoggedIn() {
  return !!getToken();
}

// ── API Helpers ──

async function apiCall(path, opts = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (opts.adminPassword) headers['Authorization'] = `Bearer ${opts.adminPassword}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });

  const data = await res.json();

  if (res.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('bq_token');
    localStorage.removeItem('bq_user');
    if (!opts.noRedirect) {
      window.location.href = '/auth.html';
    }
    throw new Error(lang === 'he' ? 'יש להתחבר מחדש' : 'Please log in again');
  }

  if (res.status === 402) {
    // No credits
    showNoCreditModal();
    throw new Error(lang === 'he' ? 'אין קרדיטים' : 'No credits remaining');
  }

  if (res.status === 429) {
    throw new Error(lang === 'he' ? 'יותר מדי בקשות. נסה שוב בעוד דקה.' : 'Too many requests. Try again in a minute.');
  }

  if (!res.ok) {
    throw new Error(data.error || 'API error');
  }

  return data;
}

// ── Auth ──

async function registerEmail(email) {
  return apiCall('/api/auth/register', {
    method: 'POST',
    body: { email },
    noRedirect: true
  });
}

async function verifyCode(email, code) {
  const data = await apiCall('/api/auth/verify', {
    method: 'POST',
    body: { email, code },
    noRedirect: true
  });
  if (data.ok) {
    localStorage.setItem('bq_token', data.userToken);
    setCachedUser(data.user);
  }
  return data;
}

async function fetchUser() {
  const data = await apiCall('/api/user');
  if (data.ok) setCachedUser(data.user);
  return data.user;
}

async function updateUserProfile(updates) {
  const data = await apiCall('/api/user/update', {
    method: 'POST',
    body: updates
  });
  if (data.ok) setCachedUser(data.user);
  return data.user;
}

function logout() {
  localStorage.removeItem('bq_token');
  localStorage.removeItem('bq_user');
  window.location.href = '/';
}

// ── Resize image for API (keeps quality, reduces payload) ──
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

// Resize for thumbnail (200px)
function resizeForThumbnail(dataUrl) {
  return resizeForAPI(dataUrl, 200);
}

// ── Call AI through Worker ──

async function callWorkerAI(action, prompt, images, projectTitle) {
  // Check login
  if (!isLoggedIn()) {
    window.location.href = '/auth.html';
    throw new Error('Login required');
  }

  // Check credits before calling
  const credits = getCredits();
  if (credits <= 0) {
    showNoCreditModal();
    throw new Error(lang === 'he' ? 'אין קרדיטים' : 'No credits remaining');
  }

  const data = await apiCall('/api/ai', {
    method: 'POST',
    body: { action, prompt, images: images || [], projectTitle }
  });

  // Update cached credits
  const user = getCachedUser();
  if (user && data.credits !== undefined) {
    user.credits = data.credits;
    user.creditsUsedThisMonth = (user.creditsUsedThisMonth || 0) + 1;
    setCachedUser(user);
    updateCreditDisplay();
  }

  return data.result;
}

// Parse JSON from AI response (strips markdown fences)
function parseAIJSON(text) {
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

// ── Credit Confirmation ──

function confirmCredit(actionName) {
  return new Promise(resolve => {
    const credits = getCredits();
    const msg = lang === 'he'
      ? `פעולה זו תשתמש ב-1 קרדיט ⚡\n(נשאר: ${credits})\n\nלהמשיך?`
      : `This will use 1 credit ⚡\n(${credits} remaining)\n\nContinue?`;

    // Use a nice modal instead of confirm()
    const m = document.createElement('div');
    m.className = 'modal-overlay';
    m.innerHTML = `
      <div class="modal-card" style="max-width:360px;text-align:center;">
        <div style="font-size:32px;margin-bottom:12px;">⚡</div>
        <h3 style="margin-bottom:8px;" data-en="Use 1 Credit" data-he="השתמש ב-1 קרדיט">${lang === 'he' ? 'השתמש ב-1 קרדיט' : 'Use 1 Credit'}</h3>
        <p style="color:var(--txd);font-size:14px;margin-bottom:6px;">${actionName}</p>
        <p style="color:var(--ac);font-size:18px;font-weight:700;margin-bottom:20px;">⚡ ${credits} ${lang === 'he' ? 'נשאר' : 'remaining'}</p>
        <div style="display:flex;gap:8px;">
          <button class="btn" style="flex:1;" id="creditCancel">${lang === 'he' ? 'ביטול' : 'Cancel'}</button>
          <button class="btn btn-primary" style="flex:1;" id="creditConfirm">${lang === 'he' ? 'המשך' : 'Continue'}</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    requestAnimationFrame(() => m.classList.add('open'));

    m.querySelector('#creditCancel').onclick = () => { m.remove(); resolve(false); };
    m.querySelector('#creditConfirm').onclick = () => { m.remove(); resolve(true); };
    m.onclick = (e) => { if (e.target === m) { m.remove(); resolve(false); } };
  });
}

// ── No Credit Modal ──

function showNoCreditModal() {
  const old = document.getElementById('noCreditModal');
  if (old) old.remove();

  const m = document.createElement('div');
  m.id = 'noCreditModal';
  m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal-card" style="max-width:420px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">⚡</div>
      <h3 data-en="Out of Credits" data-he="אין קרדיטים">${lang === 'he' ? 'אין קרדיטים' : 'Out of Credits'}</h3>
      <p style="color:var(--txd);font-size:14px;margin:12px 0 20px;line-height:1.6;" data-en="Buy a credit pack to continue using AI tools." data-he="קנה חבילת קרדיטים כדי להמשיך להשתמש בכלי AI.">${lang === 'he' ? 'קנה חבילת קרדיטים כדי להמשיך להשתמש בכלי AI.' : 'Buy a credit pack to continue using AI tools.'}</p>

      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
        <div style="background:var(--bg);border:1px solid var(--bd);border-radius:10px;padding:14px;display:flex;justify-content:space-between;align-items:center;">
          <div style="text-align:left;">
            <div style="font-weight:700;">25 credits</div>
            <div style="font-size:12px;color:var(--txd);">$4.99 / Crypto: $3.24</div>
          </div>
          <a href="https://www.paypal.com/ncp/payment/2LA7B7PZTHN54" target="_blank" class="btn btn-sm" style="font-size:13px;">Buy</a>
        </div>
        <div style="background:var(--bg);border:1px solid var(--ac);border-radius:10px;padding:14px;display:flex;justify-content:space-between;align-items:center;">
          <div style="text-align:left;">
            <div style="font-weight:700;color:var(--ac);">60 credits</div>
            <div style="font-size:12px;color:var(--txd);">$9.99 / Crypto: $6.49</div>
          </div>
          <a href="https://www.paypal.com/ncp/payment/2LA7B7PZTHN54" target="_blank" class="btn btn-primary btn-sm" style="font-size:13px;">Buy</a>
        </div>
        <div style="background:var(--bg);border:1px solid var(--bd);border-radius:10px;padding:14px;display:flex;justify-content:space-between;align-items:center;">
          <div style="text-align:left;">
            <div style="font-weight:700;">150 credits</div>
            <div style="font-size:12px;color:var(--txd);">$19.99 / Crypto: $12.99</div>
          </div>
          <a href="https://www.paypal.com/ncp/payment/2LA7B7PZTHN54" target="_blank" class="btn btn-sm" style="font-size:13px;">Buy</a>
        </div>
      </div>

      <button onclick="openCryptoModal();this.closest('.modal-overlay').remove();" class="btn" style="width:100%;margin-bottom:8px;border-color:rgba(81,207,102,.3);color:var(--grn);" data-en="Pay with Crypto — 35% OFF" data-he="שלם בקריפטו — 35% הנחה">${lang === 'he' ? 'שלם בקריפטו — 35% הנחה' : 'Pay with Crypto — 35% OFF'}</button>
      <button onclick="this.closest('.modal-overlay').remove()" style="background:none;border:none;color:var(--txd);cursor:pointer;font-size:14px;font-family:inherit;min-height:48px;padding:8px;" data-en="Maybe later" data-he="אולי אחר כך">${lang === 'he' ? 'אולי אחר כך' : 'Maybe later'}</button>
    </div>`;
  document.body.appendChild(m);
  requestAnimationFrame(() => m.classList.add('open'));
}

// ── Credit Display ──

function updateCreditDisplay() {
  const bar = document.getElementById('creditBar');
  if (!bar) return;
  const user = getCachedUser();
  if (!user) {
    bar.style.display = 'none';
    return;
  }
  bar.style.display = 'flex';
  const credits = user.credits || 0;
  const el = bar.querySelector('.credit-count');
  if (el) el.textContent = credits;

  // Warning state
  bar.classList.toggle('credit-low', credits > 0 && credits < 5);
  bar.classList.toggle('credit-empty', credits === 0);
}

// ── Projects ──

async function saveProjectToServer(project) {
  if (!isLoggedIn()) return;
  try {
    await apiCall('/api/projects', { method: 'POST', body: project });
  } catch (e) {
    console.error('Failed to save project:', e);
  }
}

async function getProjectsFromServer() {
  if (!isLoggedIn()) return [];
  try {
    const data = await apiCall('/api/projects');
    return data.projects || [];
  } catch { return []; }
}

async function getCreditHistory() {
  if (!isLoggedIn()) return [];
  try {
    const data = await apiCall('/api/credits/history');
    return data.history || [];
  } catch { return []; }
}

async function getMonthlyTip() {
  if (!isLoggedIn()) return null;
  try {
    const data = await apiCall('/api/monthly-tip');
    return data.tip || null;
  } catch { return null; }
}

// ── Backward compatibility ──
// These functions are kept so existing tool pages don't break during migration.
// They now route through the Worker.

function requirePro() {
  if (!isLoggedIn()) {
    window.location.href = '/auth.html';
    return false;
  }
  if (getCredits() <= 0) {
    showNoCreditModal();
    return false;
  }
  return true;
}

// Legacy — no longer used but kept to prevent errors
function getAISettings() {
  return { claudeModel: 'claude-3-5-haiku-20241022', mode: 'worker' };
}
function openAISettings() {
  showToast(lang === 'he' ? 'AI מופעל דרך השרת — אין צורך בהגדרות' : 'AI runs through the server — no settings needed', 'info');
}
