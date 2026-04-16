// ── BQ Tools — Shared Common JS ──

let lang = localStorage.getItem('bq_lang') || 'en';
let theme = localStorage.getItem('bq_theme') || 'dark';

// ── Theme Toggle (Day/Night) ──
function setTheme(t) {
  theme = t;
  localStorage.setItem('bq_theme', t);
  if (t === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  // Update all theme toggle buttons
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.textContent = t === 'light' ? '🌙' : '☀️';
    btn.title = t === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
  });
}
function toggleTheme() {
  setTheme(theme === 'light' ? 'dark' : 'light');
}
// Apply theme immediately on script load (before DOMContentLoaded to avoid flash)
if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');

// ── Translation helper ──
// Usage: t({ en: 'Hello', he: 'שלום', es: 'Hola' })
// Falls back to EN if current lang missing.
function t(strings) {
  if (!strings) return '';
  return strings[lang] || strings.en || Object.values(strings)[0] || '';
}

// ── Language Toggle ──
// Supported: 'en' (English), 'he' (Hebrew, RTL), 'es' (Spanish, Mexican-American)
function setLang(l) {
  if (!['en', 'he', 'es'].includes(l)) l = 'en';
  lang = l;
  localStorage.setItem('bq_lang', l);
  document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr';
  document.documentElement.lang = l;
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('on', btn.dataset.lang === l);
  });
  // Apply translations — elements with any of data-en/he/es
  document.querySelectorAll('[data-en],[data-he],[data-es]').forEach(el => {
    const t = el.getAttribute('data-' + l);
    if (!t) return;
    if (t.includes('<')) {
      el.innerHTML = t;
    } else {
      el.textContent = t;
    }
  });
}

// ── Profile Dropdown (rewritten — appended to body, not nav) ──

function _esc(s) {
  const d = document.createElement('span');
  d.textContent = s || '';
  return d.innerHTML;
}

function _avatarHTML(user) {
  if (user.picture) return `<img src="${user.picture}" alt="" style="width:100%;height:100%;object-fit:cover;">`;
  if (user.logo) return `<img src="${user.logo}" alt="" style="width:100%;height:100%;object-fit:cover;">`;
  return (user.businessName || user.email || '?')[0].toUpperCase();
}

function _openDropdown() {
  const dd = document.getElementById('navDropdown');
  const bd = document.getElementById('navDdBackdrop');
  if (!dd) return;
  // Position dropdown below avatar
  const av = document.getElementById('navAvatar');
  if (av) {
    const r = av.getBoundingClientRect();
    dd.style.top = (r.bottom + 8) + 'px';
    if (document.documentElement.dir === 'rtl') {
      dd.style.left = r.left + 'px';
      dd.style.right = 'auto';
    } else {
      dd.style.right = (window.innerWidth - r.right) + 'px';
      dd.style.left = 'auto';
    }
  }
  dd.classList.add('open');
  if (bd) bd.classList.add('open');
  if (window.innerWidth <= 600) document.body.style.overflow = 'hidden';
}

function _closeDropdown() {
  const dd = document.getElementById('navDropdown');
  const bd = document.getElementById('navDdBackdrop');
  if (dd) dd.classList.remove('open');
  if (bd) bd.classList.remove('open');
  document.body.style.overflow = '';
}

function _toggleDD() {
  const dd = document.getElementById('navDropdown');
  if (dd && dd.classList.contains('open')) _closeDropdown();
  else _openDropdown();
}

// Build the dropdown HTML (pure <a> and <button> elements)
function _ddHTML(user) {
  const credits = user.credits || 0;
  const max = user.isPro ? 50 : 5;
  const pct = Math.min(100, Math.round((credits / max) * 100));
  const name = _esc(user.businessName || user.email.split('@')[0]);
  const email = _esc(user.email);
  const badge = user.isPro === true
    ? '<span class="nav-dd-badge badge-pro">PRO</span>'
    : '<span class="nav-dd-badge badge-free">FREE</span>';

  return `
    <div class="nav-dd-header">
      <div class="nav-dd-top">
        <div class="nav-dd-avatar">${_avatarHTML(user)}</div>
        <div>
          <div class="nav-dd-name">${name}</div>
          <div class="nav-dd-email">${email}</div>
          ${badge}
        </div>
      </div>
    </div>
    <div class="nav-dd-credits-row">
      <div class="nav-dd-credits-top">
        <span class="nav-dd-credits-label">⚡ ${t({ en: 'Credits', he: 'קרדיטים', es: 'Créditos' })}</span>
        <span class="nav-dd-credits-val">${credits}</span>
      </div>
      <div class="nav-dd-credits-bar"><div class="nav-dd-credits-fill${pct < 20 ? ' low' : ''}" style="width:${pct}%"></div></div>
    </div>
    <a href="/profile.html" class="nav-dd-item"><span class="dd-icon">🏢</span>${t({ en: 'Business Profile', he: 'פרופיל עסקי', es: 'Perfil del Negocio' })}</a>
    <a href="/dashboard.html" class="nav-dd-item"><span class="dd-icon">📊</span>${t({ en: 'Dashboard', he: 'דשבורד', es: 'Panel' })}</a>
    <a href="/gallery.html" class="nav-dd-item"><span class="dd-icon">📁</span>${t({ en: 'My Projects', he: 'הפרויקטים שלי', es: 'Mis Proyectos' })}</a>
    <a href="/directory-profile.html?email=${encodeURIComponent(user.email)}" class="nav-dd-item"><span class="dd-icon">📋</span>${t({ en: 'Directory Listing', he: 'רישום Directory', es: 'Mi Directorio' })}</a>
    <div class="nav-dd-divider"></div>
    <div class="nav-dd-lang">
      <button class="nav-dd-lang-btn${lang === 'en' ? ' on' : ''}" onclick="setLang('en');_rebuildDropdown()">🇺🇸 EN</button>
      <button class="nav-dd-lang-btn${lang === 'he' ? ' on' : ''}" onclick="setLang('he');_rebuildDropdown()">🇮🇱 עב</button>
      <button class="nav-dd-lang-btn${lang === 'es' ? ' on' : ''}" onclick="setLang('es');_rebuildDropdown()">🇲🇽 ES</button>
    </div>
    <a href="/memories.html" class="nav-dd-item"><span class="dd-icon">🧠</span>${t({ en: 'Memories', he: 'זיכרונות', es: 'Memorias' })}</a>
    <button class="nav-dd-item" onclick="showReferralLink()"><span class="dd-icon">🎁</span>${t({ en: 'Refer a Friend', he: 'הזמן חבר', es: 'Recomienda a un Amigo' })}</button>
    <button class="nav-dd-item" onclick="showRedeemCode()"><span class="dd-icon">🎟️</span>${t({ en: 'Redeem Code', he: 'הזן קוד', es: 'Canjear Código' })}</button>
    <a href="/affiliate.html" class="nav-dd-item"><span class="dd-icon">💰</span>${t({ en: 'Affiliate Program', he: 'תוכנית שותפים', es: 'Programa de Afiliados' })}</a>
    <div class="nav-dd-divider"></div>
    <button class="nav-dd-item" onclick="resetTutorial()"><span class="dd-icon">📖</span>${t({ en: 'Show Tutorial Again', he: 'הצג Tutorial שוב', es: 'Ver Tutorial' })}</button>
    <button class="nav-dd-item accent" onclick="showBuyCreditsModal()"><span class="dd-icon">🛒</span>${t({ en: 'Buy Credits', he: 'קנה קרדיטים', es: 'Comprar Créditos' })}</button>
    ${!user.isPro ? `<a href="/auth.html" class="nav-dd-item green"><span class="dd-icon">⭐</span>${t({ en: 'Upgrade to Pro', he: 'שדרג ל-Pro', es: 'Hazte Pro' })}</a>` : ''}
    <div class="nav-dd-divider"></div>
    <button class="nav-dd-item danger" onclick="doLogout()"><span class="dd-icon">🚪</span>${t({ en: 'Sign Out', he: 'התנתק', es: 'Cerrar Sesión' })}</button>`;
}

