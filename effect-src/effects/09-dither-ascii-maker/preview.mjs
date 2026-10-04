import { showcaseMarkup, newShowcaseKeys, bindShowcase } from "../native-shared/showcase.mjs"
import { applicationStyles } from "../native-shared/styles.mjs"
import { productFeedback, productMarkupFor, productStyles } from "./product.mjs"
export const previewIds = [
  "compare",
  "result",
  "hero",
  "workspace",
  "player",
  "mobile",
  "article",
  ...newShowcaseKeys.filter((k) => k !== "story"),
]
export function mountDitherPreview(root, canvas, previewId, onCut) {
  root.replaceChildren()
  root.dataset.previewId = previewId
  root.style.cssText = "position:relative;display:block;width:100%;height:100%;overflow:hidden"
  if (["canvas", "compare", "result"].includes(previewId)) {
    root.append(canvas)
    if (previewId !== "compare") return null
    const original = root.ownerDocument.createElement("canvas")
    original.setAttribute("aria-label", "Original source")
    original.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none"
    root.append(original)
    const divider = root.ownerDocument.createElement("div")
    divider.setAttribute("role", "slider")
    divider.setAttribute("aria-label", "Compare source and result")
    divider.tabIndex = 0
    divider.setAttribute("aria-valuemin", "0")
    divider.setAttribute("aria-valuemax", "100")
    divider.style.cssText =
      "position:absolute;top:0;bottom:0;width:3px;background:white;cursor:ew-resize;touch-action:none"
    root.append(divider)
    const set = (e) =>
      onCut(
        Math.max(
          0,
          Math.min(100, ((e.clientX - root.getBoundingClientRect().left) / root.clientWidth) * 100)
        )
      )
    divider.onpointerdown = (e) => {
      divider.setPointerCapture(e.pointerId)
      set(e)
    }
    divider.onpointermove = (e) => {
      if (divider.hasPointerCapture(e.pointerId)) set(e)
    }
    divider.onkeydown = (e) => {
      if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault()
        onCut(
          Math.max(
            0,
            Math.min(100, +divider.getAttribute("aria-valuenow") + (e.key === "ArrowLeft" ? -1 : 1))
          )
        )
      }
    }
    return { original, divider }
  }
  root.innerHTML = `<style>${applicationStyles}${productStyles}</style>${ditherApplicationMarkup(previewId)}`
  const art = root.querySelector("[data-dither-art]")
  if (art) {
    art.replaceWith(canvas)
    bindShowcase(root)
  } else {
    root.querySelector("#heroCv").replaceWith(canvas)
    root.querySelector("#dtProductAction").onclick = () =>
      (root.querySelector("#dtProductFeedback").textContent = productFeedback(previewId))
  }
  return null
}

const showcaseScene = (previewId) =>
  ({ hero: "hero", article: "story", mobile: "mobile" })[previewId] || previewId
/**
 * An application preview's markup, shared by the live preview and the static UI a placed
 * design is made of. `art` takes the processed media's place (the live preview swaps in its
 * canvas); it defaults to the element the live preview looks for.
 */
export function ditherApplicationMarkup(previewId, { art } = {}) {
  const scene = showcaseScene(previewId)
  const showcase = newShowcaseKeys.includes(scene) || ["hero", "mobile"].includes(scene)
  return `<div class="dt-hero" data-context="${previewId}" style="width:100%;height:100%">${
    showcase
      ? showcaseMarkup(scene, { brand: "Fieldwork", art: art ?? "<span data-dither-art></span>" })
      : productMarkupFor(previewId, art === undefined ? {} : { art })
  }</div>`
}
