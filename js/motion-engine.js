/* BQ Motion Engine — drop-in premium animation layer.
   Loads GSAP + ScrollTrigger + Lenis (smooth scroll) from CDNs, wires:
     - Lenis smooth scroll on the body
     - GSAP scroll-triggered reveals on [data-reveal] elements
     - Hero text split + character stagger on [data-split]
     - Magnetic hover on [data-magnetic] buttons
     - Parallax on [data-parallax] elements
   Respects prefers-reduced-motion.

   Usage: <script src="/js/motion-engine.js" defer></script>
   Then add data-* attributes to elements you want enhanced.
*/

(function () {
  if (window.__bqMotionMounted) return;
  window.__bqMotionMounted = true;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Self-hosted (was jsdelivr/cdnjs) — removes 3rd-party CDN runtime deps + the blocked-sourcemap console
  // error, and lets connect-src stay tight. Sourcemap comments stripped from the vendored copies.
  const CDN = {
    gsap:         '/js/vendor/gsap.min.js',
    scrollTrig:   '/js/vendor/ScrollTrigger.min.js',
    lenis:        '/js/vendor/lenis.min.js',
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Sequential load (GSAP first, then ScrollTrigger which depends on it, then Lenis in parallel-ish)
  loadScript(CDN.gsap)
    .then(() => Promise.all([loadScript(CDN.scrollTrig), loadScript(CDN.lenis)]))
    .then(init)
    .catch(e => console.warn('[motion] CDN load failed', e));

  function init() {
    const { gsap } = window;
    if (!gsap) return;
    gsap.registerPlugin(ScrollTrigger);

    // ── Lenis smooth scroll ──
    if (window.Lenis) {
      const lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
      });
      function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
      requestAnimationFrame(raf);
      // Sync with ScrollTrigger
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      window.lenis = lenis;
    }

    // ── Reveal on scroll ──
    document.querySelectorAll('[data-reveal]').forEach(el => {
      const dir = el.dataset.reveal || 'up';
      const delay = parseFloat(el.dataset.revealDelay || 0);
      const from = {
        up:    { y: 40, opacity: 0 },
        down:  { y: -40, opacity: 0 },
        left:  { x: 40, opacity: 0 },
        right: { x: -40, opacity: 0 },
        scale: { scale: 0.92, opacity: 0 },
        fade:  { opacity: 0 },
      }[dir] || { y: 40, opacity: 0 };
      gsap.fromTo(el, from, {
        y: 0, x: 0, scale: 1, opacity: 1,
        duration: 0.95,
        delay,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      });
    });

    // ── Stagger groups ──
    document.querySelectorAll('[data-stagger]').forEach(group => {
      const children = Array.from(group.children);
      gsap.fromTo(children, { y: 32, opacity: 0 }, {
        y: 0, opacity: 1,
        duration: 0.8,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: group, start: 'top 85%', once: true },
      });
    });

    // ── Text split + character reveal ──
    document.querySelectorAll('[data-split]').forEach(el => {
      const text = el.textContent;
      const words = text.split(/(\s+)/);
      el.textContent = '';
      words.forEach(w => {
        if (/^\s+$/.test(w)) {
          el.appendChild(document.createTextNode(w));
        } else {
          const wrap = document.createElement('span');
          wrap.style.cssText = 'display:inline-block; overflow:hidden; vertical-align:bottom;';
          const inner = document.createElement('span');
          inner.style.cssText = 'display:inline-block; will-change:transform;';
          inner.textContent = w;
          wrap.appendChild(inner);
          el.appendChild(wrap);
        }
      });
      const inners = el.querySelectorAll('span > span');
      gsap.fromTo(inners, { yPercent: 110 }, {
        yPercent: 0,
        duration: 1.0,
        stagger: 0.04,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    // ── Magnetic hover ──
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      const strength = parseFloat(el.dataset.magnetic || 0.4);
      el.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(el, { x: x * strength, y: y * strength, duration: 0.5, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)' });
      });
    });

    // ── Parallax on scroll ──
    document.querySelectorAll('[data-parallax]').forEach(el => {
      const speed = parseFloat(el.dataset.parallax || 0.3);
      gsap.to(el, {
        y: () => -ScrollTrigger.maxScroll(window) * speed * 0.1,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    });

    // ── Auto-reveal common section types if no explicit data-reveal exists ──
    document.querySelectorAll('section, .section, .card, .home-tool, .tool-card, .glass').forEach(el => {
      if (el.hasAttribute('data-reveal') || el.closest('[data-stagger]')) return;
      gsap.fromTo(el, { y: 30, opacity: 0 }, {
        y: 0, opacity: 1,
        duration: 0.8,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    document.body.classList.add('motion-ready');
    // Refresh ScrollTrigger after fonts/images load
    window.addEventListener('load', () => ScrollTrigger.refresh());
  }
})();
