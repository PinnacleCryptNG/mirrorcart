# Mirrorcart: try the whole cart on before you check out

**YouCam API Hackathon · eCommerce VTO track** · MIT · Live demo: https://mirrorcart.vercel.app

Most try-on tools show one item on a stock model. Mirrorcart is a **checkout-stage widget**: the shopper uploads one photo and sees the **whole cart on themselves**, chained top → bottom (or dress) → shoes → jewellery, plus a bag "styled scene". They can swap a variant or fabric inline and check out knowing what they're getting. The retailer gets a dashboard of try-ons, items dropped after try-on, and **estimated returns avoided**. It ships as a one-line `<script>` embed.

The demo store, **Aurel & Thread**, is fictional: 12 products, AI-generated product flat-lays, no real logos.

## Try it (judges)
1. Open https://mirrorcart.vercel.app → add a few items (or skip ahead) → **Cart → See it on me**.
2. Tick consent → pick a **sample model** (instant pre-generated looks, free) or upload your own full-body photo (live YouCam, under the daily cap).
3. Watch the chain run step by step → drag the before/after slider → **Swap variant / Change fabric / Remove** → **Checkout with confidence**.
4. Dashboard: https://mirrorcart.vercel.app/dashboard (password in the Devpost testing instructions).
5. Embed proof: https://mirrorcart.vercel.app/embed-demo.html (a plain HTML "other shop" using the one-line script).

Demo mode keeps the site usable through 20 Nov 2026 even at 0 units.

## YouCam APIs used
Base `https://yce-api-01.makeupar.com`, header `Authorization: Bearer $YOUCAM_API_KEY`, **server-side only**.

| Purpose | Endpoint | Verified live |
|---|---|---|
| File upload (selfie, refs, chain inputs) | `POST /s2s/v2.0/file` → PUT signed URL → `src_file_id` | ✓ |
| Clothes VTO (upper/lower/full body) | `POST /s2s/v2.0/task/cloth-v4` + `GET …/cloth-v4/{task_id}` | ✓ 2 units |
| Shoes VTO | `POST /s2s/v2.0/task/shoes-transfer` | ✓ 2 units |
| Bag VTO | `POST /s2s/v2.0/task/bag` | ✓ 2 units |
| Fabric VTO | `POST /s2s/v2.0/task/fabric` | ✓ 2 units |
| Fabric templates | `GET /s2s/v2.0/task/template/fabric` | ✓ |
| Necklace VTO | `POST /s2s/v2.0/task/2d-vto/necklace` | ✓ |
| Earring VTO | `POST /s2s/v2.0/task/2d-vto/earring` | ✓ |
| Task cleanup | `POST /s2s/v2.0/task/delete` | used by "Delete my photo" |
| Credit (cost meter) | `GET /s2s/v1.0/client/credit` | ✓ |
| Feature cost | `GET /s2s/v2.0/credit/feature-cost` (shown raw) | ✓ |

Field-level notes and live findings are in [`docs/youcam-api-notes.md`](docs/youcam-api-notes.md).

## How the chain works
```
Browser (cart / widget iframe)
  │ consent → resize to 1024px JPEG → POST /api/photo/upload ──► Vercel Blob (selfie)
  │ POST /api/tryon/start  (plan: upper → lower | full → [fabric] → shoes → jewellery → bag*)
  │ loop: POST /api/tryon/step   (each call does ≤1 YouCam request, so no serverless timeouts)
  ▼
Next.js route handlers ── YouCamClient (live | mock) ── token bucket 200 req/300 s (Redis), 429 retry ×3, poll backoff
  │      each step's output → copied to Blob → becomes the next step's src_file_url
  │      cache key = sha256(selfieHash | chain prefix | step) → identical prefixes reuse results (0 units)
  ▼
Upstash Redis: jobs, cache index, events, daily unit counter      Vercel Blob: selfies + results (24 h)
```
\* **Bag** VTO re-renders the whole scene (setting and outfit), so it runs last as a side "styled scene" instead of feeding the chain. **Jewellery** needs a large, centred neck, so it runs on an upscaled head-and-shoulders crop that is composited back into the full-body look.

Swapping a variant or fabric re-runs only from the changed step; earlier steps come from cache.

**Photo memory.** On upload the server also stores a 24 × 32 normalised grey-scale print of the photo. A re-saved or re-compressed copy of the same picture (e.g. sent over WhatsApp) is recognised and reuses the original photo's results, so a repeat look costs 0 units. The match is strict: a new pose, a crop or a different person is treated as a new photo. Every finished look is kept for 24 h and shown in the try-on as **Your fitting room**; reopening one is served from saved results (0 units, even when live mode is paused by the credit caps). "Delete my photo" removes every copy recognised as the same picture, its results and its saved looks.

## Photo framing

