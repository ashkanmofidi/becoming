# Changelog

## v3.2.0 (2026-04-07) - Security Audit & Hardening

### Added
- **Data Guardian rule**: Settings repo merges with existing data, never overwrites. Enforced via CLAUDE.md Rule 0.
- **Full audit report**: Comprehensive security and reliability audit documented in `docs/AUDIT_REPORT.md`.
- **Runtime input validation**: All API endpoints validate and sanitize incoming payloads.
- **Payload size limits**: Request body size caps on API routes to prevent abuse.
- **API documentation**: Complete API reference in `docs/API.md`.
- **Font preloading**: Critical fonts preloaded in document head to eliminate FOIT/FOUT.
- **Monitoring setup guide**: Step-by-step Sentry and UptimeRobot setup in `docs/MONITORING_SETUP.md`.
- **Backup guide**: KV data backup, automation, and recovery procedures in `docs/BACKUP_GUIDE.md`.

### Changed
- **Source maps disabled in production**: `productionBrowserSourceMaps` set to `false` in next.config to prevent code exposure.
- **Stack traces removed from error responses**: API error handlers return generic messages; details logged server-side only.
- **Audio engine cleanup**: Ambient sound nodes properly disconnected and released after fade-out to prevent memory leaks.
- **CI pipeline expanded**: Shared package type-check, unit tests, and web app build added to CI workflow.

## v3.1.19 (2026-04-09) - Complete Feedback System

### Added
- **User identity on feedback cards**: Google avatar (with letter fallback), full name, email displayed prominently at the top of each card. Avatar URL stored in feedback record at submission time (self-contained, no lookups needed).
- **Category filtering**: All/General/Bug/Feature tabs with live counts. Counts update based on date filter intersection.
- **Date range filter**: Last 7/30/60/90 Days + All Time. Composes with category filter — "Bug + Last 7 Days" shows only bugs from last 7 days.
- **Group by Category toggle**: Groups cards under section headers instead of flat list.
- **Selection system**: Per-card checkboxes + Select All/Deselect All (respects active filters).
- **CSV export**: UTF-8 BOM, all fields (name, email, avatar, category, subject, body, severity, status, date), proper filename convention.
- **PDF export**: Branded Becoming.. report header, date range + category in title, professional card layout, print-optimized.
- `picture` field added to FeedbackSubmission type + service + API.

## v3.1.18 (2026-04-09) - Fix /users 500 Error

### Root cause
Admin layout (`(admin)/layout.tsx`) called `authService.validateSession()` server-side during page render. This KV call fails on Vercel serverless, causing a 500.

### Fixed
- Admin layout: removed server-side `validateSession()` call. Now only checks cookie existence (same pattern as app layout). Role enforcement handled by admin API routes via `requireRole()` middleware.
- Admin pages (users, analytics, feedback, audit): added 401/403 response handling. Non-admin users get a clean redirect to `/timer?error=forbidden`, not a crash.
- Users page: added error state with retry button for API failures.

## v3.1.16 (2026-04-09) - Skip Break Button

### Added
- "Skip Break →" button appears on the timer screen during active breaks (running or paused).
- Tapping it immediately: stops tick, logs the partial break with actual elapsed duration (not full break length), transitions to focus mode in idle/ready state with saved focus duration displayed.
- No confirmation modal needed — skipping a break is always safe.
- Button disappears once focus mode starts.
- Styled as a teal outline pill to match the break color palette.

## v3.1.15 (2026-04-09) - Unified Sound Toggle

### Fixed
- Timer page mute button and Settings page sound controls were out of sync. Timer used localStorage (`bm_muted`), Settings used KV (`soundTheme`/`masterVolume`). Four separate mute states existed across the codebase.
- Now: single `muted` boolean in UserSettings, persisted to KV. Both pages read/write the same field. No localStorage, no component state for mute.

### Changed
- Added `muted: boolean` to UserSettings type (default: false).
- Timer page mute button writes to `settings.muted` via PUT /api/settings.
- Settings page: added "Mute All Sounds" toggle at top of Sound section.
- Removed localStorage `bm_muted` — all mute state lives in persisted settings.
- When either toggle changes, the other reflects it on next render (same data source).

## v3.1.14 (2026-04-09) - Tick Rebuilt from Scratch + Login Timer Reset

