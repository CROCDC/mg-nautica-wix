# MG Náutica — Headless Storefront Plan

> **Goal:** Replace the Wix-rendered frontend (which broke — product detail pages render
> blank in production) with an **owned, self-hosted storefront**, while keeping **Wix as the
> backend** so the owner keeps managing boats from the Wix dashboard exactly as today.
> The visual design is **ported from the existing `mg-nautica-web` Flask app** (its custom
> Jinja templates + `main.css`), feeding it Wix data instead of the Flask DB.

---

## 1. Why this project exists

The live Wix site (`mgnauticabroker.com`) renders every `/product-page/*` blank: only the
header/footer mount, the Wix Stores product widget never does. Root cause is on Wix's side
(the published front-end bundle / OOI widget fails to mount). The store data and the Wix
Stores app are healthy — the catalog page and the home gallery both work, and there are 71
products, all available.

**Decision:** stop depending on Wix to *render* the site. Own the frontend; keep Wix only
as the data/commerce engine. This makes today's class of bug impossible (we render the
product page ourselves) and gives hosting portability.

## 2. What stays on Wix vs what we own

| Layer | Owner | Notes |
|---|---|---|
| Product/content management (dashboard) | **Wix** | No change for the site owner |
| Catalog, orders, members, DB, checkout/payments | **Wix** | Reached via Wix APIs |
| Storefront rendering (the website) | **Us** | Next.js in our repo, hosted on Vercel |
| Source code + CI/CD | **Us** | GitHub repo + deploy pipeline (see §4) |

The site owner's workflow does **not** change: they keep loading boats in the Wix dashboard.
Only the rendering moves to our code.

## 3. Architecture

```
Wix (backend)                         Our repo (frontend)            Hosting
─────────────                         ──────────────────             ───────
Stores / eCom  ──@wix/sdk (REST)──►   Next.js (App Router)  ──────►  Vercel (free tier)
Dashboard CMS                          - SSR/ISR product pages        + our domain (DNS)
Hosted checkout ◄──redirect──────────  - cart → createCheckout

        GitHub repo (main = prod) ──push/PR──► CI (lint/typecheck/build/test) ──► Vercel deploy
```

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind.
- **Data:** `@wix/sdk` with `@wix/stores`, `@wix/ecom`, `@wix/redirects`.
- **Auth:** Wix OAuth app (visitor tokens, public client id) for catalog/cart; API key only
  for server/build-time tasks. **No secrets in the browser.**
- **Checkout:** create an eCom checkout via API → redirect to the **Wix-hosted checkout page**
  (PCI handled by Wix; orders show in the Wix dashboard).
- **Source control + CI/CD:** **GitHub** repo with a **deploy pipeline** (see §4). Every push
  runs the quality gate; `main` deploys to production automatically.
- **Hosting:** Vercel. If we ever dislike it, the app is portable — redeploy elsewhere in an
  afternoon.

## 4. Repo & deploy pipeline (GitHub → Vercel) — **required**

The project **lives on GitHub** and ships through an **automated deploy pipeline**. No manual
"build on my laptop and upload" — every change goes repo → CI gate → deploy.

### 4.1 Repository
- **Host:** GitHub. Repo: **https://github.com/CROCDC/mg-nautica-wix** (public, default branch `main`).
  Secrets never live in the repo — they stay in Vercel / GitHub Actions secret stores (§4.4).
- **Default branch:** `main` = **production**. Work happens on feature branches → Pull Request.
- **Branch protection on `main`:** require the CI checks to pass before merge; no direct pushes.
- Standard hygiene: `.gitignore` (node_modules, `.next`, `.env*`, `.vercel`), `.env.example`,
  `README.md` with setup/deploy steps, conventional commits (optional).

### 4.2 CI quality gate — GitHub Actions (`.github/workflows/ci.yml`)
Runs on every push and PR. Blocks merge if anything fails:
- `npm ci`
- **Lint** — `next lint` / eslint
- **Typecheck** — `tsc --noEmit`
- **Build** — `next build` (catches the kind of render error that started this project)
- **Tests** — unit/e2e when present (Playwright smoke on the product page later)

### 4.3 Deploy — GitHub Actions owns the deploy (decided)
Branch model: every **PR → a unique Preview URL** (review before merge); **merge to `main` →
Production deploy**. **GitHub Actions performs the deploy** (chosen over Vercel's native Git
integration — keeps CI in full control and leaves us one step from moving off Vercel):

- A `deploy.yml` workflow runs after the §4.2 gate passes and uses the Vercel CLI:
  - on PRs: `vercel pull --environment=preview` → `vercel build` → `vercel deploy --prebuilt`
    → comment the Preview URL on the PR.
  - on `main`: `vercel pull --environment=production` → `vercel build --prod` →
    `vercel deploy --prebuilt --prod`.
