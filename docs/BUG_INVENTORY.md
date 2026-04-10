# Bug Inventory

**Generated:** 2026-04-09
**Method:** Full codebase read, TypeScript compiler (155 errors), npm audit (8 vulnerabilities), shared tests (138/138 passing), architectural analysis

---

## Bugs Grouped by Root Cause

### ROOT CAUSE A: Redundant/Unstable Polling Architecture
*SyncProvider, useAudioSync, and useTimer all poll `/api/timer` independently. Effects recreate on every render.*

| ID | Severity | Description | File:Line | Notes |
|----|----------|-------------|-----------|-------|
| A1 | P1 | useAudioSync polls `/api/timer` every 2s independently of SyncProvider — redundant network load | `useAudioSync.ts:101` | Should subscribe to SyncProvider instead |
| A2 | P1 | SyncProvider effects (Pusher, BroadcastChannel, Polling) recreate on every render because `updateState` and `poll` are not stable | `SyncProvider.tsx:98,152,196` | Causes interval churn, potential message loss |
| A3 | P2 | DataProvider 30s refresh interval recreated every render | `DataProvider.tsx:117-123` | `refreshSessions`/`refreshDashboard` in deps |
| A4 | P2 | useTimer JSON.stringify comparison for sync state is fragile and expensive | `useTimer.ts:72-74` | Could use timestamp-based dedup |
| A5 | P2 | SyncProvider poll interval doesn't adapt dynamically when Pusher disconnects | `SyncProvider.tsx:194` | `pusherReady` checked at interval creation only |

### ROOT CAUSE B: Missing Input Validation on API Routes
*Many POST endpoints accept untrusted data without validation.*

| ID | Severity | Description | File:Line | Notes |
|----|----------|-------------|-----------|-------|
| B1 | P1 | Timer POST: action, deviceId, mode not validated before previous audit fix | `timer/route.ts:30-31` | **PARTIALLY FIXED** in prior audit |
| B2 | P1 | Admin POST: targetUserId, newRole, feedbackId, status not validated before prior fix | `admin/route.ts:55-73` | **PARTIALLY FIXED** in prior audit |
| B3 | P1 | Sessions PATCH: sessionId, intent, category, notes not type-validated before prior fix | `sessions/route.ts:73-74` | **PARTIALLY FIXED** in prior audit |
| B4 | P2 | Settings PUT: only focusDuration bounds-checked; other numeric fields unchecked before prior fix | `settings/route.ts:32-46` | **PARTIALLY FIXED** — added shortBreak, longBreak, dailyGoal |
| B5 | P2 | Feedback POST: optional fields (severity, stepsToReproduce, etc.) passed through without validation | `feedback/route.ts:53-63` | |
| B6 | P2 | TOS POST: `body.accepted` not type-checked (accepts any truthy value) | `auth/tos/route.ts:35` | |
| B7 | P3 | Dashboard GET: no try-catch; service errors propagate as 500 | `dashboard/route.ts` | |

### ROOT CAUSE C: No Atomic KV Operations (Read-Modify-Write Races)
*Multiple services do read → modify → write without locks.*

| ID | Severity | Description | File:Line | Notes |
|----|----------|-------------|-----------|-------|
| C1 | P1 | Settings save race condition: two concurrent saves can lose changes | `settings.repo.ts:28-40` | Merge pattern mitigates but doesn't prevent |
| C2 | P1 | Timer takeOver race: read state, modify, write — another device could update between | `timer.service.ts:385-397` | |
| C3 | P2 | Timer heartbeat update race: check deviceId then write — not atomic | `timer.repo.ts:updateHeartbeat` | |
| C4 | P2 | Session create is two operations (set + lpush) — if lpush fails, orphaned session | `session.repo.ts:create` | Same pattern in feedback.repo, audit.repo |
| C5 | P3 | Beta cap race: two simultaneous new users could both pass the cap check | `auth.service.ts:processOAuthCallback` | Unlikely at beta scale |

### ROOT CAUSE D: Missing Error Handling / Silent Failures
*Critical operations swallow errors or have no retry logic.*