### Changed (BREAKING: tick architecture)
- **Deleted** `GlobalTickEngine.tsx` (React component approach — broken by design).
- **New** `lib/tick-engine.ts` — pure singleton module, zero React dependency.
- Uses Web Audio API scheduled timing (`audioContext.currentTime`) instead of setInterval.
- Two methods: `startTick()` and `stopTick()`. Called directly from timer event handlers.
- No mount/unmount logic, no navigation listeners, no visibility API.
- Chris Wilson scheduling pattern: 25ms scheduler loop schedules ticks ahead using audio clock.
- Survives all navigation: in-app links, browser back/forward, tab switch, mobile background.

### Fixed
- Tick delays on start: first tick now plays 0.5s after start (no instant burst).
- Tick gaps on navigation: singleton doesn't care about React component lifecycle.
- Double-tick: Web Audio scheduling is sample-accurate, not setInterval which drifts.
- Break timer shown after login: timer state (which may be in break mode from previous session) is now cleared on every fresh login. User always lands on focus timer.

## v3.1.13 (2026-04-09) - P0 FIX: Sessions Now Count

### Root cause found
Settings API PUT route (`/api/settings`) called `settingsRepo.save()` directly, **bypassing** `settingsService.saveSettings()` which runs `validateAndEnforce()`. This meant when a user set `focusDuration: 1`, the `minCountableSession` stayed at its default of `10`. Every completed 1-minute session was silently discarded at line 386 of timer.service.ts: `actualDurationSeconds (60) < minCountableSession * 60 (600)` → return null.

### The exact broken lines (before → after)
**`/api/settings/route.ts` line 36:**
```
BEFORE: await settingsRepo.save(result.session.userId, settings);
AFTER:  const validated = await settingsService.saveSettings(result.session.userId, settings);
```

**`timer.service.ts` line 386:**
```
BEFORE: if (actualDurationSeconds < settings.minCountableSession * 60)
AFTER:  const effectiveMinCountable = Math.min(settings.minCountableSession, state.configuredDuration);
        if (actualDurationSeconds < effectiveMinCountable * 60)
```

### Fixed
- Settings API PUT now routes through `settingsService.saveSettings()` with full validation.
- Settings API GET now routes through `settingsService.getSettings()` which validates on read (fixes stale data).
- `finalizeSession` clamps `minCountableSession` to `configuredDuration` at point of use — catches stale settings that haven't been re-saved yet.

## v3.1.12 (2026-04-09) - Eliminate 25:00 Flash on Load

### Fixed
- Timer showed 25:00 for a split second before loading user's saved duration (e.g., 1:00). Now shows a loading skeleton until settings are fetched — the first visible frame always shows the correct duration.
- useTimer: when timer state is null (no active session), remainingSeconds now syncs to `options.defaultDurationMinutes` via useEffect dependency. Previously only set on initial useState (which captured the stale 25 default).

### Changed
- Timer page: loading gate extended from `isLoading` to `isLoading || !settings`. No timer UI renders until settings fetch is complete.
- useTimer tick effect: added `options.defaultDurationMinutes` to dependency array so null-state display updates when settings arrive.

## v3.1.11 (2026-04-09) - Settings Persistence + Session Counting Fix

### Fixed
- Timer displayed 25:00 after login instead of user's saved focus duration. Root cause: useTimer initialized `remainingSeconds` to hardcoded `25*60`. Now reads from `settings.focusDuration`. Settings were always persisted in KV — the display was wrong, not the data.
- 1-minute focus sessions not counted. Root cause: `minCountableSession` default is 10 minutes, silently discarding sessions under 10 min. Now: `minCountableSession` can never exceed `focusDuration` — auto-adjusted on save and in UI.
- Settings max on Minimum Countable Session stepper now capped at current focus duration.

### Changed
- useTimer accepts `defaultDurationMinutes` option from settings (no more hardcoded 25).
- settings.service `validateAndEnforce`: if `minCountableSession > focusDuration`, auto-lowers it.
- Settings page: focusDuration change auto-adjusts minCountableSession. Stepper max bound linked.
- PRD Appendix B: documented focusDuration↔minCountableSession interaction.

## v3.1.10 (2026-04-09) - "Don't Ask Again" Logout Preference

