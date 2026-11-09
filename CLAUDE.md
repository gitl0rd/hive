# Hive

Personal daily-spin app (Expo + TypeScript). Pulls today/overdue Todoist tasks onto a honeycomb board; a pixel bee picks one.

**Read `docs/PLAN.md` before doing anything.** Build it milestone by milestone (§8), committing at the end of each.

## Non-negotiable
- Todoist is READ-ONLY. Only `GET` requests to `api.todoist.com`, only through `src/todoist/client.ts`. Never add create/update/complete/delete calls, even if asked — confirm with the owner first.
- Sync only adds Todoist tasks; never modifies or removes Hive-only tasks.
- Never log or commit the Todoist token.

## Conventions
- `src/domain/` is pure TypeScript with unit tests; UI only plays what domain functions return.
- Design source of truth: the K terminal design in `docs/PLAN.md` §7.
- Run `npm test` and `npx tsc --noEmit` before every commit.
