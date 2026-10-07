export const DITHER_PALETTES = {
  "1bit": { label: "1-bit", type: "duo", sw: ["#111111", "#F4F1EA"] },
  duotone: { label: "Duotone", type: "duo", sw: ["#130537", "#9B8CFF", "#E9E4FF"] },
  gray: { label: "Grayscale", type: "gray", sw: ["#000000", "#555555", "#AAAAAA", "#FFFFFF"] },
  original: { label: "Original", type: "orig", sw: ["#E4572E", "#F2A541", "#3F20FB", "#16A34A"] },
  gameboy: { label: "Game Boy", type: "ramp", c: ["#0F380F", "#306230", "#8BAC0F", "#9BBC0F"] },
  sepia: {
    label: "Sepia",
    type: "ramp",
    c: ["#2B1D0E", "#6B4A2B", "#A87F55", "#DCC7A1", "#F5EBD9"],
  },
  terminal: { label: "Terminal", type: "ramp", c: ["#021A0A", "#0F7B3A", "#39FF88"] },
  blueprint: { label: "Blueprint", type: "ramp", c: ["#0B3D91", "#4F7FD6", "#FFFFFF"] },
  cga: { label: "CGA", type: "set", c: ["#000000", "#55FFFF", "#FF55FF", "#FFFFFF"] },
  pico8: {
    label: "PICO-8",
    type: "set",
    c: [
      "#000000",
      "#1D2B53",
      "#7E2553",
      "#008751",
      "#AB5236",
      "#5F574F",
      "#C2C3C7",
      "#FFF1E8",
      "#FF004D",
      "#FFA300",
      "#FFEC27",
      "#00E436",
      "#29ADFF",
      "#83769C",
      "#FF77A8",
      "#FFCCAA",
    ],
  },
  riso: { label: "Riso", type: "set", c: ["#F5EFE6", "#FF48B0", "#0078BF", "#1F1F1F"] },
  neon: { label: "Neon", type: "set", c: ["#0B0F1A", "#22D3EE", "#F472B6", "#FDE68A"] },
}

const defaultHexToRgb = (hex) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16))

export function canonicalOnColor(hex, hexToRgb = defaultHexToRgb) {
  const luminance = canonicalLuminance(hex, hexToRgb)
  const contrast = (other) => {
    const otherLuminance = canonicalLuminance(other, hexToRgb)
    return (
      (Math.max(luminance, otherLuminance) + 0.05) / (Math.min(luminance, otherLuminance) + 0.05)
    )
  }
  return contrast("#FFFFFF") >= contrast("#130537") ? "#FFFFFF" : "#130537"
}

function canonicalLuminance(hex, hexToRgb) {
  return hexToRgb(hex)
    .map((value) => {
      value /= 255
      return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
    })
    .reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0)
}

