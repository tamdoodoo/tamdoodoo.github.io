// Resolved URLs belong to the render boundary, never to persisted settings.
// Convert to self-contained bytes so nested SVG images and PNG exports work too.
export async function resolveAssets(bindings, definition, document, signal) {
  if (!Array.isArray(bindings)) throw new RangeError("Assets must be an array")
  const counts = new Map()
  for (const binding of bindings) {
    const slot = definition.assetSlots.find((slot) => slot.slot === binding.slot)
    const count = (counts.get(binding.slot) || 0) + 1
    counts.set(binding.slot, count)
    if (
      !slot ||
      !slot.uses.includes(binding.use) ||
      typeof binding.data !== "string" ||
      count > (slot.multiple ? slot.maxItems || 16 : 1)
    )
      throw new RangeError("Invalid resolved asset binding")
  }
  return Promise.all(
    bindings.map(async (binding) => {
      const slot = definition.assetSlots.find((slot) => slot.slot === binding.slot)
      const input = binding.data
      if (input.startsWith("data:")) return structuredClone(binding)
      const relative = /^\.?\/?assets\/[A-Za-z0-9_.-]+$/.test(input)
      const url = new URL(input, document.baseURI)
      const local =
        url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
      if (
        url.username ||
        url.password ||
        (!relative && !["https:", "blob:"].includes(url.protocol) && !local)
      )
        throw new RangeError("Unsupported resolved asset URL")
      // The browser's cache may answer: an uploaded asset never changes (its storage path holds
      // its digest), and its signed link stays the same for hours, so a design reloaded on the
      // canvas does not download its media again. A cached copy that fails the CORS check (one
      // cached from a request without CORS) is fetched again from the network, once.
      const request = (cache) =>
        document.defaultView.fetch(url.href, {
          credentials: "omit",
          mode: "cors",
          signal,
          ...(cache ? { cache } : {}),
        })
      let response
      try {
        response = await request()
      } catch (error) {
        if (signal?.aborted) throw error
        response = await request("reload")
      }
      if (!response.ok) throw new Error("Asset could not be loaded")
      const limit = slot.maxBytes || 35 * 1024 * 1024
      if (Number(response.headers.get("content-length")) > limit)
        throw new RangeError("Asset exceeds slot limit")
      const reader = response.body.getReader(),
        chunks = []
      let size = 0
      try {
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          size += value.byteLength
          if (size > limit) throw new RangeError("Asset exceeds slot limit")
          chunks.push(value)
        }
      } catch (error) {
        await reader.cancel().catch(() => {})
        throw error
      }
      signal?.throwIfAborted()
      const blob = new document.defaultView.Blob(chunks, {
        type:
          binding.contentType || response.headers.get("content-type") || "application/octet-stream",
      })
      const data = await new Promise((resolve, reject) => {
        const reader = new document.defaultView.FileReader()
        reader.onload = () => resolve(reader.result)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(blob)
      })
      signal?.throwIfAborted()
      return {
        ...binding,
        data,
        ...(binding.slot === "model"
          ? {
              name:
                binding.name ||
                binding.fileName ||
                decodeURIComponent(url.pathname.split("/").at(-1)),
            }
          : {}),
      }
    })
  )
}