function _rebuildDropdown() {
  const user = typeof getCachedUser === 'function' ? getCachedUser() : null;
  if (!user) return;
  const dd = document.getElementById('navDropdown');
  if (dd) dd.innerHTML = _ddHTML(user);
  // Re-bind close on item click
  if (dd) dd.querySelectorAll('a.nav-dd-item').forEach(a => {
    a.addEventListener('click', _closeDropdown);
  });
}

function injectProfileAvatar() {
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;
  const loggedIn = typeof isLoggedIn === 'function' && isLoggedIn();

  // Clean up old elements
  navRight.querySelectorAll('.btn.btn-sm').forEach(b => {
    const href = b.getAttribute('href') || '';
    if (href.includes('auth') || href.includes('dashboard') || b.id === 'navSignInBtn') b.remove();
  });
  const oldAvatar = document.getElementById('navAvatar');
  if (oldAvatar) oldAvatar.remove();
  const oldDd = document.getElementById('navDropdown');
  if (oldDd) oldDd.remove();
  const oldBd = document.getElementById('navDdBackdrop');
  if (oldBd) oldBd.remove();

  const langToggle = navRight.querySelector('.lang-toggle');

  if (!loggedIn) {
    if (langToggle) langToggle.style.display = '';
    const signIn = document.createElement('a');
    signIn.href = '/auth.html';
    signIn.className = 'btn btn-sm';
    signIn.id = 'navSignInBtn';
    signIn.textContent = t({ en: 'Sign In', he: 'התחבר', es: 'Iniciar Sesión' });
    if (langToggle) navRight.insertBefore(signIn, langToggle);
    else navRight.appendChild(signIn);
    return;
  }

  const user = typeof getCachedUser === 'function' ? getCachedUser() : null;
  if (!user) return;

  // Hide standalone lang toggle
  if (langToggle) langToggle.style.display = 'none';

  // Avatar button — goes inside nav
  const avatar = document.createElement('div');
  avatar.className = 'nav-avatar';
  avatar.id = 'navAvatar';
  avatar.innerHTML = _avatarHTML(user);
  avatar.addEventListener('click', (e) => { e.stopPropagation(); _toggleDD(); });
  if (langToggle) navRight.insertBefore(avatar, langToggle);
  else navRight.appendChild(avatar);

  // Backdrop — appended to body (outside nav stacking context)
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-dd-backdrop';
  backdrop.id = 'navDdBackdrop';
  backdrop.addEventListener('click', _closeDropdown);
  document.body.appendChild(backdrop);

  // Dropdown — appended to body (outside nav stacking context!)
  const dd = document.createElement('div');
  dd.className = 'nav-dropdown';
  dd.id = 'navDropdown';
  dd.innerHTML = _ddHTML(user);
  document.body.appendChild(dd);

  // Close dropdown when clicking any <a> item (navigation happens naturally)
  dd.querySelectorAll('a.nav-dd-item').forEach(a => {
    a.addEventListener('click', _closeDropdown);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    const d = document.getElementById('navDropdown');
    const a = document.getElementById('navAvatar');
    if (!d || !d.classList.contains('open')) return;
    if (d.contains(e.target) || (a && a.contains(e.target))) return;
    _closeDropdown();
  });
}

function doLogout() {
  localStorage.removeItem('bq_token');
  localStorage.removeItem('bq_user');
  window.location.href = '/';
}