### Added
- "Don't ask me again" checkbox in logout confirmation modal. When checked and confirmed, saves `confirmLogoutWithActiveTimer: false` to user settings. Future logouts with active timer skip the modal — abandon and logout immediately.
- Settings toggle: "Ask before logout with active timer" under Behavior section. Allows re-enabling the prompt.
- New setting field: `confirmLogoutWithActiveTimer` (boolean, default `true`) in UserSettings type, defaults, and migration.

## v3.1.9 (2026-04-09) - Logout Confirmation with Active Timer

### Added
- Logout confirmation modal: when timer is running/paused/overtime and user clicks Logout, shows "You have a focus session in progress. Logging out will reset your timer. Continue?" with Cancel and Log Out buttons.
- Session expiry warning: when 3-day session expires during an active timer, shows a modal explaining the situation before forcing logout.
- Timer abandon on logout: calls `timerService.abandon('close')` which writes partial session data to logs before clearing timer state.
- New `abandon` action on POST /api/timer — used by logout and session expiry flows, bypasses controller check.

### Changed
- Logout button now checks timer state via GET /api/timer before proceeding. If no active timer, logs out immediately (no modal).
- SidebarWrapper 401 handler now checks for active timer before forcing redirect.

## v3.1.8 (2026-04-09) - Clean Tab Title

### Fixed
- Removed redundant emoji characters (▶ ⏸ ✓) from browser tab title. The animated favicon already communicates timer state visually — doubling it with emoji was cluttered.
- Tab title now shows clean text: "24:59 — Deep Work | Becoming.." (running), "12:30 — Paused | Becoming.." (paused), "Done! | Becoming.." (completed).
- Dynamic animated favicon completely unchanged — still renders state-reactive canvas icon.

## v3.1.7 (2026-04-09) - Universal Tick Resume

### Fixed
- Tick sound stopped on browser back/forward button, not just in-app navigation. Root cause: tick interval was tied to timer page component lifecycle — any unmount killed it.

### Changed
- **Architecture overhaul**: tick sounds moved from timer page `onTick` callback to `GlobalTickEngine` — a headless component mounted in the app layout that survives ALL navigation types.
- GlobalTickEngine polls /api/timer every 5 seconds to know if a session is running. Plays ticks independently of which page is visible.
- Listens to `visibilitychange` (tab switch, mobile background), `popstate` (browser back/forward), `focus` (alt-tab), and Next.js route changes.
- Timer page `onTick` now only handles haptics (page-local, fine to re-mount).
- Tick interval stops when tab is hidden (save resources), resumes instantly on return.

### Coverage
Every navigation path tested: in-app Link, browser back, browser forward, tab switch, mobile background/foreground, alt-tab, window focus.

## v3.1.6 (2026-04-09) - Completion Recording + 3-Day Session Expiry

### Fixed
- Timer completion called multiple times: setInterval (100ms) hit `remaining <= 0` repeatedly before state updated. Added `completingRef` guard — completion fires exactly once.
- Session completion data flow verified end-to-end: timer complete → timerService.finalizeSession → sessionRepo.create → fetchTodaySessions updates daily goal/cycle → dashboard/session-log read from same source.

### Added  
- Hard 3-day session expiry: sessions expire exactly 3 days after login, regardless of activity. No sliding window. Checked against `createdAt` on every API call. Applies to all users including Super Admin.
- "Session expired, please log in again" message on forced logout redirect.
- Client-side expiry detection: SidebarWrapper checks 401 from /api/auth/session and redirects to login.

### Changed
- SESSION_MAX_AGE_SECONDS: 30 days → 3 days
- validateSession: checks `now - createdAt > 3 days` instead of sliding `expiresAt`
- Cookie maxAge: 30 days → 3 days
- KV TTL: set to remaining time until 3-day cutoff (not reset on activity)

## v3.1.5 (2026-04-09) - Tick Sound Survives Navigation

### Fixed
- Tick sound stopped when navigating away from timer (e.g., to Settings) and never resumed on return. Root cause: useAudio destroyed the AudioContext on unmount, and playMinuteTick didn't call ensureInitialized to re-create it.
- Audio engine is now a persistent singleton — never destroyed during in-app navigation. Only cleaned up on tab close.
- playMinuteTick and playLast30s now call ensureInitialized to guarantee the engine is alive before playing.
- Documented why destroyAudioEngine is intentionally NOT called on unmount (AudioContext requires user gesture to re-create).

