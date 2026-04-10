# Migration Plan

**Generated:** 2026-04-09
**Total steps:** 47
**Estimated risk:** Low-Medium (most changes are additive; foundation-first order prevents cascading breaks)

---

## STEP GROUP A — SAFETY NET

### A1. Back up all user data from KV
- **What changes:** Create a script that dumps all KV keys to a JSON file
- **Files:** `scripts/backup-kv.ts` (new)
- **Test after:** JSON file exists, contains user/settings/session/timer data
- **Could break:** Nothing (read-only operation)
- **Rollback:** N/A

### A2. Write smoke test script
- **What changes:** Create a script that verifies: app compiles, shared tests pass, no 500s on critical API routes
- **Files:** `scripts/smoke-test.sh` (new)
- **Test after:** Script runs and produces pass/fail report
- **Could break:** Nothing (read-only)
- **Rollback:** N/A

### A3. Run smoke test — establish baseline
- **What changes:** Execute smoke test, document current state
- **Files:** None modified
- **Test after:** Baseline documented
- **Could break:** Nothing
- **Rollback:** N/A

---

## STEP GROUP B — SINGLE SOURCE OF TRUTH

### B1. Stabilize SyncProvider callbacks (fix A2)
- **What changes:** Make `updateState` and `poll` truly stable using refs. Stop recreating effects every render.
- **Files:** `contexts/SyncProvider.tsx`
- **Test after:** No interval churn in console. Timer state still syncs. Connection indicator works.
- **Could break:** Sync timing; poll might not start
- **Rollback:** Revert SyncProvider.tsx

### B2. Remove redundant timer polling from useAudioSync (fix A1)
- **What changes:** Instead of polling `/api/timer` directly, subscribe to SyncProvider's `timerState`. Remove the 2s poll interval.
- **Files:** `hooks/useAudioSync.ts`
- **Test after:** Audio still starts/stops with timer. Only SyncProvider polls. Network requests drop by ~50%.
- **Could break:** Audio might not sync if SyncProvider state doesn't reach useAudioSync
- **Rollback:** Revert useAudioSync.ts

### B3. Stabilize DataProvider refresh interval (fix A3)
- **What changes:** Pass empty deps `[]` to the 30s refresh useEffect, use refs for the callback functions
- **Files:** `contexts/DataProvider.tsx`
- **Test after:** Sessions still refresh. No interval churn.
- **Could break:** Background refresh might stop if refs are stale
- **Rollback:** Revert DataProvider.tsx

### B4. Wire SyncProvider settings-changed event to SettingsContext (fix I1, I3)
- **What changes:** When SyncProvider receives 'settings-changed' Pusher event OR poll detects settings timestamp change, call a new `refreshFromServer()` function on SettingsContext.
- **Files:** `contexts/SyncProvider.tsx`, `contexts/SettingsContext.tsx`
- **Test after:** Change a setting in one browser tab, verify other tab updates within 10s
- **Could break:** Settings could flicker if remote settings overwrite in-flight local changes
- **Rollback:** Revert both files

### B5. Wire SyncProvider session-logged event to DataProvider (fix I4)
- **What changes:** When SyncProvider receives 'session-logged' event, trigger DataProvider refresh
- **Files:** `contexts/SyncProvider.tsx`, `contexts/DataProvider.tsx`
- **Test after:** Complete a session on one device, verify counters update on another
- **Could break:** Excessive refreshes if events fire rapidly
- **Rollback:** Revert both files

### B6. Run smoke test
- **Test after:** Everything that worked before still works, network requests reduced, sync works across tabs

---

## STEP GROUP C — DATA INTEGRITY

### C1. Add try-catch + retry to session.repo.create (fix C4)
- **What changes:** Wrap the two-step create (set + lpush) in a try-catch. If lpush fails, retry once. If both fail, delete the orphaned session key.
- **Files:** `repositories/session.repo.ts`
- **Test after:** Sessions still log. Simulate failure (mock) — no orphaned records.
- **Could break:** Extra KV calls on failure path
- **Rollback:** Revert session.repo.ts

### C2. Add audit log error handling (fix D5)
- **What changes:** Wrap auditRepo.log() calls in try-catch with console.error fallback. Never let audit failure prevent the primary operation.
- **Files:** `services/auth.service.ts`, `services/admin.service.ts`
- **Test after:** Auth flow works even if audit fails. Audit failures logged to console.
- **Could break:** Nothing (additive error handling)
- **Rollback:** Revert files

### C3. Improve bulk operation error reporting (fix D6)
- **What changes:** Track failed IDs in bulkDelete/bulkChangeCategory. Return `{ succeeded: number, failed: string[] }`.
- **Files:** `services/session.service.ts`, `app/api/sessions/route.ts`
- **Test after:** Bulk delete returns count + any failed IDs
- **Could break:** API response shape change — but no current consumer uses the failed list
- **Rollback:** Revert files

### C4. Run smoke test
- **Test after:** Data operations reliable. Sessions log correctly. Audit logs don't block auth.

---

## STEP GROUP D — CORE FLOW FIXES

