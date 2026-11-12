(() => {
  const app = document.getElementById("app");
  const projects = window.PROJECTS;

  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tags = (list) => `<div class="card-tags">${list.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>`;
  const coverStyle = (p) =>
    // contained covers get breathing room so the artwork doesn't touch the card edge
    p.coverFit ? ` style="background:${p.coverBg || "var(--tile)"};--fit:${p.coverFit};--cover-pad:5%"`
    : p.coverPos ? ` style="--pos:${p.coverPos}"` : "";

  /* ---------- home ---------- */
  function renderHome() {
    document.title = "Tam Do — Branding";
    document.documentElement.style.removeProperty("--accent");
    app.innerHTML = `
      <section class="intro">
        <h1>Brand identities<br><em>that hold a story.</em></h1>
        <div class="intro-meta">
          <p>Selected branding work: logos, visual systems and the places they live, from packaging and signage to apps and campaigns.</p>
          <span>${projects.length} projects · 2024–2026</span>
        </div>
      </section>
      <section class="work">
        ${projects
          .map(
            (p) => `
          <a class="card" href="#/${p.slug}">
            <div class="card-media"${coverStyle(p)}>
              <img src="${p.cover}" alt="${esc(p.name)} cover" decoding="async">
              <span class="view">View project</span>
            </div>
            <div class="card-info">
              <span class="card-name">${esc(p.name)}</span>
              ${tags(p.tags)}
              <span class="card-year">${p.year}</span>
            </div>
          </a>`
          )
          .join("")}
      </section>`;
  }

  /* ---------- bento board ----------
     Desktop places every tile exactly (12 columns of square cells). Phones use a
     4-column grid: wide tiles take a full row, the rest pair up side by side at a
     shared height so no cell is left empty. */
  function mobileLayout(board) {
    const m = board.map((t) => {
      const [, , w, h] = t.at;
      const mw = w >= 5 ? 4 : 2;
      // text tiles get at least two rows so a sentence never spills out
      return { mw, mh: Math.max(t.text ? 2 : 1, Math.round((mw * h) / w)), ratio: h / w };
    });
    let order = 0, waiting = null;
    m.forEach((x) => {
      if (x.mw === 4) { x.order = order++; return; }
      if (!waiting) { waiting = x; x.order = order++; return; }
      x.order = waiting.order + 0.5;
      x.mh = waiting.mh = Math.max(x.mh, waiting.mh);
      waiting = null;
    });
    // a half tile left without a partner goes full width, keeping its shape
    if (waiting) { waiting.mw = 4; waiting.mh = Math.max(1, Math.round(4 * waiting.ratio)); }
    return m;
  }

  function tileVars(t, m) {
    const [c, r, w, h] = t.at;
    return `--c:${c};--r:${r};--w:${w};--h:${h};--mw:${m.mw};--mh:${m.mh};--mo:${m.order * 2}${t.bg ? `;--bg:${t.bg}` : ""}${t.color ? `;--fg:${t.color}` : ""}`;
  }

  // a project's main board plus any draft boards, in page order
  const boardsOf = (p) => [{ ...p.main, board: p.board }, ...(p.drafts ? p.drafts.boards : [])];

  // start: index of this board's first image in the project-wide lightbox list
  function boardHTML(board, start) {
    let n = start;
    const mobile = mobileLayout(board);
    return board
      .map((t, k) => {
        if (t.text)
          return `<div class="tile type ${t.size || "m"}" style="${tileVars(t, mobile[k])}"><span>${esc(t.text)}</span></div>`;
        const cls = ["tile", "pic", t.fit === "contain" && "contain", t.pad && "pad", t.blend && "blend"].filter(Boolean).join(" ");
        return `<button class="${cls}" data-i="${n++}" style="${tileVars(t, mobile[k])}" aria-label="Open image">
          <img src="${t.src}" alt="" loading="lazy" decoding="async"></button>`;
      })
      .join("");
  }

  /* ---------- project ---------- */
  let current = null;

  function renderProject(p) {
    current = p;
    const idx = projects.indexOf(p);
    const next = projects[(idx + 1) % projects.length];
    document.title = `${p.name} — Tam Do`;
    document.documentElement.style.setProperty("--accent", p.accent || "#16140f");

    app.innerHTML = `
      <section class="project-head">
        <a class="back" href="#/">← All work</a>
        <div class="project-title">
          <div>
            <h1>${esc(p.name)}</h1>
            <p class="tagline">${esc(p.tagline)}</p>
          </div>
          <div class="project-info">
            <p class="summary">${esc(p.summary)}</p>
            <dl class="credits">${p.credits.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}<dt>Year</dt><dd>${p.year}</dd></dl>
            ${p.fullCase ? `<a class="full-case" href="${p.fullCase}" target="_blank" rel="noopener">Read the full case study ↗</a>` : ""}
          </div>
        </div>
      </section>
      ${boardsHTML(p)}
      ${p.tool ? toolHTML(p.tool) : ""}
      <a class="next" href="#/${next.slug}">
        <small>Next project</small>
        <div class="next-row">
          <span class="next-name">${esc(next.name)} →</span>
          <div class="next-thumb"${coverStyle(next)}><img src="${next.cover}" alt="" loading="lazy"></div>
        </div>
      </a>`;
    reveal();
    mountTool();
  }

  /* ---------- embedded tool ----------
     The tool is laid out for a 1440 × 900 window and scaled down to fit, so its
     desktop preview always shows. Phones get the screenshot instead. */
  const TOOL_W = 1440;
  function toolHTML(t) {
    return `
      <section class="tool">
        <div class="board-head"><h2><span class="label">${esc(t.label)}</span>${esc(t.title)}</h2><p>${esc(t.note)}</p></div>
        <div class="tool-frame">
          <div class="tool-live"><iframe data-src="${t.src}" title="${esc(t.title)}" loading="lazy"></iframe></div>
          <img class="tool-shot" src="${t.shot}" alt="${esc(t.title)} screenshot" loading="lazy">
        </div>
        <div class="tool-foot"><span>${esc(t.caption)}</span><a href="${t.src}" target="_blank" rel="noopener">Open the tool ↗</a></div>
      </section>`;
  }
  let toolRO;
  function mountTool() {
    toolRO && toolRO.disconnect();
    const live = app.querySelector(".tool-live");
    if (!live || !matchMedia("(min-width: 761px)").matches) return;
    const frame = live.querySelector("iframe");
    frame.src = frame.dataset.src;
    toolRO = new ResizeObserver(() => live.style.setProperty("--k", live.clientWidth / TOOL_W));
    toolRO.observe(live);
  }

  function boardsHTML(p) {
    let start = 0;
    const section = (b) => {
      const html = `
      <section class="board-wrap">
        ${b.title ? `<div class="board-head"><h2>${b.label ? `<span class="label">${esc(b.label)}</span>` : ""}${esc(b.title)}</h2>${b.note ? `<p>${esc(b.note)}</p>` : ""}</div>` : ""}
        <div class="board">${boardHTML(b.board, start)}</div>
      </section>`;
      start += b.board.filter((t) => t.src).length;
      return html;
    };
    const [main, ...drafts] = boardsOf(p);
    return (
      section(main) +
      (p.drafts
        ? `<section class="drafts-intro"><h2>${esc(p.drafts.title)}</h2><p>${esc(p.drafts.note)}</p></section>` +
          drafts.map(section).join("")
        : "")
    );
  }

  /* ---------- scroll reveal ---------- */
  let io;
  function reveal() {
    io && io.disconnect();
    const tiles = app.querySelectorAll(".tile");
    if (!("IntersectionObserver" in window)) return tiles.forEach((t) => t.classList.add("in"));
    io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.style.transitionDelay = `${(+getComputedStyle(e.target).getPropertyValue("--c") || 1) * 25}ms`;
          e.target.classList.add("in");
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -4% 0px" }
    );
    tiles.forEach((t) => io.observe(t));
  }

  /* ---------- lightbox ---------- */
  const lb = document.getElementById("lightbox");
  const lbImg = lb.querySelector("img");
  const lbCount = lb.querySelector(".lb-count");
  let lbIndex = 0;
  const lbList = () => boardsOf(current).flatMap((b) => b.board.filter((t) => t.src));

  function openLB(i) {
    lbIndex = i;
    showLB();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function showLB() {
    const list = lbList();
    lbIndex = (lbIndex + list.length) % list.length;
    const t = list[lbIndex];
    lbImg.src = t.src;
    lb.querySelector(".lb-stage").style.setProperty("--lb-bg", t.fit === "contain" && t.bg ? t.bg : "transparent");
    lbImg.classList.toggle("blend", !!t.blend);
    lbCount.textContent = `${lbIndex + 1} / ${list.length}`;
  }
  function closeLB() {
    lb.hidden = true;
    lbImg.removeAttribute("src");
    document.body.style.overflow = "";
  }

  app.addEventListener("click", (e) => {
    const t = e.target.closest(".tile.pic");
    if (t) openLB(+t.dataset.i);
  });
  lb.querySelector(".lb-close").onclick = closeLB;
  lb.querySelector(".lb-prev").onclick = () => { lbIndex--; showLB(); };
  lb.querySelector(".lb-next").onclick = () => { lbIndex++; showLB(); };
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lb-stage")) closeLB(); });
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLB();
    if (e.key === "ArrowLeft") { lbIndex--; showLB(); }
    if (e.key === "ArrowRight") { lbIndex++; showLB(); }
  });
  let touchX = null;
  lb.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) { lbIndex += dx < 0 ? 1 : -1; showLB(); }
    touchX = null;
  });

  /* ---------- router ---------- */
  function route() {
    if (!lb.hidden) closeLB();
    const slug = location.hash.replace(/^#\/?/, "");
    const p = projects.find((x) => x.slug === slug);
    current = null;
    app.style.animation = "none";
    void app.offsetWidth;
    app.style.animation = "";
    p ? renderProject(p) : renderHome();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();
