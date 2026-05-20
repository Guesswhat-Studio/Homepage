/* =========================================
   Guesswhat Studio — interactive script
   ========================================= */

(() => {
  /* ---------- Lenis smooth scroll ---------- */
  const lenis = new Lenis({
    duration: 1.15,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.4,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  /* anchor links use lenis */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -40, duration: 1.6 });
      }
    });
  });

  /* ---------- Nav state on scroll ---------- */
  const nav = document.querySelector('.nav');
  lenis.on('scroll', ({ scroll }) => {
    if (scroll > 40) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  });

  /* ---------- Custom cursor ---------- */
  const cursor = document.getElementById('cursorGlow');
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let curX = mouseX;
  let curY = mouseY;

  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animateCursor() {
    curX += (mouseX - curX) * 0.18;
    curY += (mouseY - curY) * 0.18;
    if (cursor) {
      cursor.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
    }
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  document.querySelectorAll('a, button, .project--card').forEach((el) => {
    el.addEventListener('mouseenter', () => cursor && cursor.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cursor && cursor.classList.remove('is-hover'));
  });

  /* ---------- Stacking project cards ----------
     Each .project-stage owns one viewport's worth of scroll budget.
     We pick the stage whose center is closest to the viewport center
     and mark its card .is-active; previous cards get .is-leaving. */
  const cards = Array.from(document.querySelectorAll('.project--card'));
  const stages = Array.from(document.querySelectorAll('.project-stage'));

  function updateActiveCard() {
    if (!stages.length) return;
    const vh = window.innerHeight;
    const center = vh * 0.5;
    let bestIdx = 0;
    let bestDist = Infinity;
    stages.forEach((stage, i) => {
      const rect = stage.getBoundingClientRect();
      const stageCenter = rect.top + rect.height * 0.5;
      const dist = Math.abs(stageCenter - center);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    });
    cards.forEach((card, i) => {
      card.classList.toggle('is-active', i === bestIdx);
      card.classList.toggle('is-leaving', i < bestIdx);
    });
  }
  updateActiveCard();
  lenis.on('scroll', updateActiveCard);
  window.addEventListener('resize', updateActiveCard);

  /* ---------- Hero dice: subtle mouse parallax ---------- */
  const heroArt = document.querySelector('.hero__art');
  const heroDice = document.querySelector('.hero__dice');
  if (heroArt && heroDice) {
    heroArt.addEventListener('mousemove', (e) => {
      const rect = heroArt.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width  - 0.5;
      const py = (e.clientY - rect.top)  / rect.height - 0.5;
      // CSS keyframes already read --rx / --ry on .hero__dice,
      // so we just update the variables and let CSS compose the transform.
      heroDice.style.setProperty('--ry', (px * 14).toFixed(2) + 'deg');
      heroDice.style.setProperty('--rx', (-py * 10).toFixed(2) + 'deg');
    });
    heroArt.addEventListener('mouseleave', () => {
      heroDice.style.setProperty('--rx', '0deg');
      heroDice.style.setProperty('--ry', '0deg');
    });
  }

  /* ---------- Reveal on scroll (used for any [data-reveal] elements) ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -80px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- 3D tilt on legacy media elements (.tilt) ---------- */
  const tilts = document.querySelectorAll('.tilt');
  tilts.forEach((card) => {
    const inner = card.querySelector('.project__media-inner');
    let rect = null;

    const onEnter = () => { rect = card.getBoundingClientRect(); };
    const onMove = (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = x / rect.width - 0.5;
      const py = y / rect.height - 0.5;
      const rotY = px * 8;
      const rotX = -py * 6;
      card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
      if (inner) inner.style.transform = `translate(${px * 6}px, ${py * 6}px)`;
    };
    const onLeave = () => {
      rect = null;
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg)`;
      if (inner) inner.style.transform = `translate(0, 0)`;
    };

    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mousemove', onMove);
    card.addEventListener('mouseleave', onLeave);
  });

  /* ---------- Theme toggle ---------- */
  const themeBtn = document.getElementById('themeToggle');
  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    try { localStorage.setItem('gw-theme', theme); } catch (e) {}
  }
  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      applyTheme(currentTheme() === 'light' ? 'dark' : 'light');
    });
  }
  /* If user has not made an explicit choice, follow system changes live */
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    if (mq.addEventListener) {
      mq.addEventListener('change', (e) => {
        let saved = null;
        try { saved = localStorage.getItem('gw-theme'); } catch (err) {}
        if (!saved) applyTheme(e.matches ? 'light' : 'dark');
      });
    }
  }

  /* ---------- Animated background (particle network) ---------- */
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;
  let particles = [];
  const mouse = { x: -9999, y: -9999 };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth = window.innerWidth;
    H = canvas.clientHeight = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initParticles();
  }

  function initParticles() {
    const area = W * H;
    // density tuned for nice performance: ~1 particle / 14000 px
    const count = Math.min(140, Math.max(50, Math.floor(area / 14000)));
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.4 + 0.4,
        hue: Math.random() < 0.18 ? 'accent' : 'base',
      });
    }
  }

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  /* Read theme-driven particle colors live from CSS custom props,
     so dark and light modes share the same animation seamlessly. */
  function getThemeColors() {
    const cs = getComputedStyle(document.documentElement);
    return {
      base: (cs.getPropertyValue('--particle-base').trim() || '180, 180, 220'),
      accent: (cs.getPropertyValue('--particle-accent').trim() || '201, 255, 90'),
      glow: (cs.getPropertyValue('--particle-mouse-glow').trim() || '106, 92, 255'),
    };
  }
  let themeColors = getThemeColors();
  /* re-read when theme attribute changes */
  const themeMo = new MutationObserver(() => { themeColors = getThemeColors(); });
  themeMo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  function tick() {
    ctx.clearRect(0, 0, W, H);

    // soft glow under mouse
    if (mouse.x > -1000) {
      const grd = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 220);
      grd.addColorStop(0, `rgba(${themeColors.glow}, 0.12)`);
      grd.addColorStop(1, `rgba(${themeColors.glow}, 0)`);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);
    }

    // update + draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      // mouse repulsion
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < 18000) {
        const f = (1 - dist2 / 18000) * 0.6;
        const d = Math.sqrt(dist2) || 1;
        p.x += (dx / d) * f;
        p.y += (dy / d) * f;
      }

      // wrap edges
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle =
        p.hue === 'accent'
          ? `rgba(${themeColors.accent}, 0.7)`
          : `rgba(${themeColors.base}, 0.55)`;
      ctx.fill();
    }

    // connection lines
    const maxDist = 130;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < maxDist * maxDist) {
          const alpha = (1 - Math.sqrt(d2) / maxDist) * 0.25;
          ctx.strokeStyle = `rgba(${themeColors.base}, ${alpha})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    if (!reduceMotion) requestAnimationFrame(tick);
  }

  resize();
  window.addEventListener('resize', resize);
  if (!reduceMotion) tick();
  else {
    // single static frame for reduced-motion users
    tick();
  }
})();
