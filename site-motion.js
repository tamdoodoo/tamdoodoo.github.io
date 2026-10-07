// Smooth scrolling + scroll-in text reveals for every page. Selector lists mirror site-motion.css.
import Lenis from '/vendor/lenis.mjs';

const root = document.documentElement;
clearTimeout(window.__motionFallback);

const HEADINGS = '.portrait-space h1,.case-head h3,.contact h2,.info h1,.case-story h2';
const TEXT = '.portrait-header>*,.discipline-row>span,.intro-rule>span,.intro-rule>p,.section-label>span,.case-number,.case-head>p,.case-scope>*,.case-link,.contact>span,.contact>p,.contact-links>li,footer>*,body>header>*,.info>.label,.info>.description,.info dl>div,.info>.draft,.gallery figcaption,.case-story>p,.bottom>a,.case-image';

if (root.classList.contains('has-motion')) {
  // Smooth wheel scrolling; touch devices keep native momentum.
  const barHeight = document.querySelector('.site-bar')?.offsetHeight || 0;
  const lenis = new Lenis({autoRaf: true, lerp: 0.1, anchors: {offset: -barHeight}}); // in-page links land below the pinned header
  window.lenis = lenis;

  // Wrap each word of a heading (keeping links and other inline markup intact).
  const split = heading => {
    let w = 0;
    const walk = node => [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) return walk(child);
      if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      child.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.append(part);
        const outer = document.createElement('span'), inner = document.createElement('span');
        outer.className = 'split-word';
        inner.style.setProperty('--w', w++);
        inner.textContent = part;
        outer.append(inner);
        frag.append(outer);
      });
      child.replaceWith(frag);
    });
    walk(heading);
    heading.classList.add('is-split');
  };
  document.querySelectorAll(HEADINGS).forEach(split);

  // Reveal on entry; items entering together are staggered in document order.
  const pending = new Set(document.querySelectorAll(`${HEADINGS},${TEXT}`));
  const reveal = (els) => els.forEach((el, i) => {
    el.style.setProperty('--d', `${i * 70}ms`);
    el.classList.add('is-in');
    observer.unobserve(el);
    pending.delete(el);
  });
  const observer = new IntersectionObserver(entries => reveal(entries.filter(e => e.isIntersecting).map(e => e.target)),
    {rootMargin: '0px 0px -8% 0px'});
  pending.forEach(el => observer.observe(el));
  // Content at the very end of the page can never rise above that bottom margin, so reveal whatever is on screen there.
  const atEnd = () => {
    if (!pending.size || scrollY + innerHeight < document.documentElement.scrollHeight - 4) return;
    reveal([...pending].filter(el => el.getBoundingClientRect().top < innerHeight));
  };
  addEventListener('scroll', atEnd, {passive: true});
  atEnd();
}

