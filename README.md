# Taste Circles

Responsive web app + PWA scaffold for tracking and sharing media taste with circles.

## Stack

- Next.js (App Router) + TypeScript
- Prisma + PostgreSQL
- CSS-variable design system (Parchment + Umber Forest)
- Vitest for lightweight behavioral checks

## Local setup

1. Start local Postgres:

```bash
docker compose up -d db
```

2. Create env file:

```bash
cp .env.example .env
```

3. Install and setup DB:

```bash
npm install
npm run db:setup
```

4. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Workspace gate:

```bash
/Users/aashishbalaji/Desktop/codex-mvp/scripts/quality_gate.sh /Users/aashishbalaji/Desktop/codex-mvp/taste-circles
```

## Current route map

- `/auth`
- `/me`
- `/u/[handle]`
- `/u/[handle]/[category]`
- `/item/[itemId]`
- `/search`
- `/inbox`
- `/people`
- `/settings`
- `/styleguide` (engineering)

## Notes

- External metadata providers are server-only behind adapter interfaces.
- Add flow supports DB-first search, provider fallback, and manual add while offline.
- Dev identity is currently environment-driven (`DEV_USER_HANDLE`) until auth flows land.
