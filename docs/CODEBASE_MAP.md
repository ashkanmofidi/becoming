# Codebase Map

**Generated:** 2026-04-09
**Total files:** 189 (102 web app, 23 shared package, 17 public assets, 22 config, 20 docs, 3 scripts, 2 CI)

---

## 1. File Inventory by Directory

### apps/web/src/app/ — Pages & API Routes

| File | Purpose | Type |
|------|---------|------|
| `layout.tsx` | Root layout: fonts, metadata, service worker, SkipToContent | Server |
| `page.tsx` | Root redirect `/` → `/timer` | Server |
| `error.tsx` | Global error boundary | Client |
| `not-found.tsx` | 404 page | Server |
| `globals.css` | CSS variables, themes (dark/light), a11y overrides, animations | CSS |
| `(auth)/login/page.tsx` | Google OAuth login button | Client |
| `(auth)/tos/page.tsx` | Terms of Service acceptance gate | Client |
| `(app)/layout.tsx` | Auth check + Provider stack (Settings→Data→Sync→Audio→Display→A11y→Gate) | Server |
| `(app)/timer/page.tsx` | Main timer interface (~550 lines) | Client |
| `(app)/dashboard/page.tsx` | Stats, charts, heatmap, weekly comparison | Client |
| `(app)/session-log/page.tsx` | Session list with filters | Client |
| `(app)/settings/page.tsx` | All settings (~300 lines, 10 sections) | Client |
| `(admin)/layout.tsx` | Admin auth check | Server |
| `(admin)/analytics/page.tsx` | Pulse metrics (10s refresh) | Client |
| `(admin)/users/page.tsx` | User management table | Client |
| `(admin)/audit/page.tsx` | Audit log (super_admin only) | Client |
| `(admin)/feedback/page.tsx` | Feedback list with filters + export | Client |
| `(admin)/system/page.tsx` | System health + sync metrics | Client |
| `privacy/page.tsx` | Privacy policy (static, 16 sections) | Server |
| `terms/page.tsx` | Terms of service (static, 17 sections) | Server |

### apps/web/src/app/api/ — API Routes

| Route | Methods | Auth | Services Called |
|-------|---------|------|----------------|
| `auth/callback/route.ts` | GET | None (OAuth) | authService.exchangeCodeForTokens, processOAuthCallback |
| `auth/logout/route.ts` | POST | Manual token | authService.destroySession |
| `auth/session/route.ts` | GET | Manual token | authService.validateSession |
| `auth/tos/route.ts` | GET, POST | Manual token | tosService.needsAcceptance, accept |
| `dashboard/route.ts` | GET | requireAuth | dashboardService.getDashboardData |
| `feedback/route.ts` | POST | requireAuth | feedbackService.submit |
| `sessions/route.ts` | GET, PATCH, DELETE | requireAuth | sessionService.* |
| `settings/route.ts` | GET, PUT | requireAuth | settingsService.getSettings, saveSettings |
| `timer/route.ts` | GET, POST | requireAuth | timerService.* (12 actions) |
| `admin/route.ts` | GET, POST | requireRole(admin/super_admin) | adminService.* |
| `middleware.ts` | N/A | Utility | rateLimit, requireAuth, requireRole, checkPayloadSize |

### apps/web/src/contexts/ — React Contexts

| File | State Managed | API Calls |
|------|---------------|-----------|
| `SettingsContext.tsx` | `settings: UserSettings`, `isLoaded`, `saveError` | GET/PUT `/api/settings` |
| `DataProvider.tsx` | `sessions[]`, `dashboard`, `isReady` | GET `/api/sessions`, GET `/api/dashboard` |
| `SyncProvider.tsx` | `timerState`, `connectionStatus`, `metrics` | GET `/api/timer` (poll), Pusher events |

### apps/web/src/hooks/ — Custom Hooks

| File | Purpose | API Calls | Deps |
|------|---------|-----------|------|
| `useTimer.ts` | Timer state machine + countdown | GET/POST `/api/timer` | syncedState from SyncProvider |
| `useAudio.ts` | Sound playback callbacks | None | settings |
| `useAudioSync.ts` | Layout-level audio controller | GET `/api/timer` (2s poll) | useSettings() |
| `useBroadcast.ts` | BroadcastChannel for multi-tab | None | channelName |
| `useDynamicFavicon.ts` | Animated favicon | None | status, mode, progress |
| `useShortcuts.ts` | Keyboard shortcuts | None | bindings, enabled |
| `useWakeLock.ts` | Screen Wake Lock API | None | enabled |

### apps/web/src/components/ — UI Components (29 total)