// Hover on links and buttons: letters dissolve into dither blocks, then resolve left to right.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const GLYPHS = '░▒▓█▚▞▖▗▘▝';
  const DURATION = 1000; // full resolve
  const STEP = 70;       // how often the blocks reshuffle
  const TARGETS = '.portrait-header nav a, body > header nav a, body > header .name, .site-bar .name, .site-bar nav a, .case-link, footer a, .bottom a, .contact a, .motion-toggle .toggle-label';
  document.querySelectorAll(TARGETS).forEach(el => {
    let frame = 0, label = null, text = '', cells = [];
    // Never swap DOM nodes while the pointer may be pressing them: a click only registers if the element
    // under the cursor survives from mousedown to mouseup. So the animation settles in place, and the
    // per-letter cells are only unwrapped back to plain text once the pointer has left.
    const settle = () => {
      cancelAnimationFrame(frame);
      cells.forEach((c, i) => { c.textContent = [...text][i]; });
    };
    const unwrap = () => {
      settle();
      if (label?.isConnected && cells.length) { label.textContent = text; label.style.width = label.style.height = ''; } // plain text again (keeps kerning)
      cells = [];
    };
    const run = () => {
      settle();
      // Wrap the visible text once; buttons that rewrite their own label get re-wrapped next time.
      if (!label?.isConnected) {
        cells = [];
        text = el.textContent.trim();
        label = document.createElement('span');
        label.className = 'dither-text';
        label.setAttribute('aria-hidden', 'true');
        label.textContent = text;
        if (!el.hasAttribute('aria-label') || el.dataset.ditherLabel) { el.setAttribute('aria-label', text); el.dataset.ditherLabel = '1'; }
        el.replaceChildren(label);
      }
      // Lock the label's size, then give every character a fixed cell the width of the original letter,
      // so wider dither glyphs never push the text (or a trailing arrow) out of place.
      if (!cells.length) {
        const box = label.getBoundingClientRect();
        label.style.width = `${box.width}px`;
        label.style.height = `${box.height}px`;
        cells = [...text].map(ch => { const c = document.createElement('span'); c.className = 'dither-char'; c.textContent = ch; return c; });
        label.replaceChildren(...cells);
        cells.forEach(c => { c.style.width = `${c.getBoundingClientRect().width}px`; });
      }
      const start = performance.now();
      const tick = now => {
        const elapsed = now - start, t = elapsed / DURATION;
        if (t >= 1) return settle();
        const seed = Math.floor(elapsed / STEP);
        [...text].forEach((ch, i) => {
          const scrambled = /\S/.test(ch) && t <= 0.3 + 0.7 * (i / text.length); // letters and arrows alike
          cells[i].textContent = scrambled ? GLYPHS[(seed * 7 + i * 13 + Math.floor(Math.random() * 3)) % GLYPHS.length] : ch;
        });
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    // The background toggle's label lives inside the button, so the button drives it.
    const trigger = el.closest('.motion-toggle') || el;
    const triggers = [trigger];
    // A card's link also reacts to hovering the card's cover image.
    if (el.classList.contains('case-link')) { const image = el.closest('.case-panel')?.querySelector('.case-image'); if (image) triggers.push(image); }
    triggers.forEach(t => { t.addEventListener('mouseenter', run); t.addEventListener('mouseleave', unwrap); });
    trigger.addEventListener('focus', () => { if (trigger.matches(':focus-visible')) run(); }); // keyboard only; a mouse click also focuses
    trigger.addEventListener('blur', unwrap);
    trigger.addEventListener('pointerdown', settle);
  });
}

// Showcase videos: each starts from the beginning when it scrolls into view (40% visible) and pauses once it leaves;
// with reduced motion they stay paused with controls.
document.querySelectorAll('.gallery video').forEach(video => {
  video.removeAttribute('autoplay');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { video.pause(); video.controls = true; return; }
  let inView = false;
  new IntersectionObserver(([entry]) => {
    if (entry.intersectionRatio >= 0.4 && !inView) { inView = true; video.currentTime = 0; video.play().catch(() => {}); }
    else if (!entry.isIntersecting && inView) { inView = false; video.pause(); }
  }, {threshold: [0, 0.4]}).observe(video);
});

// Back to top: only appears when the visitor reaches the bottom of the page.
const backToTop = document.querySelector('.back-to-top');
if (backToTop) {
  const toggle = () => backToTop.classList.toggle('is-visible', scrollY + innerHeight >= document.documentElement.scrollHeight - 240);
  addEventListener('scroll', toggle, {passive: true});
  toggle();
}

// Email: clicking copies the address (falls back to opening the mail app if copying isn't allowed).
document.querySelectorAll('.copy-email').forEach(link => {
  const email = link.dataset.email, status = document.getElementById('copy-status');
  let timer = 0;
  link.addEventListener('click', async event => {
    if (!navigator.clipboard) return;
    event.preventDefault();
    try { await navigator.clipboard.writeText(email); } catch { location.href = link.href; return; }
    clearTimeout(timer);
    link.textContent = 'Copied to clipboard';
    link.classList.add('is-copied');
    if (status) status.textContent = `${email} copied to clipboard`;
    timer = setTimeout(() => { link.textContent = email; link.classList.remove('is-copied'); }, 1800);
  });
});

// Pinned header (homepage): shown once the top menu has scrolled out of view; its height feeds the cards' sticky offset.
const bar = document.querySelector('.site-bar'), topMenu = document.querySelector('.portrait-header');
if (bar && topMenu) {
  const setHeight = () => document.documentElement.style.setProperty('--bar-h', `${bar.offsetHeight}px`);
  new ResizeObserver(setHeight).observe(bar);
  setHeight();
  new IntersectionObserver(([entry]) => {
    const show = !entry.isIntersecting && entry.boundingClientRect.top < 0;
    bar.classList.toggle('is-visible', show);
    bar.inert = !show;
    bar.setAttribute('aria-hidden', String(!show));
  }).observe(topMenu);
}

// Portrait intro: same language as the link hover — blue block glyphs (░▒▓█▚▞▖▗▘▝) that reshuffle,
// then the whole portrait cross-fades into the photo.
const portrait = document.querySelector('.portrait-photo');
if (portrait && root.classList.contains('has-motion')) {
  const photo = portrait.querySelector('img');
  const done = () => portrait.classList.add('dither-done');
  const play = () => {
    const box = portrait.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.round(box.width * dpr), H = Math.round(box.height * dpr);
    if (!W || !H || !photo.naturalWidth) return done();
    const canvas = Object.assign(document.createElement('canvas'), {className: 'portrait-dither', width: W, height: H});
    canvas.setAttribute('aria-hidden', 'true');
    portrait.append(canvas);
    const ctx = canvas.getContext('2d');
    // The photo, cropped like object-fit: cover, so resolved cells match the <img> underneath pixel for pixel
    const full = Object.assign(document.createElement('canvas'), {width: W, height: H});
    const scale = Math.max(W / photo.naturalWidth, H / photo.naturalHeight);
    const sw = W / scale, sh = H / scale;
    full.getContext('2d').drawImage(photo, (photo.naturalWidth - sw) / 2, (photo.naturalHeight - sh) / 2, sw, sh, 0, 0, W, H);
    // Brightness per cell decides how dense each glyph is
    const CS = Math.round(8 * dpr), cols = Math.ceil(W / CS), rows = Math.ceil(H / CS);
    const grid = Object.assign(document.createElement('canvas'), {width: cols, height: rows}), gctx = grid.getContext('2d', {willReadFrequently: true});
    gctx.drawImage(full, 0, 0, cols, rows);
    const px = gctx.getImageData(0, 0, cols, rows).data;
    const dark = Array.from({length: cols * rows}, (_, i) => 1 - (0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]) / 255);
    const INK = '#0007cb', PAPER = '#f1eee9';
    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    const q = CS / 2, s4 = CS / 4;
    // Glyphs drawn as shapes: shades (░▒▓) are 4×4 ordered dots, quadrants (▖▗▘▝▚▞) are half-cells, █ is solid.
    const shade = (x, y, level) => { for (let k = 0; k < 16; k++) if (BAYER[k] < level * 16) ctx.fillRect(x + (k & 3) * s4, y + (k >> 2) * s4, s4, s4); };
    const GLYPHS = [
      [],                                                                        // blank
      [(x, y) => shade(x, y, .25), (x, y) => ctx.fillRect(x, y + q, q, q), (x, y) => ctx.fillRect(x + q, y + q, q, q),
       (x, y) => ctx.fillRect(x, y, q, q), (x, y) => ctx.fillRect(x + q, y, q, q)],                   // ░ ▖ ▗ ▘ ▝
      [(x, y) => shade(x, y, .5), (x, y) => { ctx.fillRect(x, y, q, q); ctx.fillRect(x + q, y + q, q, q); },
       (x, y) => { ctx.fillRect(x + q, y, q, q); ctx.fillRect(x, y + q, q, q); }],                   // ▒ ▚ ▞
      [(x, y) => shade(x, y, .75)],                                              // ▓
      [(x, y) => ctx.fillRect(x, y, CS, CS)],                                    // █
    ];
    const hash = (a, b, c) => { const v = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return v - Math.floor(v); };
    const DURATION = 1600, STEP = 70, start = performance.now();
    const frame = now => {
      const elapsed = now - start, t = Math.min(1, elapsed / DURATION), seed = Math.floor(elapsed / STEP);
      ctx.globalAlpha = 1; ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
      // the whole portrait resolves together (no sweep): glyphs shuffle, then cross-fade into the photo
      const m = Math.min(1, Math.max(0, (t - 0.45) / 0.55)), a = m * m * (3 - 2 * m);
      for (let cx = 0; cx < cols; cx++) {
        const x = cx * CS;
        if (a < 1) {
          ctx.globalAlpha = 1; ctx.fillStyle = INK;
          for (let cy = 0; cy < rows; cy++) {
            const level = Math.max(0, Math.min(4, Math.round(dark[cy * cols + cx] * 4 + (hash(cx, cy, seed) - .5) * 1.2)));
            const set = GLYPHS[level];
            if (set.length) set[Math.floor(hash(cy, cx, seed + 3) * set.length)](x, cy * CS);
          }
        }
        if (a > 0) { ctx.globalAlpha = a; ctx.drawImage(full, x, 0, CS, H, x, 0, CS, H); }
      }
      if (t < 1) return requestAnimationFrame(frame);
      done();          // the canvas now shows exactly the photo, so swapping it out is seamless
      canvas.remove();
    };
    frame(start);      // paint the first glyph frame immediately, so there is no blank frame
  };
  (photo.complete ? Promise.resolve() : new Promise(r => { photo.onload = photo.onerror = r; }))
    .then(() => photo.decode?.().catch(() => {})).then(play).catch(done);
  setTimeout(done, 4000); // never leave the portrait hidden
}