| ID | Severity | Description | File:Line | Notes |
|----|----------|-------------|-----------|-------|
| D1 | P1 | useTimer completion has no retry on API failure — session stuck forever if network fails (completingRef stays true) | `useTimer.ts:98-101` | **PARTIALLY FIXED** — retry added in prior audit |
| D2 | P1 | Timer finalizeSession: if sessionRepo.create() fails, timer state already updated but session data lost | `timer.service.ts:433-436` | **PARTIALLY FIXED** — retry once added |
| D3 | P2 | SettingsContext swallows save errors silently | `SettingsContext.tsx:55` | **FIXED** in prior audit — saveError state added |
| D4 | P2 | Session log: fetch error silently swallowed | `session-log/page.tsx:31-32` | **FIXED** in prior audit — fetchError state added |
| D5 | P2 | Audit log failures are silent: if auditRepo.log() fails, critical security events go unlogged | `auth.service.ts:149-156` | |
| D6 | P2 | Bulk session delete/update: partial failures — no indication which records failed | `session.service.ts:150-157` | |
| D7 | P3 | Admin pulse data returns hardcoded zeros for activeNow, todaySessions, todayFocusHours, todayActiveUsers | `admin.service.ts:21-31` | Stub implementation |

### ROOT CAUSE E: TypeScript / Build Errors
*155 TS errors, mostly module resolution and implicit any.*

| ID | Severity | Description | File:Line | Notes |
|----|----------|-------------|-----------|-------|
| E1 | P1 | 95 TS2307 errors: "Cannot find module" — path alias `@/` not resolving in tsc | Multiple files | Works at runtime (Next.js resolves), fails in strict tsc |
| E2 | P2 | 49 TS7006 errors: "Parameter implicitly has 'any' type" — settings page callbacks | `settings/page.tsx:52-109` | All Stepper/Slider/Select onChange callbacks |
| E3 | P2 | 3 TS7053 errors: Element indexing with 'any' | `DisplaySync.tsx:57`, `ConnectionIndicator.tsx:12,18` | |
| E4 | P2 | 2 TS2451 errors: Block-scoped variable redeclaration in scripts | `scripts/backup.ts:32`, `scripts/migrate.ts:120` | |
| E5 | P3 | 1 TS2322 error: Type 'unknown' not assignable to ReactNode | `settings/page.tsx:200` | |

### ROOT CAUSE F: Security / Auth Gaps
*OAuth flow lacks CSRF protection, inconsistent auth patterns.*

| ID | Severity | Description | File:Line | Notes |
|----|----------|-------------|-----------|-------|
| F1 | P1 | No OAuth state parameter — vulnerable to CSRF on auth redirect | `login/page.tsx`, `auth/callback/route.ts` | |
| F2 | P2 | Inconsistent auth: some routes use `requireAuth` middleware, others manually validate tokens | `auth/tos/route.ts`, `auth/session/route.ts`, `auth/logout/route.ts` | |
| F3 | P2 | Session tokens stored plain text in KV — if KV compromised, all sessions compromised | `auth.service.ts:202-206` | Standard for Upstash, but worth noting |
| F4 | P2 | Google Client ID hardcoded in login page source | `login/page.tsx:5` | Public client ID — not a secret, but poor practice |
| F5 | P2 | Error details encoded in auth callback redirect URL — visible in browser history | `auth/callback/route.ts:66` | |
| F6 | P3 | Rate limiter allows limit+1 requests (count incremented after check) | `middleware.ts:95-96` | Off-by-one |
| F7 | P3 | IP extraction from x-forwarded-for without validation — spoofable | `middleware.ts:85` | |

### ROOT CAUSE G: Accessibility Gaps
*Modals lack focus traps, progress indicators lack ARIA.*

| ID | Severity | Description | File:Line | Notes |
|----|----------|-------------|-----------|-------|
| G1 | P2 | ConfirmModal had no focus trap or aria-modal | `ConfirmModal.tsx` | **FIXED** in prior audit |
| G2 | P2 | DailyGoal progress bar had no role="progressbar" | `DailyGoal.tsx` | **FIXED** in prior audit |
| G3 | P2 | Sidebar logout modal had no aria-labelledby | `Sidebar.tsx` | **FIXED** in prior audit |
| G4 | P2 | CategorySelector had no Escape key handler | `CategorySelector.tsx` | **FIXED** in prior audit |
| G5 | P2 | Settings page uses native `confirm()`/`prompt()` for destructive actions — not accessible | `settings/page.tsx:252,269` | |
| G6 | P3 | Chart tooltips have no aria-labels | `dashboard/page.tsx:179` | |
| G7 | P3 | Export dropdown in feedback page has no aria-haspopup | `feedback/page.tsx:242-246` | |