| Directory | Components | Notes |
|-----------|------------|-------|
| `timer/` | ModeSelector, TimerRing, PlaybackControls, IntentInput, CategorySelector, DailyGoal, DailyFocusTime, CycleTracker, ConfirmModal | All controlled via props |
| `settings/primitives/` | Toggle, Stepper, Slider, Select, ColorPicker, SegmentedControl, SettingsCard | Reusable form primitives |
| `layout/` | Sidebar, SidebarWrapper, AppReadyGate, ConnectionIndicator, DisplaySync, FocusModeSync, AccessibilitySync | Layout + headless sync |
| `header/` | HeaderButtons, FeedbackModal | Top bar actions |
| `audio/` | AudioSyncProvider | Headless audio controller |
| `onboarding/` | OnboardingOverlay | **DEAD CODE** — never rendered |
| `a11y/` | SkipToContent, AriaLive | AriaLive is **DEAD CODE** — never imported |

### apps/web/src/services/ — Business Logic (8 files)

| File | Key Functions | KV Keys Used |
|------|---------------|-------------|
| `auth.service.ts` | exchangeCodeForTokens, processOAuthCallback, validateSession, createSession, destroySession, deleteAccount | `auth:session:{token}`, `user:{id}` |
| `timer.service.ts` | start, pause, resume, complete, stopOvertime, finishEarly, skip, reset, abandon, switchMode, heartbeat, takeOver, finalizeSession | `timer:{userId}`, `session:{userId}:{id}` |
| `settings.service.ts` | getSettings, saveSettings, validateAndEnforce, addCategory, deleteCategory, renameCategory, exportBackup, importBackup | `settings:{userId}` |
| `session.service.ts` | getSessions, getTodaySessions, updateSession, bulkDelete, bulkChangeCategory, exportToCsv | `session:{userId}:{id}`, `sessions:{userId}` |
| `dashboard.service.ts` | getDashboardData, aggregateFocusHours, getCategoryBreakdown, getHeatmapData | reads sessions + settings |
| `admin.service.ts` | getPulseData, getUsers, changeRole, getFeedback, updateFeedbackStatus, getAuditLog, getBetaConfig | `user:*` (KEYS scan) |
| `feedback.service.ts` | submit | `feedback:{id}` |
| `tos.service.ts` | needsAcceptance, accept | `tos:{userId}` |

### apps/web/src/repositories/ — Data Access (7 files)

| File | KV Key Pattern | Operations |
|------|---------------|------------|
| `kv.client.ts` | All keys | Wrapper with retry (3x, exponential backoff); key generators |
| `user.repo.ts` | `user:{id}`, `beta:user_count`, `beta:allowlist`, `bm:admins` | CRUD, beta count, allowlist, admin list |
| `settings.repo.ts` | `settings:{userId}` | get (with migration), save (MERGE, never overwrite), resetToDefaults |
| `timer.repo.ts` | `timer:{userId}` | getState, setState, clearState, updateHeartbeat, transferControl, isHeartbeatExpired |
| `session.repo.ts` | `session:{userId}:{id}`, `sessions:{userId}` (LIST) | create (set+lpush), findById, findByUser (paginated), softDelete |
| `feedback.repo.ts` | `feedback:{id}`, `feedback:all` (LIST) | create, findById, findAll, update |
| `audit.repo.ts` | `audit:{id}`, `audit:all` (LIST) | log (append-only), findAll, findByActor, findByAction |

### apps/web/src/lib/ — Utilities & Engines

| File | Singleton? | Purpose |
|------|-----------|---------|
| `sound-themes/audio-engine.ts` | YES | Web Audio API: chimes, ambient, haptics. Buffer cache. |
| `tick-engine.ts` | YES | 1Hz tick scheduler (Chris Wilson pattern) |
| `pusher-client.ts` | YES | WebSocket client (returns null if not configured) |
| `pusher-server.ts` | YES | Server-side Pusher broadcaster (fire-and-forget) |
| `rate-limiter.ts` | YES | In-memory sliding window rate limiter |
| `announcer.ts` | YES | ARIA live region for screen reader announcements |
| `logger.ts` | NO | Console logger factory |
| `sanitize.ts` | NO | HTML/URL sanitization (only used by feedback.service) |

### packages/shared/src/ — Shared Types, Constants, Utils

| Directory | Files | Purpose |
|-----------|-------|---------|
| `types/` | user, timer, settings (93 fields), feedback, admin, index | All type definitions |
| `constants/` | defaults, limits, colors, sound, index | All default values and limits |
| `utils/` | time, cycle, goal, streak, migration, validation + 5 test files | Pure functions |

---

## 2. KV Key Patterns (Complete)