### D1. Fix useDynamicFavicon flash animation (fix M6)
- **What changes:** Move `flashPhase` from local variable to `useRef`
- **Files:** `hooks/useDynamicFavicon.ts`
- **Test after:** Complete a session. Favicon shows flash animation briefly before returning to idle.
- **Could break:** Animation might loop or not stop
- **Rollback:** Revert file

### D2. Fix admin pulse data stubs (fix D7)
- **What changes:** Replace hardcoded zeros with actual queries: count active sessions, count today's sessions, sum today's focus hours, count unique active users
- **Files:** `services/admin.service.ts`
- **Test after:** Admin analytics shows real numbers instead of zeros
- **Could break:** Performance if queries are slow
- **Rollback:** Revert file

### D3. Run smoke test
- **Test after:** Timer flows work. Admin shows real data. Favicon animates.

---

## STEP GROUP E — SETTINGS FIXES

### E1. Fix settings page implicit any types (fix E2)
- **What changes:** Add explicit types to all Stepper/Slider/Select onChange callbacks: `(v: number) =>` or `(v: string) =>`
- **Files:** `app/(app)/settings/page.tsx`
- **Test after:** `tsc --noEmit` error count drops by ~49. Settings page still renders and functions.
- **Could break:** Nothing (type annotations only)
- **Rollback:** Revert file

### E2. Fix DisplaySync/ConnectionIndicator index types (fix E3)
- **What changes:** Add type assertions or record lookups to fix TS7053 errors
- **Files:** `components/layout/DisplaySync.tsx`, `components/layout/ConnectionIndicator.tsx`
- **Test after:** TS error count drops by 3. Display sync still works.
- **Could break:** Nothing (type fixes only)
- **Rollback:** Revert files

### E3. Fix script variable redeclarations (fix E4)
- **What changes:** Wrap scripts in IIFEs or rename variables to avoid block-scope conflicts
- **Files:** `scripts/backup.ts`, `scripts/migrate.ts`
- **Test after:** TS error count drops by 2
- **Could break:** Nothing
- **Rollback:** Revert files

### E4. Replace native confirm()/prompt() with accessible modals (fix G5)
- **What changes:** Replace `window.confirm()` in "Reset to Factory" and `window.prompt()` in "Clear All Data" with ConfirmModal component
- **Files:** `app/(app)/settings/page.tsx`
- **Test after:** Reset and Clear actions show styled modals, work with keyboard, screen readers can access
- **Could break:** Modal interaction flow might differ from native
- **Rollback:** Revert file

### E5. Run smoke test
- **Test after:** All settings work. TS errors reduced. Accessible modals for destructive actions.

---

## STEP GROUP F — ADMIN & PAGES

### F1. Fix remaining ARIA gaps (fix G6, G7)
- **What changes:** Add aria-labels to chart tooltips in dashboard. Add aria-haspopup to feedback export dropdown.
- **Files:** `app/(app)/dashboard/page.tsx`, `app/(admin)/feedback/page.tsx`
- **Test after:** Screen reader announces chart data points. Export menu has correct ARIA.
- **Could break:** Nothing (additive attributes)
- **Rollback:** Revert files

### F2. Fix feedback optional field validation (fix B5)
- **What changes:** Validate severity enum, stepsToReproduce length, page URL format in feedback POST route
- **Files:** `app/api/feedback/route.ts`
- **Test after:** Invalid severity rejected with 400. Valid feedback still submits.
- **Could break:** Existing feedback submissions with unexpected values would be rejected
- **Rollback:** Revert file

### F3. Fix TOS accepted type check (fix B6)
- **What changes:** Check `typeof body.accepted === 'boolean'` instead of truthy check
- **Files:** `app/api/auth/tos/route.ts`
- **Test after:** TOS acceptance still works with `{accepted: true}`. Rejects `{accepted: "yes"}`.
- **Could break:** Nothing (stricter validation)
- **Rollback:** Revert file

### F4. Add try-catch to dashboard route (fix B7)
- **What changes:** Wrap `dashboardService.getDashboardData()` in try-catch, return 500 with generic error
- **Files:** `app/api/dashboard/route.ts`
- **Test after:** Dashboard works. Simulated service error returns 500 (not stack trace).
- **Could break:** Nothing (additive error handling)
- **Rollback:** Revert file

### F5. Run smoke test
- **Test after:** All admin pages functional. Validation tighter. Error handling improved.

---

## STEP GROUP G — MULTI-DEVICE SYNC

### G1. Document Pusher setup instructions
- **What changes:** Create setup guide for Pusher credentials
- **Files:** `docs/PUSHER_SETUP.md` (new)
- **Test after:** Document exists with step-by-step instructions
- **Could break:** Nothing
- **Rollback:** N/A

### G2. Test BroadcastChannel sync
- **What changes:** Verify BroadcastChannel works for same-browser tabs. Fix any issues found.
- **Files:** Possibly `hooks/useBroadcast.ts`
- **Test after:** Open two tabs. Start timer in one. Both show running state.
- **Could break:** Tab sync might conflict with SyncProvider
- **Rollback:** Revert file

