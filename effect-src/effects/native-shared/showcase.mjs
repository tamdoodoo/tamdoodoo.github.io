// Product applications share composition and behavior, not a second artwork renderer.
const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]
  )
const spec = (label, title, body, action, why, group) => ({
  label,
  title,
  body,
  action,
  why,
  group,
  layout: "showcase",
})
export const showcaseContexts = {
  signup: spec(
    "Immersive signup",
    "Make room for your next idea.",
    "A shared space for the things you are ready to make.",
    "Create workspace",
    "A full-bleed brand backdrop with a quiet, readable signup surface.",
    "Acquisition"
  ),
  split: spec(
    "Split-screen signup",
    "Your next chapter starts here.",
    "Bring your references, ideas and team into one creative workspace.",
    "Get started",
    "A dedicated brand panel gives the signup flow its own visual identity.",
    "Acquisition"
  ),
  profile: spec(
    "Social profile",
    "A new perspective on what comes next.",
    "Independent ideas, experiments and things worth sharing.",
    "Follow",
    "A cover and profile system for a brand launch or social presence.",
    "Branding"
  ),
  campaign: spec(
    "Campaign poster",
    "Something worth looking closer at.",
    "Notes on form, feeling and the possibilities in between.",
    "Save poster",
    "A typography-led campaign for social feeds, announcements and editorial launches.",
    "Branding"
  ),
  feature: spec(
    "Feature card",
    "A different way to see the whole picture.",
    "Connect the details. Find a direction. Make your next move with a little more clarity.",
    "Explore feature",
    "A reusable product feature card with a dedicated illustration area.",
    "Product"
  ),
  welcome: spec(
    "Onboarding",
    "A little space for a new beginning.",
    "Collect your first reference, explore a direction and make this workspace your own.",
    "Continue",
    "An illustrated onboarding sequence with clear progress and an uninterrupted next step.",
    "Product"
  ),
  story: spec(
    "Editorial story",
    "Good things begin with a different perspective.",
    "A field guide to the shapes, systems and small decisions behind thoughtful work.",
    "Read the story",
    "An editorial cover that connects a brand visual to useful reading content.",
    "Branding"
  ),
  case: spec(
    "Brand spotlight",
    "Small details. A lasting impression.",
    "An exploration of the visual language behind a thoughtful product experience.",
    "Save this direction",
    "A translucent editorial card turns the artwork into a cohesive campaign system.",
    "Branding"
  ),
  mobile: spec(
    "Mobile welcome",
    "Your ideas. A little closer.",
    "A place for the references and discoveries you want to keep.",
    "Get started",
    "A realistic device frame, edge-to-edge artwork and a readable mobile welcome flow.",
    "Product"
  ),
  hero: spec(
    "Brand hero",
    "Give your ideas room to take shape.",
    "Explore a new perspective. Build on what catches your eye. Make something that feels like you.",
    "Explore the collection",
    "An edge-to-edge artwork backdrop with editorial typography and a readable primary action.",
    "Acquisition"
  ),
}
export const newShowcaseKeys = [
  "signup",
  "split",
  "profile",
  "campaign",
  "feature",
  "welcome",
  "story",
  "case",
]
const mark =
  '<svg class="sc-mark" viewBox="0 0 40 40" aria-hidden="true"><path fill="currentColor" d="M20 2C20 12 12 20 2 20c10 0 18 8 18 18 0-10 8-18 18-18C28 20 20 12 20 2Z"/><circle cx="20" cy="20" r="5" fill="var(--sc-paper,#f7f6f2)"/></svg>'
