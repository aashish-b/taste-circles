# Taste Circles V1 Foundation

## Scope implemented

This scaffold now includes a persisted baseline for the highest-value V1 paths:

- App shell with constrained route map and sheet-first interactions.
- Theme system (`Parchment + Umber Forest`) via CSS tokens.
- Reusable components: `ListRow`, chips, sheet/drawer, `EntryCard`, `RecommendationCard`, state components.
- Profile visualizer: server-rendered `Verdict Wave` on `/me` and `/u/[handle]`.
- Canonical Item + UserItem data split represented in TypeScript and Prisma.
- Prisma-backed list/search/add/item detail flows.
- Server-only provider adapter interface and seeded provider fixtures.
- Manual-add fallback with offline queue persistence in local storage.
- Taste blurb generation boundaries stubbed for future worker-based async generation.

## Route inventory

Primary routes:

1. `/auth`
2. `/me`
3. `/u/[handle]`
4. `/u/[handle]/[category]`
5. `/item/[itemId]`
6. `/search`
7. `/inbox`
8. `/people`
9. `/settings`

Engineering route:

- `/styleguide` for component/state iteration.

## Add flow implementation shape

1. Client calls `/api/search` for both DB-first and provider-backed results.
2. User selects provider result or manual fallback.
3. Client posts to `/api/items/add`.
   - Verdict score is required at add time.
4. Server executes one transaction:
   - upsert `Item` by `(category, provider, providerId)`
   - upsert `UserItem` by `(user_id, item_id)`
5. Search page refreshes current category entries from `/api/lists/category`.
6. Offline manual entries are queued in local storage and flushed when back online.

## Current persistence boundaries

Persisted today:

- Users (dev bootstrap user)
- Category list settings
- Items
- UserItems
- Recommendations (inbox + acknowledge actions)
- Taste blurbs (read only)
- Circles/members (read only)

Still stubbed:

- Real provider integrations/caching tables
- Auth/session-backed identity
- Taste blurb generation jobs

## Next iterations

- Replace fixture provider search with real adapters + cache tables.
- Add DB sessions + OAuth + credentials auth.
- Expand recommendation actions with optional one-liner, verdict, and excellent/incompatible prompts.
- Move taste-blurb generation into background worker queue.