### G3. Run smoke test
- **Test after:** Multi-tab sync verified. Pusher setup documented.

---

## STEP GROUP H — VISUAL POLISH

### H1. Fix rate limiter off-by-one (fix F6)
- **What changes:** Move `entry.count++` before the check, not after
- **Files:** `app/api/middleware.ts`
- **Test after:** Rate limit at exactly `limitPerMinute`, not `limitPerMinute + 1`
- **Could break:** Slightly stricter rate limiting
- **Rollback:** Revert file

### H2. Remove hardcoded version string (fix M4)
- **What changes:** Read version from `process.env.APP_VERSION || '3.1.0'` instead of hardcoded string in Sidebar
- **Files:** `components/layout/Sidebar.tsx`, or pass version as prop from SidebarWrapper
- **Test after:** Sidebar shows correct version. Changing env var updates display.
- **Could break:** Version might show undefined if env var not set
- **Rollback:** Revert file

### H3. Clean up dead code (fix H1-H6)
- **What changes:** Delete: OnboardingOverlay (never rendered), AriaLive (never imported), SOUND_FREQUENCIES, unused KV key generators, unused admin types. Mark sanitize.ts exports that are unused.
- **Files:** Multiple deletions
- **Test after:** `tsc --noEmit` — no new errors. App still works.
- **Could break:** If something actually imports these files dynamically
- **Rollback:** `git checkout` deleted files

### H4. Run smoke test
- **Test after:** Codebase cleaner. No functional regressions.

---

## STEP GROUP I — SECURITY

### I1. Add OAuth state parameter (fix F1)
- **What changes:** Generate random `state` param in login page, store in sessionStorage. Verify `state` matches in callback route.
- **Files:** `app/(auth)/login/page.tsx`, `app/api/auth/callback/route.ts`
- **Test after:** Login still works. Missing/mismatched state param returns error.
- **Could break:** Login flow if state doesn't survive Google redirect
- **Rollback:** Revert both files

### I2. Standardize auth middleware usage (fix F2)
- **What changes:** Convert auth/tos, auth/session, auth/logout to use `requireAuth` middleware instead of manual token extraction
- **Files:** `app/api/auth/tos/route.ts`, `app/api/auth/session/route.ts`, `app/api/auth/logout/route.ts`
- **Test after:** All auth routes return consistent 401 responses. Login/logout still work.
- **Could break:** Auth flow if middleware doesn't handle edge cases the manual code did
- **Rollback:** Revert files

### I3. Fix error details in callback redirect (fix F5)
- **What changes:** Replace detailed error messages in redirect URL with generic error codes
- **Files:** `app/api/auth/callback/route.ts`
- **Test after:** Auth errors show generic "Authentication failed" instead of stack details
- **Could break:** Harder to debug auth issues (add server-side logging to compensate)
- **Rollback:** Revert file

### I4. Run smoke test
- **Test after:** Auth flow secure. OAuth state validated. Consistent error responses.

---

## STEP GROUP J — AUTOMATED TESTING

### J1. Write unit tests for timer service state transitions
- **What changes:** Test all state transitions: idle→running, running→paused, paused→running, running→completed, completed→overtime, etc.
- **Files:** `__tests__/unit/timer.service.test.ts` (new or fix existing)
- **Test after:** All tests pass
- **Could break:** Nothing (additive)
- **Rollback:** Delete test file

### J2. Write unit tests for streak calculation
- **What changes:** Test streak.ts with edge cases: DST transitions, streak freezes, different calculation modes
- **Files:** `packages/shared/src/utils/streak.test.ts` (new)
- **Test after:** All tests pass
- **Could break:** Nothing (additive)
- **Rollback:** Delete test file

### J3. Fix integration test module resolution (fix E1 partial)
- **What changes:** Fix path alias resolution in test configuration so `@/` imports work in test files
- **Files:** `apps/web/vitest.config.ts` or `tsconfig.json`
- **Test after:** Integration tests can at least compile (may not pass due to KV mocking)
- **Could break:** Other test configs
- **Rollback:** Revert config

### J4. Run full test suite
- **Test after:** Shared: 138+ tests passing. Integration: compiling. E2E: documented but not blocking.

---

## Step Summary

| Group | Steps | Risk | Key Concern |
|-------|-------|------|-------------|
| A — Safety Net | 3 | NONE | Read-only |
| B — Single Source of Truth | 6 | MEDIUM | Polling/sync timing |
| C — Data Integrity | 4 | LOW | Error handling (additive) |
| D — Core Flow Fixes | 3 | LOW | Visual + admin data |
| E — Settings Fixes | 5 | LOW | Type fixes + accessible modals |
| F — Admin & Pages | 5 | LOW | Validation (additive) |
| G — Multi-Device Sync | 3 | LOW | Documentation + verification |
| H — Visual Polish | 4 | LOW | Dead code removal |
| I — Security | 4 | MEDIUM | Auth flow changes |
| J — Testing | 4 | NONE | Additive tests |

**Total: 41 atomic steps + 6 smoke tests = 47 steps**