### ROOT CAUSE H: Dead Code / Unused Exports
*Files and exports that nothing references.*

| ID | Severity | Description | File:Line | Notes |
|----|----------|-------------|-----------|-------|
| H1 | P3 | OnboardingOverlay component: defined but never rendered | `components/onboarding/OnboardingOverlay.tsx` | Referenced in auth.service but never mounted |
| H2 | P3 | AriaLive component: defined but never imported | `components/a11y/AriaLive.tsx` | |
| H3 | P3 | sanitize.ts: 3 of 4 exports unused (encodeHtml, stripHtml, truncateSafe) | `lib/sanitize.ts` | Only sanitizeUrl used indirectly |
| H4 | P3 | CATEGORY_DEFAULTS, SOUND_FREQUENCIES: exported but never imported | `constants/defaults.ts`, `constants/sound.ts` | |
| H5 | P3 | KV key generators for agg:daily and streak:freeze: defined but never used | `repositories/kv.client.ts` | |
| H6 | P3 | Types RetentionCohort, FeatureAdoption: defined but never used | `types/admin.ts` | |

### ROOT CAUSE I: Cross-Device Sync Gaps
*Settings don't sync. Pusher not activated.*

| ID | Severity | Description | File:Line | Notes |
|----|----------|-------------|-----------|-------|
| I1 | P2 | Settings changes on one device don't propagate to other devices | `SettingsContext.tsx` | Fetched once on mount, never refreshed |
| I2 | P2 | Pusher infrastructure built but not activated (needs credentials) | `pusher-client.ts`, `pusher-server.ts` | Falls back to 2s polling |
| I3 | P3 | SyncProvider 'settings-changed' event handler is empty stub | `SyncProvider.tsx:121-123` | |
| I4 | P3 | SyncProvider 'session-logged' event handler is empty stub | `SyncProvider.tsx:116-119` | |

### ROOT CAUSE J: npm/Dependency Issues

| ID | Severity | Description | Notes |
|----|----------|-------------|-------|
| J1 | P2 | 8 npm vulnerabilities (4 moderate, 4 high) — all in next.js | Fix requires next@16 (breaking) |
| J2 | P2 | @vercel/kv deprecated — should migrate to @upstash/redis | Functional but unsupported |
| J3 | P3 | Vite CJS deprecation warning in shared package tests | Cosmetic |

### MISCELLANEOUS

| ID | Severity | Description | File:Line | Notes |
|----|----------|-------------|-----------|-------|
| M1 | P2 | Admin KEYS scan (`kvClient.keys('user:*')`) is O(N) — blocks Redis | `admin.service.ts:37-49` | Won't scale past ~1000 users |
| M2 | P2 | Dashboard loads ALL sessions (10k limit) on every request — no caching | `dashboard.service.ts` | |
| M3 | P2 | Audit logs have infinite retention — no TTL, Redis grows unbounded | `audit.repo.ts` | |
| M4 | P3 | Version string "V3.1 ENTERPRISE BETA" hardcoded in sidebar | `Sidebar.tsx:96` | |
| M5 | P3 | TOS effective date "April 8, 2026" hardcoded | `tos/page.tsx:63` | |
| M6 | P3 | useDynamicFavicon flash animation broken — flashPhase local var reset every effect | `useDynamicFavicon.ts:67-70` | |

---

## Summary

| Severity | Count | Fixed in Prior Audit | Remaining |
|----------|-------|---------------------|-----------|
| P0 (Critical) | 0 | — | 0 |
| P1 (High) | 10 | 4 partially | 6 |
| P2 (Medium) | 28 | 4 | 24 |
| P3 (Low) | 18 | 0 | 18 |
| **Total** | **56** | **8** | **48** |

**Top 6 root causes by bug count:**
1. **Redundant/unstable polling** (5 bugs) — A1-A5
2. **Missing input validation** (7 bugs) — B1-B7
3. **No atomic KV ops** (5 bugs) — C1-C5
4. **Silent failures** (7 bugs) — D1-D7
5. **TypeScript errors** (5 categories, 155 individual errors) — E1-E5
6. **Security gaps** (7 bugs) — F1-F7