- **Required secrets:** `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (GitHub Actions
  secrets) — created once with `vercel link` locally, then read from `.vercel/project.json`.
- Vercel's automatic Git deploys are **turned off** for this project (deploy happens only from
  Actions) to avoid double-deploys.

### 4.4 Secrets / env management
- `WIX_CLIENT_ID` — public OAuth client id (visitor tokens). Safe in the client bundle.
- `WIX_API_KEY` — **server-only** (build/admin reads). Never exposed to the browser.
- Stored in **Vercel env** (Production + Preview) and pulled at build time by `vercel pull`.
  Deploy creds (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`) live as **GitHub Actions
  secrets**. Mirrored in a local `.env.local` (gitignored); documented in `.env.example`.

## 5. Known IDs / facts (captured from the live site)

| Item | Value |
|---|---|
| metaSiteId | `90eb2d0e-cc22-422c-a42e-602fd3422f13` |
| siteId | `11bbc77b-4b38-4e03-b035-4fa58dfd5963` |
| Wix Stores appDefinitionId | `1380b703-ce81-ff05-f115-39571d94dfcd` |
| Products in store | 71 (≈63 public in sitemap) |
| Currency | USD |
| Plan | **Core** — includes "eCommerce esencial / Aceptar pagos" (enough to start) |
| URL pattern (keep identical for SEO) | `/product-page/<slug>`, `/category/<slug>` |
| Primary CTA | WhatsApp → `https://wa.me/5491126949628` |

**Categories** (Catalog V3, confirmed live via POC — 10 visible categories; slugs are
mislabeled vs display names, a leftover from a clothing template). Counts overlap because a
boat belongs to several categories (type + region). Out of **63 public products**:

| # products | Display name | Wix slug | category id |
|---|---|---|---|
| 63 | All Products | `all-products` | `a9461314-…` (= every product's `mainCategoryId`) |
| 49 | 🇦🇷 EMBARCACIONES BANDERA ARGENTINA | `botas-náuticas` | `51c7a24e-…` |
| 41 | 🇦🇷 BUENOS AIRES ZONA NORTE Y CABA | `buenos-aires-zona-norte-y-caba` | `9e26b454-…` |
| 33 | ⛵️🇦🇷 VELEROS | `⛵️🇦🇷veleros-bs-as-zona-norte-caba` | `e5fef466-…` |
| 8 | 🇺🇾 EMBARCACIONES EN URUGUAY | `ropa-náutica` | `9ed8621a-…` |
| 7 | 🇦🇷 EMB A MOTOR | `🇦🇷emb-a-motor` | `78bc467e-…` |
| 6 | 🌎 EMBARCACIONES EN EL EXTERIOR | `accesorios-a-bordo` | `3a45a41d-…` |
| 4 | 🇦🇷 BUENOS AIRES ZONA SUR | `🇦🇷emb-zona-sur` | `7657701c-…` |
| 1 | EMB MOTOR | `emb-motor` | `1e84e3d3-…` |
| 0 | EMB VELA | `emb-vela` | `1f047a16-…` |

> The catalog is split by **type** (vela vs motor — beyond sailboats there are motorboats /
> jet-ski under EMB MOTOR / EMB A MOTOR) and by **region** (AR zona norte/sur, UY, exterior).
> Some slugs contain emoji (`⛵️🇦🇷…`, `🇦🇷emb-a-motor`) → URL-encode them in routes. The
> nav's "Accesorios Náuticos" / "Curso Brasil" are **site pages**, not store categories.

**Top nav:** Inicio · CATALOGO · Quiénes Somos · Vendé tu Embarcación · Accesorios Náuticos ·
Curso Internacional Brasil.

## 6. Wix-side setup (one-time)

1. Confirm Core plan + Wix Stores installed + payments enabled (all true today).
2. Dashboard → **Settings → Headless** (or Developer Tools): create an **OAuth app** →
   get the **public Client ID** (used by the frontend for visitor tokens).
3. (Optional, server-only) create an **API key** for build-time/admin reads.
4. Verify Headless API access is live by running the POC (Phase 0). Do **not** upgrade the
   plan until the POC proves what Core unlocks.

## 7. Data mapping — **Wix Stores Catalog V3** (confirmed in Phase 0)

The site is on **Catalog V3**, not V1 (V1 endpoints return `CATALOG_V3_CALLING_CATALOG_V1_API`).
Use `productsV3` from `@wix/stores` + `categories` from `@wix/categories`.

Per product (`productsV3.queryProducts()` / `getProductBySlug(slug, { fields: [...] })`):

| Field | V3 path | Notes |
|---|---|---|
| Name / slug / visible | `name`, `slug`, `visible` | slugs are clean, accented (`velero-clásico-…`) |
| **Price** | `actualPriceRange.minValue.amount` (string) | `compareAtPriceRange` = strike-through "before" price |
| Currency | request field `CURRENCY` | **USD** only |
| **Images** | `media.main.image`, `media.itemsInfo.items[]` | **`wix:image://v1/<mediaId>/…` URIs**, NOT https → must convert to `static.wixstatic.com` (use the SDK media helper) |
| **Specs / details** | **`description`** (request `DESCRIPTION`) | **Ricos rich content** (`{ nodes:[…] }`). This is where eslora/año/motor/ubicación live — render it. `PLAIN_DESCRIPTION` gives plain text. |
| Categories | `mainCategoryId`, `allCategoriesInfo` (request `ALL_CATEGORIES_INFO`) | see §5 tree |
| Ribbon | `additionalRibbons` | |
| Options/variants | `options` `[]`, `variantsInfo` (1 default) | **no real variants** — boats are single-SKU |
| Inventory | `inventory` | not tracked (`trackInventory:false`, always in stock) |

> ✅ Phase 0 settled: **`infoSections` is empty** — specs are in the **`description` (Ricos)**.
> `queryProducts({ fields: [...] })` valid enums include: `URL, CURRENCY, INFO_SECTION,
> PLAIN_DESCRIPTION, DESCRIPTION, MEDIA_ITEMS_INFO, THUMBNAIL, DIRECT_CATEGORIES_INFO,
> ALL_CATEGORIES_INFO, DISCOUNT_INFO, BREADCRUMBS_INFO, MIN_VARIANT_PRICE_INFO`.
> Render the Ricos rich content with `@wix/ricos` (or a small custom renderer).

## 8. Routes to build (mirror the current site 1:1)

- `/` — home (hero, "Quiénes somos", featured boats gallery, WhatsApp CTA, podcast/CTA blocks)
- `/category/[slug]` — catalog/gallery: grid of boats, **price filter**, **sort**, "Cargar más"
- `/product-page/[slug]` — **product detail (the page that's currently blank)**: image gallery,
  title, price/offer price, specs + description (from the **Ricos rich `description`**), **WhatsApp / inquiry CTA**
- Static: `/quienes-somos`, `/vender-tu-embarcacion`, `/home-1-1-1` (accesorios), `/nuevo-curso-brasil`
- Cart + checkout (see Phase 4 — may be optional)

**Keep the exact same URLs** as the Wix site to preserve SEO and existing links.

## 9. UI source — port from `mg-nautica-web` (not the Wix site)

The UI **already exists** in the `mg-nautica-web` Flask repo: a full custom boat-marketplace
design (hand-written `app/static/css/main.css`, ~31 KB, plus Jinja templates). We port that
HTML/CSS into Next.js components and wire it to Wix data. This is much faster than rebuilding
from scratch, and the look is already the intended one.

**Reuse strategy:** keep `main.css` largely **as-is** (it's framework-agnostic CSS) as a global
stylesheet / CSS Modules to preserve the exact look with minimal effort. Port each Jinja
template's markup to JSX. Tailwind is optional, only for new pieces.

**Template → route mapping:**

| `mg-nautica-web` template | Next.js route / component |
|---|---|
| `templates/base.html` (nav + footer) | `app/layout.tsx` (shared nav/footer) |
| `templates/home.html` | `app/page.tsx` (`/`) |
| `templates/boats/list.html` | `app/category/[slug]/page.tsx` |
| `templates/boats/detail.html` (347 lines, rich) | `app/product-page/[slug]/page.tsx` ← the page that's blank today |
| `templates/accessories/list.html` + `detail.html` | accessories routes (if kept) |
| `templates/about.html`, `contact.html`, `sell_your_boat.html`, `services.html`, `404.html` | static pages |
| `static/css/main.css`, `static/js/main.js`, `file-preview.js` | `app/globals.css` + client components |

**Do NOT port:** the Flask `admin/` panel and the server-side integrations
(`integrations/mercadolibre|youtube|facebook|instagram|whatsapp`) — product management now
lives in the **Wix dashboard**. We only take the **public-facing** UI. (The boat-spec fields
used by `boats/detail.html` are a useful checklist for mapping Wix `additionalInfoSections`.)

**Assets:** copy `mg-nautica-web/app/static/` (css, js, fonts, favicons, logo) into the new
repo's `public/`. Boat images come from Wix (`static.wixstatic.com`) via `next/image` remotePatterns.

## 10. Commerce vs lead-gen — decision

These are **high-ticket brokered boats**; the real conversion is a **WhatsApp inquiry**, not an
online card purchase (the live "Agregar al carrito" is mostly vestigial). Recommendation:

- **Phase 1 product pages → WhatsApp/inquiry CTA** (prefilled message with boat name + URL).
- **Online cart/checkout = optional Phase 4**, only if the owner actually wants on-site purchase.
  If yes: `ecom.createCheckout()` + `redirects.createRedirectSession()` → Wix-hosted checkout.

This removes the most complex/uncertain piece from the critical path.

## 11. SEO parity (must-have, since this replaces a live indexed site)

- Identical URLs (`/product-page/<slug>`, `/category/<slug>`).
- Per-page `<title>`, meta description, canonical.
- **Product structured data** (schema.org/Product) on detail pages.
- Open Graph tags for WhatsApp/social previews.
- Generated `sitemap.xml` + `robots.txt`.
- SSR/ISR so crawlers get full HTML (revalidate product pages on a timer).

## 12. Phased roadmap

- [x] **Phase 0 — Validate (read-only POC):** ✅ OAuth client `7d680ee7-…` works (visitor
      tokens). **63 public products** (the "71" includes hidden/drafts). Site on **Catalog V3**.
      Specs live in the **Ricos `description`** (`infoSections` empty). No variants. USD only.
      Categories mapped (§5). Media are `wix:image://` URIs needing conversion.
- [x] **Phase 1 — Scaffold + repo + pipeline:** ✅ Next.js 16 + React 19 + TS scaffold, Wix SDK
      client (`lib/wix.ts`), `next/image` remote patterns for `static.wixstatic.com`, ported
      `main.css` + nav/footer + home hero + client JS from `mg-nautica-web`. GitHub repo created,
      **CI green** (lint/typecheck/build on Actions). **Pending sub-steps:** branch protection on
      `main`; enable deploy (set `DEPLOY_ENABLED=true` + Vercel secrets); first Preview/Prod deploy.
- [ ] **Phase 2 — Catalog + Product detail:** port `boats/list.html` → `/category/[slug]` and
      `boats/detail.html` → `/product-page/[slug]` (fixes the blank page), fed by Wix data. WhatsApp CTA.
- [ ] **Phase 3 — Home + static pages + nav/footer** (port `home.html`, `base.html`, static templates).
- [ ] **Phase 4 — (optional) Cart + Wix-hosted checkout.**
- [ ] **Phase 5 — SEO:** metadata, sitemap, OG, Product schema, ISR.
- [ ] **Phase 6 — Deploy + cutover:** confirm Production deploy on Vercel, point domain DNS to
      Vercel, verify, monitor. (The pipeline already exists from Phase 1 — this is the domain swap.)

## 13. Tech stack / dependencies

```
next, react, typescript
styling: reuse mg-nautica-web app/static/css/main.css (global CSS / CSS Modules) — Tailwind optional
@wix/sdk @wix/stores (productsV3) @wix/categories @wix/ecom @wix/redirects
rich text: @wix/ricos (render the product description) — or a small custom Ricos renderer
(image) next/image + Wix media-URI → static.wixstatic.com helper  (icons) lucide-react (optional)
source control: GitHub (public repo)   CI: GitHub Actions (lint/typecheck/build/test)
deploy: GitHub Actions → Vercel CLI (vercel deploy --prebuilt)   hosting: Vercel
secrets: WIX_CLIENT_ID (public), WIX_API_KEY (server only), VERCEL_TOKEN/ORG_ID/PROJECT_ID (Actions)
```

## 14. Open questions to resolve during the POC

1. ~~How are boat specs stored~~ — **in the Ricos `description`** (infoSections empty).
2. Is on-site checkout actually wanted, or is WhatsApp/lead-gen enough? **(still open — building lead-gen first)**
3. ~~Variants/options~~ — **none** (single-SKU boats).
4. ~~Multi-currency or USD only~~ — **USD only**.
5. ~~71 vs 63~~ — **render the 63 public**; hidden/drafts aren't exposed to visitor tokens.
6. ~~Deploy pipeline + repo visibility~~ — **decided: GitHub Actions-owned deploy via Vercel
   CLI, public repo** (see §4).

## 15. Risks & notes

- Owner keeps the Wix dashboard workflow (✅), but **loses the Wix visual editor** for the
  storefront — layout changes are now code.
- Checkout (if used) still routes through Wix's hosted page.
- Keep the Wix site/plan active: it's the backend. We are not cancelling Wix, only bypassing
  its renderer.
- Domain cutover is the only "live" step — plan it for low-traffic hours, keep Wix reachable
  for rollback.
- Deploy secrets (`WIX_API_KEY`, `VERCEL_TOKEN`) live only in Vercel/GitHub secret stores,
  never committed. CI must stay green as the merge gate so a broken build can't reach production.