export function createDitherPipeline({
  document,
  palettes = DITHER_PALETTES,
  ramps = {
    standard: " .:-=+*#%@",
    detailed: " .'^\",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    blocks: " ░▒▓█",
    minimal: " .oO@",
  },
  katakana = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789",
  hexToRgb,
  onColor = canonicalOnColor,
}) {
  const PALS = palettes,
    RAMPS = ramps,
    KATA = katakana
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
  const hash = (i, j, s) => {
    let h = (i * 374761393 + j * 668265263 + s * 2147483647) | 0
    h = ((h ^ (h >>> 13)) * 1274126177) | 0
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296
  }
  const rgbOf = hexToRgb || defaultHexToRgb
  const color = { onColor: (hex) => onColor(hex, rgbOf) }
  const off = document.createElement("canvas"),
    offx = off.getContext("2d", { willReadFrequently: true })
  const pix = document.createElement("canvas"),
    pixx = pix.getContext("2d")
  const tmp = document.createElement("canvas"),
    tmpx = tmp.getContext("2d")
  const noise = document.createElement("canvas")
  noise.width = noise.height = 192
  ;(() => {
    const g = noise.getContext("2d"),
      id = g.createImageData(192, 192)
    for (let i = 0; i < id.data.length; i += 4) {
      const v = Math.random() * 255
      id.data[i] = id.data[i + 1] = id.data[i + 2] = v
      id.data[i + 3] = 255
    }
    g.putImageData(id, 0, 0)
  })()
  function sampleGrid(srcC, cols, rows, s) {
    off.width = cols
    off.height = rows
    offx.filter = s.blur > 0 ? "blur(" + ((s.blur / 100) * 2.5).toFixed(2) + "px)" : "none"
    offx.imageSmoothingEnabled = true
    offx.imageSmoothingQuality = "high"
    offx.clearRect(0, 0, cols, rows)
    offx.drawImage(srcC, 0, 0, cols, rows)
    offx.filter = "none"
    const d = offx.getImageData(0, 0, cols, rows).data,
      n = cols * rows,
      rgb = new Float32Array(n * 3)
    const cf = (259 * (s.con * 2.55 + 255)) / (255 * (259 - s.con * 2.55)),
      br = (s.bright / 100) * 0.5,
      gm = 100 / s.gamma,
      sat = 1 + s.sat / 100
    for (let i = 0; i < n; i++) {
      let r = d[i * 4] / 255,
        g = d[i * 4 + 1] / 255,
        b = d[i * 4 + 2] / 255
      const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
      r = L + (r - L) * sat
      g = L + (g - L) * sat
      b = L + (b - L) * sat
      r = Math.pow(clamp01(cf * (r - 0.5) + 0.5 + br), gm)
      g = Math.pow(clamp01(cf * (g - 0.5) + 0.5 + br), gm)
      b = Math.pow(clamp01(cf * (b - 0.5) + 0.5 + br), gm)
      if (s.invert) {
        r = 1 - r
        g = 1 - g
        b = 1 - b
      }
      rgb[i * 3] = r
      rgb[i * 3 + 1] = g
      rgb[i * 3 + 2] = b
    }
    if (s.sharpen > 0 && cols > 2 && rows > 2) {
      const k = (s.sharpen / 100) * 1.4,
        c = rgb.slice()
      for (let y = 1; y < rows - 1; y++)
        for (let x = 1; x < cols - 1; x++)
          for (let ch = 0; ch < 3; ch++) {
            const i = (y * cols + x) * 3 + ch
            rgb[i] = clamp01(
              c[i] * (1 + 4 * k) - k * (c[i - 3] + c[i + 3] + c[i - cols * 3] + c[i + cols * 3])
            )
          }
    }
    return rgb
  }
  function animate(rgb, cols, rows, s, t) {
    if (!t || s.anim === "none" || s.anim === "flicker") return
    const sp = 0.4 + (s.speed / 100) * 2.6
    if (s.anim === "ripple" || s.anim === "ripple+flicker") {
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const dx = x / cols - 0.5,
            dy = ((y / rows - 0.5) * rows) / cols,
            w = Math.sin(Math.hypot(dx, dy) * 30 - t * sp * 4) * 0.12,
            i = (y * cols + x) * 3
          rgb[i] += w
          rgb[i + 1] += w
          rgb[i + 2] += w
        }
    } else {
      const band = ((t * sp * 0.22) % 1.3) - 0.15
      for (let y = 0; y < rows; y++) {
        const g = Math.exp(-Math.pow((y / rows - band) / 0.07, 2)) * 0.5
        if (g < 0.01) continue
        for (let x = 0; x < cols; x++) {
          const i = (y * cols + x) * 3
          rgb[i] += g
          rgb[i + 1] += g
          rgb[i + 2] += g
        }
      }
    }
  }
  const tickOf = (s, t) =>
    (s.anim === "flicker" || s.anim === "ripple+flicker") && t ? Math.floor(t * (1.5 + (s.speed / 100) * 6)) + 1 : 0

  /* ---------- dither ---------- */
  const K = (list, div) => list.map(([x, y, w]) => [x, y, w / div])
  const KERNELS = {
    fs: K(
      [
        [1, 0, 7],
        [-1, 1, 3],
        [0, 1, 5],
        [1, 1, 1],
      ],
      16
    ),
    atkinson: K(
      [
        [1, 0, 1],
        [2, 0, 1],
        [-1, 1, 1],
        [0, 1, 1],
        [1, 1, 1],
        [0, 2, 1],
      ],
      8
    ),
    jjn: K(
      [
        [1, 0, 7],
        [2, 0, 5],
        [-2, 1, 3],
        [-1, 1, 5],
        [0, 1, 7],
        [1, 1, 5],
        [2, 1, 3],
        [-2, 2, 1],
        [-1, 2, 3],
        [0, 2, 5],
        [1, 2, 3],
        [2, 2, 1],
      ],
      48
    ),
    stucki: K(
      [
        [1, 0, 8],
        [2, 0, 4],
        [-2, 1, 2],
        [-1, 1, 4],
        [0, 1, 8],
        [1, 1, 4],
        [2, 1, 2],
        [-2, 2, 1],
        [-1, 2, 2],
        [0, 2, 4],
        [1, 2, 2],
        [2, 2, 1],
      ],
      42
    ),
    burkes: K(
      [
        [1, 0, 8],
        [2, 0, 4],
        [-2, 1, 2],
        [-1, 1, 4],
        [0, 1, 8],
        [1, 1, 4],
        [2, 1, 2],
      ],
      32
    ),
    sierra: K(
      [
        [1, 0, 5],
        [2, 0, 3],
        [-2, 1, 2],
        [-1, 1, 4],
        [0, 1, 5],
        [1, 1, 4],
        [2, 1, 2],
        [-1, 2, 2],
        [0, 2, 3],
        [1, 2, 2],
      ],
      32
    ),
    sierralite: K(
      [
        [1, 0, 2],
        [-1, 1, 1],
        [0, 1, 1],
      ],
      4
    ),
  }
  function bayer(n) {
    let m = [[0]]
    while (m.length < n) {
      const s = m.length,
        nm = []
      for (let y = 0; y < s * 2; y++) {
        nm.push([])
        for (let x = 0; x < s * 2; x++)
          nm[y].push(
            4 * m[y % s][x % s] +
              [
                [0, 2],
                [3, 1],
              ][Math.floor(y / s)][Math.floor(x / s)]
          )
      }
      m = nm
    }
    return m.map((r) => r.map((v) => (v + 0.5) / (n * n)))
  }
  const B2 = bayer(2),
    B4 = bayer(4),
    B8 = bayer(8)
  const ORDERED = {
    bayer2: (x, y) => B2[y % 2][x % 2],
    bayer4: (x, y) => B4[y % 4][x % 4],
    bayer8: (x, y) => B8[y % 8][x % 8],
    blue: (x, y) => {
      const v = 52.9829189 * ((0.06711056 * x + 0.00583715 * y) % 1)
      return v - Math.floor(v)
    },
    halftone: (x, y) => {
      const p = 6,
        u = (x + y) * 0.7071,
        v = (x - y) * 0.7071
      return clamp01(
        0.5 - 0.25 * (Math.cos((u * 2 * Math.PI) / p) + Math.cos((v * 2 * Math.PI) / p))
      )
    },
    random: (x, y) => hash(x, y, 91),
    threshold: () => 0.5,
  }
  function rampFor(s) {
    const P = PALS[s.pal]
    if (P.type === "ramp") return P.c.map(rgbOf)
    if (P.type === "gray") {
      const L = s.levels
      return Array.from({ length: L }, (_, k) => {
        const v = Math.round((k / (L - 1)) * 255)
        return [v, v, v]
      })
    }
    const L = s.pal === "1bit" ? 2 : s.levels,
      a = rgbOf(s.ink),
      b = rgbOf(s.paper)
    return Array.from({ length: L }, (_, k) =>
      a.map((v, c) => Math.round(v + ((b[c] - v) * k) / (L - 1)))
    )
  }
  function dither(rgb, cols, rows, s, tick) {
    const P = PALS[s.pal],
      n = cols * rows,
      outc = new Uint8ClampedArray(n * 3),
      lum = new Float32Array(n)
    const kern = KERNELS[s.algo],
      str = s.strength / 100,
      ord = ORDERED[s.algo] || ORDERED.threshold
    const thr = (x, y) => {
      let t = ord(x, y)
      if (tick) t = clamp01(t + (hash(x, y, tick) - 0.5) * 0.22)
      return 0.5 + (t - 0.5) * str
    }
    const diffuse = (buf, ch, x, y, rev, errs) => {
      for (let k = 0; k < kern.length; k++) {
        const q = kern[k],
          xx = x + (rev ? -q[0] : q[0]),
          yy = y + q[1]
        if (xx < 0 || xx >= cols || yy >= rows) continue
        const j = (yy * cols + xx) * ch
        for (let c = 0; c < ch; c++) buf[j + c] += errs[c] * q[2]
      }
    }
    if (P.type === "set") {
      const pal = P.c.map((h) => rgbOf(h).map((v) => v / 255)),
        buf = rgb,
        e = [0, 0, 0]
      for (let y = 0; y < rows; y++) {
        const rev = s.serp && kern && y & 1
        for (let xi = 0; xi < cols; xi++) {
          const x = rev ? cols - 1 - xi : xi,
            i = y * cols + x
          let r = buf[i * 3],
            g = buf[i * 3 + 1],
            b = buf[i * 3 + 2]
          if (!kern) {
            const o = (thr(x, y) - 0.5) * 0.55
            r += o
            g += o
            b += o
          }
          let best = 0,
            bd = 1e9
          for (let k = 0; k < pal.length; k++) {
            const p = pal[k],
              rm = (r + p[0]) / 2,
              dr = r - p[0],
              dg = g - p[1],
              db = b - p[2],
              dist = (2 + rm) * dr * dr + 4 * dg * dg + (3 - rm) * db * db
            if (dist < bd) {
              bd = dist
              best = k
            }
          }
          const p = pal[best]
          outc[i * 3] = p[0] * 255
          outc[i * 3 + 1] = p[1] * 255
          outc[i * 3 + 2] = p[2] * 255
          lum[i] = 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]
          if (kern) {
            e[0] = (Math.max(-0.5, Math.min(1.5, buf[i * 3])) - p[0]) * str
            e[1] = (Math.max(-0.5, Math.min(1.5, buf[i * 3 + 1])) - p[1]) * str
            e[2] = (Math.max(-0.5, Math.min(1.5, buf[i * 3 + 2])) - p[2]) * str
            diffuse(buf, 3, x, y, rev, e)
          }
        }
      }
    } else if (P.type === "orig") {
      const L = s.levels,
        buf = rgb,
        e = [0, 0, 0]
      for (let y = 0; y < rows; y++) {
        const rev = s.serp && kern && y & 1
        for (let xi = 0; xi < cols; xi++) {
          const x = rev ? cols - 1 - xi : xi,
            i = y * cols + x,
            t = kern ? 0 : thr(x, y)
          let ls = 0
          for (let c = 0; c < 3; c++) {
            const v = buf[i * 3 + c]
            let q
            if (kern) q = Math.round(clamp01(v) * (L - 1))
            else {
              const sc = clamp01(v) * (L - 1),
                lo = Math.floor(sc)
              q = Math.min(L - 1, lo + (sc - lo > t ? 1 : 0))
            }
            const qv = q / (L - 1)
            outc[i * 3 + c] = qv * 255
            e[c] = (Math.max(-0.5, Math.min(1.5, v)) - qv) * str
            ls += qv * [0.2126, 0.7152, 0.0722][c]
          }
          lum[i] = ls
          if (kern) diffuse(buf, 3, x, y, rev, e)
        }
      }
    } else {
      const RC = rampFor(s),
        L = RC.length,
        buf = new Float32Array(n),
        e = [0]
      for (let i = 0; i < n; i++)
        buf[i] = 0.2126 * rgb[i * 3] + 0.7152 * rgb[i * 3 + 1] + 0.0722 * rgb[i * 3 + 2]
      for (let y = 0; y < rows; y++) {
        const rev = s.serp && kern && y & 1
        for (let xi = 0; xi < cols; xi++) {
          const x = rev ? cols - 1 - xi : xi,
            i = y * cols + x,
            v = buf[i]
          let q
          if (kern) {
            q = Math.round(clamp01(v) * (L - 1))
            e[0] = (Math.max(-0.5, Math.min(1.5, v)) - q / (L - 1)) * str
            diffuse(buf, 1, x, y, rev, e)
          } else {
            const sc = clamp01(v) * (L - 1),
              lo = Math.floor(sc)
            q = Math.min(L - 1, lo + (sc - lo > thr(x, y) ? 1 : 0))
          }
          const c = RC[q]
          outc[i * 3] = c[0]
          outc[i * 3 + 1] = c[1]
          outc[i * 3 + 2] = c[2]
          lum[i] = q / (L - 1)
        }
      }
    }
    return { outc, lum }
  }
  function renderDither(ctx, srcC, W, H, s, k, t) {
    const px = Math.max(1, Math.round(s.px * k)),
      cols = Math.max(1, Math.round(W / px)),
      rows = Math.max(1, Math.round(H / px))
    const rgb = sampleGrid(srcC, cols, rows, s)
    animate(rgb, cols, rows, s, t)
    const r = dither(rgb, cols, rows, s, tickOf(s, t))
    pix.width = cols
    pix.height = rows
    const id = pixx.createImageData(cols, rows)
    for (let i = 0; i < cols * rows; i++) {
      id.data[i * 4] = r.outc[i * 3]
      id.data[i * 4 + 1] = r.outc[i * 3 + 1]
      id.data[i * 4 + 2] = r.outc[i * 3 + 2]
      id.data[i * 4 + 3] = 255
    }
    pixx.putImageData(id, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(pix, 0, 0, W, H)
    return { kind: "dither", cols, rows, rgb: r.outc, lum: r.lum, W, H }
  }

  /* ---------- ASCII ---------- */
  const BR = [
    [0x01, 0x02, 0x04, 0x40],
    [0x08, 0x10, 0x20, 0x80],
  ]
  function renderAscii(ctx, srcC, W, H, s, k, t) {
    const cs = Math.max(4, s.csize * k),
      cw = Math.max(2, (cs * s.aspect) / 100),
      cols = Math.max(1, Math.floor(W / cw)),
      rows = Math.max(1, Math.floor(H / cs))
    const braille = s.charset === "braille",
      gc = braille ? cols * 2 : cols,
      gr = braille ? rows * 4 : rows
    const rgb = sampleGrid(srcC, gc, gr, s)
    animate(rgb, gc, gr, s, t)
    const tick = tickOf(s, t),
      fg = rgbOf(s.aFg),
      darkBg = color.onColor(s.aBg) === "#FFFFFF"
    const ramp =
        s.charset === "custom" ? " " + (s.custom || ".:#") : RAMPS[s.charset] || RAMPS.standard,
      nR = ramp.length
    ctx.fillStyle = s.aBg
    ctx.fillRect(0, 0, W, H)
    ctx.font = s.weight + " " + cs + 'px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace'
    ctx.textBaseline = "top"
    const lumAt = (i) => 0.2126 * rgb[i * 3] + 0.7152 * rgb[i * 3 + 1] + 0.0722 * rgb[i * 3 + 2]
    const lines = [],
      cc = new Uint8ClampedArray(cols * rows * 3),
      lum = new Float32Array(cols * rows)
    const edgeOn = s.edges > 0 && !braille,
      eThr = 1.15 - (s.edges / 100) * 0.95
    const fgStr = "rgb(" + fg.join(",") + ")"
    let lastFill = ""
    for (let y = 0; y < rows; y++) {
      let line = ""
      for (let x = 0; x < cols; x++) {
        const ci = y * cols + x
        let ch = " ",
          d = 0,
          r = 0,
          g = 0,
          b = 0
        if (braille) {
          let bits = 0
          for (let sx = 0; sx < 2; sx++)
            for (let sy = 0; sy < 4; sy++) {
              const j = (y * 4 + sy) * gc + x * 2 + sx,
                v = lumAt(j),
                dd = darkBg ? v : 1 - v
              r += rgb[j * 3]
              g += rgb[j * 3 + 1]
              b += rgb[j * 3 + 2]
              if (
                dd >
                ORDERED.bayer4(x * 2 + sx, y * 4 + sy) +
                  (tick ? (hash(x * 2 + sx, y * 4 + sy, tick) - 0.5) * 0.15 : 0)
              ) {
                bits |= BR[sx][sy]
                d += 0.125
              }
            }
          r /= 8
          g /= 8
          b /= 8
          if (bits) ch = String.fromCharCode(0x2800 + bits)
        } else {
          r = rgb[ci * 3]
          g = rgb[ci * 3 + 1]
          b = rgb[ci * 3 + 2]
          const v = clamp01(lumAt(ci))
          d = darkBg ? v : 1 - v
          let edged = false
          if (edgeOn && x > 0 && y > 0 && x < cols - 1 && y < rows - 1) {
            const L = (xx, yy) => lumAt(yy * cols + xx)
            const gx =
                -L(x - 1, y - 1) -
                2 * L(x - 1, y) -
                L(x - 1, y + 1) +
                L(x + 1, y - 1) +
                2 * L(x + 1, y) +
                L(x + 1, y + 1),
              gy =
                -L(x - 1, y - 1) -
                2 * L(x, y - 1) -
                L(x + 1, y - 1) +
                L(x - 1, y + 1) +
                2 * L(x, y + 1) +
                L(x + 1, y + 1)
            if (Math.hypot(gx, gy) > eThr) {
              const a = ((Math.atan2(gy, gx) * 180) / Math.PI + 180) % 180
              ch =
                a < 22.5 || a >= 157.5
                  ? "|"
                  : a < 67.5
                    ? "/"
                    : a < 112.5
                      ? "-"
                      : String.fromCharCode(92)
              edged = true
              d = Math.max(d, 0.8)
            }
          }
          if (!edged) {
            if (s.charset === "matrix") {
              if (d > 0.1)
                ch =
                  KATA[
                    Math.floor(
                      hash(x, y, tick + (s.anim === "scan" && t ? Math.floor(t * 4) : 0)) *
                        KATA.length
                    )
                  ]
            } else if (s.charset === "binary") {
              if (d > 0.2) ch = hash(x, y, tick + 5) < 0.5 ? "0" : "1"
            } else {
              let idx = Math.min(nR - 1, Math.floor(d * nR))
              if (tick && idx > 0 && hash(x, y, tick) < (s.flickerRate ?? 0.07))
                idx = Math.max(1, Math.min(nR - 1, idx + (hash(y, x, tick) < 0.5 ? -1 : 1)))
              ch = ramp[idx]
            }
          }
        }
        line += ch
        lum[ci] = d
        const col =
          s.acolor === "original" ? [clamp01(r) * 255, clamp01(g) * 255, clamp01(b) * 255] : fg
        cc[ci * 3] = col[0]
        cc[ci * 3 + 1] = col[1]
        cc[ci * 3 + 2] = col[2]
        if (ch !== " ") {
          const fill =
            s.charset === "matrix" && s.acolor !== "original"
              ? "rgba(" + fg.join(",") + "," + (0.3 + 0.7 * d).toFixed(2) + ")"
              : s.acolor === "original"
                ? "rgb(" + (col[0] | 0) + "," + (col[1] | 0) + "," + (col[2] | 0) + ")"
                : fgStr
          if (fill !== lastFill) {
            ctx.fillStyle = fill
            lastFill = fill
          }
          const px = x * cw, py = y * cs
          const dx = px - (s.cursorX ?? -10000), dy = py - (s.cursorY ?? -10000)
          const distance = Math.hypot(dx, dy)
          const influence = Math.exp(-distance * distance / (2 * 105 * 105)) * (s.cursorStrength || 0)
          const ripple = Math.sin(distance * 0.065 - t * 5) * influence * 7
          const push = influence * 20 + ripple
          const ox = distance > 0 ? dx / distance * push : 0
          const oy = distance > 0 ? dy / distance * push : 0
          ctx.fillText(ch, px + ox, py + oy)
        }
      }
      lines.push(line)
    }
    return { kind: "ascii", cols, rows, lines, rgb: cc, lum, cw, cs, W, H }
  }

  /* ---------- shapes ---------- */
  function renderShapes(ctx, srcC, W, H, s, k, t) {
    const cell = Math.max(3, s.cell * k),
      cols = Math.max(1, Math.round(W / cell)),
      rows = Math.max(1, Math.round(H / cell)),
      cwid = W / cols,
      chei = H / rows
    const rgb = sampleGrid(srcC, cols, rows, s)
    animate(rgb, cols, rows, s, t)
    const tick = tickOf(s, t),
      ink = rgbOf(s.ink),
      paper = rgbOf(s.paper),
      darkPaper = color.onColor(s.paper) === "#FFFFFF"
    ctx.fillStyle = s.paper
    ctx.fillRect(0, 0, W, H)
    const cc = new Uint8ClampedArray(cols * rows * 3),
      lum = new Float32Array(cols * rows),
      base = Math.min(cwid, chei) * (1 - s.gap / 100)
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x,
          v = clamp01(0.2126 * rgb[i * 3] + 0.7152 * rgb[i * 3 + 1] + 0.0722 * rgb[i * 3 + 2])
        let a = darkPaper ? v : 1 - v
        if (tick) a = clamp01(a + (hash(x, y, tick) - 0.5) * 0.25)
        lum[i] = a
        const cx = x * cwid + cwid / 2,
          cy = y * chei + chei / 2
        let col =
          s.scolor === "original"
            ? [
                clamp01(rgb[i * 3]) * 255,
                clamp01(rgb[i * 3 + 1]) * 255,
                clamp01(rgb[i * 3 + 2]) * 255,
              ]
            : ink
        if (s.shape === "pixel" && s.scolor !== "original")
          col = paper.map((p, c) => p + (ink[c] - p) * a)
        cc[i * 3] = col[0]
        cc[i * 3 + 1] = col[1]
        cc[i * 3 + 2] = col[2]
        ctx.fillStyle = "rgb(" + (col[0] | 0) + "," + (col[1] | 0) + "," + (col[2] | 0) + ")"
        const sz = base * Math.pow(a, 0.85)
        if (s.shape === "pixel") {
          ctx.fillRect(cx - base / 2, cy - base / 2, base, base)
          continue
        }
        if (sz < 0.4) continue
        if (s.shape === "dots") {
          ctx.beginPath()
          ctx.arc(cx, cy, sz / 2, 0, Math.PI * 2)
          ctx.fill()
        } else if (s.shape === "squares") ctx.fillRect(cx - sz / 2, cy - sz / 2, sz, sz)
        else if (s.shape === "lines") ctx.fillRect(x * cwid, cy - sz * 0.45, cwid + 0.5, sz * 0.9)
        else if (s.shape === "cross") {
          const th = Math.max(0.8, sz * 0.26)
          ctx.fillRect(cx - sz / 2, cy - th / 2, sz, th)
          ctx.fillRect(cx - th / 2, cy - sz / 2, th, sz)
        } else {
          ctx.beginPath()
          ctx.moveTo(cx, cy - (sz / 2) * 1.2)
          ctx.lineTo(cx + (sz / 2) * 1.2, cy)
          ctx.lineTo(cx, cy + (sz / 2) * 1.2)
          ctx.lineTo(cx - (sz / 2) * 1.2, cy)
          ctx.closePath()
          ctx.fill()
        }
      }
    return { kind: "shapes", cols, rows, rgb: cc, lum, cwid, chei, W, H }
  }

  /* ---------- post effects ---------- */
  function post(ctx, W, H, s, t) {
    if (s.chroma > 0) {
      const id = ctx.getImageData(0, 0, W, H),
        d = id.data,
        c = new Uint8ClampedArray(d),
        sh = Math.max(1, Math.round((s.chroma / 100) * 6))
      for (let y = 0; y < H; y++) {
        const row = y * W
        for (let x = 0; x < W; x++) {
          const i = (row + x) * 4,
            ir = (row + Math.max(0, x - sh)) * 4,
            ib = (row + Math.min(W - 1, x + sh)) * 4
          d[i] = c[ir]
          d[i + 2] = c[ib + 2]
        }
      }
      ctx.putImageData(id, 0, 0)
    }
    if (s.bloom > 0) {
      tmp.width = W
      tmp.height = H
      tmpx.drawImage(ctx.canvas, 0, 0)
      ctx.save()
      ctx.globalCompositeOperation = "lighter"
      ctx.globalAlpha = (s.bloom / 100) * 0.55
      ctx.filter = "blur(" + (2 + (s.bloom / 100) * 10).toFixed(1) + "px)"
      ctx.drawImage(tmp, 0, 0)
      ctx.restore()
    }
    if (s.scan > 0) {
      ctx.fillStyle = "rgba(0,0,0," + ((s.scan / 100) * 0.55).toFixed(3) + ")"
      for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1)
    }
    if (s.grain > 0) {
      ctx.save()
      ctx.globalAlpha = (s.grain / 100) * 0.45
      ctx.globalCompositeOperation = "overlay"
      const p = ctx.createPattern(noise, "repeat")
      const o = t ? Math.floor(t * 24) % 97 : 0
      ctx.translate(-o, -o * 0.7)
      ctx.fillStyle = p
      ctx.fillRect(o, o * 0.7, W, H)
      ctx.restore()
    }
    if (s.vig > 0) {
      const g = ctx.createRadialGradient(
        W / 2,
        H / 2,
        Math.min(W, H) * 0.3,
        W / 2,
        H / 2,
        Math.hypot(W, H) * 0.58
      )
      g.addColorStop(0, "rgba(0,0,0,0)")
      g.addColorStop(1, "rgba(0,0,0," + ((s.vig / 100) * 0.8).toFixed(2) + ")")
      ctx.fillStyle = g
      ctx.fillRect(0, 0, W, H)
    }
  }
  function pipeline(ctx, srcC, W, H, s, k, t) {
    const R =
      s.mode === "ascii"
        ? renderAscii(ctx, srcC, W, H, s, k, t)
        : s.mode === "shapes"
          ? renderShapes(ctx, srcC, W, H, s, k, t)
          : renderDither(ctx, srcC, W, H, s, k, t)
    post(ctx, W, H, s, t)
    return R
  }
  return { sampleGrid, animate, dither, renderDither, renderAscii, renderShapes, post, pipeline }
}

export function ditherPipelineRuntimeSource() {
  return `const {sampleGrid,animate,dither,renderDither,renderAscii,renderShapes,post,pipeline}=(${createDitherPipeline.toString()})({document,palettes:PALS,ramps:RAMPS,katakana:KATA,hexToRgb:rgbOf,onColor:color.onColor});`
}
