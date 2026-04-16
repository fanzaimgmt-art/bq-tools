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

// ── Nav Builder ──
function buildNav(activePage) {
  const nav = document.createElement('nav');
  nav.className = 'nav';

  const user = typeof getCachedUser === 'function' ? getCachedUser() : null;
  const loggedIn = typeof isLoggedIn === 'function' ? isLoggedIn() : false;
  const credits = user ? user.credits : 0;
  const pro = user ? user.isPro : false;

  const authBtn = loggedIn
    ? `<a href="/dashboard.html" class="btn btn-sm ${pro ? 'btn-pro-active' : ''}">${pro ? 'PRO' : 'Account'}</a>`
    : `<a href="/auth.html" class="btn btn-sm" data-en="Login" data-he="התחבר">Login</a>`;

  const creditBar = loggedIn
    ? `<div class="credit-bar ${credits < 5 ? (credits === 0 ? 'credit-empty' : 'credit-low') : ''}" id="creditBar">
        <span>⚡</span>
        <span class="credit-count">${credits}</span>
      </div>`
    : '';

  nav.innerHTML = `
    <a href="/" class="nav-logo">BQ <span>Tools</span></a>
    <div class="nav-right">
      <a href="/#tools" class="nav-link" data-en="Tools" data-he="כלים">Tools</a>
      <a href="/directory.html" class="nav-link" data-en="Directory" data-he="ספר עסקים">Directory</a>
      <a href="/gallery.html" class="nav-link" data-en="Gallery" data-he="גלריה">Gallery</a>
      ${creditBar}
      ${authBtn}
      <div class="lang-toggle">
        <button class="lang-btn" data-lang="en" onclick="setLang('en')">EN</button>
        <button class="lang-btn" data-lang="he" onclick="setLang('he')">עב</button>
      </div>
    </div>`;
  document.body.prepend(nav);
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
  if (document.getElementById('creditBar')) return; // already has one

  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;

  const user = typeof getCachedUser === 'function' ? getCachedUser() : null;
  const credits = user ? user.credits : 0;

  const bar = document.createElement('div');
  bar.className = 'credit-bar' + (credits < 5 ? (credits === 0 ? ' credit-empty' : ' credit-low') : '');
  bar.id = 'creditBar';
  bar.innerHTML = `<span>⚡</span><span class="credit-count">${credits}</span>`;

  // Insert before the first button/link in nav-right
  const firstBtn = navRight.querySelector('.btn');
  if (firstBtn) {
    navRight.insertBefore(bar, firstBtn);
  } else {
    navRight.appendChild(bar);
  }
}

// ── Init on load ──
document.addEventListener('DOMContentLoaded', () => {
  setLang(lang);

  // Inject credit bar on pages that don't have one
  injectCreditBar();

  // Refresh user data from server if logged in
  if (typeof isLoggedIn === 'function' && isLoggedIn()) {
    fetchUser().then(() => {
      if (typeof updateCreditDisplay === 'function') updateCreditDisplay();
    }).catch(() => {});
  }
});
