# Mirrorcart — try the whole cart on before you check out

YouCam API Hackathon · eCommerce VTO track · Deadline Mon 2 Nov 2026, 17:45 WAT (11:45 EST)
Team: AbdulMalik Yusuf (Pinnacle Crypt) + colleague. Stack: Next.js (App Router, TS) on Vercel.

## 1. Pitch

Most try-on apps show one item on a stock model. Mirrorcart is a checkout-stage widget. The shopper uploads one photo and sees the whole cart on themselves: top, bottom or dress, then shoes, then bag, then optional jewellery. They can swap a size, colour or fabric inline and check out knowing what they're getting. The retailer gets a dashboard of try-ons, items dropped after try-on and estimated returns avoided. It ships as a one-line `<script>` embed, so it reads as a real B2B product rather than a demo toy.

### Stand-out touches

1. **Outfit chaining.** Each try-on's output becomes the next one's input (cloth → shoes → bag), so you see one coherent outfit. Every step is shown as a filmstrip.
2. **"Drop-before-ship" metric.** If a shopper removes an item after seeing it on themselves, that counts as a likely return avoided. The dashboard shows it × avg return cost (an editable assumption, labelled as an estimate).
3. **Fabric swap chips.** Change the pattern or fabric of the garment you're wearing without a re-shoot (`/task/fabric` templates).
4. **Before/after slider** plus a "Share look" PNG.
5. **One-line embed.** The same widget runs on the demo store and on a plain HTML page (proof it's embeddable).
6. **Privacy-first.** Explicit selfie consent, auto-delete after 24 h (this matches YouCam's own 24 h result retention) and a "Delete my photo now" button.
7. **Cost meter.** The admin page shows units spent and cached hits saved, via `GET /s2s/v1.0/client/credit`.

## 2. YouCam API — what we use (confirmed from docs.perfectcorp.com unless marked)

Base URL `https://yce-api-01.makeupar.com`; header `Authorization: Bearer <YOUCAM_API_KEY>`. The key is server-side only (Vercel env var) and never reaches the browser.

**Async pattern.** `POST /s2s/v2.0/task/<feature>` → `{status:200, data:{task_id}}`. Then poll `GET /s2s/v2.0/task/<feature>/<task_id>` until `data.task_status` is `"success"` (result in `data.results.url`, a signed URL valid for a limited time) or `"error"`. Webhooks also exist; we skip them for simplicity.

**Upload flow.** Step 1: `POST /s2s/v2.0/file` with body `{"files":[{"content_type":"image/jpg","file_name":"x.jpg","file_size":547541}]}` → `data.files[0].file_id` + `requests[0] {method:"PUT", url, headers:{Content-Length, Content-Type}}`. Step 2: PUT the bytes to that URL with those headers. Step 3: pass `src_file_id`. Alternatively pass a public `src_file_url`. Our catalogue garment images are public URLs on our domain, so we pass them as `ref_file_url`.

**Errors.** 401 `{"error_code":"InvalidAccessToken"}`. Feature errors include invalid gender/style values, unsupported ratio and `unknown_internal_error`. Units are charged only on success.

**Rate limit.** 250 requests / 300 s per IP & token → server-side queue, polling every 2–3 s with backoff, and retry on 429 with exponential backoff (max 3).

**Credits.** `GET /s2s/v1.0/client/credit`; `GET /s2s/v2.0/credit/feature-cost` (response shape unconfirmed, so display it raw).

| Step | Endpoint | Body (confirmed example) | Units |
|---|---|---|---|
| Garment | `POST /s2s/v2.0/task/cloth-v4` | `{src_file_url\|src_file_id, ref_file_url\|ref_file_id\|template_id, garment_category: "upper_body"\|"lower_body"\|"full_body"\|"shoes"\|"auto"}` | 2 |
| Shoes | `POST /s2s/v2.0/task/shoes-transfer` | `{src_file_url, ref_file_url, gender:"female"\|"male", style:"random"}` | 2 |
| Bag | `POST /s2s/v2.0/task/bag` | `{src_file_url, ref_file_url, gender, style:"random"}` | 2 |
| Fabric | `POST /s2s/v2.0/task/fabric` | `{template_id, src_file_url}`; template list `GET /s2s/v2.0/task/template/fabric` | 2 |
| Necklace / Earring | `POST /s2s/v2.0/task/2d-vto/necklace` · `/2d-vto/earring` | src + ref image (exact field names unconfirmed; check the playground) | 1 (earring stacked 2) |
| Ring / Bracelet / Watch | `/2d-vto/ring` · `/bracelet` · `/watch` | needs a hand photo → stretch goal | 1 |

**Notes / unconfirmed:**

- The docs also mention `/task/cloth` (V2/V3) and `/task/shoes`. We use the endpoints that have published examples (cloth-v4, shoes-transfer). Verify cloth-v4's cost (V2/V3 are listed at 2 units, V4 not seen).
- Valid `style` values beyond `"random"` are unconfirmed.
- Hat (`/task/hat`) and scarf (`/task/scarf`) take the same body as bag, 2 units each. Optional.
- Whether a chained result URL is accepted as `src_file_url` is unconfirmed. Fallback: download the result server-side and re-upload it via the File API.
- Image limits per feature (e.g. long side ≤ 1024 for some) need checking; resize client-side to a long side of 1024 JPEG.

**Cost per full look:** cloth 2 + shoes 2 + bag 2 = 6 units (+1–2 jewellery, +2 per fabric swap). 1,000 units ≈ 150 live looks. Budget: ~150 units for dev, ~100 for pre-generating demo results, and the rest reserved for judges. Hard cap via env `DAILY_UNIT_CAP` (default 60/day); once it's reached, the app falls back to demo mode with a banner.

## 3. Demo storefront — "Aurel & Thread" (fictional brand, original wordmark in plain type, no real logos)

12 products, each with variants (colour/fabric):

- Tops: Linen Shirt, Ribbed Knit Top, Denim Jacket
- Bottoms: Wide-leg Trousers, Pleated Midi Skirt
- Full: Wrap Dress, Jumpsuit
- Shoes: White Sneakers, Block-heel Loafers
- Bags: Leather Tote, Mini Crossbody
- Jewellery: Gold Pendant Necklace (+ Hoop Earrings variant)

Price data is mock (USD, $ labelled "demo").

**Image licensing.** Use AI-generated product flat-lays (our own, e.g. generated for this project) OR CC0 / Unsplash-licence / Pexels-licence images with no visible branding. Keep `public/products/CREDITS.md` with the source + licence per image. Garment refs should be a single item on a plain background (best for VTO). Do not use YouCam's sample URLs in the shipped product (use them only for dev testing). Model/selfie demo photos: team members' own photos with consent, or CC0/Pexels models; credit them.

## 4. User flow

1. `/` storefront grid → `/p/[slug]` product page (variant chips, "Add to cart", small "Try on me" badge).
2. `/cart` → "See it on me" button opens the widget modal.
3. **Consent screen:** what's sent (to YouCam via our server), retention (≤24 h), a delete button, and a checkbox. No upload without the tick.
4. **Upload / camera.** Show a full-body, front-facing, plain-background guide. Resize to a 1024 long side. Optional gender selector (needed by shoes/bag).
5. **Chain run** (sequential, server-orchestrated): garment(s) → shoes → bag → necklace. Upper + lower = two cloth steps (`upper_body` then `lower_body`); a dress = one `full_body` step. Show a live step list with spinners and a filmstrip of intermediate outputs.
6. **Result viewer:** a before/after slider, per-item "Keep / Remove / Swap variant / Change fabric". A swap re-runs from that step onward only (earlier steps are cached).
7. "Checkout with confidence" → mock checkout (no payment; "Demo order placed" page). Removed items are logged as `dropped_after_tryon`.
8. "Delete my photo" anywhere → purges the blob + cache entries.

## 5. Architecture

Next.js App Router on Vercel. Routes:

- `/api/tryon/start`: creates a job and returns `jobId`.
- `/api/tryon/step`: advances one step; this keeps each serverless call short and avoids Vercel timeouts, with the client calling repeatedly.
- `/api/tryon/status`.
- `/api/photo/delete`.
- `/api/events`.
- `/api/admin/credit`.

Storage: Vercel Blob (selfies & cached results; copy the YouCam result into our blob because their URLs expire) + Upstash Redis / Vercel KV (jobs, cache index, events, daily unit counter). Both have free tiers.

Cache key = `sha256(selfieHash + step chain so far + productVariantId)`. An identical chain prefix → reuse, 0 units.

**Demo mode** (`DEMO_MODE=true` or no key or cap reached): 2–3 sample models × pre-generated looks stored in `public/demo/` with a `manifest.json` mapping chain → image. Judges can pick a sample model and get instant results. A live upload is still available if under the cap.

**Mock mode** (`YOUCAM_MOCK=true`): a fake YouCam client returning the documented shapes with 2 s delays and placeholder images. Used until the key arrives.

**Retention cron** (Vercel Cron, hourly): delete selfies/results older than 24 h.

**YouCamClient module:** `uploadFile()`, `createTask(feature, body)`, `pollTask(feature, id)` with backoff, plus a token-bucket limiter (≤200 req/300 s to leave headroom).

## 6. Retailer dashboard `/dashboard` (password via env `DASHBOARD_PASS`)

Real counts from the events table:
`widget_open`, `consent_given`, `tryon_started`, `tryon_completed`, `item_swapped`, `fabric_changed`, `item_dropped_after_tryon`, `checkout_after_tryon`, `photo_deleted`.

Cards:

- try-ons
- completion rate
- conversion after try-on
- items dropped before ship
- est. returns avoided = dropped × assumed return rate (editable, default shown as an assumption) × avg return cost (editable)
- units used vs cached hits

Also a top-swapped products table. Seed nothing fake: label it "No data yet" until real events exist (a "load sample data" toggle is OK if clearly marked).

## 7. Embeddable widget

```html
<script src="https://mirrorcart.vercel.app/widget.js" data-store="aurel-demo" async></script>
<button data-mirrorcart-tryon data-items='[{"id":"wrap-dress","variant":"sage"}]'>See it on me</button>
```

`widget.js` (vanilla, <15 KB) injects a floating button + an iframe modal pointing at `/embed?store=...&items=...`. It communicates with the host via `postMessage` (`mirrorcart:checkout`, `mirrorcart:remove-item`). `/embed-demo.html` is a plain static "other shop" page proving the embed. CORS/allowed-origins comes from a store config.

## 8. Hackathon compliance checklist

- Public GitHub repo, MIT LICENSE, README (what/why, YouCam APIs used with endpoints, setup, env vars, demo mode, architecture diagram, credits, privacy).
- Live URL free for judges through 20 Nov 2026 (demo mode guarantees it works even at 0 units).
- Screenshots (storefront, chain run, before/after, dashboard, embed page).
- 1–3 min demo video (YouTube/Vimeo, public):
  - 0:00–0:15 the problem: returns from "looked different on me".
  - 0:15–1:20 store → cart → consent → chain run → swap a fabric → keep/remove → checkout.
  - 1:20–1:50 dashboard counts updating + estimated returns avoided.
  - 1:50–2:10 one-line embed on a plain page.
  - 2:10–2:30 APIs used on-screen: Clothes VTO (cloth-v4), Shoes VTO, Bag VTO, Fabric VTO, Necklace/Earring VTO, File API, Credit API.
  - Music: none, or royalty-free with a licence noted. No brand logos.
- Devpost text: mention the eCommerce VTO track, the APIs and the privacy design. Testing instructions: demo URL + dashboard password.
- Optional social bonus (500 units/platform, max 2): needs the owner's approval before posting.

## 9. Build order (~2 days with Devin)

**Day 1**

1. Scaffold the Next.js + Tailwind repo, add MIT, deploy to Vercel.
2. Catalogue JSON + product images + CREDITS, storefront/product/cart pages.
3. YouCamClient with mock mode; job orchestrator (chain, cache, limiter); Blob/KV.
4. Consent + upload + chain UI with mock data.

**Day 2**

5. Plug in the real key and test each endpoint once (~20 units); fix field names (jewellery).
6. Result viewer: slider, swaps, fabric chips, delete.
7. Events + dashboard; checkout mock.
8. widget.js + embed demo page.
9. Generate demo-mode assets; cap + fallback; retention cron.
10. README, screenshots, video, submit by Mon 2 Nov ~12:00 WAT (buffer before 17:45).

## 10. Risks

- Chained VTO quality degrades → limit the chain to 4 steps and show a per-step "use previous" fallback.
- Some features need a full-body vs upper-body photo → photo guide + per-item hints.
- Rate limits → queue.
- Expiring result URLs → copy to Blob.
- Key/units running out → demo mode.