export function showcaseMarkup(
  key,
  { brand = "Forma", title, body, action, art = '<div class="app-art-slot"></div>' } = {}
) {
  const c = showcaseContexts[key] || showcaseContexts.hero,
    b = escape(brand),
    h = escape(title ?? c.title),
    p = escape(body ?? c.body),
    a = escape(action ?? c.action)
  const logo = `<span class="sc-logo">${mark}<b>${b}</b></span>`,
    visual = `<div class="sc-visual">${art}</div>`
  const btn = `<button type="button" class="sc-action" data-sc-action="${key}"><span>${a}</span><span aria-hidden="true">↗</span></button>`
  const feedback = '<p class="sc-feedback" role="status"></p>'
  const form = `<div class="sc-form"><span class="sc-eyebrow">YOUR CREATIVE WORKSPACE</span><h2>${h}</h2><p>${p}</p><div class="sc-demo-field"><small>Work email</small><span>you@studio.com</span></div>${btn}<small class="sc-disclosure">Design preview only. No account is created.</small>${feedback}</div>`
  let html = ""
  if (key === "signup")
    html = `${visual}<div class="sc-signup-top">${logo}<span>CREATE SOMETHING NEW</span></div><section class="sc-auth-card">${mark}${form}</section><span class="sc-colophon">A SPACE FOR YOUR NEXT CHAPTER</span>`
  else if (key === "split")
    html = `<section class="sc-brand-panel">${visual}${logo}<div class="sc-panel-caption"><span class="sc-eyebrow">OPEN TO POSSIBILITY</span><h3>A fresh point<br>of view.</h3><span>01 / A place to begin</span></div></section><section class="sc-signup-panel">${form}</section>`
  else if (key === "profile")
    html = `<section class="sc-profile"><div class="sc-cover">${visual}<div class="sc-cover-copy">${logo}<h2>${h}</h2></div></div><div class="sc-profile-content"><div class="sc-profile-actions"><span class="sc-profile-avatar">${mark}</span>${btn}</div><h3>${b} Studio</h3><span class="sc-handle">Independent creative studio</span><p>${p}</p><div class="sc-profile-meta"><span>Design & culture</span><span>Open to new perspectives ↗</span></div>${feedback}<div class="sc-profile-tabs"><b>Posts</b><span>Collections</span><span>About</span></div><div class="sc-profile-post"><span class="sc-post-avatar">${mark}</span><div><b>${b} Studio <small>· Just now</small></b><p>Our next chapter, in a new light. Explore the visual identity behind it.</p></div></div></div></section>`
  else if (key === "campaign")
    html = `<article class="sc-poster">${visual}<header>${logo}<span>STUDIO NOTES<br>VOLUME 01</span></header><div class="sc-poster-copy"><span class="sc-eyebrow">FORM / FEELING / POSSIBILITY</span><h2>${h}</h2><p>${p}</p></div><footer><span>A NEW PERSPECTIVE</span><span>2026 / 01</span></footer></article>`
  else if (key === "feature")
    html = `<article class="sc-feature-card"><div class="sc-feature-art">${visual}<span class="sc-art-number">EXPLORATION / 001</span></div><div class="sc-feature-copy"><span class="sc-eyebrow">${b} / IN FOCUS</span><h2>${h}</h2><p>${p}</p>${btn}${feedback}</div></article><aside class="sc-margin-note"><span>01</span><span>FORM WITH<br>A PURPOSE</span></aside>`
  else if (key === "case")
    html = `${visual}<article class="sc-spotlight-card">${logo}<div class="sc-seal">${mark}<span>FORM & FEELING<br>STUDIO EXPLORATION</span></div><span class="sc-eyebrow">A STUDY IN VISUAL IDENTITY</span><h2>${h}</h2><p>${p}</p>${btn}${feedback}</article><span class="sc-spotlight-index">IN FOCUS / 001</span>`
  else if (key === "welcome")
    html = `<div class="sc-onboard-shell"><header>${logo}<span>YOUR WORKSPACE / WELCOME</span></header><article class="sc-onboard-card"><div class="sc-onboard-art">${visual}<span class="sc-art-number">A NEW BEGINNING</span></div><div class="sc-onboard-copy"><div class="sc-progress" aria-label="Step 1 of 3"><i class="active"></i><i></i><i></i><small>01 / 03</small></div><h2>${h}</h2><p>${p}</p><div class="sc-onboard-actions"><button type="button" class="sc-back" data-sc-back disabled>Back</button>${btn}</div>${feedback}</div></article><span class="sc-demo-note">Interactive onboarding preview</span></div>`
  else if (key === "story")
    html = `<article class="sc-story"><header>${logo}<span>THE JOURNAL / DESIGN & CULTURE</span></header><div class="sc-story-grid"><div class="sc-story-copy"><span class="sc-eyebrow">FIELD NOTES / ISSUE 01</span><h2>${h}</h2><p>${p}</p>${btn}${feedback}<div class="sc-story-byline"><span class="sc-post-avatar">${mark}</span><span>${b} editorial<br><small>A visual study · 6 min read</small></span></div></div><div class="sc-story-art">${visual}<span class="sc-art-number">FIG. 01 / A STUDY IN FORM</span></div></div></article>`
  else if (key === "mobile")
    html = `<div class="sc-device"><div class="sc-device-screen"><div class="sc-status"><b>9:41</b><i class="sc-island"></i><span><svg viewBox="0 0 48 16" aria-label="Full signal and battery"><path d="M1 13v-3h3v3zm5 0V7h3v6zm5 0V4h3v9zm5 0V1h3v12z" fill="currentColor"/><path d="M23 5q5-5 10 0m-8 3q3-3 6 0" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="28" cy="11" r="1.3" fill="currentColor"/><rect x="36" y="3" width="10" height="9" rx="2" fill="none" stroke="currentColor"/><rect x="38" y="5" width="6" height="5" rx="1" fill="currentColor"/></svg></span></div><div class="sc-mobile-art">${visual}</div><div class="sc-mobile-brand">${logo}</div><div class="sc-mobile-copy"><span class="sc-eyebrow">A NEW PERSPECTIVE, EVERY DAY</span><h2>${h}</h2><p>${p}</p>${btn}${feedback}<span class="sc-mobile-foot">Your space to explore.</span></div><span class="sc-home-indicator"></span></div></div>`
  else
    html = `${visual}<div class="sc-hero-shade" aria-hidden="true"></div><header class="sc-hero-header">${logo}<span>Independent thinking.<br>Shared possibilities.</span></header><div class="sc-hero-grid"><div class="sc-hero-copy"><span class="sc-eyebrow"><i aria-hidden="true"></i>A PLACE TO BEGIN</span><h2>${h}</h2><p>${p}</p>${btn}${feedback}</div></div><footer class="sc-hero-footer"><span>CURIOUS BY DESIGN</span><span>FORM / FEELING / POSSIBILITY</span><span aria-hidden="true">↘</span></footer>`
  return `<div class="sc-scene sc-${key}" data-scene="${key}">${html}</div>`
}

