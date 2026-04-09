# Changelog

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