| Key Pattern | Data Type | Written By | Read By |
|-------------|-----------|-----------|---------|
| `user:{userId}` | User object | user.repo (create/update) | user.repo, admin.service |
| `settings:{userId}` | UserSettings | settings.repo (save) | settings.repo, settings.service, dashboard.service |
| `timer:{userId}` | TimerState | timer.repo (setState) | timer.repo, timer.service |
| `auth:session:{token}` | AuthSession | auth.service (createSession) | auth.service (validateSession) |
| `session:{userId}:{id}` | SessionRecord | session.repo (create) | session.repo (findById/findByUser) |
| `sessions:{userId}` | LIST of IDs | session.repo (lpush) | session.repo (lrange) |
| `tos:{userId}` | TosRecord | tos.service (accept) | tos.service (needsAcceptance) |
| `feedback:{id}` | FeedbackSubmission | feedback.repo (create) | feedback.repo (findById) |
| `feedback:all` | LIST of IDs | feedback.repo (lpush) | feedback.repo (findAll) |
| `audit:{id}` | AuditLogEntry | audit.repo (log) | audit.repo (findAll) |
| `audit:all` | LIST of IDs | audit.repo (lpush) | audit.repo (findAll) |
| `beta:user_count` | number | user.repo (incr/decr) | user.repo (getBetaUserCount) |
| `beta:allowlist` | SET of emails | user.repo (sadd/srem) | user.repo (isOnAllowlist) |
| `bm:admins` | SET of emails | user.repo (sadd/srem) | admin.service |
| `intent_history:{userId}` | (reserved) | auth.service (delete only) | — |
| `agg:daily:{userId}:{date}` | (reserved, unused) | — | — |
| `streak:freeze:{userId}:{month}` | (reserved, unused) | — | — |

---

## 3. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GOOGLE_CLIENT_ID` | YES | OAuth client ID (also hardcoded in login page) |
| `GOOGLE_CLIENT_SECRET` | YES | OAuth server secret |
| `APP_URL` | YES | Canonical app URL |
| `APP_VERSION` | NO | Display version (defaults to '3.1.0') |
| `KV_URL` | YES | Vercel KV / Upstash Redis URL |
| `KV_REST_API_URL` | YES | KV REST endpoint |
| `KV_REST_API_TOKEN` | YES | KV auth token |
| `KV_REST_API_READ_ONLY_TOKEN` | NO | Read-only KV token |
| `PUSHER_APP_ID` | NO | Pusher app ID (real-time sync) |
| `PUSHER_KEY` | NO | Pusher key |
| `PUSHER_SECRET` | NO | Pusher secret |
| `PUSHER_CLUSTER` | NO | Pusher cluster |
| `NEXT_PUBLIC_PUSHER_KEY` | NO | Client-side Pusher key |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | NO | Client-side Pusher cluster |

---

## 4. Dead Code

| File | Issue |
|------|-------|
| `components/onboarding/OnboardingOverlay.tsx` | Defined but never rendered by any page or layout |
| `components/a11y/AriaLive.tsx` | Defined but never imported by any file |
| `lib/sanitize.ts` exports: `encodeHtml`, `stripHtml`, `sanitizeUrl`, `truncateSafe` | Only `sanitizeString` is used (by feedback.service); but that's imported from shared, not this file. 3 of 4 exports unused. |
| `constants/defaults.ts`: `CATEGORY_DEFAULTS` | Exported but never imported anywhere |
| `KV keys: agg:daily:*, streak:freeze:*` | Key generators exist but never used |
| `types/admin.ts`: `RetentionCohort`, `FeatureAdoption` | Types defined but never used |
| `constants/sound.ts`: `SOUND_FREQUENCIES` | Frequencies object from oscillator era, never used |

---

## 5. Dependency Graph (Simplified)

```
┌─────────────────────────────────────────────────────────┐
│ (app)/layout.tsx (Server)                                │
│  ├─ SettingsProvider ← GET /api/settings                 │
│  │   └─ settingsService ← settingsRepo ← KV             │
│  ├─ DataProvider ← GET /api/sessions, /api/dashboard     │
│  │   └─ sessionService ← sessionRepo ← KV               │
│  ├─ SyncProvider ← GET /api/timer (poll) + Pusher        │
│  │   └─ timerService ← timerRepo ← KV                   │
│  ├─ AudioSyncProvider → useAudioSync                     │
│  │   ├─ tick-engine (singleton)                          │
│  │   └─ audio-engine (singleton)                         │
│  ├─ DisplaySync → CSS variables                          │
│  ├─ FocusModeSync → Wake Lock, Fullscreen, Notifications │
│  ├─ AccessibilitySync → data attributes, announcer       │
│  └─ AppReadyGate → shows children when isLoaded+isReady  │
│                                                          │
│ Timer Page (Client)                                      │
│  ├─ useSettings() → reads SettingsContext                 │
│  ├─ useData() → reads DataProvider                       │
│  ├─ useSync() → reads SyncProvider                       │
│  ├─ useTimer(syncedState) → POST /api/timer              │
│  ├─ useAudio(settings) → audio-engine calls              │
│  ├─ useWakeLock(enabled)                                 │
│  ├─ useShortcuts(bindings)                               │
│  ├─ useBroadcast(channel) → BroadcastChannel API         │
│  └─ useDynamicFavicon(status, progress)                  │
└─────────────────────────────────────────────────────────┘
```