// ── Referral Link Modal ──
function showReferralLink() {
  _closeDropdown();
  const user = typeof getCachedUser === 'function' ? getCachedUser() : null;
  if (!user) return;
  const h = lang === 'he';
  const link = `${window.location.origin}/?ref=${encodeURIComponent(user.email)}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent((h ? 'נסה את BQ Tools — כלי AI לקבלנים! ' : 'Check out BQ Tools — AI tools for contractors! ') + link)}`;
  const mailUrl = `mailto:?subject=${encodeURIComponent('BQ Tools')}&body=${encodeURIComponent((h ? 'נסה את BQ Tools: ' : 'Try BQ Tools: ') + link)}`;

  const m = document.createElement('div');
  m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal-card" style="max-width:420px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">🎁</div>
      <h3 style="margin-bottom:6px;">${h ? 'שתף והרוויח' : 'Share & Earn Rewards!'}</h3>
      <p style="font-size:14px;color:var(--txd);line-height:1.6;margin-bottom:6px;">${h
        ? 'לכל חבר שנרשם:'
        : 'For every friend who signs up:'}</p>
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <div style="flex:1;background:var(--acd);border-radius:10px;padding:10px;">
          <div style="font-size:13px;font-weight:700;color:var(--ac);">${h ? 'אתה מקבל' : 'You get'}</div>
          <div style="font-size:12px;color:var(--txd);">10% OFF</div>
        </div>
        <div style="flex:1;background:rgba(81,207,102,.1);border-radius:10px;padding:10px;">
          <div style="font-size:13px;font-weight:700;color:var(--grn);">${h ? 'הם מקבלים' : 'They get'}</div>
          <div style="font-size:12px;color:var(--txd);">5 bonus credits</div>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:12px;">
        <input type="text" value="${link}" readonly id="refLinkInput" style="flex:1;padding:10px;border:1px solid var(--bd);border-radius:8px;background:var(--bg);color:var(--ac);font-family:monospace;font-size:11px;overflow:hidden;text-overflow:ellipsis;">
        <button class="btn btn-primary" style="min-width:60px;font-size:13px;" onclick="navigator.clipboard.writeText(document.getElementById('refLinkInput').value);showToast('Copied!','ok')">Copy</button>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:14px;">
        <a href="${waUrl}" target="_blank" rel="noopener" class="btn" style="flex:1;font-size:13px;background:#25D366;border-color:#25D366;color:#fff;">WhatsApp</a>
        <a href="${mailUrl}" class="btn" style="flex:1;font-size:13px;">Email</a>
      </div>
      <div id="refStats" style="font-size:13px;color:var(--txd);margin-bottom:14px;"></div>
      <button onclick="this.closest('.modal-overlay').remove()" class="btn" style="width:100%;">${h ? 'סגור' : 'Close'}</button>
    </div>`;
  document.body.appendChild(m);
  requestAnimationFrame(() => m.classList.add('open'));
  m.onclick = (e) => { if (e.target === m) m.remove(); };

  if (typeof apiCall === 'function') {
    apiCall('/api/referral/stats').then(data => {
      if (data.ok) {
        const el = document.getElementById('refStats');
        if (el) el.textContent = h
          ? `הפנית ${data.referrals} חברים${data.hasDiscount ? ' — יש לך 10% הנחה!' : ''}`
          : `You referred ${data.referrals} friend${data.referrals !== 1 ? 's' : ''}${data.hasDiscount ? ' — you earned 10% off!' : ''}`;
      }
    }).catch(() => {});
  }
}

// ── Redeem Code Modal ──
function showRedeemCode() {
  _closeDropdown();
  const h = lang === 'he';
  const m = document.createElement('div');
  m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal-card" style="max-width:380px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">🎟️</div>
      <h3 style="margin-bottom:6px;">${h ? 'הזן קוד' : 'Redeem Code'}</h3>
      <p style="font-size:14px;color:var(--txd);margin-bottom:16px;line-height:1.5;">${h ? 'יש לך קוד מתנה או קוד ארגון?' : 'Have a gift code or organization code?'}</p>
      <input type="text" id="redeemInput" class="input" placeholder="ABCD-1234" style="text-align:center;letter-spacing:2px;font-size:18px;font-weight:700;margin-bottom:12px;" maxlength="20">
      <button class="btn btn-primary" style="width:100%;margin-bottom:8px;" onclick="doRedeem()" id="redeemBtn">${h ? 'הפעל קוד' : 'Redeem'}</button>
      <div id="redeemResult" style="font-size:13px;margin-bottom:12px;min-height:20px;"></div>
      <button onclick="this.closest('.modal-overlay').remove()" class="btn" style="width:100%;">${h ? 'סגור' : 'Close'}</button>
    </div>`;
  document.body.appendChild(m);
  requestAnimationFrame(() => m.classList.add('open'));
  m.onclick = (e) => { if (e.target === m) m.remove(); };
  setTimeout(() => document.getElementById('redeemInput')?.focus(), 200);
  document.getElementById('redeemInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') doRedeem(); });
}

async function doRedeem() {
  const code = document.getElementById('redeemInput')?.value.trim();
  const result = document.getElementById('redeemResult');
  const btn = document.getElementById('redeemBtn');
  if (!code) { result.innerHTML = '<span style="color:var(--red);">Enter a code</span>'; return; }
  btn.disabled = true; btn.textContent = '...';
  try {
    const data = await apiCall('/api/credits/redeem', { method: 'POST', body: { code } });
    result.innerHTML = `<span style="color:var(--grn);">✓ ${data.credits} credits added!</span>`;
    if (typeof fetchUser === 'function') fetchUser().catch(() => {});
  } catch (err) {
    result.innerHTML = `<span style="color:var(--red);">✗ ${err.message}</span>`;
  }
  btn.disabled = false; btn.textContent = lang === 'he' ? 'הפעל קוד' : 'Redeem';
}

// ── Cross-promo Banner ──
function showPromoBanner() {
  const ref = localStorage.getItem('bq_referral');
  if (ref !== 'bqprod') return;
  // Only show once
  if (sessionStorage.getItem('bq_promo_seen')) return;
  sessionStorage.setItem('bq_promo_seen', '1');

  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:110;background:linear-gradient(90deg,rgba(232,197,71,.12),rgba(81,207,102,.12));border-bottom:1px solid rgba(232,197,71,.2);padding:10px 20px;text-align:center;font-size:14px;font-weight:600;color:var(--ac);display:flex;align-items:center;justify-content:center;gap:8px;';
  banner.innerHTML = `
    <span>${t({ en: '🎉 Welcome from BQ Production! 10% OFF your first month', he: '🎉 ברוכים הבאים מ-BQ Production! 10% הנחה על החודש הראשון', es: '🎉 ¡Bienvenido de BQ Production! 10% de descuento en tu primer mes' })}</span>
    <button onclick="this.parentElement.remove();document.querySelector('.nav').style.top=''" style="background:none;border:none;color:var(--txd);cursor:pointer;font-size:18px;margin-inline-start:8px;">✕</button>`;
  document.body.prepend(banner);
  // Push nav down
  const nav = document.querySelector('.nav');
  if (nav) nav.style.top = banner.offsetHeight + 'px';
}

