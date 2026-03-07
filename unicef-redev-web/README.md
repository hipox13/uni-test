# unicef-redev-web

**Public website** for UNICEF Donation Platform. Next.js + TanStack Query.  
SEO-friendly pages: donate, campaign, etc. Caching via TanStack Query.

## Structure

- `src/app/` – root layout, page; `[locale]/` for i18n (donate, campaign)
- `src/components/` – donation, payment, ui
- `src/lib/` – api client, utils, constants

## Scripts

- `npm run dev` – dev server
- `npm run build` – production build

## Repo role

Admin CMS is **unicef-redev-cms**. This repo is public-facing only.
