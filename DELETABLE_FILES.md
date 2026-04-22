# Zenthar — Files to Delete (Cleanup Guide)

These files are either duplicates, unused, or replaced by better alternatives.
Remove them to keep the codebase clean.

---

## Duplicate / Redundant

| File | Reason | Replacement |
|------|--------|-------------|
| `src/core/types/http.types.ts` | Duplicates `ApiError` and `RequestConfig` already defined in `src/core/http/client.ts` | Delete; update any imports to use `src/core/http/client.ts` |
| `src/capsules/lab/model/sample.model.ts` | Just re-exports `src/shared/schemas/sample.schema.ts` with no additions | Delete; update imports to use the schema directly |
| `src/lib/utils.ts` | Only exports `cn(...inputs)` which is identical to `src/lib/clsx.ts` | Delete; use `clsx` from `src/lib/clsx.ts` |
| `src/orchestrator/state/app.store.ts` — `setActiveTab` action | Exposed both via `useAppStore().actions.setActiveTab` AND via `useAppActions().setActiveTab`. Sidebar, Header, Router all use `useAppActions()` — keep only that pattern. | Keep `useAppActions()` pattern; remove direct `.actions` exposure confusion |

---

## Unused Hooks

| File | Reason |
|------|--------|
| `src/capsules/lab/hooks/useLab.ts` | `LabFeature.tsx` uses `useLabSamples.ts` instead. `useLab.ts` is never imported. |
| `src/capsules/lab/hooks/useLabStore.ts` | Only used by `useLab.ts` (which is itself unused). |

---

## Misplaced Code

| File | Issue | Fix |
|------|-------|-----|
| `src/shared/components/StatusPill.tsx` (original) | Had an `ErrorBoundary` class component embedded at the bottom that shouldn't be there | Replaced — new clean version provided |
| `src/app/components/GlobalErrorBoundary.tsx` | Duplicate of `src/shared/components/ErrorBoundary.tsx` | Keep `src/shared/components/ErrorBoundary.tsx` (richer); update `src/App.tsx` to import from there |

---

## Actions Required in `package.json`

Add `@testing-library/jest-dom` to devDependencies (required by `tests/setup.ts`):

```bash
npm install --save-dev @testing-library/jest-dom
```