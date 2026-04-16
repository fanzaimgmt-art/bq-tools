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
  // Check directory tier first (featured > pro > free)
  if (user.directoryTier === 'featured') return '<span class="nav-dd-badge badge-featured">FEATURED</span>';
  if (user.isPro) return '<span class="nav-dd-badge badge-pro">PRO</span>';
  return '<span class="nav-dd-badge badge-free">FREE</span>';
}

function _toggleDropdown(open) {
  const dd = document.getElementById('navDropdown');
  const bd = document.getElementById('navDdBackdrop');
  if (!dd) return;
  if (open === undefined) open = !dd.classList.contains('open');
  dd.classList.toggle('open', open);
  if (bd) bd.classList.toggle('open', open);
  // Prevent body scroll on mobile when open
  document.body.style.overflow = open ? 'hidden' : '';
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
  dd.onclick = (e) => e.stopPropagation();

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

    <a href="https://www.paypal.com/ncp/payment/2LA7B7PZTHN54" target="_blank" rel="noopener" class="nav-dd-item accent" onclick="_toggleDropdown(false)">
      <span class="dd-icon">🛒</span><span class="dd-label">${isHe ? 'קנה קרדיטים' : 'Buy Credits'}</span>
    </a>
    ${!user.isPro ? `
    <a href="/auth.html" class="nav-dd-item green" onclick="_toggleDropdown(false)">
      <span class="dd-icon">⭐</span><span class="dd-label">${isHe ? 'שדרג ל-Pro' : 'Upgrade to Pro'}</span>
    </a>` : ''}

    <div class="nav-dd-divider"></div>

    <button class="nav-dd-item danger" onclick="doLogout()">
      <span class="dd-icon">🚪</span><span class="dd-label">${isHe ? 'התנתק' : 'Sign Out'}</span>
    </button>
  `;

  wrap.appendChild(avatar);
  wrap.appendChild(dd);

  // Insert before lang toggle (which is now hidden) or at end
  if (langToggle) navRight.insertBefore(wrap, langToggle);
  else navRight.appendChild(wrap);

  // Close on outside click (desktop)
  document.addEventListener('click', _closeDropdownOutside);
}

function _closeDropdownOutside(e) {
  const dd = document.getElementById('navDropdown');
  const av = document.getElementById('navAvatar');
  if (dd && dd.classList.contains('open') && !dd.contains(e.target) && e.target !== av && !av.contains(e.target)) {
    _toggleDropdown(false);
  }
}

function doLogout() {
  localStorage.removeItem('bq_token');
  localStorage.removeItem('bq_user');
  window.location.href = '/';
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

// ── Inject credit bar into navs that don't have one ──
function injectCreditBar() {
  if (typeof isLoggedIn !== 'function' || !isLoggedIn()) return;
  if (document.getElementById('creditBar')) return;

  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;

  const user = typeof getCachedUser === 'function' ? getCachedUser() : null;
  const credits = user ? user.credits : 0;

  const bar = document.createElement('div');
  bar.className = 'credit-bar' + (credits < 5 ? (credits === 0 ? ' credit-empty' : ' credit-low') : '');
  bar.id = 'creditBar';
  bar.innerHTML = `<span>⚡</span><span class="credit-count">${credits}</span>`;

  // Insert before avatar or first button
  const avatarWrap = navRight.querySelector('.nav-avatar-wrap');
  if (avatarWrap) {
    navRight.insertBefore(bar, avatarWrap);
  } else {
    const firstBtn = navRight.querySelector('.btn');
    if (firstBtn) navRight.insertBefore(bar, firstBtn);
    else navRight.appendChild(bar);
  }
}

// ── Init on load ──
document.addEventListener('DOMContentLoaded', () => {
  setLang(lang);

  // Skip avatar injection on admin page
  if (window.location.pathname !== '/admin.html') {
    injectProfileAvatar();
    injectCreditBar();
  }

  // Refresh user data from server if logged in
  if (typeof isLoggedIn === 'function' && isLoggedIn()) {
    fetchUser().then(() => {
      if (typeof updateCreditDisplay === 'function') updateCreditDisplay();
      // Re-render avatar with fresh data
      if (window.location.pathname !== '/admin.html') {
        injectProfileAvatar();
        injectCreditBar();
      }
    }).catch(() => {});
  }
});