// ── Footer Builder ──
function buildFooter() {
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="footer-brand">BQ Tools — BQ Production LLC</div>
    <div class="footer-links">
      <a href="https://bqprod.pages.dev" target="_blank">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/></svg>
        bqprod.pages.dev
      </a>
      <a href="https://instagram.com/bq_music" target="_blank">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/></svg>
        @bq_music
      </a>
    </div>
    <div class="footer-legal">
      <a href="/privacy.html">Privacy Policy</a>
      <span>|</span>
      <a href="/terms.html">Terms of Service</a>
      <span>|</span>
      <a href="/ai-disclaimer.html">AI Disclaimer</a>
      <span>|</span>
      <a href="/refund.html">Refund Policy</a>
      <span>|</span>
      <a href="/contact.html">Contact</a>
    </div>
    <div style="font-size:10px;color:var(--txd);opacity:.3;text-align:center;margin-top:6px;">&copy; 2026 BQ Production LLC. All rights reserved.</div>`;
  document.body.appendChild(footer);
}

// ── Toast Notification ──
function showToast(msg, type) {
  const t = document.createElement('div');
  t.className = 'toast toast-' + (type || 'ok');
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2500);
}

// ── Global Error Handler ──
window.onerror = function(msg, src, line, col, err) {
  const errors = JSON.parse(localStorage.getItem('bq_errors') || '[]');
  errors.unshift({
    timestamp: new Date().toISOString(),
    page: window.location.pathname,
    error: msg,
    source: src,
    line,
    browser: navigator.userAgent
  });
  if (errors.length > 50) errors.length = 50;
  localStorage.setItem('bq_errors', JSON.stringify(errors));

  // Try to send to server
  if (typeof apiCall === 'function') {
    apiCall('/api/error-report', {
      method: 'POST',
      body: { page: window.location.pathname, error: msg, source: src, line, browser: navigator.userAgent }
    }).catch(() => {}); // silent fail
  }
};

// ── Last Action Tracking (for Smart Suggestions) ──
function trackAction(tool, projectId) {
  localStorage.setItem('bq_lastAction', JSON.stringify({
    tool,
    projectId: projectId || null,
    timestamp: Date.now()
  }));
}

function getLastAction() {
  try {
    return JSON.parse(localStorage.getItem('bq_lastAction') || 'null');
  } catch { return null; }
}

// ── Voice Input (shared) ──

function addVoiceButton(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'voice-btn';
  btn.innerHTML = '🎤';
  btn.title = lang === 'he' ? 'הקלטה קולית' : 'Voice input';
  btn.style.cssText = 'width:44px;height:44px;border-radius:10px;border:1px solid var(--bd);background:var(--bg);color:var(--txd);cursor:pointer;font-size:18px;display:inline-flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0;margin-inline-start:4px;';

  let rec = null;
  let recording = false;

  btn.onclick = () => {
    if (recording) {
      if (rec) try { rec.stop(); } catch {}
      recording = false;
      btn.innerHTML = '🎤';
      btn.style.borderColor = 'var(--bd)';
      btn.style.color = 'var(--txd)';
      btn.style.animation = '';
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    rec = new SR();
    rec.lang = lang === 'he' ? 'he-IL' : 'en-US';
    rec.interimResults = true;
    rec.continuous = true;

    let finalText = input.value;

    rec.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalText += (finalText ? ' ' : '') + e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      input.value = finalText + (interim ? ' ' + interim : '');
      if (input.tagName === 'TEXTAREA' && typeof autoGrow === 'function') autoGrow(input);
    };

    rec.onerror = rec.onend = () => {
      recording = false;
      btn.innerHTML = '🎤';
      btn.style.borderColor = 'var(--bd)';
      btn.style.color = 'var(--txd)';
      btn.style.animation = '';
    };

    rec.start();
    recording = true;
    btn.innerHTML = '⏹';
    btn.style.borderColor = 'var(--red)';
    btn.style.color = 'var(--red)';
    btn.style.animation = 'voicePulse 1s ease-in-out infinite';
  };

  // Insert after input
  input.parentNode.insertBefore(btn, input.nextSibling);
}

// ── Onboarding Tutorial ──

function runTutorial() {
  if (localStorage.getItem('bq_tutorial_done') === '1') return;
  if (!isLoggedIn()) return;

  const steps = [
    {
      target: null, pos: 'center',
      title: t({ en: 'Welcome to BQ Tools!', he: 'ברוך הבא ל-BQ Tools!', es: '¡Bienvenido a BQ Tools!' }),
      text: t({ en: 'Let me show you around — it only takes a minute', he: 'בוא אראה לך את הכל בקצרה', es: 'Te muestro todo — solo toma un minuto' })
    },
    {
      target: '.nav-link[href="/home.html"]', pos: 'bottom',
      title: t({ en: 'Your AI Tools', he: 'הכלים שלך', es: 'Tus Herramientas IA' }),
      text: t({ en: 'Compare photos, create reports, get estimates — all powered by AI.', he: 'השווה תמונות, צור דוחות, קבל הצעות מחיר — הכל עם AI', es: 'Compara fotos, crea reportes, obtén estimados — todo con IA.' })
    },
    {
      target: '.nav-link[href="/directory.html"]', pos: 'bottom',
      title: t({ en: 'Directory', he: 'Directory', es: 'Directorio' }),
      text: t({ en: 'Find contractors or list your business here.', he: 'מצא קבלנים או רשום את העסק שלך כאן', es: 'Encuentra contratistas o registra tu negocio aquí.' })
    },
    {
      target: '#creditBar, .nav-credit-pill', pos: 'bottom',
      title: t({ en: 'Credits', he: 'קרדיטים', es: 'Créditos' }),
      text: t({ en: 'You have 5 free credits. Each AI action uses 1 credit.', he: 'יש לך 5 קרדיטים חינם. כל פעולת AI עולה 1 קרדיט', es: 'Tienes 5 créditos gratis. Cada acción con IA usa 1 crédito.' })
    },
    {
      target: '#navAvatar, .nav-avatar', pos: 'bottom',
      title: t({ en: 'Your Profile', he: 'הפרופיל שלך', es: 'Tu Perfil' }),
      text: t({ en: 'Your profile, settings, and account are here.', he: 'פרופיל, הגדרות וחשבון — הכל כאן', es: 'Tu perfil, ajustes y cuenta están aquí.' })
    },
    {
      target: null, pos: 'center',
      title: t({ en: "You're ready!", he: 'מוכן!', es: '¡Listo!' }),
      text: t({ en: 'Start by comparing your first before/after photos.', he: 'התחל בהשוואת תמונות לפני/אחרי', es: 'Empieza comparando tus primeras fotos de antes/después.' }),
      cta: { text: t({ en: 'Go to Compare →', he: 'לך ל-Compare →', es: 'Ir a Comparar →' }), href: '/tools/compare.html' }
    },
  ];

  let stepIdx = 0;

  function showStep() {
    // Remove old
    document.getElementById('bq-tutorial-overlay')?.remove();

    if (stepIdx >= steps.length) {
      localStorage.setItem('bq_tutorial_done', '1');
      return;
    }

    const step = steps[stepIdx];
    const isCenter = step.pos === 'center' || !step.target;
    let targetEl = null;

    if (step.target) {
      const selectors = step.target.split(', ');
      for (const sel of selectors) {
        targetEl = document.querySelector(sel);
        if (targetEl) break;
      }
    }

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'bq-tutorial-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;';

    // Dark backdrop with cutout
    const backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.7);transition:all .3s;';
    overlay.appendChild(backdrop);

    // Highlight target
    if (targetEl && !isCenter) {
      const rect = targetEl.getBoundingClientRect();
      const pad = 6;
      const highlight = document.createElement('div');
      highlight.style.cssText = `position:absolute;left:${rect.left - pad}px;top:${rect.top - pad}px;width:${rect.width + pad * 2}px;height:${rect.height + pad * 2}px;border-radius:10px;box-shadow:0 0 0 9999px rgba(0,0,0,.7);z-index:1;pointer-events:none;border:2px solid var(--ac);`;
      overlay.appendChild(highlight);
      backdrop.style.background = 'transparent';
    }

    // Tooltip card
    const card = document.createElement('div');
    card.style.cssText = 'position:absolute;z-index:2;background:var(--sf);border:1px solid var(--ac);border-radius:14px;padding:20px 24px;max-width:340px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,.5);';

    if (isCenter) {
      card.style.left = '50%';
      card.style.top = '50%';
      card.style.transform = 'translate(-50%,-50%)';
    } else if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      card.style.left = Math.max(10, Math.min(rect.left, window.innerWidth - 360)) + 'px';
      card.style.top = (rect.bottom + 14) + 'px';
    }

    const isLast = stepIdx === steps.length - 1;
    const nextText = t({ en: 'Next', he: 'הבא', es: 'Siguiente' });
    const skipText = t({ en: 'Skip', he: 'דלג', es: 'Omitir' });

    card.innerHTML = `
      <div style="font-size:11px;color:var(--txd);margin-bottom:6px;">${stepIdx + 1}/${steps.length}</div>
      <h3 style="font-size:17px;font-weight:700;margin-bottom:6px;color:var(--ac);">${step.title}</h3>
      <p style="font-size:14px;color:var(--tx);line-height:1.6;margin-bottom:16px;">${step.text}</p>
      <div style="display:flex;gap:8px;">
        <button id="tutSkip" style="flex:1;padding:10px;border:1px solid var(--bd);border-radius:8px;background:none;color:var(--txd);cursor:pointer;font-family:inherit;font-size:14px;min-height:44px;">${skipText}</button>
        ${step.cta
          ? `<a href="${step.cta.href}" style="flex:1;padding:10px;border:none;border-radius:8px;background:var(--ac);color:var(--bg);cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;text-align:center;text-decoration:none;min-height:44px;display:flex;align-items:center;justify-content:center;" id="tutNext">${step.cta.text}</a>`
          : `<button id="tutNext" style="flex:1;padding:10px;border:none;border-radius:8px;background:var(--ac);color:var(--bg);cursor:pointer;font-family:inherit;font-size:14px;font-weight:700;min-height:44px;">${nextText}</button>`
        }
      </div>`;

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    // Bind
    document.getElementById('tutSkip').onclick = () => {
      overlay.remove();
      localStorage.setItem('bq_tutorial_done', '1');
    };
    const nextBtn = document.getElementById('tutNext');
    if (!step.cta) {
      nextBtn.onclick = () => { stepIdx++; showStep(); };
    } else {
      nextBtn.addEventListener('click', () => {
        localStorage.setItem('bq_tutorial_done', '1');
      });
    }
  }

  // Delay to let nav render
  setTimeout(showStep, 600);
}

function resetTutorial() {
  // Clear all tutorial flags
  const keys = Object.keys(localStorage).filter(k => k.startsWith('bq_tutorial'));
  keys.forEach(k => localStorage.removeItem(k));
  _closeDropdown();
  showToast(lang === 'he' ? 'Tutorial אופס — יופיע בעמוד הבא' : 'Tutorial reset — will show on next page', 'ok');
  setTimeout(() => runTutorial(), 300);
}

// ── Per-Page Tooltips ──

const PAGE_TIPS = {
  '/tools/compare.html': [
    { target: null, text: {
      en: 'Upload a BEFORE photo → Upload an AFTER photo → Move the slider → Click Analyze for AI insights',
      he: 'העלה תמונת לפני → העלה תמונת אחרי → הזז את הסליידר → לחץ Analyze לניתוח AI',
      es: 'Sube una foto de ANTES → Sube una foto de DESPUÉS → Mueve el control → Haz clic en Analizar para ver el análisis con IA'
    } }
  ],
  '/tools/report.html': [
    { target: null, text: {
      en: 'Upload project photos → Describe the work → AI creates a professional PDF report',
      he: 'העלה תמונות פרויקט → תאר את העבודה → AI יוצר דוח PDF מקצועי',
      es: 'Sube fotos del proyecto → Describe el trabajo → La IA crea un reporte profesional en PDF'
    } }
  ],
  '/tools/estimate.html': [
    { target: null, text: {
      en: 'Upload a photo of the space → Describe what needs to be done → Get an AI cost estimate',
      he: 'העלה תמונה של החלל → תאר מה צריך לעשות → קבל הערכת עלות מ-AI',
      es: 'Sube una foto del área → Describe lo que se va a hacer → Obtén un estimado con IA'
    } }
  ],
  '/chat.html': [
    { target: null, text: {
      en: 'Choose a model → Type or speak your question → AI answers. Try Multi-Model to compare!',
      he: 'בחר מודל → הקלד או דבר את השאלה → AI עונה. נסה Multi-Model להשוואה!',
      es: 'Elige un modelo → Escribe o habla tu pregunta → La IA responde. ¡Prueba Multi-Model para comparar!'
    } }
  ],
  '/directory.html': [
    { target: null, text: {
      en: 'Search for contractors → Click a profile → See their work and location on the map',
      he: 'חפש קבלנים → לחץ על פרופיל → ראה את העבודות והמיקום על המפה',
      es: 'Busca contratistas → Haz clic en un perfil → Ve su trabajo y ubicación en el mapa'
    } }
  ],
};

function showPageTip() {
  const path = window.location.pathname;
  const tips = PAGE_TIPS[path];
  if (!tips) return;

  const flagKey = 'bq_tutorial_page_' + path.replace(/[^a-z]/g, '');
  if (localStorage.getItem(flagKey) === '1') return;

  const tip = tips[0];
  const text = t(tip.text);

  const banner = document.createElement('div');
  banner.id = 'bq-page-tip';
  banner.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:500;background:var(--sf);border:1px solid var(--ac);border-radius:12px;padding:14px 20px;max-width:460px;width:90%;box-shadow:0 4px 20px rgba(0,0,0,.4);display:flex;align-items:flex-start;gap:10px;animation:tipSlideUp .3s ease;';
  banner.innerHTML = `
    <span style="font-size:20px;flex-shrink:0;">💡</span>
    <p style="font-size:13px;line-height:1.5;color:var(--tx);margin:0;">${text}</p>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--txd);cursor:pointer;font-size:16px;flex-shrink:0;padding:0 4px;">✕</button>`;
  document.body.appendChild(banner);

  localStorage.setItem(flagKey, '1');

  // Auto-dismiss after 10 seconds
  setTimeout(() => banner.remove(), 10000);
}

