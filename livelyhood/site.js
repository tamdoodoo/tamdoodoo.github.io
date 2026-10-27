// Livelyhood — shared behaviour: header/menu/footer, scale the 1440px design to the window, side menu, homepage show switcher.

// Shared header, side menu and footer, inserted on every page. <body data-page="home|shows|brands|about|contact">.
const PAGES = [
  {id: 'home', label: 'Homepage', href: 'index.html'},
  {id: 'shows', label: 'Shows & Creators', href: 'shows-and-creators.html'},
  {id: 'brands', label: 'For Brands', href: 'for-brands.html'},
  {id: 'about', label: 'About', href: 'about.html'},
  {id: 'contact', label: 'Contact', href: 'contact.html'},
];
const current = document.body.dataset.page;
const cur = id => (id === current ? ' aria-current="page"' : '');
const headerSlot = document.querySelector('[data-site-header]');
if (headerSlot) headerSlot.outerHTML = `
  <header class="site-header">
    <a class="logo" href="index.html" aria-label="Livelyhood home"><img src="assets/home/header-logo.svg" alt="Livelyhood" width="190" height="39"></a>
    <button class="menu-btn" type="button" aria-label="Open menu" aria-haspopup="dialog" aria-expanded="false" aria-controls="site-menu"><img src="assets/home/icon-menu.svg" alt="" width="32" height="21"></button>
  </header>`;
document.body.insertAdjacentHTML('beforeend', `
  <div class="side-menu" id="site-menu" role="dialog" aria-modal="true" aria-label="Site menu" aria-hidden="true">
    <button class="scrim" type="button" tabindex="-1" aria-label="Close menu"></button>
    <div class="drawer">
      <div class="drawer-head"><button class="close" type="button" aria-label="Close menu"><img src="assets/menu/close.svg" alt="" width="24" height="24"></button></div>
      <nav aria-label="Main">${PAGES.map(p => `<a class="menu-item" href="${p.href}"${cur(p.id)}><span class="label"><span class="dot"></span>${p.label}</span><img class="arrow" src="assets/menu/arrow-hover.svg" alt="" width="36" height="36"></a>`).join('')}</nav>
      <div class="drawer-foot">
        <div class="secondary"><a href="for-brands.html#faq">FAQ</a><a href="contact.html">Work with us</a><a href="#" aria-disabled="true">Policy</a></div>
        <a class="cta" href="for-brands.html#enquiry">Discuss a Partnership</a>
      </div>
    </div>
  </div>`);
const footerSlot = document.querySelector('[data-site-footer]');
if (footerSlot) footerSlot.outerHTML = `
  <footer class="site-footer">
    <div class="glow" aria-hidden="true"></div>
    <div class="cols">
      <div class="brand">
        <div class="brand-top"><a href="index.html" aria-label="Livelyhood home"><img src="assets/livelyhood-logo.svg" alt="Livelyhood" width="237" height="58"></a><p>Live shopping shows from Singapore.</p></div>
        <div class="contact">
          <div><img src="assets/home/icon-mail.svg" alt="" width="24" height="24"><a href="mailto:hello@livelyhood.sg">hello@livelyhood.sg</a></div>
          <div><img src="assets/home/icon-map-pin.svg" alt="" width="24" height="24"><span>Singapore</span></div>
        </div>
      </div>
      <nav class="links" aria-label="Footer">
        <div><h4>Explore</h4><a href="shows-and-creators.html"${cur('shows')}>Shows</a><a href="shows-and-creators.html#apply">For Creators</a><a href="for-brands.html"${cur('brands')}>For Brands</a><a href="about.html"${cur('about')}>About</a><a href="contact.html"${cur('contact')}>Contact</a></div>
        <div><h4>Help</h4><a href="for-brands.html#faq">Brand FAQ</a><a href="shows-and-creators.html#faq">Creator FAQ</a><a href="#" aria-disabled="true">Privacy Policy</a></div>
        <div><h4>Follow</h4><a href="#" aria-disabled="true">TikTok</a><a href="#" aria-disabled="true">Instagram</a><a href="#" aria-disabled="true">YouTube</a></div>
      </nav>
    </div>
    <img class="wordmark" src="assets/livelyhood-wordmark.svg" alt="" width="1320" height="204">
    <div class="divider"></div>
    <p class="copy">© 2026 Livelyhood. All rights reserved.</p>
  </footer>`;
