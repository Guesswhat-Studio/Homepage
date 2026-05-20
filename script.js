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

  document.querySelectorAll('a, button, .project__media').forEach((el) => {
    el.addEventListener('mouseenter', () => cursor && cursor.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => cursor && cursor.classList.remove('is-hover'));
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
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

  /* ---------- 3D tilt on project cards ---------- */
  const tilts = document.querySelectorAll('.tilt');
  tilts.forEach((card) => {
    const inner = card.querySelector('.project__media-inner');
    let rect = null;

    const onEnter = () => {
      rect = card.getBoundingClientRect();
    };
    const onMove = (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = x / rect.width - 0.5;
      const py = y / rect.height - 0.5;
      const rotY = px * 14;
      const rotX = -py * 10;
      card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
      if (inner) inner.style.transform = `translate(${px * 10}px, ${py * 10}px)`;
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

  function tick() {
    ctx.clearRect(0, 0, W, H);

    // soft glow under mouse
    if (mouse.x > -1000) {
      const grd = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 220);
      grd.addColorStop(0, 'rgba(106, 92, 255, 0.12)');
      grd.addColorStop(1, 'rgba(106, 92, 255, 0)');
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
          ? 'rgba(201, 255, 90, 0.7)'
          : 'rgba(180, 180, 220, 0.55)';
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
          ctx.strokeStyle = `rgba(180, 180, 220, ${alpha})`;
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