YouCam's clothes VTO wants one front-facing person filling at least 80% of the frame. Uploads run through MediaPipe Pose in the browser (wasm and model self-hosted in `public/mediapipe/`). The photo is cropped to 3:4 around the person and warns about a missing face or feet, or more than one person, before any units are spent. `cloth-v4` runs with `change_shoes:false` so the shopper keeps her own shoes unless the cart has shoes. A small subject in a wide photo used to change the face and drop a hijab; framing fixed both in live tests.

## Modes
- **Live**: `YOUCAM_API_KEY` set, `YOUCAM_MOCK=false`.
- **Mock** (`YOUCAM_MOCK=true`, the default when no key is set): a fake client returning the documented shapes (`{status:200,data:{task_id}}`, then `{status:200,data:{task_status:"success",results:{url}}}` after ~2 s) with placeholder composites. Costs nothing.
- **Demo** (`DEMO_MODE=true`, no key, `DAILY_UNIT_CAP` reached, or balance at `CREDIT_RESERVE`): 3 sample models × 3 outfits pre-generated in `public/demo/` (`manifest.json` maps chain → image). Regenerate with `npm run demo:generate` against a running server.

## Setup
```bash
npm install
cp .env.example .env.local   # fill in what you have; everything works in mock mode with no keys
npm run dev                  # http://localhost:3000
```
| Env var | Purpose |
|---|---|
| `YOUCAM_API_KEY` | YouCam key (server only) |
| `YOUCAM_MOCK` | `true` = fake client (default when no key) |
| `DEMO_MODE` | force demo mode |
| `DAILY_UNIT_CAP` | live units/day before falling back to demo (default 35) |
| `VISITOR_DAILY_UNITS` | live units per visitor (hashed IP) per day (default 16 ≈ 2 full looks) |
| `CREDIT_RESERVE` | live try-on pauses when the YouCam balance is at or below this (default 150) |
| `MAX_CHAIN_STEPS` | max items per look (default 5) |
| `DASHBOARD_PASS` | dashboard password |
| `CRON_SECRET` | protects the retention cron (Vercel sends it automatically) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (falls back to `public/_local-blob` locally) |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Upstash Redis (falls back to in-memory locally) |
| `EMBED_ALLOWED_ORIGINS` | comma-separated origins allowed to frame `/embed` (default `*`) |
| `NEXT_PUBLIC_SITE_URL` | public base URL |

Checks: `npm run lint && npm run typecheck && npm run build`.

## Embed
```html
<script src="https://mirrorcart.vercel.app/widget.js" data-store="aurel-demo" async></script>
<button data-mirrorcart-tryon data-items='[{"id":"wrap-dress","variant":"sage"}]'>See it on me</button>
```
`widget.js` (vanilla, ~3.4 KB) adds a floating button and an iframe modal at `/embed?store=…&items=…`. The host page receives `mirrorcart:checkout`, `mirrorcart:remove-item` (and `mirrorcart:swap-item`) as DOM `CustomEvent`s relayed from `postMessage`. Allowed frame origins come from the store config (`src/lib/stores.ts`).

## Retailer dashboard
`/dashboard` (behind `DASHBOARD_PASS`) shows real counts of `widget_open`, `consent_given`, `tryon_started`, `tryon_completed`, `item_swapped`, `fabric_changed`, `item_dropped_after_tryon`, `checkout_after_tryon` and `photo_deleted`, plus completion rate, conversion after try-on, units used vs cached hits, top swapped and dropped products, and the YouCam credit balance. **Estimated returns avoided = items dropped after try-on × assumed return rate × average return cost.** Both assumptions are editable and labelled as estimates. It shows "No data yet" until real events exist; the "sample data" toggle is clearly marked as fake.

## Privacy
- Explicit consent before any upload. The photo goes only to our server and, from there, to YouCam.
- **Delete my photo** (in the widget at any time) removes the selfie, every result and cache entry made from it, and asks YouCam to delete the tasks (`/task/delete`).
- Retention sweep (`/api/cron/retention`) deletes everything older than 24 h. It runs hourly via GitHub Actions, with a daily Vercel Cron backup (Vercel Hobby allows daily crons only).
- YouCam's docs state uploaded and generated files may be kept for up to 30 days on their side (result URLs expire in about 2 h). That's why we copy results into our own Blob and call task deletion. See [/privacy](https://mirrorcart.vercel.app/privacy).

## Credits
All product, model and fabric-swatch images are original, AI-generated for this project (no real brands, logos or people); see [`public/products/CREDITS.md`](public/products/CREDITS.md). Try-on outputs are produced by the YouCam API (Perfect Corp). Fonts: Syne, Inter Tight, Martian Mono (SIL OFL, via Google Fonts).

## Licence
MIT © 2026 AbdulMalik Yusuf (Pinnacle Crypt)