// ── How It Works Builder ──

function buildHowItWorks(containerId, config) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const h = lang === 'he';

  const toggleText = h ? '📖 איך זה עובד' : '📖 How it works';

  // Check for demo video
  const videoSrc = config.video || null;
  let videoHtml;
  if (videoSrc) {
    videoHtml = `<div class="tool-demo-video"><video src="${videoSrc}" autoplay muted loop playsinline poster="${config.videoPoster || ''}"></video></div>`;
  } else {
    videoHtml = `<div class="tool-demo-video">🎬 ${h ? 'סרטון הדרכה בקרוב' : 'Video tutorial coming soon'}</div>`;
  }

  el.innerHTML = `
    <button class="hiw-toggle" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('open')">
      ${toggleText}
      <span class="hiw-arrow">▼</span>
    </button>
    <div class="hiw-body">
      <div class="hiw-steps">
        ${config.steps.map((s, i) => `
          <div class="hiw-step">
            <span class="hiw-num">${i + 1}</span>
            <span class="hiw-icon">${s.icon}</span>
            <p>${h ? s.he : s.en}</p>
          </div>`).join('')}
      </div>
      ${config.example ? `<div class="hiw-example">${h ? config.example.he : config.example.en}</div>` : ''}
      ${videoHtml}
    </div>`;
}

