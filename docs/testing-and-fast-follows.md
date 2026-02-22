# Testing Plan And Fast Follows

## Release goal

Ship a usable private beta where one person can reliably:

- add items across all 6 categories,
- see them persist across refresh/restart,
- manage status/star/verdict,
- browse their category lists and item details,
- recover from provider/search failures using manual add.

## Testing plan

### 1) Static and build gates (every PR)

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Purpose:

- catch schema/type regressions,
- prevent client/server import boundary mistakes,
- ensure app-router pages compile before merge.

### 2) Persistence smoke tests (every PR touching data)

Manual deterministic script:

1. `docker compose up -d db`
2. `cp .env.example .env`
3. `npm run db:setup`
4. `npm run dev`
5. In `/search`, add one manual item in each category.
6. Refresh page.
7. Verify entries are present in `/u/me/<category>`.
8. Restart dev server and re-check lists.

Pass condition:

- all added items remain visible after refresh and restart.

### 3) Critical UX resilience checks (every release candidate)

Run these manual checks:

1. Turn off network, manual add from `/search`, confirm offline banner.
2. Turn network back on, confirm queued entries sync.
3. Trigger empty states on `/inbox`, `/people`, and a fresh category list.
4. Trigger error state by stopping DB and loading `/search`.

Pass condition:

- no dead ends; user always sees a recoverable state.

### 4) Data integrity checks (nightly or pre-release)

Run SQL checks against Postgres:

- no duplicate `(category, provider, provider_id)` in `items`
- no duplicate `(user_id, item_id)` in `user_items`
- all `user_items.item_id` resolve to an `items.id`
- all category list settings exist for active users

Pass condition:

- zero rows violating constraints.

### 5) Planned automated additions (next)

Add integration tests for:

- `/api/items/add` transaction semantics,
- `/api/search` DB-first results,
- `/api/recommendations/:id/accept` defaulting to `NONE` for first-time acceptance,
- `/api/recommendations/:id/state` syncing recommendation and `user_items.status`,
- offline queue replay behavior,
- list filtering/sorting logic in `CategoryListView`.

## Fast follows (execution order)

## Fast Follow 1: Make it personally usable this week

- Add entry edit endpoint and wire `EntryCard` save action.
- Persist `starred`, `status`, `verdict_score`, `impact_age`, and one-liner updates.
- Add optimistic UI updates on item detail and category list.

Done when:

- you can fully maintain your own list without touching DB tooling.

## Fast Follow 2: Real auth and identity safety

- Add DB-backed sessions.
- Implement credentials auth and password hashing (argon2).
- Add Google/Apple OAuth with explicit account linking.
- Remove dev-user bootstrap path from default runtime.

Done when:

- identity is stable and revocable across devices.

## Fast Follow 3: Recommendations that actually work

- Create send recommendation API.
- Add inbox action APIs for started/finished/dropped + optional one-liner/verdict.
- Persist `excellent` and `incompatible` toggles.

Done when:

- inbox reflects real recommendation state transitions end to end.

## Fast Follow 4: Provider quality and cache correctness

- Implement provider adapters (TMDB, Open Library, MusicBrainz, AniList, RAWG).
- Add metadata cache tables and TTL policy.
- Add parse-input support for URLs/IDs in each provider adapter.

Done when:

- provider search is reliable and fast; manual add remains always available.

## Fast Follow 5: PWA reliability and polish

- Strengthen service worker strategy and cache invalidation.
- Add installability checks and offline read behavior.
- Add instrumentation for add/search latency and failed requests.

Done when:

- app remains stable in poor network conditions and feels fast.

## Fast Follow 6: Taste nugget feature completion

- Add generation request endpoint with 24h regen guard.
- Add async worker queue for generation.
- Add visibility controls (hide/show/clear/regenerate) on profile.

Done when:

- taste nugget is user-controlled, cached, and never blocks profile load.
