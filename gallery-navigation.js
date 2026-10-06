const gallery = document.querySelector('.gallery');
if (gallery) {
  const nav = document.createElement('nav');
  nav.className = 'gallery-nav';
  nav.setAttribute('aria-label', 'Showcase image navigation');
  const track = document.createElement('div');
  track.className = 'thumb-track';
  const count = document.createElement('span');
  count.className = 'gallery-count';
  nav.append(track, count);
  document.body.append(nav);
  let figures = [], buttons = [], active = -1, scheduled = false;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function update() {
    scheduled = false;
    const line = innerHeight * .4;
    let closest = 0, distance = Infinity;
    figures.forEach((figure, index) => {
      const rect = figure.getBoundingClientRect();
      const d = rect.top > line ? rect.top - line : rect.bottom < line ? line - rect.bottom : 0;
      if (d <= distance) { closest = index; distance = d; }
    });
    if (!figures.length || active === closest) return;
    active = closest;
    buttons.forEach((button, i) => button.setAttribute('aria-current', String(i === active)));
    count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(figures.length).padStart(2, '0')}`;
    const button = buttons[active];
    track.scrollTo({left: button.offsetLeft - track.offsetLeft - (track.clientWidth - button.offsetWidth) / 2, behavior: reduced() ? 'instant' : 'smooth'});
  }
  function schedule() { if (!scheduled) { scheduled = true; requestAnimationFrame(update); } }
  function build() {
    figures = [...gallery.querySelectorAll(':scope > figure')];
    track.replaceChildren();
    buttons = figures.map((figure, index) => {
      if (!figure.id) figure.id = `image-${index + 1}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', `View image ${index + 1} of ${figures.length}`);
      button.setAttribute('aria-controls', figure.id);
      const source = figure.querySelector('img');
      if (source) { const image = document.createElement('img'); image.src = figure.dataset.thumbnail || source.currentSrc || source.src; image.alt = ''; image.loading = 'lazy'; button.append(image); }
      else button.textContent = String(index + 1).padStart(2, '0');
      button.addEventListener('click', () => (figure.previousElementSibling?.classList.contains('motion-anchor') ? figure.previousElementSibling : figure).scrollIntoView({behavior: reduced() ? 'instant' : 'smooth', block: 'start'}));
      track.append(button);
      return button;
    });
    nav.hidden = !figures.length;
    active = -1;
    schedule();
  }
  addEventListener('scroll', schedule, {passive:true});
  addEventListener('resize', schedule);
  gallery.addEventListener('load', schedule, true);
  new MutationObserver(build).observe(gallery, {childList:true, subtree:true});
  build();
}