const HIW_CONFIGS = {
  compare: {
    steps: [
      { icon: '📸', en: 'Upload a BEFORE photo', he: 'העלה תמונת לפני' },
      { icon: '📸', en: 'Upload an AFTER photo', he: 'העלה תמונת אחרי' },
      { icon: '🔀', en: 'Slide to compare, then click Analyze for AI insights', he: 'הזז את הסליידר, ואז לחץ Analyze לניתוח AI' },
    ],
    example: {
      en: 'Kitchen remodel: AI detected new countertops, backsplash, and lighting. Score: 9/10',
      he: 'שיפוץ מטבח: AI זיהה משטחי שיש חדשים, חיפוי ותאורה. ציון: 9/10'
    }
  },
  report: {
    steps: [
      { icon: '📸', en: 'Upload 1-10 project photos', he: 'העלה 1-10 תמונות פרויקט' },
      { icon: '✍️', en: 'Describe what was done', he: 'תאר מה בוצע' },
      { icon: '📄', en: 'Get a professional PDF report with your logo', he: 'קבל דוח PDF מקצועי עם הלוגו שלך' },
    ],
    example: {
      en: 'Bathroom renovation report: 5 photos → 2-page PDF with project overview, work completed, and AI quality assessment',
      he: 'דוח שיפוץ אמבטיה: 5 תמונות → PDF בן 2 עמודים עם סקירה, עבודות שבוצעו, והערכת איכות AI'
    }
  },
  estimate: {
    steps: [
      { icon: '📸', en: 'Take a photo of the space', he: 'צלם את החלל' },
      { icon: '✍️', en: "Describe the project (e.g. 'replace kitchen tiles')", he: "תאר את הפרויקט (למשל 'החלפת אריחים במטבח')" },
      { icon: '💰', en: 'Get cost breakdown: materials + labor + total range', he: 'קבל פירוט עלויות: חומרים + עבודה + טווח סופי' },
    ],
    example: {
      en: 'Kitchen tile replacement: Materials $800-1,200, Labor $600-900, Total $1,400-2,100',
      he: 'החלפת אריחים במטבח: חומרים $800-1,200, עבודה $600-900, סה״כ $1,400-2,100'
    }
  },
  'social-post': {
    steps: [
      { icon: '📸', en: 'Upload before/after photos', he: 'העלה תמונות לפני/אחרי' },
      { icon: '📱', en: 'Choose platform: Instagram / Facebook / LinkedIn', he: 'בחר פלטפורמה: Instagram / Facebook / LinkedIn' },
      { icon: '📋', en: 'Copy AI-generated caption with hashtags', he: 'העתק קפשן שנוצר ע״י AI עם האשטגים' },
    ],
    example: {
      en: '🏠 From outdated to outstanding! This kitchen transformation features custom cabinetry... #KitchenRemodel #BeforeAndAfter',
      he: '🏠 מישן למרהיב! שיפוץ מטבח זה כולל ארונות מותאמים... #שיפוץמטבח #לפניואחרי'
    }
  },
  review: {
    steps: [
      { icon: '✍️', en: 'Enter client name + work type', he: 'הכנס שם לקוח + סוג עבודה' },
      { icon: '📱', en: 'Choose: SMS / WhatsApp / Email', he: 'בחר: SMS / WhatsApp / Email' },
      { icon: '📋', en: 'Copy personalized review request message', he: 'העתק הודעת בקשת ביקורת מותאמת' },
    ],
    example: {
      en: 'Hi Sarah! Thanks for trusting us with your kitchen remodel. We\'d love your feedback: [Google Review Link]',
      he: 'היי שרה! תודה שסמכת עלינו בשיפוץ המטבח. נשמח לביקורת שלך: [לינק ביקורת Google]'
    }
  },
  sketch: {
    steps: [
      { icon: '✏️', en: 'Draw on canvas or upload a photo of your sketch', he: 'צייר על הקנבס או העלה תמונה של סקיצה' },
      { icon: '🧠', en: "Click 'Clean Up' for AI to redraw professionally", he: 'לחץ \'Clean Up\' כדי ש-AI ישרטט מקצועית' },
      { icon: '📄', en: 'Export as PNG or PDF', he: 'ייצא כ-PNG או PDF' },
    ],
    example: {
      en: 'Hand-drawn floor plan → AI cleaned to professional blueprint with straight lines and measurements',
      he: 'תוכנית קומה ביד → AI ניקה לשרטוט מקצועי עם קווים ישרים ומידות'
    }
  },
  'social-analysis': {
    steps: [
      { icon: '📸', en: 'Enter Instagram username', he: 'הכנס שם משתמש Instagram' },
      { icon: '🔍', en: 'AI fetches real profile data', he: 'AI שולף נתוני פרופיל אמיתיים' },
      { icon: '📊', en: 'Get scores, engagement analysis, and recommendations', he: 'קבל ציונים, ניתוח אינטראקציה, והמלצות' },
    ],
    example: {
      en: '@goldremodeling: 2,450 followers, 3.2% engagement, posts 2x/week. Recommendation: Add more before/after reels',
      he: '@goldremodeling: 2,450 עוקבים, 3.2% אינטראקציה, 2 פוסטים/שבוע. המלצה: הוסיפו עוד רילס לפני/אחרי'
    }
  },
  chat: {
    steps: [
      { icon: '💬', en: 'Choose AI model (GPT-4o, Claude, Gemini, etc.)', he: 'בחר מודל AI (GPT-4o, Claude, Gemini וכו\')' },
      { icon: '✍️', en: 'Type or 🎤 speak your question', he: 'הקלד או 🎤 דבר את השאלה' },
      { icon: '⚡', en: 'Get expert answers about permits, estimates, contracts, marketing', he: 'קבל תשובות מומחה על היתרים, הצעות מחיר, חוזים, שיווק' },
    ],
    example: {
      en: 'Q: What permits do I need for a bathroom addition in LA? A: You\'ll need a building permit from LADBS...',
      he: 'ש: אילו היתרים אני צריך להרחבת אמבטיה ב-LA? ת: תצטרך היתר בנייה מ-LADBS...'
    }
  },
  directory: {
    steps: [
      { icon: '📝', en: 'Sign up for free', he: 'הירשם בחינם' },
      { icon: '⭐', en: 'Go Pro to add phone, photos, and reviews', he: 'שדרג ל-Pro כדי להוסיף טלפון, תמונות וביקורות' },
      { icon: '📍', en: 'Add your work locations to appear on the map', he: 'הוסף את מיקומי העבודה שלך כדי להופיע במפה' },
    ],
    example: {
      en: 'A Pro listing can include up to 20 photos, client reviews, and multiple work locations — all searchable on the map.',
      he: 'רישום Pro יכול לכלול עד 20 תמונות, ביקורות לקוחות, ומספר מיקומי עבודה — הכל ניתן לחיפוש על המפה.'
    }
  },
};

// ── Buy Credits Modal ──

