/* i18n-lite — self-contained translation engine for standalone pages that do NOT load common.js.
   Defines window.setLang + window.t, applies data-{lang} text + data-{lang}-placeholder on load.
   Auto-detects browser language on first visit (good for client-facing pages). Load in <head>, NOT deferred. */
(function () {
  function applyLang(l) {
    if (['en', 'he', 'es'].indexOf(l) < 0) l = 'en';
    try { localStorage.setItem('bq_lang', l); } catch (e) {}
    document.documentElement.dir = l === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = l;
    if (document.body) document.body.setAttribute('lang', l);
    document.querySelectorAll('[data-en],[data-he],[data-es]').forEach(function (el) {
      var v = el.getAttribute('data-' + l);
      if (v == null) return;
      if (v.indexOf('<') >= 0) el.innerHTML = v; else el.textContent = v;
    });
    document.querySelectorAll('[data-en-placeholder],[data-he-placeholder],[data-es-placeholder]').forEach(function (el) {
      var p = el.getAttribute('data-' + l + '-placeholder');
      if (p != null) el.placeholder = p;
    });
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.classList.toggle('on', b.dataset.lang === l);
    });
  }
  window.setLang = window.setLang || applyLang;
  window.t = window.t || function (o) {
    var l = 'en';
    try { l = localStorage.getItem('bq_lang') || 'en'; } catch (e) {}
    return (o && (o[l] || o.en)) || '';
  };
  function initLang() {
    var l;
    try { l = localStorage.getItem('bq_lang'); } catch (e) {}
    if (!l) {
      var n = (navigator.language || 'en').slice(0, 2).toLowerCase();
      l = (['he', 'es'].indexOf(n) >= 0) ? n : 'en';
    }
    applyLang(l);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initLang);
  else initLang();
})();
