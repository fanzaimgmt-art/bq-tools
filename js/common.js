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

// ── Profile Avatar Dropdown ──

function _avatarInner(user) {
  if (user.picture) return `<img src="${user.picture}" alt="">`;
  if (user.logo) return `<img src="${user.logo}" alt="">`;
  return (user.businessName || user.email || '?')[0].toUpperCase();
}

function _escHtml(s) {
  const d = document.createElement('span');
  d.textContent = s || '';
  return d.innerHTML;
}

function _planBadge(user) {
  if (user.isPro === true) return '<span class="nav-dd-badge badge-pro">PRO</span>';
  return '<span class="nav-dd-badge badge-free">FREE</span>';
}

function _toggleDropdown(open) {
  const dd = document.getElementById('navDropdown');
  const bd = document.getElementById('navDdBackdrop');
  if (!dd) return;
  if (open === undefined) open = !dd.classList.contains('open');
  dd.classList.toggle('open', open);
  if (bd) bd.classList.toggle('open', open);
  // Only lock scroll on mobile when dropdown is full-screen
  if (window.innerWidth <= 600) {
    document.body.style.overflow = open ? 'hidden' : '';
  } else {
    document.body.style.overflow = '';
  }
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
  const oldWrap = navRight.querySelector('.nav-avatar-wrap');
  if (oldWrap) oldWrap.remove();
  const oldBackdrop = document.getElementById('navDdBackdrop');
  if (oldBackdrop) oldBackdrop.remove();
  // Also remove old standalone lang-toggle (dropdown has its own)
  const langToggle = navRight.querySelector('.lang-toggle');

  if (!loggedIn) {
    const signIn = document.createElement('a');
    signIn.href = '/auth.html';
    signIn.className = 'btn btn-sm';
    signIn.id = 'navSignInBtn';
    signIn.setAttribute('data-en', 'Sign In');
    signIn.setAttribute('data-he', 'התחבר');
    signIn.textContent = lang === 'he' ? 'התחבר' : 'Sign In';
    if (langToggle) navRight.insertBefore(signIn, langToggle);
    else navRight.appendChild(signIn);
    return;
  }

  const user = typeof getCachedUser === 'function' ? getCachedUser() : null;
  if (!user) return;

  // Hide standalone lang toggle — dropdown has its own
  if (langToggle) langToggle.style.display = 'none';

  const credits = user.credits || 0;
  const maxCredits = user.isPro ? 50 : 5;
  const pct = Math.min(100, Math.round((credits / maxCredits) * 100));
  const name = user.businessName || user.email.split('@')[0];
  const isHe = lang === 'he';

  // Backdrop for mobile
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-dd-backdrop';
  backdrop.id = 'navDdBackdrop';
  backdrop.onclick = () => _toggleDropdown(false);
  document.body.appendChild(backdrop);

  const wrap = document.createElement('div');
  wrap.className = 'nav-avatar-wrap';

  const avatar = document.createElement('div');
  avatar.className = 'nav-avatar';
  avatar.id = 'navAvatar';
  avatar.innerHTML = _avatarInner(user);
  avatar.onclick = (e) => { e.stopPropagation(); _toggleDropdown(); };

  const dd = document.createElement('div');
  dd.className = 'nav-dropdown';
  dd.id = 'navDropdown';
  // Allow clicks on links/buttons inside to work normally
  dd.addEventListener('click', (e) => {
    // Only stop propagation if clicking the dropdown background itself
    if (e.target === dd) e.stopPropagation();
  });

  dd.innerHTML = `
    <div class="nav-dd-header">
      <div class="nav-dd-top">
        <div class="nav-dd-avatar">${_avatarInner(user)}</div>
        <div>
          <div class="nav-dd-name">${_escHtml(name)}</div>
          <div class="nav-dd-email">${_escHtml(user.email)}</div>
          ${_planBadge(user)}
        </div>
      </div>
    </div>

    <div class="nav-dd-credits-row">
      <div class="nav-dd-credits-top">
        <span class="nav-dd-credits-label">⚡ ${isHe ? 'קרדיטים' : 'Credits'}</span>
        <span class="nav-dd-credits-val">${credits}</span>
      </div>
      <div class="nav-dd-credits-bar">
        <div class="nav-dd-credits-fill${pct < 20 ? ' low' : ''}" style="width:${pct}%"></div>
      </div>
    </div>

    <a href="/profile.html" class="nav-dd-item" onclick="_toggleDropdown(false)">
      <span class="dd-icon">🏢</span><span class="dd-label">${isHe ? 'פרופיל עסקי' : 'Business Profile'}</span>
    </a>
    <a href="/dashboard.html" class="nav-dd-item" onclick="_toggleDropdown(false)">
      <span class="dd-icon">📊</span><span class="dd-label">${isHe ? 'דשבורד' : 'Dashboard'}</span>
    </a>
    <a href="/gallery.html" class="nav-dd-item" onclick="_toggleDropdown(false)">
      <span class="dd-icon">📁</span><span class="dd-label">${isHe ? 'הפרויקטים שלי' : 'My Projects'}</span>
    </a>
    <a href="/directory-profile.html?email=${encodeURIComponent(user.email)}" class="nav-dd-item" onclick="_toggleDropdown(false)">
      <span class="dd-icon">📋</span><span class="dd-label">${isHe ? 'רישום Directory' : 'Directory Listing'}</span>
    </a>

    <div class="nav-dd-divider"></div>

    <div class="nav-dd-lang">
      <button class="nav-dd-lang-btn${lang === 'en' ? ' on' : ''}" onclick="setLang('en');injectProfileAvatar()">🇺🇸 EN</button>
      <button class="nav-dd-lang-btn${lang === 'he' ? ' on' : ''}" onclick="setLang('he');injectProfileAvatar()">🇮🇱 עב</button>
    </div>

    <button class="nav-dd-item" onclick="showReferralLink()">
      <span class="dd-icon">🎁</span><span class="dd-label">${isHe ? 'הזמן חבר' : 'Refer a Friend'}</span>
    </button>
    <a href="https://www.paypal.com/ncp/payment/2LA7B7PZTHN54" target="_blank" rel="noopener" class="nav-dd-item accent" onclick="_toggleDropdown(false)">
      <span class="dd-icon">🛒</span><span class="dd-label">${isHe ? 'קנה קרדיטים' : 'Buy Credits'}</span>
    </a>
    ${!user.isPro ? `<a href="/auth.html" class="nav-dd-item green" onclick="_toggleDropdown(false)">
      <span class="dd-icon">⭐</span><span class="dd-label">${isHe ? 'שדרג ל-Pro' : 'Upgrade to Pro'}</span>
    </a>` : ''}

    <div class="nav-dd-divider"></div>

    <button class="nav-dd-item danger" onclick="doLogout()">
      <span class="dd-icon">🚪</span><span class="dd-label">${isHe ? 'התנתק' : 'Sign Out'}</span>
    </button>
  `;

  wrap.appendChild(avatar);
  wrap.appendChild(dd);

  // Make all nav-dd-item links close dropdown on click
  dd.querySelectorAll('.nav-dd-item').forEach(item => {
    item.addEventListener('click', () => _toggleDropdown(false));
  });

  // Insert before lang toggle (which is now hidden) or at end
  if (langToggle) navRight.insertBefore(wrap, langToggle);
  else navRight.appendChild(wrap);

  // Close on outside click (desktop)
  document.addEventListener('click', _closeDropdownOutside);
}

