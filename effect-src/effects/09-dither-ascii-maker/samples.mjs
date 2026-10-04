function drawStill(g, W, H) {
  let bg = g.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, "#EADDCF")
  bg.addColorStop(0.62, "#C9B8D6")
  bg.addColorStop(0.63, "#9C8BAE")
  bg.addColorStop(1, "#6E5C82")
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)
  let win = g.createRadialGradient(W * 0.2, H * 0.12, 10, W * 0.2, H * 0.12, W * 0.5)
  win.addColorStop(0, "rgba(255,248,230,.9)")
  win.addColorStop(1, "rgba(255,248,230,0)")
  g.fillStyle = win
  g.fillRect(0, 0, W, H)
  const shadow = (x, y, rx, ry, a) => {
    const s = g.createRadialGradient(x, y, 1, x, y, rx)
    s.addColorStop(0, "rgba(30,10,50," + a + ")")
    s.addColorStop(1, "rgba(30,10,50,0)")
    g.save()
    g.translate(x, y)
    g.scale(1, ry / rx)
    g.translate(-x, -y)
    g.fillStyle = s
    g.beginPath()
    g.arc(x, y, rx, 0, Math.PI * 2)
    g.fill()
    g.restore()
  }
  shadow(W * 0.66, H * 0.8, W * 0.22, H * 0.07, 0.55)
  shadow(W * 0.35, H * 0.83, W * 0.11, H * 0.035, 0.5)
  shadow(W * 0.18, H * 0.84, W * 0.12, H * 0.03, 0.45)
  const cx = W * 0.18,
    cy = H * 0.66,
    s = W * 0.085
  g.fillStyle = "#F4EFE6"
  g.beginPath()
  g.moveTo(cx - s, cy - s * 0.5)
  g.lineTo(cx, cy - s)
  g.lineTo(cx + s, cy - s * 0.5)
  g.lineTo(cx, cy)
  g.closePath()
  g.fill()
  g.fillStyle = "#CBBFB0"
  g.beginPath()
  g.moveTo(cx - s, cy - s * 0.5)
  g.lineTo(cx, cy)
  g.lineTo(cx, cy + s * 1.1)
  g.lineTo(cx - s, cy + s * 0.6)
  g.closePath()
  g.fill()
  g.fillStyle = "#9C8E80"
  g.beginPath()
  g.moveTo(cx + s, cy - s * 0.5)
  g.lineTo(cx, cy)
  g.lineTo(cx, cy + s * 1.1)
  g.lineTo(cx + s, cy + s * 0.6)
  g.closePath()
  g.fill()
  const sphere = (x, y, r, c1, c2, c3) => {
    const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r)
    gr.addColorStop(0, c1)
    gr.addColorStop(0.45, c2)
    gr.addColorStop(1, c3)
    g.fillStyle = gr
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  sphere(W * 0.64, H * 0.55, H * 0.26, "#FFE6C2", "#FF7A59", "#4A1631")
  sphere(W * 0.36, H * 0.72, H * 0.12, "#E3DDFF", "#6A52FF", "#130537")
  g.save()
  g.translate(W * 0.86, H * 0.74)
  g.rotate(-0.3)
  g.scale(1, 0.42)
  g.lineWidth = H * 0.035
  const rg = g.createLinearGradient(-60, -60, 60, 60)
  rg.addColorStop(0, "#FFF6D8")
  rg.addColorStop(1, "#A87F2E")
  g.strokeStyle = rg
  g.beginPath()
  g.arc(0, 0, H * 0.1, 0, Math.PI * 2)
  g.stroke()
  g.restore()
}
function drawAlpine(g, W, H) {
  const sky = g.createLinearGradient(0, 0, 0, H * 0.62)
  sky.addColorStop(0, "#1B1340")
  sky.addColorStop(0.45, "#6B3F8C")
  sky.addColorStop(0.8, "#F08A5D")
  sky.addColorStop(1, "#FFD08A")
  g.fillStyle = sky
  g.fillRect(0, 0, W, H)
  const sun = g.createRadialGradient(W * 0.62, H * 0.5, 4, W * 0.62, H * 0.5, H * 0.3)
  sun.addColorStop(0, "#FFF4D6")
  sun.addColorStop(0.25, "#FFD08A")
  sun.addColorStop(1, "rgba(255,208,138,0)")
  g.fillStyle = sun
  g.fillRect(0, 0, W, H)
  g.fillStyle = "#FFF1CF"
  g.beginPath()
  g.arc(W * 0.62, H * 0.5, H * 0.075, 0, Math.PI * 2)
  g.fill()
  const ridge = (base, amp, freq, seed, fill) => {
    g.fillStyle = fill
    g.beginPath()
    g.moveTo(0, H)
    for (let x = 0; x <= W; x += 6) {
      const t = x / W
      const y =
        base -
        Math.abs(Math.sin(t * freq + seed)) * amp -
        Math.sin(t * freq * 3.1 + seed * 2) * amp * 0.25 -
        Math.sin(t * freq * 7.3 + seed) * amp * 0.08
      g.lineTo(x, y)
    }
    g.lineTo(W, H)
    g.closePath()
    g.fill()
  }
  ridge(H * 0.62, H * 0.26, 3.2, 1.1, "#8C5A8E")
  ridge(H * 0.7, H * 0.2, 4.4, 2.3, "#553F7A")
  ridge(H * 0.8, H * 0.16, 5.1, 0.4, "#2E2552")
  const lake = g.createLinearGradient(0, H * 0.8, 0, H)
  lake.addColorStop(0, "#F3A76E")
  lake.addColorStop(0.3, "#6B3F8C")
  lake.addColorStop(1, "#140F2E")
  g.fillStyle = lake
  g.fillRect(0, H * 0.84, W, H * 0.16)
  g.fillStyle = "rgba(255,241,207,.55)"
  for (let i = 0; i < 9; i++)
    g.fillRect(W * 0.62 - (40 - i * 4), H * 0.86 + i * 8, (40 - i * 4) * 2, 2)
  g.fillStyle = "#120C26"
  for (let i = 0; i < 26; i++) {
    const x = (i * 97) % W,
      h = H * (0.08 + ((i * 37) % 10) / 100)
    g.beginPath()
    g.moveTo(x, H * 0.86)
    g.lineTo(x + h * 0.22, H * 0.86 - h)
    g.lineTo(x + h * 0.44, H * 0.86)
    g.fill()
  }
}
function drawType(g, W, H) {
  const bg = g.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, "#F6F1FF")
  bg.addColorStop(1, "#C9BCFF")
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)
  const glow = g.createRadialGradient(W * 0.72, H * 0.35, 10, W * 0.72, H * 0.35, H * 0.55)
  glow.addColorStop(0, "#FF9E7A")
  glow.addColorStop(1, "rgba(255,158,122,0)")
  g.fillStyle = glow
  g.fillRect(0, 0, W, H)
  const tx = g.createLinearGradient(0, H * 0.15, 0, H * 0.85)
  tx.addColorStop(0, "#3F20FB")
  tx.addColorStop(1, "#130537")
  g.fillStyle = tx
  g.font = "800 " + Math.round(H * 0.62) + 'px Inter, "Helvetica Neue", Arial, sans-serif'
  g.textBaseline = "alphabetic"
  g.fillText("Aa", W * 0.07, H * 0.72)
  g.fillStyle = "#130537"
  g.font = "600 " + Math.round(H * 0.05) + "px Inter, Arial, sans-serif"
  g.fillText("Display · 800 · -2% tracking", W * 0.08, H * 0.88)
  const sphere = g.createRadialGradient(W * 0.78 - 30, H * 0.4 - 40, 8, W * 0.78, H * 0.4, H * 0.2)
  sphere.addColorStop(0, "#FFFFFF")
  sphere.addColorStop(0.4, "#FF7A59")
  sphere.addColorStop(1, "#5A1D3A")
  g.fillStyle = sphere
  g.beginPath()
  g.arc(W * 0.78, H * 0.4, H * 0.2, 0, Math.PI * 2)
  g.fill()
}

export function createDitherSample(document, name = "still") {
  const canvas = document.createElement("canvas")
  canvas.width = 900
  canvas.height = 600
  const render = { still: drawStill, alpine: drawAlpine, type: drawType }[name]
  if (!render) throw new RangeError("Unsupported sample")
  render(canvas.getContext("2d"), 900, 600)
  return canvas
}
