import { createDitherPipeline, DITHER_PALETTES } from "./dither-engine.mjs"
import { createDitherSample } from "./samples.mjs"
import { mountDitherPreview, previewIds } from "./preview.mjs"
import { resolveAssets } from "../native-shared/assets.mjs"

const defaults = {
  look: "macpaint",
  mode: "dither",
  view: "compare",
  source: "sample",
  sample: "still",
  cut: 40,
  crop: "orig",
  cropX: 50,
  cropY: 50,
  frameFit: "contain",
  bright: 0,
  con: 15,
  gamma: 100,
  sat: 0,
  blur: 0,
  sharpen: 0,
  invert: false,
  algo: "atkinson",
  px: 2,
  strength: 100,
  serp: true,
  pal: "1bit",
  levels: 2,
  ink: "#111111",
  paper: "#F4F1EA",
  charset: "standard",
  custom: ".:uxpilot@",
  csize: 10,
  aspect: 60,
  edges: 0,
  weight: "600",
  acolor: "mono",
  aFg: "#E9E4FF",
  aBg: "#130537",
  shape: "dots",
  cell: 10,
  gap: 10,
  scolor: "mono",
  scan: 0,
  bloom: 0,
  chroma: 0,
  vig: 0,
  grain: 0,
  anim: "none",
  speed: 40,
  time: 0,
  playing: false,
}
const clone = (value) => structuredClone(value)
const knownAlgorithms = new Set([
  "fs",
  "atkinson",
  "jjn",
  "stucki",
  "burkes",
  "sierra",
  "sierralite",
  "bayer2",
  "bayer4",
  "bayer8",
  "blue",
  "halftone",
  "random",
  "threshold",
])
function normalize(input) {
  const state = { ...defaults, ...input }
  delete state.$playback
  if (!new Set(["dither", "ascii", "shapes"]).has(state.mode))
    throw new RangeError("Unsupported output mode")
  if (!knownAlgorithms.has(state.algo)) throw new RangeError("Unsupported dither algorithm")
  if (!DITHER_PALETTES[state.pal]) throw new RangeError("Unsupported palette")
  if (!["contain", "cover"].includes(state.frameFit)) throw new RangeError("Unsupported fit")
  if (!["still", "alpine", "type"].includes(state.sample))
    throw new RangeError("Unsupported sample")
  if (!Number.isFinite(state.px) || state.px < 1 || state.px > 24)
    throw new RangeError("px must be between 1 and 24")
  if (!Number.isFinite(state.time) || state.time < 0)
    throw new RangeError("time must be finite and non-negative")
  if (typeof state.playing !== "boolean") throw new RangeError("Invalid playing state")
  return state
}
const CROP_RATIOS = { sq: 1, portrait: 0.8, landscape: 1.5, wide: 16 / 9, story: 9 / 16 }
// A preview's local video is copied into memory: at most what the editor lets a visitor pick.
const MAX_VIDEO_BYTES = 100 * 1024 * 1024
/** A picture's own size: an image's, a canvas's, or a video's frame. */
const pictureSize = (source) => [
  source.videoWidth || source.naturalWidth || source.width,
  source.videoHeight || source.naturalHeight || source.height,
]
/** The artwork's shape: the chosen crop, or the picture's own for "Original". */
const artworkRatio = (source, state) => {
  const [width, height] = pictureSize(source)
  return CROP_RATIOS[state.crop] || width / height
}
function cropSource(document, source, state, width, height) {
  const [sourceWidth, sourceHeight] = pictureSize(source),
    ratio = artworkRatio(source, state)
  let sw = sourceWidth,
    sh = sourceHeight,
    sx = 0,
    sy = 0
  if (sourceWidth / sourceHeight > ratio) {
    sw = sourceHeight * ratio
    sx = (sourceWidth - sw) * ((state.cropX ?? 50) / 100)
  } else {
    sh = sourceWidth / ratio
    sy = (sourceHeight - sh) * ((state.cropY ?? 50) / 100)
  }
  // A frame the artwork fills (a product mockup, a placed design's slot) crops it further to
  // its own shape, where the crop position says, rather than stretching it.
  const target = width / height
  if (sw / sh > target) {
    sx += (sw - sh * target) * ((state.cropX ?? 50) / 100)
    sw = sh * target
  } else {
    sy += (sh - sw / target) * ((state.cropY ?? 50) / 100)
    sh = sw / target
  }
  const cropped = document.createElement("canvas")
  cropped.width = width
  cropped.height = height
  cropped.getContext("2d").drawImage(source, sx, sy, sw, sh, 0, 0, width, height)
  return cropped
}

