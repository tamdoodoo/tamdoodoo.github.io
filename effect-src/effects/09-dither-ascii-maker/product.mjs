export const productMarkup =
  '<div class="dt-product-shell"><header><b>Fieldwork<span>®</span></b><nav>Discover &nbsp; Library &nbsp; Your workspace</nav><span class="dt-product-avatar">MC</span></header><div class="dt-product-main"><section class="dt-product-art"><canvas id="heroCv" width="960" height="540" aria-label="Processed media in a product"></canvas><span class="dt-art-tag">VISUAL STUDY / 026</span></section><section class="dt-product-copy"><small data-dt-eyebrow>FIELD NOTES / ISSUE 12</small><h3 data-dt-title>Made with light and grain.</h3><p data-dt-body>Stories from the studio, rendered one pixel at a time.</p><div class="dt-player-track" hidden><i></i><span>00:00 <b>03:42</b></span></div><button type="button" class="dt-btn" id="dtProductAction">Read the issue</button><p id="dtProductFeedback" role="status"></p><div class="dt-product-meta"><span>CURATED BY<br><b>Fieldwork Studio</b></span><span>COLLECTION<br><b>Form & texture</b></span></div></section></div><footer>Explore the details. Make something your own.<span>01 / 08</span></footer></div>'
export const productStyles =
  ".dt-hero[data-context]{background:#f7f4ed;color:#292a26;box-shadow:0 18px 70px #25263020}.dt-product-shell{height:100%;display:flex;flex-direction:column;font-family:'DM Sans',sans-serif}.dt-product-shell header{height:65px;display:flex;align-items:center;padding:0 32px;border-bottom:1px solid #d8d7ca;gap:45px}.dt-product-shell header>b{font-size:24px;letter-spacing:-1px}.dt-product-shell header>b span{font-size:10px;vertical-align:top;margin-left:3px}.dt-product-shell nav{font-size:12px;color:#717169}.dt-product-avatar{margin-left:auto;border-radius:100%;background:#e5e6d9;font-size:10px;padding:10px}.dt-product-main{display:grid;grid-template-columns:1.1fr 1fr;flex:1;min-height:0;gap:40px;padding:28px 32px}.dt-product-art{position:relative;overflow:hidden;border-radius:12px;min-height:0;background:#d6d6ca}.dt-hero .dt-product-art canvas{position:absolute;width:100%;height:100%;object-fit:cover;inset:0}.dt-art-tag{position:absolute;left:16px;bottom:15px;padding:6px 9px;background:#f3f2e8df;font:9px monospace;letter-spacing:1px;border-radius:5px}.dt-product-copy{align-self:center}.dt-product-copy small{font-size:10px;letter-spacing:1.6px;color:#727365}.dt-product-copy h3{font-size:44px;letter-spacing:-1.6px;line-height:1.02;margin:15px 0}.dt-product-copy p{font-size:14px;color:#77776d;line-height:1.6;margin:0 0 16px}.dt-product-copy .dt-btn{border:0;cursor:pointer;background:#354336;color:#f6f4ea;padding:13px 18px;border-radius:8px;font:600 12px 'DM Sans'}.dt-product-meta{display:flex;gap:40px;margin-top:24px;font-size:8px;letter-spacing:1px;line-height:1.7;color:#8b8c80}.dt-product-meta b{font-size:11px;letter-spacing:0;font-weight:500;color:#45483c}.dt-product-shell footer{display:flex;justify-content:space-between;padding:16px 32px;border-top:1px solid #dedfd5;font-size:10px;color:#85877a}.dt-player-track{height:45px;margin:20px 0}.dt-player-track i{height:3px;background:#d4d6cb;display:block}.dt-player-track span{display:block;margin-top:8px;font-size:10px;color:#828477}.dt-player-track b{float:right;font-weight:400}.dt-product-main:has(.dt-player-track:not([hidden])) h3{font-size:48px}.dt-hero[data-context=workspace]{background:#f5f5fa}.dt-hero[data-context=workspace] .dt-product-art{box-shadow:0 8px 24px #2821371a;border:12px solid white}.dt-hero[data-context=workspace] .dt-product-copy h3{font-size:36px}.dt-hero[data-context=mobile]{width:330px;height:620px;border:7px solid #292e29;border-radius:38px}.dt-hero[data-context=mobile] header{height:52px;padding:0 20px}.dt-hero[data-context=mobile] nav{display:none}.dt-hero[data-context=mobile] .dt-product-main{grid-template-columns:1fr;grid-template-rows:210px auto;padding:18px;gap:17px}.dt-hero[data-context=mobile] h3{font-size:30px}.dt-hero[data-context=mobile] p{font-size:12px}.dt-hero[data-context=mobile] .dt-product-meta{display:none}.dt-hero[data-context=mobile] footer{padding:15px 20px;font-size:9px}.dt-hero[data-context=article] .dt-product-main{grid-template-columns:1.4fr 1fr}.dt-hero[data-context=article] h3{font-family:Georgia,serif;font-size:48px;font-weight:400}.dt-video-controls{padding:12px;background:#f0edf5;border-radius:10px;margin-top:12px;display:flex;align-items:center;gap:9px;flex-wrap:wrap}.dt-video-controls[hidden]{display:none}.dt-video-controls input{flex:1;min-width:90px;accent-color:#735296}.dt-video-controls output{font-size:10px;color:#79668c}.dt-video-controls button{font-size:11px}.work-bar:has(#dtView){flex-wrap:wrap}#dtView{max-width:165px;padding:7px;border:1px solid #ded6e6;border-radius:7px;background:white;color:#51495b;font-size:12px}"
// The copy each product preview shows, and the feedback its action gives. Filled into the
// markup as text, so the live preview and the static UI of a placed design read the same.
const productCopy = {
  workspace: {
    eyebrow: "YOUR LIBRARY / VISUAL ASSETS",
    title: "A new texture for your next idea.",
    body: "Save this treatment to your collection, then bring it into your next project.",
    action: "Save to library",
    feedback: "Treatment saved to this demo library.",
  },
  player: {
    eyebrow: "AFTER HOURS / VOLUME 04",
    title: "Slow frequencies.",
    body: "A soundscape for the hours when everything falls into place.",
    action: "Save album",
    feedback: "Album saved to your collection.",
  },
}
export const productFeedback = (previewId) =>
  (productCopy[previewId] || productCopy.player).feedback

/** The product preview for `previewId`, with `art` in place of the processed-media canvas. */
export function productMarkupFor(previewId, { art } = {}) {
  const copy = productCopy[previewId] || productCopy.player
  let html = productMarkup
    .replace(/(<small data-dt-eyebrow>)[^<]*/u, `$1${copy.eyebrow}`)
    .replace(/(<h3 data-dt-title>)[^<]*/u, `$1${copy.title}`)
    .replace(/(<p data-dt-body>)[^<]*/u, `$1${copy.body}`)
    .replace(
      /(<button type="button" class="dt-btn" id="dtProductAction">)[^<]*/u,
      `$1${copy.action}`
    )
  if (previewId === "player")
    html = html.replace('<div class="dt-player-track" hidden>', '<div class="dt-player-track">')
  if (art !== undefined) html = html.replace(/<canvas id="heroCv"[^>]*><\/canvas>/u, art)
  return html
}
