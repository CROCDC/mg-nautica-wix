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
- **GitHub** (source) → **GitHub Actions** (CI) → **Vercel** (production only)
- Demo/preview environments: **the nexttech Pi** via `preview/<name>` branches (see [Design previews](#design-previews-pi))

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
`WIX_API_KEY` + `WIX_SITE_ID` are server-only; the newsletter needs them to write subscribers
into the Wix CRM (see [docs/NEWSLETTER-PLAN.md](./docs/NEWSLETTER-PLAN.md)).

## Deploy pipeline

GitHub Actions owns the deploy (see plan §4):

- **`.github/workflows/ci.yml`** — runs on every push/PR: `lint`, `typecheck`, `build`. Set it
  as a **required check** on `main` in branch protection.
- **`.github/workflows/deploy.yml`** — `main` → Vercel **Production**, and nothing else: PRs do
  **not** get a Vercel preview (demos go to the Pi, see below). It is **inert until enabled**: set the repo variable `DEPLOY_ENABLED=true` and the secrets
  `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (get the IDs with `vercel link`). Turn
  **off** Vercel's own Git integration for this project so deploys happen only from Actions.

App env vars (`NEXT_PUBLIC_WIX_CLIENT_ID`, etc.) live in the Vercel project settings.

> **Vercel is production only.** Never create a demo or preview environment on Vercel
> (`vercel deploy` without `--prod`, Vercel's Git integration, preview URLs to share): every
> environment to show a branch runs on the Pi as `preview/<name>`.

## Design previews (Pi)

Every `preview/<name>` branch gets its own environment on the nexttech Pi. This is the only
place demo environments live: to show a feature branch, push it (or a copy of it) as
`preview/<name>` and share `https://mgn-<name>.nexttech.com.ar`:

```bash
git checkout -b preview/dark-hero main
git push -u origin preview/dark-hero   # → https://mgn-dark-hero.nexttech.com.ar
git push origin --delete preview/dark-hero   # tears the environment down
```

- **`.github/workflows/preview.yml`** triggers the Jenkins job `mg-nautica-wix-preview`:
  `deploy` on every push to the branch, `destroy` when the branch is deleted.
- **`Jenkinsfile.preview`** + **`docker-compose.preview.yml`** build the `Dockerfile` and run
  it as compose project `mgn-<name>`; nginx-proxy routes the host, and the `*.nexttech.com.ar`
  wildcard (DNS + cert) covers any name, so a new preview needs no infra change.
- The name is lowercased and anything outside `a-z0-9` becomes `-` (max 50 chars).
- Previews read the live Wix catalog, send `X-Robots-Tag: noindex`, and have the newsletter
  off (no `WIX_API_KEY`). Builds run one at a time, so a few minutes per push on the Pi.
- The destroy step runs `Jenkinsfile.preview` from `main`, so these files must be on `main`.