function showBuyCreditsModal() {
  _closeDropdown();
  const credits = typeof getCredits === 'function' ? getCredits() : 0;
  const creditsWord = t({ en: 'credits remaining', he: 'קרדיטים', es: 'créditos disponibles' });
  const youHave = t({ en: 'You have', he: 'יש לך', es: 'Tienes' });

  const m = document.createElement('div');
  m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal-card" style="max-width:540px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">⚡</div>
      <h3 style="margin-bottom:4px;">${t({ en: 'Buy Credits', he: 'קנה קרדיטים', es: 'Comprar Créditos' })}</h3>
      <p style="font-size:14px;color:var(--txd);margin-bottom:16px;">${youHave} <b style="color:var(--ac);">${credits}</b> ${creditsWord}</p>

      <div style="display:flex;gap:10px;margin-bottom:16px;flex-wrap:wrap;">
        <!-- 25 credits -->
        <div style="flex:1;min-width:140px;background:var(--bg);border:1px solid var(--bd);border-radius:12px;padding:16px 12px;">
          <div style="font-size:20px;font-weight:900;">25</div>
          <div style="font-size:12px;color:var(--txd);margin-bottom:2px;">credits</div>
          <div style="font-size:18px;font-weight:700;margin-bottom:2px;">$4.99</div>
          <div style="font-size:11px;color:var(--txd);margin-bottom:10px;">~$0.20/credit</div>
          <a href="https://www.paypal.com/ncp/payment/2LA7B7PZTHN54" target="_blank" rel="noopener" class="btn btn-sm" style="width:100%;font-size:12px;margin-bottom:6px;">PayPal</a>
          <button onclick="openCryptoModal();this.closest('.modal-overlay').remove();" class="btn btn-sm" style="width:100%;font-size:11px;border-color:rgba(81,207,102,.3);color:var(--grn);">Crypto $3.24<br><span style="font-size:10px;">35% OFF</span></button>
        </div>
        <!-- 60 credits -->
        <div style="flex:1;min-width:140px;background:var(--bg);border:2px solid var(--ac);border-radius:12px;padding:16px 12px;position:relative;">
          <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--ac);color:var(--bg);font-size:10px;font-weight:700;padding:2px 10px;border-radius:6px;">POPULAR</div>
          <div style="font-size:20px;font-weight:900;color:var(--ac);">60</div>
          <div style="font-size:12px;color:var(--txd);margin-bottom:2px;">credits</div>
          <div style="font-size:18px;font-weight:700;margin-bottom:2px;">$9.99</div>
          <div style="font-size:11px;color:var(--txd);margin-bottom:10px;">~$0.17/credit</div>
          <a href="https://www.paypal.com/ncp/payment/2LA7B7PZTHN54" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="width:100%;font-size:12px;margin-bottom:6px;">PayPal</a>
          <button onclick="openCryptoModal();this.closest('.modal-overlay').remove();" class="btn btn-sm" style="width:100%;font-size:11px;border-color:rgba(81,207,102,.3);color:var(--grn);">Crypto $6.49<br><span style="font-size:10px;">35% OFF</span></button>
        </div>
        <!-- 150 credits -->
        <div style="flex:1;min-width:140px;background:var(--bg);border:1px solid var(--bd);border-radius:12px;padding:16px 12px;position:relative;">
          <div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--red);color:#fff;font-size:10px;font-weight:700;padding:2px 10px;border-radius:6px;">BEST VALUE</div>
          <div style="font-size:20px;font-weight:900;">150</div>
          <div style="font-size:12px;color:var(--txd);margin-bottom:2px;">credits</div>
          <div style="font-size:18px;font-weight:700;margin-bottom:2px;">$19.99</div>
          <div style="font-size:11px;color:var(--txd);margin-bottom:10px;">~$0.13/credit</div>
          <a href="https://www.paypal.com/ncp/payment/2LA7B7PZTHN54" target="_blank" rel="noopener" class="btn btn-sm" style="width:100%;font-size:12px;margin-bottom:6px;">PayPal</a>
          <button onclick="openCryptoModal();this.closest('.modal-overlay').remove();" class="btn btn-sm" style="width:100%;font-size:11px;border-color:rgba(81,207,102,.3);color:var(--grn);">Crypto $12.99<br><span style="font-size:10px;">35% OFF</span></button>
        </div>
      </div>

      <p style="font-size:12px;color:var(--txd);margin-bottom:14px;line-height:1.5;">1 credit = 1 AI Analysis, Report, Estimate, Social Post, or Assistant message</p>

      <div style="background:var(--acd);border-radius:10px;padding:12px;margin-bottom:14px;">
        <p style="font-size:13px;color:var(--ac);font-weight:600;margin-bottom:6px;">${t({ en: 'Need Pro? Get 50 credits/month for $14.99', he: 'צריך Pro? 50 קרדיטים בחודש ב-$14.99', es: '¿Necesitas Pro? Obtén 50 créditos al mes por $14.99' })}</p>
        <a href="/auth.html" class="btn btn-sm" style="font-size:12px;">${t({ en: 'Upgrade to Pro →', he: 'שדרג ל-Pro →', es: 'Hazte Pro →' })}</a>
      </div>

      <button onclick="this.closest('.modal-overlay').remove()" class="btn" style="width:100%;">${t({ en: 'Close', he: 'סגור', es: 'Cerrar' })}</button>
    </div>`;
  document.body.appendChild(m);
  requestAnimationFrame(() => m.classList.add('open'));
  m.onclick = (e) => { if (e.target === m) m.remove(); };
}

// ── Offline Check ──
function requireOnline() {
  if (!navigator.onLine) {
    showToast(lang === 'he' ? 'נדרש אינטרנט לפעולה זו' : 'Internet required for this action', 'err');
    return false;
  }
  return true;
}

// ── Routing ──
const _SKIP_PAGES = ['/admin.html', '/auth.html', '/onboarding.html'];
const _LANDING_PAGES = ['/', '/index.html'];
const _APP_PAGES = ['/home.html', '/profile.html', '/dashboard.html', '/gallery.html', '/directory.html', '/directory-profile.html', '/chat.html', '/affiliate.html', '/memories.html', '/news.html', '/training.html', '/business.html'];
const _BUSINESS_PAGES = ['/business/receipts.html', '/business/clients.html', '/business/expenses.html', '/business/projects.html', '/business/suppliers.html', '/business/equipment.html', '/business/time.html', '/business/compliance.html'];

function _isAppPage() {
  const p = window.location.pathname;
  return p.startsWith('/tools/') || p.startsWith('/business/') || _APP_PAGES.includes(p);
}

function _routingCheck() {
  const p = window.location.pathname;
  const loggedIn = typeof isLoggedIn === 'function' && isLoggedIn();

  // Landing page: no redirect — logged-in users can still see pricing
  // But show "Go to App" button via nav injection

  // Not logged in hits tool page → go to auth
  // Exception: compare.html slider is free without login
  if (!loggedIn && p.startsWith('/tools/') && !p.includes('compare.html')) {
    window.location.replace('/auth.html');
    return true;
  }

  // Save referral param if present
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (ref) localStorage.setItem('bq_referral', ref);

  return false;
}

// ── App Nav Builder ──
// Replaces the hardcoded nav on app pages with a clean app nav
function buildAppNav() {
  const oldNav = document.querySelector('nav.nav');
  if (!oldNav) return;

  const loggedIn = typeof isLoggedIn === 'function' && isLoggedIn();
  const user = typeof getCachedUser === 'function' ? getCachedUser() : null;
  const credits = user ? (user.credits || 0) : 0;
  const p = window.location.pathname;

  // Build nav links
  const links = [
    { href: '/home.html', en: 'Tools', he: 'כלים', es: 'Herramientas', match: ['/home.html'] },
    { href: '/business.html', en: 'Business', he: 'עסק', es: 'Negocio', match: ['/business.html'] },
    { href: '/news.html', en: 'News', he: 'חדשות', es: 'Noticias', match: ['/news.html'] },
    { href: '/directory.html', en: 'Directory', he: 'ספר עסקים', es: 'Directorio', match: ['/directory.html', '/directory-profile.html'] },
    { href: '/dashboard.html', en: 'Dashboard', he: 'דשבורד', es: 'Panel', match: ['/dashboard.html'] },
  ];

  const linksHtml = links.map(l => {
    const active = l.match.some(m => p === m) || (p.startsWith('/tools/') && l.href === '/home.html');
    return `<a href="${l.href}" class="nav-link${active ? ' nav-active' : ''}" data-en="${l.en}" data-he="${l.he}" data-es="${l.es}">${t(l)}</a>`;
  }).join('');

  // Credit pill (compact, integrated in nav)
  const creditPill = loggedIn
    ? `<div class="nav-credit-pill${credits < 5 ? (credits === 0 ? ' empty' : ' low') : ''}" id="creditBar">
        <span>⚡</span><span class="credit-count">${credits}</span>
      </div>`
    : '';

  // Theme toggle
  const themeToggle = `<button class="theme-toggle" onclick="toggleTheme()" title="Toggle theme">${theme === 'light' ? '🌙' : '☀️'}</button>`;

  // Auth area
  let authHtml = '';
  if (loggedIn && user) {
    authHtml = `<div class="nav-avatar-wrap" id="navAvatarWrap"></div>`;
  } else {
    authHtml = `<a href="/auth.html" class="btn btn-sm" data-en="Sign In" data-he="התחבר" data-es="Iniciar Sesión">${t({ en: 'Sign In', he: 'התחבר', es: 'Iniciar Sesión' })}</a>`;
  }

  oldNav.innerHTML = `
    <a href="${loggedIn ? '/home.html' : '/'}" class="nav-logo">BQ <span>Tools</span></a>
    <div class="nav-right">
      ${linksHtml}
      ${creditPill}
      ${themeToggle}
      ${authHtml}
    </div>`;

  // Inject dropdown into the wrap
  if (loggedIn && user) {
    const wrap = document.getElementById('navAvatarWrap');
    if (wrap) _buildDropdownInto(wrap, user);
  }
}

function _buildDropdownInto(wrap, user) {
  // Clean old
  const oldDd = document.getElementById('navDropdown');
  if (oldDd) oldDd.remove();
  const oldBd = document.getElementById('navDdBackdrop');
  if (oldBd) oldBd.remove();

  // Avatar in nav
  const avatar = document.createElement('div');
  avatar.className = 'nav-avatar';
  avatar.id = 'navAvatar';
  avatar.innerHTML = _avatarHTML(user);
  avatar.addEventListener('click', (e) => { e.stopPropagation(); _toggleDD(); });
  wrap.appendChild(avatar);

  // Backdrop in body
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-dd-backdrop';
  backdrop.id = 'navDdBackdrop';
  backdrop.addEventListener('click', _closeDropdown);
  document.body.appendChild(backdrop);

  // Dropdown in body (not inside nav!)
  const dd = document.createElement('div');
  dd.className = 'nav-dropdown';
  dd.id = 'navDropdown';
  dd.innerHTML = _ddHTML(user);
  document.body.appendChild(dd);

  // Close on <a> click
  dd.querySelectorAll('a.nav-dd-item').forEach(a => {
    a.addEventListener('click', _closeDropdown);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    const d = document.getElementById('navDropdown');
    const a = document.getElementById('navAvatar');
    if (!d || !d.classList.contains('open')) return;
    if (d.contains(e.target) || (a && a.contains(e.target))) return;
    _closeDropdown();
  });
}

// ── Cookie Consent Banner ──

function showCookieConsent() {
  if (localStorage.getItem('bq_cookie_consent') === '1') return;

  const banner = document.createElement('div');
  banner.id = 'cookieConsent';
  banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9000;background:var(--sf);border-top:1px solid var(--bd);padding:14px 20px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;box-shadow:0 -4px 20px rgba(0,0,0,.3);';
  banner.innerHTML = `
    <p style="font-size:13px;color:var(--txd);line-height:1.5;margin:0;max-width:500px;">
      ${t({ en: 'We use localStorage to save your preferences. No tracking cookies.', he: 'אנחנו משתמשים ב-localStorage כדי לשמור את ההעדפות שלך. אין עוגיות מעקב.', es: 'Usamos localStorage para guardar tus preferencias. Sin cookies de rastreo.' })}
      <a href="/privacy.html" style="color:var(--ac);margin-inline-start:4px;">${t({ en: 'Privacy Policy', he: 'מדיניות פרטיות', es: 'Política de Privacidad' })}</a>
    </p>
    <button onclick="localStorage.setItem('bq_cookie_consent','1');this.parentElement.remove();" style="padding:8px 20px;border:none;border-radius:8px;background:var(--ac);color:var(--bg);font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;min-height:40px;white-space:nowrap;">${t({ en: 'Got it', he: 'מאשר', es: 'Entendido' })}</button>`;
  document.body.appendChild(banner);
}

// ── Init on load ──
document.addEventListener('DOMContentLoaded', () => {
  // Routing check — may redirect and stop execution
  if (_routingCheck()) return;

  setLang(lang);

  const p = window.location.pathname;
  const skip = _SKIP_PAGES.includes(p);
  const isLanding = _LANDING_PAGES.includes(p);

  if (!skip) {
    if (isLanding) {
      // Landing page: inject avatar into existing nav (marketing nav)
      injectProfileAvatar();
    } else {
      // App pages: replace entire nav with app nav
      buildAppNav();
    }
  }

  // Cross-promo banner
  showPromoBanner();

  // Cookie consent
  showCookieConsent();

  // Refresh user data from server
  if (typeof isLoggedIn === 'function' && isLoggedIn()) {
    fetchUser().then(() => {
      if (typeof updateCreditDisplay === 'function') updateCreditDisplay();
      if (!skip) {
        if (isLanding) injectProfileAvatar();
        else buildAppNav();
      }
      // Run tutorial after nav is built
      if (!skip && !isLanding) {
        runTutorial();
        showPageTip();
      }
    }).catch(() => {});
  }
});
