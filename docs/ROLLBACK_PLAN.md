# Rollback Plan

**Generated:** 2026-04-09

---

## Pre-Execution Baseline

Before any changes begin:
1. **Git commit hash:** Current HEAD (`git rev-parse HEAD`)
2. **Vercel deployment:** Current production URL (snapshot in Vercel dashboard)
3. **KV backup:** JSON dump from Step A1 stored locally

## Per-Group Rollback

### Group A — Safety Net
- **Risk:** None (read-only)
- **Rollback:** N/A — no code changes
- **Data:** N/A

### Group B — Single Source of Truth
- **Risk:** MEDIUM — polling/sync timing changes could break timer updates or audio
- **Files modified:** `SyncProvider.tsx`, `useAudioSync.ts`, `DataProvider.tsx`, `SettingsContext.tsx`
- **Rollback:** `git checkout HEAD~N -- apps/web/src/contexts/ apps/web/src/hooks/useAudioSync.ts`
- **Vercel:** Redeploy previous commit
- **Data:** No KV changes — safe

### Group C — Data Integrity
- **Risk:** LOW — additive error handling
- **Files modified:** `session.repo.ts`, `auth.service.ts`, `admin.service.ts`, `session.service.ts`, `sessions/route.ts`
- **Rollback:** `git checkout HEAD~N -- apps/web/src/repositories/session.repo.ts apps/web/src/services/`
- **Data:** No KV schema changes — safe

### Group D — Core Flow Fixes
- **Risk:** LOW — visual fix + admin query
- **Files modified:** `useDynamicFavicon.ts`, `admin.service.ts`
- **Rollback:** `git checkout HEAD~N -- <files>`
- **Data:** No KV changes — safe

### Group E — Settings Fixes
- **Risk:** LOW — type annotations + modal replacement
- **Files modified:** `settings/page.tsx`, `DisplaySync.tsx`, `ConnectionIndicator.tsx`, scripts
- **Rollback:** `git checkout HEAD~N -- <files>`
- **Data:** No KV changes — safe

### Group F — Admin & Pages
- **Risk:** LOW — additive validation
- **Files modified:** `dashboard/page.tsx`, `feedback/page.tsx`, `feedback/route.ts`, `tos/route.ts`, `dashboard/route.ts`
- **Rollback:** `git checkout HEAD~N -- <files>`
- **Data:** No KV changes — safe

### Group G — Multi-Device Sync
- **Risk:** LOW — documentation + verification
- **Files modified:** Possibly `useBroadcast.ts`
- **Rollback:** `git checkout HEAD~N -- <files>`
- **Data:** No KV changes — safe

### Group H — Visual Polish
- **Risk:** LOW — dead code removal + cosmetic
- **Files modified:** `middleware.ts`, `Sidebar.tsx`, deleted files
- **Rollback:** `git checkout HEAD~N -- <files>` (deleted files recovered from git)
- **Data:** No KV changes — safe

### Group I — Security
- **Risk:** MEDIUM — auth flow changes
- **Files modified:** `login/page.tsx`, `auth/callback/route.ts`, `auth/tos/route.ts`, `auth/session/route.ts`, `auth/logout/route.ts`
- **Rollback:** `git checkout HEAD~N -- apps/web/src/app/api/auth/ apps/web/src/app/(auth)/`
- **Critical test:** After rollback, verify login flow works end-to-end
- **Data:** No KV schema changes — safe. Existing sessions remain valid.

### Group J — Testing
- **Risk:** NONE — additive test files
- **Rollback:** Delete new test files
- **Data:** No changes

---

## Emergency Full Rollback

If at any point the app is in a worse state than baseline:

1. **Stop all changes immediately**
2. **Revert to baseline commit:** `git reset --hard <baseline-hash>`
3. **Redeploy:** `vercel --prod` from clean state
4. **Verify KV data:** Compare current KV state against A1 backup JSON
5. **If KV data corrupted:** Run restore script from A1 backup (write-if-missing, never overwrite)
6. **Notify:** Document what went wrong in BUG_INVENTORY.md

---

## Data Protection Guarantees

Throughout all groups:
- **No KV key pattern changes** — all existing keys remain valid
- **No schema version bumps** — settings migration is forward-compatible
- **No user data deletion** — only dead CODE is deleted, never data
- **Settings repo always merges** — RULE 0 enforced in every step
- **Session soft-delete only** — no hard deletes anywhere
