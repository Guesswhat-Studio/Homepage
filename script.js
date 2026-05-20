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

  /* ---------- Project card hover: 3D tilt + spotlight ----------
     Each card listens to mousemove and updates four CSS custom properties:
       --rx / --ry : the tilt rotation in degrees (max ±6°)
       --mx / --my : the spotlight position (CSS percent within the card)
     The card's .is-hover class gates all of these effects in CSS so they
     can be transitioned smoothly when the mouse leaves. */
  cards.forEach((card) => {
    let rect = null;

    const onEnter = () => {
      rect = card.getBoundingClientRect();
      card.classList.add('is-hover');
    };
    const onMove = (e) => {
      if (!rect) rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = x / rect.width  - 0.5;   // -0.5 .. 0.5
      const py = y / rect.height - 0.5;
      // Gentle 3D tilt — noticeable but never disorienting
      const rotY = (px *  10).toFixed(2);
      const rotX = (-py *  7).toFixed(2);
      card.style.setProperty('--ry', rotY + 'deg');
      card.style.setProperty('--rx', rotX + 'deg');
      // Spotlight position as a percentage of card size
      card.style.setProperty('--mx', ((x / rect.width)  * 100).toFixed(1) + '%');
      card.style.setProperty('--my', ((y / rect.height) * 100).toFixed(1) + '%');
    };
    const onLeave = () => {
      rect = null;
      card.classList.remove('is-hover');
      // Smoothly ease back to neutral via CSS transitions
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    };

    card.addEventListener('mouseenter', onEnter);
    card.addEventListener('mousemove',  onMove);
    card.addEventListener('mouseleave', onLeave);
  });

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

  /* =========================================
     About-section DICE RAIN
     - Triggers a one-shot burst when the section first enters view
     - Then keeps a few dice gently falling/floating as ambient decor
     - Mouse pushes dice away; click shatters them into spark particles
     - Each die is drawn as an isometric cube using theme colors
     ========================================= */
  const diceCanvas = document.getElementById('aboutDiceCanvas');
  const aboutSection = document.getElementById('about');
  if (diceCanvas && aboutSection && !reduceMotion) {
    const dctx = diceCanvas.getContext('2d');
    let dW = 0, dH = 0, ddpr = 1;
    let dice = [];      // active falling/floating dice
    let shards = [];    // particles from shattered dice
    let burstFired = false;
    let aboutVisible = false;
    let aboutRect = null;

    const dMouse = { x: -9999, y: -9999, active: false };

    function dieResize() {
      ddpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = aboutSection.getBoundingClientRect();
      dW = diceCanvas.clientWidth = aboutSection.clientWidth;
      dH = diceCanvas.clientHeight = aboutSection.clientHeight;
      diceCanvas.width = dW * ddpr;
      diceCanvas.height = dH * ddpr;
      dctx.setTransform(ddpr, 0, 0, ddpr, 0, 0);
      aboutRect = r;
    }

    /* read accent colors from theme so dice look right in dark + light modes */
    function getDieColors() {
      const cs = getComputedStyle(document.documentElement);
      return {
        top1:  cs.getPropertyValue('--die-top-1').trim()   || '#b9b1ff',
        top2:  cs.getPropertyValue('--die-top-2').trim()   || '#8b7cff',
        right1: cs.getPropertyValue('--die-right-1').trim() || '#7261f0',
        right2: cs.getPropertyValue('--die-right-2').trim() || '#4f3fcf',
        left1:  cs.getPropertyValue('--die-left-1').trim()  || '#4a3cb8',
        left2:  cs.getPropertyValue('--die-left-2').trim()  || '#2c247f',
        pip:    cs.getPropertyValue('--die-pip').trim()     || '#ffffff',
        accent: (cs.getPropertyValue('--accent').trim() || '#8b7cff'),
      };
    }
    let dieColors = getDieColors();
    const diceMo = new MutationObserver(() => { dieColors = getDieColors(); });
    diceMo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    /* Spawn one die. mode = 'rain' (drops from above) or 'ambient' (slow drift) */
    function makeDie(mode = 'ambient') {
      const size = 18 + Math.random() * 18;            // 18..36 px edge
      const x = Math.random() * dW;
      const y = mode === 'rain'
        ? -size - Math.random() * dH * 0.6              // start above viewport
        : Math.random() * dH;
      return {
        x, y,
        vx: (Math.random() - 0.5) * (mode === 'rain' ? 1.4 : 0.4),
        vy: mode === 'rain' ? 1.5 + Math.random() * 1.6 : 0.25 + Math.random() * 0.4,
        size,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.04,
        face: 1 + Math.floor(Math.random() * 6),
        life: 1,
        mode,
      };
    }

    /* Initial ambient dice (always present once section is reachable) */
    function seedAmbient() {
      dice = [];
      const n = 5;
      for (let i = 0; i < n; i++) {
        const d = makeDie('ambient');
        d.y = Math.random() * dH;
        dice.push(d);
      }
    }

    /* One-shot rain burst when user first scrolls to About */
    function fireBurst() {
      if (burstFired) return;
      burstFired = true;
      const count = 18;
      for (let i = 0; i < count; i++) {
        const d = makeDie('rain');
        d.x = (i / count) * dW + (Math.random() - 0.5) * 60;
        d.y = -d.size - Math.random() * 300;
        dice.push(d);
      }
    }

    /* Shatter a die into small shards */
    function shatter(d) {
      const n = 10 + Math.floor(Math.random() * 6);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 2 + Math.random() * 4;
        shards.push({
          x: d.x,
          y: d.y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 1,
          size: 2 + Math.random() * 3,
          life: 1,
          decay: 0.012 + Math.random() * 0.012,
          color: dieColors.accent,
        });
      }
    }

    /* Draw an isometric die at (cx, cy) with edge length s, rotated by rot.
       For simplicity we apply 2D rotation to the whole emblem — looks like a
       tumbling cube without needing real 3D math. */
    function drawDie(d) {
      const s = d.size;
      dctx.save();
      dctx.translate(d.x, d.y);
      dctx.rotate(d.rot);
      // build 4 corner points of the isometric outline
      const top   = [0, -s];
      const right = [s * 0.866, -s * 0.5];
      const btm   = [0, s * 0.0];
      const left  = [-s * 0.866, -s * 0.5];
      const tBtm  = [0, s];
      const rBtm  = [s * 0.866, s * 0.5];
      const lBtm  = [-s * 0.866, s * 0.5];

      // TOP face
      let g = dctx.createLinearGradient(0, -s, 0, 0);
      g.addColorStop(0, dieColors.top1);
      g.addColorStop(1, dieColors.top2);
      dctx.fillStyle = g;
      dctx.beginPath();
      dctx.moveTo(top[0], top[1]);
      dctx.lineTo(right[0], right[1]);
      dctx.lineTo(btm[0], btm[1]);
      dctx.lineTo(left[0], left[1]);
      dctx.closePath();
      dctx.fill();

      // RIGHT face
      g = dctx.createLinearGradient(0, -s * 0.5, 0, s);
      g.addColorStop(0, dieColors.right1);
      g.addColorStop(1, dieColors.right2);
      dctx.fillStyle = g;
      dctx.beginPath();
      dctx.moveTo(btm[0], btm[1]);
      dctx.lineTo(right[0], right[1]);
      dctx.lineTo(rBtm[0], rBtm[1]);
      dctx.lineTo(tBtm[0], tBtm[1]);
      dctx.closePath();
      dctx.fill();

      // LEFT face
      g = dctx.createLinearGradient(0, -s * 0.5, 0, s);
      g.addColorStop(0, dieColors.left1);
      g.addColorStop(1, dieColors.left2);
      dctx.fillStyle = g;
      dctx.beginPath();
      dctx.moveTo(btm[0], btm[1]);
      dctx.lineTo(left[0], left[1]);
      dctx.lineTo(lBtm[0], lBtm[1]);
      dctx.lineTo(tBtm[0], tBtm[1]);
      dctx.closePath();
      dctx.fill();

      // pips on the top face — number based on d.face
      dctx.fillStyle = dieColors.pip;
      const pr = Math.max(1.2, s * 0.07);
      const pipsForFace = (n) => {
        const c = [0, -s * 0.5];
        const tl = [-s * 0.34, -s * 0.66];
        const tr = [ s * 0.34, -s * 0.34];
        const bl = [-s * 0.34, -s * 0.34];
        const br = [ s * 0.34, -s * 0.66];
        const ml = [-s * 0.34, -s * 0.5];
        const mr = [ s * 0.34, -s * 0.5];
        switch (n) {
          case 1: return [c];
          case 2: return [tl, br];
          case 3: return [tl, c, br];
          case 4: return [tl, tr, bl, br];
          case 5: return [tl, tr, c, bl, br];
          case 6: return [tl, ml, bl, tr, mr, br];
          default: return [c];
        }
      };
      for (const p of pipsForFace(d.face)) {
        dctx.beginPath();
        dctx.ellipse(p[0], p[1], pr, pr * 0.55, 0, 0, Math.PI * 2);
        dctx.fill();
      }

      dctx.restore();
    }

    function dieTick() {
      dctx.clearRect(0, 0, dW, dH);

      // update + draw dice
      for (let i = dice.length - 1; i >= 0; i--) {
        const d = dice[i];
        d.x += d.vx;
        d.y += d.vy;
        d.rot += d.vrot;

        // gentle gravity for rain dice; ambient just drifts
        if (d.mode === 'rain') d.vy += 0.015;
        else {
          // gentle wave drift for ambient dice
          d.vx += (Math.random() - 0.5) * 0.01;
          d.vy += (Math.random() - 0.5) * 0.01;
          d.vx = Math.max(-0.6, Math.min(0.6, d.vx));
          d.vy = Math.max(-0.5, Math.min(0.7, d.vy));
        }

        // mouse repulsion (only when mouse is over the about section)
        if (dMouse.active) {
          const dx = d.x - dMouse.x;
          const dy = d.y - dMouse.y;
          const r2 = dx * dx + dy * dy;
          const range = 130;
          if (r2 < range * range) {
            const dist = Math.sqrt(r2) || 1;
            const push = (1 - dist / range) * 1.6;
            d.vx += (dx / dist) * push;
            d.vy += (dy / dist) * push;
            d.vrot += (Math.random() - 0.5) * 0.08;
          }
        }

        // wrap horizontally for ambient, recycle for rain
        if (d.mode === 'ambient') {
          if (d.x < -d.size * 2) d.x = dW + d.size;
          if (d.x > dW + d.size * 2) d.x = -d.size;
          if (d.y > dH + d.size * 2) {
            d.y = -d.size;
            d.x = Math.random() * dW;
            d.vy = 0.25 + Math.random() * 0.4;
          }
          if (d.y < -d.size * 2) d.y = dH + d.size;
        } else {
          // rain dice exit at the bottom and disappear
          if (d.y > dH + d.size * 2) {
            dice.splice(i, 1);
            continue;
          }
        }

        drawDie(d);
      }

      // update + draw shards
      for (let i = shards.length - 1; i >= 0; i--) {
        const s = shards[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.15;
        s.life -= s.decay;
        if (s.life <= 0) { shards.splice(i, 1); continue; }
        dctx.globalAlpha = Math.max(0, s.life);
        dctx.fillStyle = s.color;
        dctx.beginPath();
        dctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        dctx.fill();
      }
      dctx.globalAlpha = 1;

      requestAnimationFrame(dieTick);
    }

    /* mouse tracking relative to the canvas */
    diceCanvas.addEventListener('mousemove', (e) => {
      const r = diceCanvas.getBoundingClientRect();
      dMouse.x = e.clientX - r.left;
      dMouse.y = e.clientY - r.top;
      dMouse.active = true;
    });
    diceCanvas.addEventListener('mouseleave', () => { dMouse.active = false; });

    /* click to shatter the closest die within reach.
       The hit radius is generous (≥ 70px) so users don't have to pixel-aim
       at a small tumbling die. If nothing is hit, we still spray a small
       confetti puff at the click point as feedback so clicks feel responsive. */
    diceCanvas.addEventListener('click', (e) => {
      const r = diceCanvas.getBoundingClientRect();
      const cx = e.clientX - r.left;
      const cy = e.clientY - r.top;
      let best = -1, bestDist = Infinity;
      for (let i = 0; i < dice.length; i++) {
        const d = dice[i];
        const dx = d.x - cx, dy = d.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // generous hit radius: at least 70px, scales up for bigger dice
        const hitR = Math.max(70, d.size * 2.6);
        if (dist < hitR && dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      if (best >= 0) {
        shatter(dice[best]);
        dice.splice(best, 1);
        // spawn a fresh ambient die elsewhere so density stays roughly stable
        setTimeout(() => dice.push(makeDie('ambient')), 1200);
      } else {
        // missed: still give a tiny visual reward so the click feels alive
        const n = 6 + Math.floor(Math.random() * 4);
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 1.5 + Math.random() * 2.5;
          shards.push({
            x: cx,
            y: cy,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp - 0.5,
            size: 1.5 + Math.random() * 2,
            life: 1,
            decay: 0.025 + Math.random() * 0.015,
            color: dieColors.accent,
          });
        }
      }
    });

    /* IntersectionObserver fires the one-shot burst the first time
       the About section enters the viewport */
    const aboutIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.25) {
          aboutVisible = true;
          fireBurst();
        }
      });
    }, { threshold: [0, 0.25, 0.6] });
    aboutIo.observe(aboutSection);

    dieResize();
    window.addEventListener('resize', dieResize);
    seedAmbient();
    dieTick();
  }
})();