## v3.1.4 (2026-04-09) - Google Profile Avatar

### Fixed
- User avatar showed generic letter "A" instead of Google profile picture. Root cause: AuthSession type was missing `picture` field — Google picture URL was captured during OAuth but never stored in the session or returned by the session API.
- Fixed chain: AuthSession type → createSession → /api/auth/session response → SidebarWrapper → Sidebar → admin users table. All 6 links in the chain now carry the picture URL.
- Avatar renders Google profile photo with crossOrigin="anonymous" and referrerPolicy="no-referrer" (PRD 3.1). Letter initial fallback only on image load error.
- Admin user management table now shows profile avatars alongside names.

### Changed  
- PRD.md: Section 3.1 avatar implementation confirmed working end-to-end

## v3.1.3 (2026-04-09) - Sound System Hardening

### Fixed
- Tick cadence glitch: first 2 ticks fired back-to-back on timer start. Now enforces 950ms minimum gap + 2-second grace period after start.
- Sound leaks: engine functions had inconsistent gate checks (some checked theme, some didn't). All now route through single `shouldPlay()` gate.
- Mute reliability: theme/mute/volume state now stored in engine, synced from React via useEffect. No stale closures.
- Engine functions no longer accept `theme` parameter — theme is stored in engine state and synced automatically.
- Stale closure bug: onTick callback referenced stale `state?.mode` and `settings`. Tick logic now reads current values correctly.

### Changed
- Audio engine: added `shouldPlay()` single gate function (checks initialized + not muted + not silent theme)
- Audio engine: added `setTheme()` to sync theme from settings
- useAudio: removed all `theme` parameters from play functions (engine manages theme internally)
- Tick timing: 3-gate system (integer second change + 950ms minimum + 2s startup grace)

## v3.1.2 (2026-04-09) - Audio Overhaul

### Changed
- Complete audio engine rewrite: all sounds route through single master gain node — mute sets gain=0 at source, no per-call-site checks
- Tick sound replaced with handpan-style D4 (293.66Hz) triangle wave + A4 overtone, 5ms attack, 450ms natural decay — meditative, not mechanical
- All event sounds (activation, completion, pause, resume) redesigned as handpan/tongue-drum character
- Mute button redesigned: speaker icon with waves/X, persists to localStorage, prominent visual styling

### Fixed
- Mute gate now covers 100% of audio triggers (22 call sites audited) — zero sound leaks when muted
- Muting before Start now silences everything including start chime

## v3.1.1 (2026-04-09) - Post-Deploy Fixes

### Fixed
- Timer idle state showed "00:00" instead of configured duration on first load (PRD Appendix C, Contradiction #1). useTimer hook now initializes remainingSeconds to 25*60 (default focus) before server state loads.
- Rectangular blinking/flashing around timer ring caused by box-shadow on SVG element. Breathing glow animation now uses opacity-only transitions, eliminating the rectangle artifact.
- Sound system: Tick During Focus now fires every second (was every minute). Tick During Breaks now implemented. Last 30s Ticking fires once per second (was every render frame). Haptic Last 10s now wired.
- Slow page transitions: sidebar now uses Next.js Link for instant client-side navigation (was using <a> tags causing full page reloads).
- Missing sidebar elements: Super Admin/Admin role badge, Logout button, Admin nav section (Analytics, Users, Feedback, Audit Log) now visible for admin/super_admin users.
- Stale timer state showing "Timer running on another device" when no other device is active. Timer now auto-resets abandoned running states and correctly identifies controller on idle/completed timers.
- Tick sound redesigned using sound psychology: 396Hz Solfeggio frequency (grounding), pure sine, 1.5% volume (sub-threshold — brain registers rhythm without conscious attention), 300ms natural water drop decay, pitch bends 396→220Hz organically. 1-second interval matches resting heart rate for focus entrainment.
- Fixed double-tick on timer start: 1.5s grace period, 900ms minimum gap between ticks.
- Activation chime suppressed when tick is ON (tick IS the rhythm — playing both is jarring).
- Tick sound completely redesigned: two-layer water drop (filtered noise "blep" + 150Hz sine body), 1% volume, subliminal.
- Added mute toggle button on timer page — instant sound control without going to Settings.
- Dynamic animated favicon: canvas-based 32x32 with state-reactive visuals (pulsing amber/teal with draining ring when running, pause bars when paused, charcoal spark when idle, gold checkmark flash on completion).
- Dynamic tab title: "▶ 24:59 — Deep Work | Becoming.." while running, "⏸ Paused", "✓ Done!", idle format. Shows intent if set.

### Changed
- PRD.md: Added Sections 5.7.1-5.7.4 (sound behavior rules), updated Section 2 (instant navigation), Section 3 (sidebar profile card)
- TEST_CASES.md: Updated TMR-001 expected result

## v3.1.0 (2026-04-08) - Full Rebuild

### Added
- Monorepo structure with Turborepo (packages/shared, apps/web)
- Shared TypeScript types for all domain objects (PRD Section 18)
- Shared constants: defaults (PRD Appendix A), limits, colors, sound config
- Shared utilities: time/timezone, streak calculation, goal tracking, cycle computation, validation, migration
- Vercel KV client with exponential backoff retry logic (PRD Section 18)
- Repository layer: user, session, timer, settings, feedback, audit (PRD Section 18)
- Auth service: Google OAuth 2.0 + PKCE flow (PRD Section 1.2)
- TOS service: versioned consent with audit trail (PRD Section 1.3)
- Login page with Google Sign-In and beta cap messaging (PRD Section 1.1)
- TOS page with scroll-to-accept (PRD Section 1.3.1)
- API routes: /auth/callback, /auth/session, /auth/logout, /auth/tos
- API middleware: auth, role checks, rate limiting (PRD Section 17)
- Structured logger (no console.log in production)
- 404 Not Found page (PRD Section 16.1)
- Authenticated app shell with sidebar navigation (PRD Section 4)

- Timer service: full state machine with 5 states (idle/running/paused/completed/overtime) (PRD Section 5)
- Timer state transitions: start, pause, resume, skip, reset, complete, stopOvertime, abandon, switchMode (PRD Section 5.3)
- Multi-device timer: heartbeat, takeOver, controller enforcement (PRD Section 5.2.7)
- Strict Mode enforcement: no pause/skip/reset during focus (PRD Section 6.2)
- Session service: filtered queries, CSV export (RFC 4180, UTF-8 BOM), bulk operations (PRD Section 8)
- Timer API routes: /api/timer (GET state, POST actions), /api/sessions (CRUD+export), /api/settings (PRD Sections 5, 6, 8)
- Timer page: full interactive UI with all PRD Section 5 components
- Mode selector: three-segment pill (FOCUS/BREAK/LONG BREAK) with instant/confirmed switching (PRD Section 5.1)
- Circular timer display: SVG ring with stroke-dashoffset, color warming, breathing glow, flip-clock digits (PRD Section 5.2)
- Playback controls: Play/Pause/Skip/Reset with strict mode and multi-device variants (PRD Section 5.3)
- Daily goal progress: X/Y display with progress bar, green completion, overflow indicator (PRD Section 5.4)
- Pomodoro cycle tracker: computed dots from session data (PRD Section 5.5)
- Intent input: 120-char limit, character counter, autocomplete-ready (PRD Section 5.6.1)
- Category selector: dropdown with color dots and checkmark (PRD Section 5.6.2)
- Confirmation modal: for destructive timer actions (skip/reset/switch/abandon)
- Web Audio API sound engine: 4 themes (Warm/Minimal/Nature/Silent), completion bells, pause/resume tones, tick sounds, ambient (PRD Section 5.7)
- useTimer hook: server-synced state machine with heartbeat and completion detection
- useAudio hook: settings-aware sound playback with lazy initialization
- useWakeLock hook: Screen Wake Lock API with silent audio fallback (PRD Section 6.7)
- useBroadcast hook: BroadcastChannel for multi-tab sync (PRD Section 5.2.7)
- useShortcuts hook: keyboard shortcut engine with 100ms debounce (PRD Section 6.6)
- Tab title timer: dynamic "18:42 — Focusing | Becoming.." (PRD Section 5.2.8)
- Loading skeleton for timer page

### Fixed
- Contradiction #1: Timer idle now shows configured duration, not "00:00" (PRD Appendix C)
- Contradiction #2: Logout relocated to profile card area (PRD Appendix C)
