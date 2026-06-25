# MG Náutica — Headless Storefront

Owned, self-hosted storefront for **MG Náutica** (boat broker). It renders the website
ourselves with **Next.js** while **Wix stays the backend** — the owner keeps managing boats
from the Wix dashboard exactly as before. This replaces the Wix-rendered frontend, whose
product pages (`/product-page/*`) broke in production (blank renders).

The visual design is **ported from the `mg-nautica-web` Flask app** (its `main.css` + templates),
fed with Wix Stores data instead of the Flask DB.

> Full rationale, architecture and roadmap: [MG-NAUTICA-HEADLESS-PLAN.md](./MG-NAUTICA-HEADLESS-PLAN.md)

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Wix SDK** (`@wix/sdk`, `@wix/stores`, `@wix/ecom`, `@wix/redirects`) as the data/commerce backend
- Styling: the ported `app/main.css` (the original site's stylesheet, used as-is)
- **GitHub** (source) → **GitHub Actions** (CI) → **Vercel** (deploy)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in NEXT_PUBLIC_WIX_CLIENT_ID
npm run dev                  # http://localhost:3000
```

Scripts:

| Script | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (next/core-web-vitals + typescript) |
| `npm run typecheck` | `tsc --noEmit` |

## Project structure

```
app/
  layout.tsx        Root layout — <Header>, <Footer>, main.css, main.js
  page.tsx          Home (/) — hero ported from mg-nautica-web
  main.css          Ported stylesheet (design system: navy/gold, Playfair + Inter)
components/
  Header.tsx        Nav (ported from base.html)
  Footer.tsx        Footer (ported from base.html)
lib/
  wix.ts            Wix SDK client (visitor tokens via OAuth)
public/
  site/             Site imagery (hero, founders, logo, …)
  js/main.js        Ported client behavior (header shadow, burger, scroll reveals)
  favicon-32.png, favicon-180.png
```

## Environment variables

See [.env.example](./.env.example). The only one needed to run the storefront is
`NEXT_PUBLIC_WIX_CLIENT_ID` (Wix OAuth public client id — Wix dashboard → Settings → Headless).
`WIX_API_KEY` is server-only and optional.

## Deploy pipeline

GitHub Actions owns the deploy (see plan §4):

- **`.github/workflows/ci.yml`** — runs on every push/PR: `lint`, `typecheck`, `build`. Set it
  as a **required check** on `main` in branch protection.
- **`.github/workflows/deploy.yml`** — PR → Vercel **Preview**, `main` → **Production**.
  It is **inert until enabled**: set the repo variable `DEPLOY_ENABLED=true` and the secrets
  `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (get the IDs with `vercel link`). Turn
  **off** Vercel's own Git integration for this project so deploys happen only from Actions.

App env vars (`NEXT_PUBLIC_WIX_CLIENT_ID`, etc.) live in the Vercel project settings.