document.querySelectorAll('a[aria-disabled="true"]').forEach(a => a.addEventListener('click', e => e.preventDefault()));

// Desktop-only build: the page is drawn at the Figma size (1440px) and scaled to fit the window width.
const fit = () => document.documentElement.style.setProperty('--z', String(innerWidth / 1440));
fit();
addEventListener('resize', fit);

// Side menu: dialog with focus trap; Esc, Close or the scrim close it and return focus to the hamburger.
const menu = document.querySelector('.side-menu');
const opener = document.querySelector('.menu-btn');
if (menu && opener) {
  const focusables = () => [...menu.querySelectorAll('a[href], button')];
  const open = () => {
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    opener.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    menu.querySelector('.close').focus();
  };
  const close = () => {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    opener.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    opener.focus();
  };
  opener.addEventListener('click', open);
  menu.querySelector('.close').addEventListener('click', close);
  menu.querySelector('.scrim').addEventListener('click', close);
  menu.addEventListener('keydown', e => {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    const f = focusables(), first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

// Homepage: previous/next switch the featured show (card copy + phone screen), like the prototype's `show` variable.
const showCard = document.querySelector('[data-show-card]');
if (showCard) {
  const shows = [
    {name: 'Truly Yours', tags: ['Jewellery', 'Gifting', 'Story'], screen: 'assets/home/phone-screen-truly-yours.png', live: false,
     body: 'Some pieces mean more. Discover jewellery through the stories behind it, ideas for styling it, and the people you’d give it to—including yourself.'},
    {name: 'Daily Hauls', tags: ['Everyday Finds', 'Trending', 'Useful'], screen: 'assets/home/phone-screen-daily-hauls.png', live: true,
     body: 'A fast, friendly live show about the things people actually buy. Useful, trending finds, shown properly and explained honestly.'},
  ];
  let i = 0;
  const screen = document.querySelector('[data-phone-screen]'), badge = document.querySelector('[data-phone-live]');
  shows.forEach(s => { const im = new Image(); im.src = s.screen; }); // preload so the swap is instant
  const render = () => {
    const s = shows[i];
    showCard.querySelector('[data-name]').textContent = s.name;
    showCard.querySelector('[data-tags]').innerHTML = s.tags.map(t => `<span>${t}</span>`).join('<i></i>');
    showCard.querySelector('[data-body]').textContent = s.body;
    screen.src = s.screen;
    screen.alt = `${s.name} live show on a phone`;
    badge.hidden = !s.live;
  };
  showCard.querySelector('[data-prev]').addEventListener('click', () => { i = (i + shows.length - 1) % shows.length; render(); });
  showCard.querySelector('[data-next]').addEventListener('click', () => { i = (i + 1) % shows.length; render(); });
}

// Prototype forms: check required fields, then swap the fields for the sent state. Nothing is sent anywhere.
document.querySelectorAll('form[data-proto-form]').forEach(form => {
  const fields = form.querySelector('[data-fields]'), sent = form.querySelector('[data-sent]');
  const msg = {valueMissing: 'Please fill this in.', typeMismatch: 'Please enter a valid email address.'};
  const groupOf = el => el.closest('.form-field, .form-chips, .consent');
  const setError = (group, text) => {
    group.classList.toggle('is-invalid', !!text);
    let err = group.querySelector(':scope > .form-error');
    if (!text) return err && err.remove();
    if (!err) group.insertAdjacentHTML('beforeend', '<p class="form-error" role="alert"></p>'), err = group.lastElementChild;
    err.textContent = text;
  };
  const check = el => {
    const v = el.validity;
    const text = v.valid ? '' : el.type === 'radio' ? 'Please choose one.' : el.type === 'checkbox' ? 'Please agree to continue.' : msg[v.valueMissing ? 'valueMissing' : 'typeMismatch'];
    setError(groupOf(el), text);
    return v.valid;
  };
  form.noValidate = true;
  form.addEventListener('input', e => groupOf(e.target)?.classList.contains('is-invalid') && check(e.target));
  form.addEventListener('change', e => groupOf(e.target)?.classList.contains('is-invalid') && check(e.target));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const els = [...form.elements].filter(el => el.willValidate && groupOf(el));
    const bad = els.filter(el => !check(el));
    if (bad.length) return bad[0].focus();
    fields.hidden = true;
    sent.hidden = false;
    sent.querySelector('.tick').focus();
  });
  sent.querySelector('[data-reset]')?.addEventListener('click', () => {
    form.reset();
    sent.hidden = true;
    fields.hidden = false;
    form.querySelector('input, textarea').focus();
  });
});

// Dot-matrix icons: a 6×5 sprite of 30 frames shown at 80ms each; frames 0–5 build in once, then 6–29 loop (as in the Figma flipbook).
const flipbook = el => {
  let f = 0, timer = 0;
  const draw = () => { el.style.backgroundPosition = `${(f % 6) * 20}% ${Math.floor(f / 6) * 25}%`; };
  return {
    play() { clearInterval(timer); f = 0; draw(); timer = setInterval(() => { f = f === 29 ? 6 : f + 1; draw(); }, 80); },
    stop() { clearInterval(timer); },
  };
};

// For Brands → Why live: hovering a row makes it active (row glow + that row's dot icon). Row 1 is active by default.
const why = document.querySelector('[data-why]');
if (why) {
  const rows = [...why.querySelectorAll('li')], icons = [...why.querySelectorAll('[data-flip]')].map(el => ({el, fb: flipbook(el)}));
  const activate = i => {
    rows.forEach((r, j) => r.classList.toggle('is-on', i === j));
    icons.forEach((ic, j) => { ic.el.classList.toggle('is-on', i === j); i === j ? ic.fb.play() : ic.fb.stop(); });
  };
  rows.forEach((r, i) => r.addEventListener('mouseenter', () => !r.classList.contains('is-on') && activate(i)));
  activate(0);
}

// For Brands → Three ways in: hover or focus expands a panel; "Discuss This Option" preselects it in the enquiry form.
const ways = document.querySelector('[data-ways]');
if (ways) {
  const panels = [...ways.querySelectorAll('.panel-way')];
  const open = p => panels.forEach(q => q.classList.toggle('is-on', q === p));
  panels.forEach(p => { p.addEventListener('mouseenter', () => open(p)); p.addEventListener('focusin', () => open(p)); });
  ways.querySelectorAll('[data-way]').forEach(a => a.addEventListener('click', () => {
    const chip = document.querySelector(`#enquiry input[name="way"][value="${a.dataset.way}"]`);
    if (chip) { chip.checked = true; chip.dispatchEvent(new Event('change', {bubbles: true})); }
  }));
}

// For Brands → What's included: hovering a row nudges it right and plays its dot icon; leaving the row clears it.
document.querySelectorAll('[data-incl] li').forEach(row => {
  const fb = flipbook(row.querySelector('[data-flip]'));
  row.addEventListener('mouseenter', () => { row.classList.add('is-on'); fb.play(); });
  row.addEventListener('mouseleave', () => { row.classList.remove('is-on'); setTimeout(() => !row.classList.contains('is-on') && fb.stop(), 300); });
});

// For Brands → Case studies: dots and previous/next switch between cases.
const cases = document.querySelector('[data-cases]');
if (cases) {
  const list = [
    {name: 'Daily Hauls', img: 'assets/brands/case-daily-hauls.png', alt: 'Host presenting skincare products on the Daily Hauls set',
     objective: 'Launch a new skincare line to a younger audience.', did: 'Featured in three episodes of Daily Hauls, with the host testing the product live.', result: '12K live viewers,<br>1,400 product clicks.'},
    {name: 'Truly Yours', img: 'assets/brands/case-truly-yours.png', alt: 'Host presenting jewellery gifts on the Truly Yours set',
     objective: 'Drive gifting sales ahead of Valentine’s Day.', did: 'A two episode special on Truly Yours built around gift stories.', result: '860 orders across two shows.'},
  ];
  let i = 0;
  const dots = [...cases.querySelectorAll('.dots button')], img = cases.querySelector('[data-case-img]'), detail = cases.querySelector('.detail');
  list.forEach(c => { const im = new Image(); im.src = c.img; });
  const show = n => {
    i = (n + list.length) % list.length;
    const c = list[i];
    dots.forEach((d, j) => d.setAttribute('aria-current', String(i === j)));
    img.classList.add('is-swapping'); detail.classList.add('is-swapping');
    setTimeout(() => {
      img.src = c.img; img.alt = c.alt;
      detail.querySelector('[data-case=name]').textContent = c.name;
      detail.querySelector('[data-case=objective]').textContent = c.objective;
      detail.querySelector('[data-case=did]').textContent = c.did;
      detail.querySelector('[data-case=result]').innerHTML = c.result;
      img.classList.remove('is-swapping'); detail.classList.remove('is-swapping');
    }, 300);
  };
  dots.forEach((d, j) => d.addEventListener('click', () => j !== i && show(j)));
  cases.querySelector('[data-case-prev]').addEventListener('click', () => show(i - 1));
  cases.querySelector('[data-case-next]').addEventListener('click', () => show(i + 1));
}

// FAQ accordions: one answer open at a time; clicking the open question closes it.
document.querySelectorAll('[data-faq]').forEach(faq => {
  const items = [...faq.querySelectorAll('dl > div')];
  items.forEach(item => item.querySelector('button').addEventListener('click', () => {
    const wasOpen = item.querySelector('button').getAttribute('aria-expanded') === 'true';
    items.forEach(other => {
      const open = other === item && !wasOpen;
      other.querySelector('button').setAttribute('aria-expanded', String(open));
      other.querySelector('dd').classList.toggle('is-open', open);
    });
  }));
});

// Shows & Creators → apply form: Host / Pitch tabs (same fields in the design; the choice is kept with the application).
document.querySelectorAll('.tabs').forEach(tabs => {
  const btns = [...tabs.querySelectorAll('[role=tab]')], field = tabs.closest('form').querySelector('input[name=track]');
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(o => o.setAttribute('aria-selected', String(o === b)));
    field.value = b.dataset.track;
  }));
});

// Shows & Creators → "What's on next": countdown to the next live show (Tuesday = Daily Hauls, Thursday = Truly Yours, 8–9pm SGT).
const countdown = document.querySelector('[data-countdown]');
if (countdown) {
  const slots = [{day: 2, name: 'Daily Hauls'}, {day: 4, name: 'Truly Yours'}];
  const tick = () => {
    const sgt = new Date(Date.now() + 8 * 3600e3); // Singapore time, read through the UTC getters
    let best = null;
    for (const s of slots) for (let w = 0; w < 2; w++) {
      const start = Date.UTC(sgt.getUTCFullYear(), sgt.getUTCMonth(), sgt.getUTCDate() + ((s.day - sgt.getUTCDay() + 7) % 7) + w * 7, 20);
      if (start + 3600e3 > sgt.getTime() && (!best || start < best.start)) best = {start, name: s.name};
    }
    const ms = best.start - sgt.getTime();
    if (ms <= 0) return void (countdown.textContent = `${best.name} is live now`);
    const d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4);
    countdown.textContent = `${best.name} goes live in ${d ? `${d}d ${h}h` : h ? `${h}h ${m}m` : `${m}m`}`;
  };
  tick();
  setInterval(tick, 30e3);
}