function _closeDropdownOutside(e) {
  const dd = document.getElementById('navDropdown');
  const av = document.getElementById('navAvatar');
  if (!dd || !dd.classList.contains('open')) return;
  // Don't close if clicking inside dropdown or avatar
  if (dd.contains(e.target) || (av && av.contains(e.target))) return;
  _toggleDropdown(false);
}

function doLogout() {
  localStorage.removeItem('bq_token');
  localStorage.removeItem('bq_user');
  window.location.href = '/';
}

// ── Referral Link Modal ──
function showReferralLink() {
  _toggleDropdown(false);
  const user = typeof getCachedUser === 'function' ? getCachedUser() : null;
  if (!user) return;
  const isHe = lang === 'he';
  const link = `${window.location.origin}/?ref=${encodeURIComponent(user.email)}`;

  const m = document.createElement('div');
  m.className = 'modal-overlay';
  m.innerHTML = `
    <div class="modal-card" style="max-width:420px;text-align:center;">
      <div style="font-size:40px;margin-bottom:12px;">🎁</div>
      <h3 style="margin-bottom:6px;">${isHe ? 'הזמן חבר' : 'Refer a Friend'}</h3>
      <p style="font-size:14px;color:var(--txd);line-height:1.6;margin-bottom:16px;">${isHe
        ? 'שתף את הלינק שלך. חברים שנרשמים מקבלים 10 קרדיטים חינם, ואתה מקבל 10% הנחה על הרכישה הבאה!'
        : 'Share your link. Friends who sign up get 10 free credits, and you get 10% off your next purchase!'}</p>
      <div style="display:flex;gap:6px;margin-bottom:16px;">
        <input type="text" value="${link}" readonly id="refLinkInput" style="flex:1;padding:10px;border:1px solid var(--bd);border-radius:8px;background:var(--bg);color:var(--ac);font-family:monospace;font-size:12px;overflow:hidden;text-overflow:ellipsis;">
        <button class="btn btn-primary" style="min-width:70px;" onclick="navigator.clipboard.writeText(document.getElementById('refLinkInput').value);showToast('${isHe ? 'הועתק!' : 'Copied!'}','ok')">${isHe ? 'העתק' : 'Copy'}</button>
      </div>
      <div id="refStats" style="font-size:13px;color:var(--txd);margin-bottom:16px;"></div>
      <button onclick="this.closest('.modal-overlay').remove()" class="btn" style="width:100%;">${isHe ? 'סגור' : 'Close'}</button>
    </div>`;
  document.body.appendChild(m);
  requestAnimationFrame(() => m.classList.add('open'));
  m.onclick = (e) => { if (e.target === m) m.remove(); };

  // Load referral stats
  if (typeof apiCall === 'function') {
    apiCall('/api/referral/stats').then(data => {
      if (data.ok) {
        const el = document.getElementById('refStats');
        if (el) el.textContent = isHe
          ? `הפנית ${data.referrals} חברים${data.hasDiscount ? ' — יש לך 10% הנחה!' : ''}`
          : `You referred ${data.referrals} friend${data.referrals !== 1 ? 's' : ''}${data.hasDiscount ? ' — you earned 10% off!' : ''}`;
      }
    }).catch(() => {});
  }
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
const _APP_PAGES = ['/home.html', '/profile.html', '/dashboard.html', '/gallery.html', '/directory.html', '/directory-profile.html', '/chat.html'];

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
  const credits = user.credits || 0;
  const maxCredits = user.isPro ? 50 : 5;
  const pct = Math.min(100, Math.round((credits / maxCredits) * 100));
  const name = user.businessName || user.email.split('@')[0];
  const isHe = lang === 'he';

  // Backdrop
  const oldBd = document.getElementById('navDdBackdrop');
  if (oldBd) oldBd.remove();
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-dd-backdrop';
  backdrop.id = 'navDdBackdrop';
  backdrop.onclick = () => _toggleDropdown(false);
  document.body.appendChild(backdrop);

  const avatar = document.createElement('div');
  avatar.className = 'nav-avatar';
  avatar.id = 'navAvatar';
  avatar.innerHTML = _avatarInner(user);
  avatar.onclick = (e) => { e.stopPropagation(); _toggleDropdown(); };

  const dd = document.createElement('div');
  dd.className = 'nav-dropdown';
  dd.id = 'navDropdown';
  // Allow clicks on links/buttons inside to work normally
  dd.addEventListener('click', (e) => {
    // Only stop propagation if clicking the dropdown background itself
    if (e.target === dd) e.stopPropagation();
  });

  dd.innerHTML = `
    <div class="nav-dd-header">
      <div class="nav-dd-top">
        <div class="nav-dd-avatar">${_avatarInner(user)}</div>
        <div>
          <div class="nav-dd-name">${_escHtml(name)}</div>
          <div class="nav-dd-email">${_escHtml(user.email)}</div>
          ${_planBadge(user)}
        </div>
      </div>
    </div>
    <div class="nav-dd-credits-row">
      <div class="nav-dd-credits-top">
        <span class="nav-dd-credits-label">⚡ ${isHe ? 'קרדיטים' : 'Credits'}</span>
        <span class="nav-dd-credits-val">${credits}</span>
      </div>
      <div class="nav-dd-credits-bar">
        <div class="nav-dd-credits-fill${pct < 20 ? ' low' : ''}" style="width:${pct}%"></div>
      </div>
    </div>
    <a href="/profile.html" class="nav-dd-item" onclick="_toggleDropdown(false)">
      <span class="dd-icon">🏢</span><span class="dd-label">${isHe ? 'פרופיל עסקי' : 'Business Profile'}</span>
    </a>
    <a href="/dashboard.html" class="nav-dd-item" onclick="_toggleDropdown(false)">
      <span class="dd-icon">📊</span><span class="dd-label">${isHe ? 'דשבורד' : 'Dashboard'}</span>
    </a>
    <a href="/gallery.html" class="nav-dd-item" onclick="_toggleDropdown(false)">
      <span class="dd-icon">📁</span><span class="dd-label">${isHe ? 'הפרויקטים שלי' : 'My Projects'}</span>
    </a>
    <a href="/directory-profile.html?email=${encodeURIComponent(user.email)}" class="nav-dd-item" onclick="_toggleDropdown(false)">
      <span class="dd-icon">📋</span><span class="dd-label">${isHe ? 'רישום Directory' : 'Directory Listing'}</span>
    </a>
    <div class="nav-dd-divider"></div>
    <div class="nav-dd-lang">
      <button class="nav-dd-lang-btn${lang === 'en' ? ' on' : ''}" onclick="setLang('en');buildAppNav()">🇺🇸 EN</button>
      <button class="nav-dd-lang-btn${lang === 'he' ? ' on' : ''}" onclick="setLang('he');buildAppNav()">🇮🇱 עב</button>
    </div>
    <a href="https://www.paypal.com/ncp/payment/2LA7B7PZTHN54" target="_blank" rel="noopener" class="nav-dd-item accent" onclick="_toggleDropdown(false)">
      <span class="dd-icon">🛒</span><span class="dd-label">${isHe ? 'קנה קרדיטים' : 'Buy Credits'}</span>
    </a>
    ${!user.isPro ? `<a href="/auth.html" class="nav-dd-item green" onclick="_toggleDropdown(false)">
      <span class="dd-icon">⭐</span><span class="dd-label">${isHe ? 'שדרג ל-Pro' : 'Upgrade to Pro'}</span>
    </a>` : ''}
    <div class="nav-dd-divider"></div>
    <button class="nav-dd-item danger" onclick="doLogout()">
      <span class="dd-icon">🚪</span><span class="dd-label">${isHe ? 'התנתק' : 'Sign Out'}</span>
    </button>`;

  wrap.appendChild(avatar);
  wrap.appendChild(dd);

  // Make all nav-dd-item links close dropdown on click
  dd.querySelectorAll('.nav-dd-item').forEach(item => {
    item.addEventListener('click', () => _toggleDropdown(false));
  });

  document.removeEventListener('click', _closeDropdownOutside);
  document.addEventListener('click', _closeDropdownOutside);
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