// Self-contained so the same behavior can be included in an offline HTML export.
export function bindShowcase(root) {
  root.querySelectorAll("[data-scene]").forEach((scene) => {
    if (scene.dataset.scBound) return
    scene.dataset.scBound = "true"
    let step = Math.max(
      0,
      Math.min(2, parseInt(scene.querySelector(".sc-progress small")?.textContent || "1", 10) - 1)
    )
    const button = scene.querySelector("[data-sc-action]"),
      back = scene.querySelector("[data-sc-back]"),
      feedback = scene.querySelector(".sc-feedback")
    if (!button) return
    const original = button.dataset.scLabel || button.querySelector("span").textContent
    button.dataset.scLabel = original
    scene.dataset.scTitle ??= scene.querySelector("h2")?.textContent || ""
    scene.dataset.scBody ??= scene.querySelector(".sc-onboard-copy>p")?.textContent || ""
    const update = () => {
      const titles = [
        scene.dataset.scTitle,
        "Bring your references together.",
        "Ready for your first direction.",
      ]
      scene.querySelector("h2").textContent = titles[step]
      scene.querySelector(".sc-onboard-copy>p").textContent = [
        scene.dataset.scBody,
        "Keep the visual ideas that matter to your project in one place.",
        "Your sample workspace is ready. Continue in UX Pilot to develop the full experience.",
      ][step]
      scene
        .querySelectorAll(".sc-progress i")
        .forEach((x, i) => x.classList.toggle("active", i <= step))
      scene.querySelector(".sc-progress small").textContent = "0" + (step + 1) + " / 03"
      scene.querySelector(".sc-progress").setAttribute("aria-label", "Step " + (step + 1) + " of 3")
      button.querySelector("span").textContent = step === 2 ? "Finish preview" : original
      back.disabled = step === 0
      feedback.textContent = "Step " + (step + 1) + " of 3"
    }
    if (back)
      back.onclick = () => {
        step = Math.max(0, step - 1)
        update()
      }
    button.onclick = () => {
      const kind = button.dataset.scAction
      if (kind === "welcome") {
        if (step < 2) {
          step++
          update()
        } else feedback.textContent = "Onboarding preview complete. Nothing was submitted."
      } else if (kind === "profile") {
        const following = button.getAttribute("aria-pressed") !== "true"
        button.setAttribute("aria-pressed", String(following))
        button.querySelector("span").textContent = following ? "Following" : original
        feedback.textContent = following
          ? "Following in this preview only."
          : "Preview follow removed."
      } else if (["signup", "split", "mobile"].includes(kind))
        feedback.textContent =
          "Preview complete. Use “Create in UX Pilot” above to build your own screen. No account was created."
      else {
        const active = button.getAttribute("aria-pressed") !== "true"
        button.setAttribute("aria-pressed", String(active))
        button.querySelector("span").textContent = active ? "Saved to preview" : original
        feedback.textContent = active
          ? "Saved in this example only. Your artwork and tool settings are unchanged."
          : "Removed from this preview."
      }
    }
  })
}
