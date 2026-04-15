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
    if (t) el.textContent = t;
  });
}

// ── Nav Builder ──
function buildNav(activePage) {
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.innerHTML = `
    <a href="/" class="nav-logo">BQ <span>Tools</span></a>
    <div class="nav-right">
      <a href="/#tools" class="nav-link" data-en="Tools" data-he="כלים">Tools</a>
      <a href="/#pricing" class="nav-link" data-en="Pricing" data-he="מחירים">Pricing</a>
      <a href="/gallery.html" class="nav-link" data-en="Gallery" data-he="גלריה">Gallery</a>
      <a href="/auth.html" class="btn btn-sm" data-en="Pro" data-he="Pro" id="navProBtn">Pro</a>
      <div class="lang-toggle">
        <button class="lang-btn" data-lang="en" onclick="setLang('en')">EN</button>
        <button class="lang-btn" data-lang="he" onclick="setLang('he')">עב</button>
      </div>
    </div>`;
  document.body.prepend(nav);
  updateNavPro();
}

function updateNavPro() {
  const btn = document.getElementById('navProBtn');
  if (!btn) return;
  if (isPro()) {
    btn.textContent = 'PRO ✓';
    btn.classList.add('btn-pro-active');
  }
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

// ── Init on load ──
document.addEventListener('DOMContentLoaded', () => {
  setLang(lang);
});
