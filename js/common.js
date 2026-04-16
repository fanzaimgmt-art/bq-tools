// ── BQ Tools — Shared Common JS ──

let lang = localStorage.getItem('bq_lang') || 'en';

// ── Language Toggle ──
function setLang(l) {
  lang = l;
  localStorage.setItem('bq_lang', l);
  document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr';
  document.documentElement.lang = l;
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('on', btn.dataset.lang === l);
  });
  document.querySelectorAll('[data-he]').forEach(el => {
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
  const h = lang === 'he';

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
        <span class="nav-dd-credits-label">⚡ ${h ? 'קרדיטים' : 'Credits'}</span>
        <span class="nav-dd-credits-val">${credits}</span>
      </div>
      <div class="nav-dd-credits-bar"><div class="nav-dd-credits-fill${pct < 20 ? ' low' : ''}" style="width:${pct}%"></div></div>
    </div>
    <a href="/profile.html" class="nav-dd-item"><span class="dd-icon">🏢</span>${h ? 'פרופיל עסקי' : 'Business Profile'}</a>
    <a href="/dashboard.html" class="nav-dd-item"><span class="dd-icon">📊</span>${h ? 'דשבורד' : 'Dashboard'}</a>
    <a href="/gallery.html" class="nav-dd-item"><span class="dd-icon">📁</span>${h ? 'הפרויקטים שלי' : 'My Projects'}</a>
    <a href="/directory-profile.html?email=${encodeURIComponent(user.email)}" class="nav-dd-item"><span class="dd-icon">📋</span>${h ? 'רישום Directory' : 'Directory Listing'}</a>
    <div class="nav-dd-divider"></div>
    <div class="nav-dd-lang">
      <button class="nav-dd-lang-btn${lang === 'en' ? ' on' : ''}" onclick="setLang('en');_rebuildDropdown()">🇺🇸 EN</button>
      <button class="nav-dd-lang-btn${lang === 'he' ? ' on' : ''}" onclick="setLang('he');_rebuildDropdown()">🇮🇱 עב</button>
    </div>
    <a href="/memories.html" class="nav-dd-item"><span class="dd-icon">🧠</span>${h ? 'זיכרונות' : 'Memories'}</a>
    <button class="nav-dd-item" onclick="showReferralLink()"><span class="dd-icon">🎁</span>${h ? 'הזמן חבר' : 'Refer a Friend'}</button>
    <button class="nav-dd-item" onclick="showRedeemCode()"><span class="dd-icon">🎟️</span>${h ? 'הזן קוד' : 'Redeem Code'}</button>
    <a href="/affiliate.html" class="nav-dd-item"><span class="dd-icon">💰</span>${h ? 'תוכנית שותפים' : 'Affiliate Program'}</a>
    <div class="nav-dd-divider"></div>
    <a href="https://www.paypal.com/ncp/payment/2LA7B7PZTHN54" target="_blank" rel="noopener" class="nav-dd-item accent"><span class="dd-icon">🛒</span>${h ? 'קנה קרדיטים' : 'Buy Credits'}</a>
    ${!user.isPro ? `<a href="/auth.html" class="nav-dd-item green"><span class="dd-icon">⭐</span>${h ? 'שדרג ל-Pro' : 'Upgrade to Pro'}</a>` : ''}
    <div class="nav-dd-divider"></div>
    <button class="nav-dd-item danger" onclick="doLogout()"><span class="dd-icon">🚪</span>${h ? 'התנתק' : 'Sign Out'}</button>`;
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
    signIn.textContent = lang === 'he' ? 'התחבר' : 'Sign In';
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

  const isHe = lang === 'he';
  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:110;background:linear-gradient(90deg,rgba(232,197,71,.12),rgba(81,207,102,.12));border-bottom:1px solid rgba(232,197,71,.2);padding:10px 20px;text-align:center;font-size:14px;font-weight:600;color:var(--ac);display:flex;align-items:center;justify-content:center;gap:8px;';
  banner.innerHTML = `
    <span>${isHe ? '🎉 ברוכים הבאים מ-BQ Production! 10% הנחה על החודש הראשון' : '🎉 Welcome from BQ Production! 10% OFF your first month'}</span>
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
    </div>`;
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
const _APP_PAGES = ['/home.html', '/profile.html', '/dashboard.html', '/gallery.html', '/directory.html', '/directory-profile.html', '/chat.html', '/affiliate.html', '/memories.html'];

function _isAppPage() {
  const p = window.location.pathname;
  return p.startsWith('/tools/') || _APP_PAGES.includes(p);
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
  const isHe = lang === 'he';
  const credits = user ? (user.credits || 0) : 0;
  const p = window.location.pathname;

  // Build nav links
  const links = [
    { href: '/home.html', en: 'Tools', he: 'כלים', match: ['/home.html'] },
    { href: '/directory.html', en: 'Directory', he: 'ספר עסקים', match: ['/directory.html', '/directory-profile.html'] },
    { href: '/dashboard.html', en: 'Dashboard', he: 'דשבורד', match: ['/dashboard.html'] },
    { href: '/gallery.html', en: 'Projects', he: 'פרויקטים', match: ['/gallery.html'] },
  ];

  const linksHtml = links.map(l => {
    const active = l.match.some(m => p === m) || (p.startsWith('/tools/') && l.href === '/home.html');
    return `<a href="${l.href}" class="nav-link${active ? ' nav-active' : ''}" data-en="${l.en}" data-he="${l.he}">${isHe ? l.he : l.en}</a>`;
  }).join('');

  // Credit pill (compact, integrated in nav)
  const creditPill = loggedIn
    ? `<div class="nav-credit-pill${credits < 5 ? (credits === 0 ? ' empty' : ' low') : ''}" id="creditBar">
        <span>⚡</span><span class="credit-count">${credits}</span>
      </div>`
    : '';

  // Auth area
  let authHtml = '';
  if (loggedIn && user) {
    authHtml = `<div class="nav-avatar-wrap" id="navAvatarWrap"></div>`;
  } else {
    authHtml = `<a href="/auth.html" class="btn btn-sm" data-en="Sign In" data-he="התחבר">${isHe ? 'התחבר' : 'Sign In'}</a>`;
  }

  oldNav.innerHTML = `
    <a href="${loggedIn ? '/home.html' : '/'}" class="nav-logo">BQ <span>Tools</span></a>
    <div class="nav-right">
      ${linksHtml}
      ${creditPill}
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

  // Refresh user data from server
  if (typeof isLoggedIn === 'function' && isLoggedIn()) {
    fetchUser().then(() => {
      if (typeof updateCreditDisplay === 'function') updateCreditDisplay();
      if (!skip) {
        if (isLanding) injectProfileAvatar();
        else buildAppNav();
      }
    }).catch(() => {});
  }
});
