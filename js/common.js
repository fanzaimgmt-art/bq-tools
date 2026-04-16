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
function getAvatarHTML(user) {
  if (user.picture) return `<img src="${user.picture}" alt="">`;
  if (user.logo) return `<img src="${user.logo}" alt="">`;
  const initial = (user.businessName || user.email || '?')[0].toUpperCase();
  return initial;
}

function injectProfileAvatar() {
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;
  const loggedIn = typeof isLoggedIn === 'function' && isLoggedIn();

  // Remove any existing auth buttons (.btn.btn-sm that link to auth/dashboard)
  const oldBtns = navRight.querySelectorAll('.btn.btn-sm');
  oldBtns.forEach(b => {
    const href = b.getAttribute('href') || '';
    if (href.includes('auth') || href.includes('dashboard')) b.remove();
  });

  // Remove old avatar wrap if re-injecting
  const oldWrap = navRight.querySelector('.nav-avatar-wrap');
  if (oldWrap) oldWrap.remove();

  const langToggle = navRight.querySelector('.lang-toggle');

  if (!loggedIn) {
    const signIn = document.createElement('a');
    signIn.href = '/auth.html';
    signIn.className = 'btn btn-sm';
    signIn.setAttribute('data-en', 'Sign In');
    signIn.setAttribute('data-he', 'התחבר');
    signIn.textContent = lang === 'he' ? 'התחבר' : 'Sign In';
    signIn.id = 'navSignInBtn';
    if (langToggle) navRight.insertBefore(signIn, langToggle);
    else navRight.appendChild(signIn);
    return;
  }

  const user = typeof getCachedUser === 'function' ? getCachedUser() : null;
  if (!user) return;

  const wrap = document.createElement('div');
  wrap.className = 'nav-avatar-wrap';

  const avatar = document.createElement('div');
  avatar.className = 'nav-avatar';
  avatar.id = 'navAvatar';
  avatar.innerHTML = getAvatarHTML(user);
  avatar.onclick = function(e) {
    e.stopPropagation();
    const dd = document.getElementById('navDropdown');
    dd.classList.toggle('open');
  };

  const credits = user.credits || 0;
  const name = user.businessName || user.email.split('@')[0];

  const dd = document.createElement('div');
  dd.className = 'nav-dropdown';
  dd.id = 'navDropdown';
  dd.innerHTML = `
    <div class="nav-dd-header">
      <div class="nav-dd-name">${escText(name)}</div>
      <div class="nav-dd-email">${escText(user.email)}</div>
      <div class="nav-dd-credits">⚡ <span id="ddCredits">${credits}</span> ${lang === 'he' ? 'קרדיטים' : 'credits'}</div>
    </div>
    <a href="/profile.html" class="nav-dd-item"><span class="dd-icon">🏢</span>${lang === 'he' ? 'הפרופיל שלי' : 'My Profile'}</a>
    <a href="/dashboard.html" class="nav-dd-item"><span class="dd-icon">📊</span>${lang === 'he' ? 'דשבורד' : 'Dashboard'}</a>
    <a href="/gallery.html" class="nav-dd-item"><span class="dd-icon">📁</span>${lang === 'he' ? 'הפרויקטים שלי' : 'My Projects'}</a>
    <a href="/directory-profile.html?email=${encodeURIComponent(user.email)}" class="nav-dd-item"><span class="dd-icon">📋</span>${lang === 'he' ? 'הרישום שלי ב-Directory' : 'My Directory Listing'}</a>
    <div class="nav-dd-divider"></div>
    <a href="/profile.html#settings" class="nav-dd-item"><span class="dd-icon">⚙️</span>${lang === 'he' ? 'הגדרות' : 'Settings'}</a>
    <div class="nav-dd-divider"></div>
    <button class="nav-dd-item danger" onclick="doLogout()"><span class="dd-icon">🚪</span>${lang === 'he' ? 'התנתק' : 'Log Out'}</button>
  `;

  wrap.appendChild(avatar);
  wrap.appendChild(dd);

  if (langToggle) navRight.insertBefore(wrap, langToggle);
  else navRight.appendChild(wrap);

  // Close dropdown on outside click
  document.addEventListener('click', function(e) {
    const d = document.getElementById('navDropdown');
    if (d && !d.contains(e.target) && e.target.id !== 'navAvatar') {
      d.classList.remove('open');
    }
  });
}

function doLogout() {
  localStorage.removeItem('bq_token');
  localStorage.removeItem('bq_user');
  window.location.href = '/';
}

function escText(s) {
  const d = document.createElement('span');
  d.textContent = s || '';
  return d.innerHTML;
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