export const definition = {
  id: "09-dither-ascii-maker",
  capabilities: { videoPlayback: true, animated: true, playback: true, seek: true },
  // A video plays (muted, looping) with the effect's Play/Pause and seeks; a video frame is a
  // still taken from one.
  assetSlots: [{ slot: "source", uses: ["image", "video-frame", "video"] }],
}
export async function mount(host, initial = {}) {
  const editing = initial.editor === true
  // A placed design owns its UI as HTML and hands the effect a slot: the processed media
  // fills it, with no product markup of its own.
  const embedded = initial.embed === true
  if (!host?.ownerDocument?.defaultView || !host.isConnected)
    throw new TypeError("A connected browser host is required")
  const document = host.ownerDocument,
    canvas = document.createElement("canvas"),
    root = document.createElement("div"),
    context = canvas.getContext("2d", { willReadFrequently: true }),
    renderer = createDitherPipeline({ document })
  canvas.dataset.uxpPilot = definition.id
  canvas.setAttribute("aria-label", "Processed media")
  canvas.style.cssText = "display:block;width:100%;height:100%;image-rendering:pixelated"
  let disposed = false,
    state = normalize(
      initial.settings ||
        Object.fromEntries(
          Object.entries(initial).filter(
            ([key]) => !["assets", "playback", "previewId", "width", "height"].includes(key)
          )
        )
    ),
    assets = clone(initial.assets || []),
    source = null,
    generation = 0,
    observer,
    frame = 0,
    last = null,
    previewId = embedded ? "result" : initial.previewId || initial.settings?.view || "result",
    compare = null,
    sample = null,
    sampleKey = null
  const view = document.defaultView
  const assetController = new view.AbortController()
  // The playing source video: its element, the URL it plays from (this document's own when it
  // came as a blob), and the upload it is, so an update with the same upload keeps it playing.
  let video = null
  if (assets.length && !Object.hasOwn(initial.settings || initial, "source"))
    state.source = "upload"
  const motion = view.matchMedia("(prefers-reduced-motion: reduce)")
  const playback = (next, value) => {
    if (value !== undefined) {
      if (
        !value ||
        typeof value.playing !== "boolean" ||
        !Number.isFinite(value.timeSeconds) ||
        value.timeSeconds < 0
      )
        throw new RangeError("Invalid playback")
      next.playing = value.playing
      next.time = value.timeSeconds
    }
    if (motion.matches) next.playing = false
    return next
  }
  state = playback(state, initial.playback)
  const validatePreview = (id) => {
    if (id !== "canvas" && !previewIds.includes(id)) throw new RangeError("Unsupported preview")
  }
  validatePreview(previewId)
  state.view = previewId === "canvas" ? "result" : previewId
  host.append(root)
  // In a UI's frame (a product mockup, a placed design's slot) rather than shown as the artwork
  // itself. A UI's frame is always filled; Fit and Fill are for the artwork on its own.
  let framed = false
  const preview = () => {
    // The source/result split is an editing aid: a placed design shows only the result.
    const shown = !editing && previewId === "compare" ? "result" : previewId
    compare = mountDitherPreview(root, canvas, shown, (cut) => {
      state.cut = cut
      draw()
    })
    framed = embedded || !["canvas", "compare", "result"].includes(shown)
    // On its own the canvas has the artwork's shape and is shown whole; in a frame the canvas
    // is the frame, so either way nothing is stretched.
    canvas.style.objectFit = framed ? "cover" : "contain"
    if (compare) compare.original.style.objectFit = "contain"
  }
  // The artwork on its own, in the canvas it is given (the editor's canvas size, or a placed
  // artwork's): Fit, the largest box of its shape inside it, shown whole; Fill, all of it.
  const artworkBox = (ratio) => {
    const box = host.getBoundingClientRect(),
      width = Math.max(1, Math.round(initial.width || box.width || 900)),
      height = Math.max(1, Math.round(initial.height || box.height || 600))
    if (state.frameFit === "cover") return [width, height]
    return width / height > ratio
      ? [Math.max(1, Math.round(height * ratio)), height]
      : [width, Math.max(1, Math.round(width / ratio))]
  }
  // Drawn at one canvas pixel per CSS pixel, never stretched: in a UI's frame the canvas is the
  // frame (its layout size, which a zoomed canvas page does not change); otherwise it is the
  // artwork's box. Where the canvas has another shape, the artwork covers it from the crop
  // position.
  const size = (ratio) => {
    const fitted =
      framed && canvas.clientWidth && canvas.clientHeight
        ? [canvas.clientWidth, canvas.clientHeight]
        : artworkBox(ratio)
    if (canvas.width !== fitted[0]) canvas.width = fitted[0]
    if (canvas.height !== fitted[1]) canvas.height = fitted[1]
  }
  let cursorTarget = { x: -2, y: -2 }, cursor = { x: -2, y: -2 }, cursorActive = 0, targetActive = 0
  const interactionArea = document.documentElement
  const cursorMove = (event) => {
    const box = host.getBoundingClientRect()
    cursorTarget = { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height }
    if (!targetActive) cursor = { ...cursorTarget }
    targetActive = 1
  }
  const cursorLeave = () => { targetActive = 0 }
  interactionArea.addEventListener('pointermove', cursorMove)
  interactionArea.addEventListener('pointerleave', cursorLeave)
  const draw = () => {
    if (disposed) return
    const selectedSource = state.source === "sample" ? null : source
    if (!selectedSource && sampleKey !== state.sample) {
      sample = createDitherSample(document, state.sample)
      sampleKey = state.sample
    }
    const picture = selectedSource || sample,
      ratio = artworkRatio(picture, state)
    size(ratio)
    context.fillStyle = state.paper
    context.fillRect(0, 0, canvas.width, canvas.height)
    const cropped = cropSource(document, picture, state, canvas.width, canvas.height)
    cursor.x += (cursorTarget.x - cursor.x) * 0.16
    cursor.y += (cursorTarget.y - cursor.y) * 0.16
    cursorActive += (targetActive - cursorActive) * 0.12
    state.cursorX = cursor.x * canvas.width
    state.cursorY = cursor.y * canvas.height
    state.cursorStrength = motion.matches ? 0 : cursorActive
    renderer.pipeline(context, cropped, canvas.width, canvas.height, state, 1, state.time)
    if (compare) {
      compare.original.width = canvas.width
      compare.original.height = canvas.height
      compare.original.getContext("2d").drawImage(cropped, 0, 0)
      const cut = Math.max(0, Math.min(100, state.cut))
      compare.original.style.clipPath = `inset(0 ${100 - cut}% 0 0)`
      compare.divider.style.left = cut + "%"
      compare.divider.setAttribute("aria-valuenow", String(cut))
    }
  }
  const loadVideo = async (binding) => {
    // The preview's blob URL is copied, as the preview revokes the ones it passes once an update
    // settles. Anything else streams from its URL: a placed design's signed URL (the canvas
    // renews it before it expires, reloading the page), or an export's embedded or packaged
    // file. The first frame shows as soon as it arrives, without reading the whole file first.
    let url = binding.data,
      owned = false
    if (url.startsWith("blob:")) {
      const file = await (await view.fetch(url, { signal: assetController.signal })).blob()
      if (file.size > MAX_VIDEO_BYTES) throw new RangeError("Source video exceeds the video limit")
      url = view.URL.createObjectURL(file)
      owned = true
    }
    const element = document.createElement("video")
    element.muted = true
    element.loop = true
    element.playsInline = true
    element.preload = "auto"
    // Pixels read back from a video of another origin need it served with CORS; an export's
    // packaged file is the page's own.
    if (/^https?:/iu.test(url) && new URL(url).origin !== view.location.origin)
      element.crossOrigin = "anonymous"
    element.src = url
    try {
      await new Promise((resolve, reject) => {
        const timer = view.setTimeout(() => fail(), 20000)
        const fail = () => {
          view.clearTimeout(timer)
          reject(new Error("Source video could not be decoded"))
        }
        element.addEventListener(
          "loadeddata",
          () => {
            view.clearTimeout(timer)
            resolve()
          },
          { once: true }
        )
        element.addEventListener("error", fail, { once: true })
        assetController.signal.addEventListener("abort", fail, { once: true })
      })
    } catch (error) {
      if (owned) view.URL.revokeObjectURL(url)
      throw error
    }
    // A paused video shows the frame a seek lands on once it has loaded.
    element.addEventListener("seeked", () => draw())
    return { element, url, owned, assetId: binding.assetId }
  }
  const releaseVideo = (record) => {
    if (!record) return
    record.element.pause()
    record.element.removeAttribute("src")
    record.element.load()
    if (record.owned) view.URL.revokeObjectURL(record.url)
  }
  /** A decoded source becomes the one drawn: a video's element, or the image. */
  const commitSource = (decoded) => {
    const next = decoded?.element ? decoded : null
    if (video && video !== next) releaseVideo(video)
    video = next
    source = next ? next.element : decoded
  }
  // Where a source video may come from: the preview's blob URL, a signed https URL, a file
  // embedded in or packaged with an export (a data URL, `assets/…`), or a local test server.
  const videoSource = (binding) => {
    if (binding.slot !== "source" || typeof binding.data !== "string") return false
    if (/^data:video\//iu.test(binding.data) || /^\.?\/?assets\/[A-Za-z0-9_.-]+$/u.test(binding.data))
      return true
    try {
      const url = new URL(binding.data, document.baseURI)
      return (
        !url.username &&
        !url.password &&
        (["blob:", "https:"].includes(url.protocol) ||
          (url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)))
      )
    } catch {
      return false
    }
  }
  // A video plays from its URL; every other asset is resolved to its bytes.
  const resolveSources = async (bindings) => {
    if (!Array.isArray(bindings)) throw new RangeError("Assets must be an array")
    const videos = bindings.filter((binding) => binding?.use === "video")
    for (const binding of videos) if (!videoSource(binding)) throw new RangeError("Invalid resolved asset binding")
    const resolved = await resolveAssets(
      bindings.filter((binding) => binding?.use !== "video"),
      definition,
      document,
      assetController.signal
    )
    return [...resolved, ...clone(videos)]
  }
  // The video follows the effect's playback: it plays while the effect plays and is shown,
  // and a seek moves it to the effect's time within its length.
  const syncVideo = () => {
    if (!video) return
    const playing =
      !disposed && state.source !== "sample" && state.playing && !document.hidden && !motion.matches
    if (playing && video.element.paused) video.element.play().catch(() => {})
    else if (!playing && !video.element.paused) video.element.pause()
  }
  const seekVideo = () => {
    const duration = video?.element.duration
    if (Number.isFinite(duration) && duration > 0) video.element.currentTime = state.time % duration
  }
  const decode = async (binding) => {
    if (!binding) return null
    if (!definition.assetSlots[0].uses.includes(binding.use))
      throw new RangeError("Unsupported source asset use")
    if (binding.use === "video") {
      if (video && binding.assetId && video.assetId === binding.assetId) return video
      return loadVideo(binding)
    }
    const image = new document.defaultView.Image()
    image.src = binding.data?.startsWith("data:")
      ? binding.data
      : (await resolveAssets([binding], definition, document, assetController.signal))[0].data
    try {
      await image.decode()
    } catch {
      throw new Error("Source image could not be decoded")
    }
    return image
  }
  const schedule = () => {
    syncVideo()
    view.cancelAnimationFrame(frame)
    last = null
    if (!disposed && state.playing && !document.hidden && !motion.matches)
      frame = view.requestAnimationFrame(tick)
  }
  const tick = (now) => {
    if (disposed || !state.playing || document.hidden || motion.matches) return
    if (last !== null) state.time += Math.max(0, (now - last) / 1000)
    last = now
    draw()
    frame = view.requestAnimationFrame(tick)
  }
  const motionChanged = () => {
    if (motion.matches) state.playing = false
    schedule()
  }
  try {
    assets = await resolveSources(assets)
    commitSource(await decode(assets.find((item) => item.slot === "source")))
    seekVideo()
  } catch (error) {
    root.remove()
    throw error
  }
  preview()
  draw()
  observer = new document.defaultView.ResizeObserver(draw)
  observer.observe(host)
  document.addEventListener("visibilitychange", schedule)
  motion.addEventListener("change", motionChanged)
  schedule()
  return {
    async update(patch = {}) {
      if (disposed) throw new Error("Effect has been disposed")
      const token = ++generation,
        settingsPatch = Object.hasOwn(patch, "settings")
          ? patch.settings
          : Object.fromEntries(
              Object.entries(patch).filter(
                ([key]) => !["assets", "playback", "previewId"].includes(key)
              )
            ),
        nextState = playback(normalize({ ...state, ...clone(settingsPatch) }), patch.playback),
        nextAssets = Object.hasOwn(patch, "assets") ? await resolveSources(patch.assets) : assets,
        nextPreview = embedded ? "result" : (patch.previewId ?? settingsPatch?.view ?? previewId)
      validatePreview(nextPreview)
      const sourceUpdated = Object.hasOwn(patch, "assets"),
        nextSource = sourceUpdated
          ? await decode(nextAssets.find((item) => item.slot === "source"))
          : source
      if (
        Object.hasOwn(patch, "assets") &&
        nextAssets.length &&
        !Object.hasOwn(settingsPatch, "source") &&
        JSON.stringify(nextAssets) !== JSON.stringify(assets)
      )
        nextState.source = "upload"
      if (disposed || token !== generation) {
        // A video this superseded update loaded is not the one playing.
        if (nextSource?.element && nextSource !== video) releaseVideo(nextSource)
        return
      }
      const sourceChanged = nextState.source !== state.source
      if (!Object.hasOwn(settingsPatch || {}, "time") && patch.playback === undefined)
        nextState.time = state.time
      nextState.view = nextPreview === "canvas" ? "result" : nextPreview
      // An explicit time (a seek, Restart) moves the video; so does a new one.
      const seeking = Object.hasOwn(settingsPatch || {}, "time") || patch.playback !== undefined,
        videoChanged = sourceUpdated && nextSource?.element && nextSource !== video
      state = nextState
      assets = nextAssets
      if (sourceUpdated) commitSource(nextSource)
      if (seeking || videoChanged) seekVideo()
      if (previewId !== nextPreview) {
        previewId = nextPreview
        preview()
      }
      draw()
      schedule()
      if (sourceChanged)
        root.dispatchEvent(new view.CustomEvent("uxp-effect:change", { bubbles: true }))
    },
    snapshot() {
      if (disposed) throw new Error("Effect has been disposed")
      return {
        settings: clone(state),
        previewId,
        playback: { playing: state.playing, timeSeconds: state.time },
        assets: clone(assets),
      }
    },
    /** The same grid at `pixelRatio` times the pixels: the pipeline scales cell sizes. */
    async exportPNG({ pixelRatio = 1 } = {}) {
      if (disposed) throw new Error("Disposed effect")
      const k = Math.min(3, Math.max(1, Math.round(Number(pixelRatio) || 1)))
      // The bare artwork, whichever view is showing: a product mockup's frame is not exported.
      const picture = (state.source === "sample" ? null : source) || sample,
        [width, height] = artworkBox(artworkRatio(picture, state))
      let output = canvas
      if (k > 1 || canvas.width !== width || canvas.height !== height) {
        output = document.createElement("canvas")
        output.width = width * k
        output.height = height * k
        const octx = output.getContext("2d")
        octx.fillStyle = state.paper
        octx.fillRect(0, 0, output.width, output.height)
        const cropped = cropSource(document, picture, state, output.width, output.height)
        renderer.pipeline(octx, cropped, output.width, output.height, state, k, state.time)
      }
      return new Promise((resolve, reject) =>
        output.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed"))),
          "image/png"
        )
      )
    },
    renderSnapshot() {
      if (disposed) throw new Error("Effect has been disposed")
      return canvas.toDataURL("image/png")
    },
    getCapabilities() {
      return clone(definition.capabilities)
    },
    dispose() {
      if (disposed) return
      disposed = true
      assetController.abort()
      generation++
      view.cancelAnimationFrame(frame)
      document.removeEventListener("visibilitychange", schedule)
      motion.removeEventListener("change", motionChanged)
      observer?.disconnect()
      releaseVideo(video)
      video = null
      interactionArea.removeEventListener('pointermove', cursorMove)
      interactionArea.removeEventListener('pointerleave', cursorLeave)
      root.remove()
    },
  }
}
