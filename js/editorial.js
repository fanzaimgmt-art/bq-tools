/* BQ Editorial — auto-mounts cursor + spotlight + tilt + magnetic + nav-scroll
   Drop in: <script src="/js/editorial.js" defer></script>
   Auto-activates on any page with <html class="editorial">
*/
(function () {
  if (window.__bqEditorialMounted) return;
  window.__bqEditorialMounted = true;
  if (!document.documentElement.classList.contains('editorial')) return;

  const isMobile = matchMedia('(max-width: 900px), (pointer: coarse)').matches;

  // ── Inject cursor + spotlight + grain ──
  const dot = document.createElement('div'); dot.className = 'ed-cursor-dot'; document.body.appendChild(dot);
  const ring = document.createElement('div'); ring.className = 'ed-cursor-ring'; document.body.appendChild(ring);
  const spotlight = document.createElement('div'); spotlight.className = 'ed-spotlight'; document.body.appendChild(spotlight);
  const grain = document.createElement('div'); grain.className = 'ed-grain'; document.body.appendChild(grain);

  if (!isMobile) {
    let mx = innerWidth/2, my = innerHeight/2, rx = mx, ry = my;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
      spotlight.style.setProperty('--mx', mx + 'px');
      spotlight.style.setProperty('--my', my + 'px');
    }, { passive: true });
    function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(loop);
    }
    loop();

    const observer = new MutationObserver(updateHoverTargets);
    observer.observe(document.body, { childList: true, subtree: true });
    updateHoverTargets();
  }

  function updateHoverTargets() {
    document.querySelectorAll('a, button, .ed-cell, .faq-q, [data-ed-hover]').forEach(el => {
      if (el.dataset.edHoverBound) return;
      el.dataset.edHoverBound = '1';
      el.addEventListener('mouseenter', () => ring.classList.add('hover'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hover'));
    });
  }

  // ── Bento spotlight tracking ──
  document.querySelectorAll('.ed-cell').forEach(cell => {
    cell.addEventListener('mousemove', e => {
      const r = cell.getBoundingClientRect();
      cell.style.setProperty('--cx', (e.clientX - r.left) + 'px');
      cell.style.setProperty('--cy', (e.clientY - r.top) + 'px');
    });
  });

  // ── Magnetic buttons ──
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width/2;
      const y = e.clientY - r.top - r.height/2;
      el.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  // ── Nav scroll ──
  function syncNav() {
    document.querySelectorAll('.ed-topnav').forEach(nav => {
      nav.classList.toggle('scrolled', scrollY > 8);
    });
  }
  addEventListener('scroll', syncNav, { passive: true });
  syncNav();
})();
