# Changelog

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
