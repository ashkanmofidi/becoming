Becoming..
ENTERPRISE FOCUS TIMER
Product Requirements Document
Final Comprehensive Enterprise-Grade Specification
Version 3.0 · Enterprise Beta


Table of Contents

1. Login Page & Authentication
1.1 Login Page UI
Becoming.. presents a minimal dark-themed login screen at becoming.ashmofidi.com.
App name "Becoming.." in serif display font (DM Serif Display), two dots in amber (#D97706), centered on deep black (#0A0A0A) background.
Monospaced uppercase subtitle: "ENTERPRISE FOCUS TIMER" in muted gray, letter-spaced, centered below.
Centered card with subtle dark gray background (#111) and 12px rounded corners containing sign-in UI.
"Welcome" heading in white text inside the card.
Subheading: "Sign in with your Google account to start focusing." in muted gray.
Google account selector chip: circular avatar, full name, email, Google logo, dropdown chevron. Rendered by Google Identity Services library.
Footer notice: "Limited to 10 beta users. By signing in you agree to our terms of use." The "terms of use" is a clickable link opening TOS in a modal.
1.1.1 Login Page Edge Cases
No Google account in browser: chip replaced with standard "Sign in with Google" button opening OAuth consent screen.
Multiple Google accounts: chip shows default with dropdown to switch.
Beta cap reached (10 users), non-invited user: OAuth succeeds but app shows rejection screen: "Becoming.. is currently in private beta and all 10 slots are filled. Please check back later or contact us for an invitation." Token revoked, no account created. A "Notify me" email input option allows the user to leave their email for future access.
Beta cap reached but user's email is on Super Admin's allowlist: sign-in succeeds regardless of cap.
Browser blocks third-party cookies: helper message: "Please enable third-party cookies or try a different browser to sign in."
Google OAuth fails (network/outage): "Couldn't connect to Google. Please check your internet connection and try again." with "Retry" button. Retry respects rate limiting.
User's Google account is suspended/deleted: OAuth flow fails at Google's end. User sees Google's error page, not ours. If they previously had a Becoming.. account, their data remains until they or a Super Admin deletes it.
Responsive: on mobile, card takes full width with 16px margins. Google chip minimum 48px height. Page loads in under 2 seconds on 3G.
No session or user data stored before authentication (localStorage, cookies). Login page is stateless.
Google Identity Services script loaded asynchronously; does not block initial render.
If user navigates directly to any authenticated route (e.g., /dashboard) without session: redirect to login page with return URL preserved. After login, redirect back to original URL.
1.2 Google OAuth 2.0 Authentication Flow
1.2.1 Authentication Sequence
1. User clicks Google sign-in chip/button.
2. App generates cryptographically random code_verifier (43-128 chars) and derives code_challenge via SHA-256.
3. App redirects to Google authorization endpoint with: client_id (115795527932-2q1afagsog0eg29pbdfn3qfs44e27uui.apps.googleusercontent.com), redirect_uri, response_type=code, scope=openid+email+profile, code_challenge, code_challenge_method=S256, state (random CSRF token).
4. User consents on Google's screen (or auto-consents if previously approved).
5. Google redirects back with authorization code and state parameter.
6. App verifies state matches original (CSRF protection). If mismatch: abort with "Authentication failed. Please try again."
7. App exchanges code + code_verifier for access_token, refresh_token, id_token at Google's token endpoint (server-side call).
8. App decodes id_token (JWT) to extract: sub (unique Google user ID), email, name, picture, email_verified.
9. App checks if sub exists in Vercel KV. EXISTS: update lastLoginAt, lastLoginIP, lastLoginDevice. NEW: check beta cap; if slots available, create user record. If full and not on allowlist: reject (Section 1.1.1).
10. App creates server-side session in Vercel KV (key: auth:session:{randomToken}) and sets httpOnly, secure, sameSite=strict cookie.
11. User redirected to Timer page (or TOS screen if first login or version mismatch).
1.2.2 Session Management
Sessions stored server-side. Key: auth:session:{token}. Value: userId, email, name, role, createdAt, expiresAt, lastActivityAt, deviceInfo.
Expiry: [CHANGED v3.1.6 - 2026-04-09] Hard 3-day cutoff from original login moment. No sliding window. On every API call, server checks `now - createdAt > 3 days`. If expired: session deleted, cookie cleared, redirect to login with "Session expired, please log in again." Applies to ALL users including Super Admin.
Google access_token NOT stored long-term. refresh_token stored encrypted for future integrations (Calendar).
Missing/expired session: redirect to login with toast: "Your session has expired. Please sign in again."
Multiple simultaneous sessions allowed (multi-device). No max sessions limit. Each device gets its own token.
Logout: delete KV session key, clear cookie (empty + immediate expiry), redirect to login. Toast: "You have been logged out."
Logout API failure: cookie still cleared client-side. Server session expires via TTL.
1.2.3 Security Requirements
All endpoints HTTPS only. HTTP redirected.
Session cookie: httpOnly=true, secure=true, sameSite=strict, path=/, domain=becoming.ashmofidi.com.
client_id is public. client_secret is server-side only.
Rate limiting: max 10 login attempts/IP/minute. Exceeded: "Too many login attempts. Please wait a minute and try again."
All auth errors logged: timestamp, IP, email (if available), error type, user-agent.
If user changes their Google email: the sub (Google user ID) does not change. The app updates the stored email on next login. All existing sessions and data remain intact because they are keyed by sub, not email.
If user's Google access is revoked (in Google Account settings): next API call returns 401. App redirects to login: "Your Google access was revoked. Please sign in again."
1.3 Terms of Service Consent System
1.3.1 First-Time User Flow
After OAuth, app checks tos:{userId} in KV for { acceptedVersion, acceptedAt, acceptedFromIP }.
No record: redirect to full-screen TOS page showing document title ("Terms of Service"), version ("Version 1.0"), scrollable text (max-height 60vh), and buttons: "I Accept" (amber) and "Decline" (ghost).
"I Accept" DISABLED until user scrolls to bottom (scroll tracking). Hint: "Please scroll to the bottom to continue."
On acceptance: write to KV: { acceptedVersion, acceptedAt (UTC ISO 8601), acceptedFromIP, userAgent }. Redirect to Timer.
On decline: logout immediately. Message: "You must accept the Terms of Service to use Becoming.. You can sign in again when you're ready."
1.3.2 Returning User Flow
acceptedVersion === CURRENT_TOS_VERSION (env var): skip TOS, go to Timer.
acceptedVersion < CURRENT_TOS_VERSION: show TOS with banner: "Our Terms of Service have been updated from version [old] to [new]. Please review and accept to continue." Must accept to proceed. Declining logs out.
acceptedVersion > CURRENT_TOS_VERSION (data integrity error): log error, treat as needing re-acceptance.
1.3.3 TOS Document Management
TOS stored server-side as versioned HTML/Markdown (not in app bundle). Updatable without deployment.
Each version immutable once published. Old versions retained for audit.
Semantic versioning: major changes (1.0 to 2.0) for new terms/liability. Minor (1.0 to 1.1) for typos/clarifications. Both require re-acceptance.
Privacy Policy follows identical versioning and consent system as a separate document.
GDPR cookie/privacy consent: since the app uses only essential cookies (session authentication) and no tracking cookies, a cookie banner is NOT required. However, a notice in the Privacy Policy must disclose the use of essential cookies. If analytics or marketing cookies are added in the future, a GDPR-compliant consent banner must be implemented before launch.
1.3.4 Audit Trail
Every TOS acceptance logged immutably: userId, email, version, timestamp, IP, user-agent. Cannot be modified or deleted.
Super Admin can view status in Admin Dashboard (Section 10.8).

2. Brand Identity Block
Persistent in top-left sidebar on all pages when authenticated.
"Becoming.." in DM Serif Display, dots in amber (#D97706), rest white. Below: "V3.0 · ENTERPRISE BETA" in small monospaced uppercase, muted gray, letter-spaced.
Version from env var APP_VERSION (never hardcoded). "ENTERPRISE BETA" from APP_LIFECYCLE_STAGE (changes to "ENTERPRISE" post-beta).
Updates on next page load or within 60 seconds via polling. No user intervention. Silent update (no notification).
Version string fetched from server on each load (not cached in service worker or localStorage).
IMPLEMENTATION NOTE [ADDED v3.1.1 - 2026-04-09]: All sidebar navigation uses Next.js Link component for instant client-side transitions (no full page reload). Page transitions must feel instantaneous — under 100ms perceived latency. Active page indicated by amber text + amber left border + 10% amber background.

3. User Identity & Role Card
3.1 Profile Display
Below brand block. Circular avatar (40x40px) from Google "picture" claim. Full name (bold, white, single line, ellipsis). Email (muted gray, smaller, single line, ellipsis).
Missing avatar: fallback circle with first initial (white text on amber background).
Avatar cached in sessionStorage. Failed load: fallback initial. crossorigin="anonymous", referrerPolicy="no-referrer".
3.2 Role Badge
Admin: amber (#D97706) pill badge below email.
Super Admin: red (#DC2626) pill badge below email.
Regular user: no badge, no empty gap.
Role from server-side KV profile, passed via session data. Client never determines role. Badge is cosmetic; access control is server-side.
3.3 Logout
"Logout" button in or directly below profile card. NOT in sidebar footer (relocated from there).
Click: clear server session (KV delete), invalidate cookie, redirect to login. Toast: "You have been logged out."
Network failure on logout: cookie cleared client-side regardless. Server session expires via TTL.
If timer is running when user logs out: session is marked as abandoned server-side. Timer state is cleared.
3.4 Account View
Tap profile card or "Account" link: opens account view (modal or page).
Shows: avatar/name/email (read-only), role with explanation, TOS status and version, active sessions (devices with "Sign out everywhere" button), member-since date, data summary (total sessions, hours, streak).

4. Sidebar Navigation
4.1 Structure
Persistent left-side nav, ~200px wide on desktop. Three sections:
CORE (amber monospaced header): Timer (clock icon, default landing), Dashboard (grid icon), Session Log (document icon).
SYSTEM: Settings (gear icon).
ADMIN (role-gated, completely absent from DOM for regular users): Analytics, User Management, Feedback, Audit Log (Super Admin only), System Health (Super Admin only).
4.2 Active State & Interaction
Active item: amber text, 10% amber background fill, 3px left border accent. Determined by URL pathname.
Inactive: muted gray. Hover: white text + 5% white bg (150ms). Keyboard: Tab, arrows, Enter. Focus: 2px amber outline.
Collapsed/expanded state per device in KV settings (not synced cross-device since sidebar width is a local preference).
4.3 Mobile
< 768px: hidden, replaced with hamburger icon. Slide-in drawer from left over backdrop. Tap item: navigate + auto-close. Tap backdrop or swipe left: close. Includes profile card + nav + footer stats.
4.4 Footer Stats Panel
2x2 grid: TODAY (amber, completed focus sessions), STREAK (amber, consecutive days), GOAL (white, daily target), ALL TIME (white, total sessions). All monospaced numerals.
Stats update real-time (30-second poll). Each tappable: TODAY → Session Log (today), STREAK → streak modal, GOAL → inline edit (stepper, syncs to Settings), ALL TIME → full Session Log.
Above grid: "BETA · X/10 USERS" (dynamic, shows actual filled/total). CONTRADICTION FIX: current UI shows static "10" but must be dynamic "X/10."
Below grid: "Privacy" and "Terms" links opening modal overlays with versioned documents and acceptance status banner.
Logout REMOVED from this area (relocated to profile card per Section 3.3).

5. Timer Page
Primary interface and default landing page. Contains: mode selector, circular timer, playback controls, daily goal, cycle tracker, intent/category bar.
5.1 Timer Mode Selector
Three-segment pill: FOCUS | BREAK | LONG BREAK. Monospaced uppercase. Active: filled bg + white text. Inactive: no bg + muted gray. 150ms transition.
5.1.1 Defaults
Focus: 25:00. Break: 5:00. Long Break: 15:00. Active tab defaults to FOCUS on first login and each new day.
CONTRADICTION FIX: Current screenshots show timer at "00:00" in idle. This is a BUG. Idle state MUST show the configured duration (e.g., "25:00"). The spec is authoritative; the implementation must be fixed. [FIXED v3.1.1 - 2026-04-09] Timer display initializes to configured focus duration (25:00 default) before server state loads. Null server state (first-time user) also defaults to 25:00.
IMPLEMENTATION NOTE [ADDED v3.1.1 - 2026-04-09]: The breathing glow animation on the idle timer ring MUST use opacity transitions only — not box-shadow. Box-shadow on SVG elements renders as a rectangle, not following the circular shape. The glow effect is achieved via opacity pulsing on the circular SVG ring stroke.
5.1.2 Switching Behavior
IDLE: instantly updates timer to selected mode's duration. No confirmation.
RUNNING/PAUSED: confirmation modal: "Switching will reset your current session. This session will not be logged. Continue?" Confirmed: timer resets to new mode idle, session marked abandoned server-side.
5.1.3 Auto-Advance Logic
Cycle: Focus → Break → Focus → Break → ... → Focus → Long Break (after N focuses, default N=4).
Auto-advance highlights next mode; does NOT auto-start unless Auto-Start settings are ON.
FEATURE INTERACTION: Auto-Start Breaks ON + Strict Mode ON: after strict focus completes, auto-start break countdown begins normally (Strict Mode only affects focus sessions, not breaks).
5.1.4 Multi-Device Sync
Both devices reflect same mode within 5 seconds via polling. Toast on syncing device: "Session updated from another device." Conflict: last-write-wins by server UTC.
5.2 Circular Timer Display
5.2.1 Idle State
Shows configured duration (e.g., "25:00") in white monospaced flip-clock numerals (~72px desktop).
Amber ring at 100% with breathing glow: 4-second cycle, opacity 80%→100%, box-shadow 0px→8px, CSS ease-in-out. "READY TO FOCUS" in muted gray, fading at 8-second cycle.
Radial gradient inside circle: transparent center to 2% amber at edge. Play button pulses amber every 5 seconds.
5.2.2 Countdown Active
Activation chime (528Hz, 200ms, Warm theme). Label crossfades to "FOCUSING..." (300ms). Breathing stops; ring steady amber.
Ring depletes clockwise from 12 o'clock via SVG stroke-dashoffset tied to server timestamps (not setInterval). Immune to tab throttling.
Flip-clock numerals: 120ms flip, cubic-bezier(0.4,0,0.2,1). Only changing digits flip.
Optional minute tick (50ms click, 20% volume, "Tick During Focus" default OFF).
Ring color warms: #D97706 (100%) → #F59E0B (50%) → #FBBF24 (25%). Linear interpolation via CSS custom properties.
EDGE CASE: Session crossing midnight (Day Reset Time): the session's "day" is determined by when it STARTED, not when it ends. A session started at 11:50 PM that ends at 12:15 AM counts toward yesterday's stats.
EDGE CASE: DST transition during session: timer uses UTC timestamps. If clocks jump forward/back during a session, the timer continues accurately because elapsed = now_utc - startedAt_utc. The display clock adjusts normally.
EDGE CASE: Session exceeding 24 hours (count-up mode with overtime): the display switches to HH:MM:SS format when exceeding 60 minutes. The session is still logged as a single record.
5.2.3 Urgency Build (Last 5 Minutes)
5:00: micro-pulse 0.5px shadow every 2s. 3:00: every 1.5s. 1:00: every 1s, 4px shadow, numerals faint amber tint.
0:30: 6px shadow every 0.8s, optional ticking (1Hz, "Last 30 Seconds" default ON).
0:10: numerals scale up 5%/tick, shadow 10px. 0:05: louder tick + haptic vibration (mobile), circle scales up 1%/second.
FEATURE INTERACTION: Show Seconds OFF + Last 30s Ticking: ticking audio PLAYS (it's an audio feature), but the visual countdown shows only minutes, updating at :00. Users hear urgency without seeing seconds change. This is intentional: the audio provides temporal awareness while the visual remains calm.
5.2.4 Completion (0:00)
Phase 1 (0-500ms): Ring fills to 100%, brightens to #FCD34D, shadow burst 30px→15px. Two-tone bell (C5+E5, 600ms, reverb 400ms, 60% volume). Numerals flash white→gold.
Phase 2 (500-1500ms): 12-16 amber dot particles radiate from ring, travel 40-80px with deceleration + opacity fade (800ms). Ring settles #FBBF24 + 12px shadow. Label: "SESSION COMPLETE" in amber, 200ms scale-up.
Phase 3 (1500-3000ms): Gold cools to #D97706, particles dissipate, shadow to 8px. Bottom-slide card: "Great focus session! Ready for a break?" with "Start Break" (amber) and "Skip" (ghost).
FEATURE INTERACTION: Overtime ON: at 00:00, Phase 1 plays but at 40% volume (notification not hard stop). Timer flips to count-up (+00:01, +00:02...). Ring stays depleted with gentle pulse. No Phase 2/3 until user manually stops. The completion card does NOT appear; instead a subtle banner: "Overtime: +2:34" appears below the timer with a "Stop" button.
FEATURE INTERACTION: Strict Mode ON + Overtime ON: at 00:00, overtime begins. The user can ONLY stop via the "Stop Overtime" button (which replaces the "Abandon" button post-completion). They cannot pause or reset during overtime either.
FEATURE INTERACTION: Auto-Start Breaks ON + Overtime OFF: Phase 3 card is replaced by auto-start countdown: "Break starting in 5... 4... 3..." with "Cancel."
5.2.5 Paused State
Ring freezes, pulses in desaturated amber (#B45309, 3-second cycle, 4px→8px shadow). Numerals 70% opacity. Label: "PAUSED." Sound: D4→A3 (300ms). 5% black frosted overlay.
Resume: A3→D4, overlay lifts, full opacity, 200ms. Pause timestamp stored server-side for refresh resilience.
FEATURE INTERACTION: Strict Mode ON: pause is DISABLED. This state never occurs during strict focus sessions.
5.2.6 Break State
Palette shifts to teal (#0D9488, configurable as Break Accent Color). Ring 100% teal, breathing glow 6-second cycle (slower). Label: "TIME TO REST."
No urgency escalation during break countdown. Completion: marimba G4 (400ms). Card: "Break's over. Ready to focus?" with "Start Focus" + "Extend Break (+2 min)" (can tap multiple times).
FEATURE INTERACTION: Ambient Sound ON: ambient audio does NOT play during breaks. It is focus-only. This is hardcoded behavior, not configurable (simplicity over configurability for this interaction).
FEATURE INTERACTION: Color Blind Mode ON: break ring gets a DASHED stroke style (not just teal color) and a moon icon appears next to "TIME TO REST." Focus ring has solid stroke + sun icon. This ensures focus vs break distinction is never color-only.
5.2.7 Multi-Device Timer Sync
Timer state in KV: timer:{userId} = { status, mode, startedAt, pausedAt, configuredDuration, controllingDeviceId, lastHeartbeatAt }.
Device B opens: fetches state, computes remaining = configuredDuration - (now - startedAt), displays mid-countdown. Banner: "Timer running on another device" + "Take over here."
Single controller model: controller has full controls; others view-only + "Take over." Transfer updates controllingDeviceId. Original gets toast: "Control moved."
Heartbeat: controller sends every 15 seconds. 60 seconds without: controllingDeviceId cleared (null), any device can claim. [CHANGED v3.1.1 - 2026-04-09] Additionally, if a timer has been "running" with no heartbeat for longer than its configured duration + 1 hour, it is automatically reset to idle (abandoned). This prevents stale running states from blocking new sessions.
Simultaneous Play: first request processed, sets controller. Second rejected with toast.
EDGE CASE: Multiple tabs same browser: BroadcastChannel API negotiates controller. Second tab sees "This session is controlled in another tab" + "Take over."
5.2.8 Browser Background Behavior
5.2.8.1 Dynamic Tab Title [CHANGED v3.1.1 - 2026-04-09]
Running: "24:59 — Deep Work | Becoming.." (with intent if set, updates every second) [CHANGED v3.1.8 - 2026-04-09: removed emoji prefix — favicon handles state visually]
Paused: "12:30 — Paused | Becoming.."
Overtime: "+01:30 — Overtime | Becoming.."
Completed: "Done! | Becoming.."
Idle: "Becoming.. | Focus Timer"
Controlled by "Tab Title Timer" toggle in Display settings. Update synced to countdown tick.
5.2.8.2 Dynamic Animated Favicon [CHANGED v3.1.1 - 2026-04-09]
Canvas-based 32x32 animated favicon, updates via requestAnimationFrame when active.
Focusing: vibrant pulsing amber radial gradient with white arc progress ring draining clockwise from 12 o'clock. Subtle breathing glow. Break mode: same but teal palette.
Paused: desaturated muted background, slower dimmer pulse, frozen progress ring, white pause bars overlay.
Idle: cool charcoal circle with minimal amber dot/spark in center, barely glowing.
Completed: brief white→gold flash burst animation, settles into glowing gold circle with white checkmark.
All transitions cinematic and smooth. Controlled by "Dynamic Favicon" toggle in Display settings.
Completion while backgrounded: Notification API push with chime, "Focus session complete! Time for a break.", Becoming.. icon. Click brings tab to focus.
On return: reconcile from server timestamps. 150ms crossfade for any visual discrepancy.
Wake Lock API for screen-on (default ON). Fallback: silent audio loop. Released on completion/pause/navigate away.
5.2.9 Accessibility
prefers-reduced-motion OR Reduced Motion toggle ON: static ring (no glow), instant numeral updates (no flip), no particles, simple color change (no burst), no pulsing.
FEATURE INTERACTION: Reduced Motion ON automatically disables and grays out the Completion Animation Intensity slider in Settings.
Screen reader (ARIA live regions): Standard (start + 5-min + completion), Minimal (start + completion), Verbose (every minute).
Focus/break distinction: not color-only. Sun icon for focus, moon for break. Color Blind Mode adds dashed/solid ring patterns.
5.3 Playback Controls
Three circular buttons: Skip (|▶, 40x40px), Play/Pause (▶/⏸, 56x56px, outlined circle), Reset (↻, 40x40px). 16px spacing.
IDLE: Play enabled, Skip disabled, Reset disabled. RUNNING: Play→Pause (200ms morph), Skip enabled, Reset enabled. PAUSED: Pause→Play, Skip/Reset enabled.
Play: starts timer, server record status=running. No confirmation. Pause: pauses, server pausedAt=now. No confirmation.
Skip (running/paused): confirm "Skip? Won't count toward goal." Confirmed: abandon + auto-advance mode. Reset (running/paused): confirm "Reset to [25:00]?" Confirmed: abandon + idle same mode.
Multi-device: only controller has enabled controls. Others view-only + "Take over."
Shortcuts: Space=Play/Pause, R=Reset, S=Skip. Only when no text input focused. 100ms debounce.
Tap targets: 44x44px min (56x56px Play). All states: hover, active, focus (2px amber), disabled. Debounce-protected to prevent race conditions.
FEATURE INTERACTION: Strict Mode ON during focus: Pause hidden, Skip hidden, Reset hidden. Only "Abandon" button visible (requires confirmation). Play button remains for starting the session initially.
5.4 Daily Goal Progress
"X / Y" display (X amber, Y white) + "Daily Goal" label + horizontal progress bar (amber fill on dark gray, 6px, rounded). Below: "NO SESSIONS YET" when X=0.
Default: 0/4. Only completed FOCUS sessions count. Bar animates 400ms ease-out on completion.
Goal met (X=Y): X turns green, checkmark icon, celebration animation (if Milestone Celebrations ON). Exceeded (X>Y): actual count shown ("6/4"), bar 100% + overflow indicator.
Mid-day goal change: X preserved, only Y updates. Multi-device: syncs within 5-10 seconds.
EDGE CASE: Daily goal changed to lower than completed (5 completed, goal changed to 3): shows "5/3" with full bar + overflow. Goal rate calculation still considers this day as "goal met."
5.5 Pomodoro Cycle Tracker
Visual: 7 dots (4 focus + 3 break), filled/unfilled. "NO SESSIONS YET" + "CYCLE" label. Computed from today's session log (not separate state).
After full cycle: "CYCLE 1" → "CYCLE 2," dots reset. Skipped breaks: dot unfilled, cycle advances. Daily reset at Day Reset Time.
5.6 Session Intent & Category Bar
5.6.1 Intent Input
Single-line, pencil icon prefix, placeholder "What are you becoming?" in monospaced. Focus: amber border (200ms). Max 120 chars, counter at 80+ (red at 115+).
Stored with session on completion. Empty valid (optional). Editable mid-session (debounced 500ms save). Resets on completion.
Autocomplete at 2+ chars: up to 5 matches sorted by frequency, with usage count badge. Arrow/Enter/Escape nav. "Clear suggestions" footer link.
Mobile: 16px min font (no iOS zoom). Long text: ellipsis when blurred, horizontal scroll when focused.
EDGE CASE: Intent with emoji, RTL, or special characters: fully supported. UTF-8 storage. RTL text renders correctly via CSS direction:auto on the input. CSV export uses UTF-8 BOM for Excel compatibility. Emoji display depends on the user's OS font support.
EDGE CASE: Intent with only whitespace: trimmed to empty string, treated as null intent.
5.6.2 Category Button
Bordered pill showing selected category (default "General"). Tap: dropdown (desktop) or bottom-sheet (mobile) with colored dots, amber checkmark on active.
"+ New Category" at bottom (inline, max 24 chars). 20 limit enforced ("Limit reached"). "Manage" link → Settings.
Selection persisted as default for next session. Max-width ~120px with ellipsis. No categories: shows "Uncategorized."
Default categories on first login: General, Work, Study, Personal, Health, Creative.
Tab flow: intent input → category button → play button. Desktop: intent auto-focuses on page load (if no active session).
EDGE CASE: Category renamed in Settings: all future sessions use the new name. All PAST sessions retain the original name at time of logging. Session Log shows the name as it was when the session was created (historical accuracy). If a user wants past sessions updated, they can use bulk "Change Category" in Session Log.
5.7 Sound System
Web Audio API (not HTML <audio>). Preloaded buffers on session start. No autoplay on load (browser policy).
Themes: Warm (default, bells/marimba), Minimal (sine waves), Nature (rain/bird), Silent (visual only).
9 individual toggles: Activation Chime (ON), Pause/Resume (ON), Minute Tick (OFF), Last 30s Ticking (ON), Completion Chime (ON), Break Start (ON), Break End (ON), Goal Achievement (ON), Streak Milestone (ON).
5.7.1 Tick Sound Behavior [UPDATED v3.1.1 - 2026-04-09]
Tick During Focus: when ON, plays a soft tick sound EVERY SECOND during focus countdown. Not every minute — every second. This gives rhythmic awareness. Default OFF (most users find it distracting).
Tick During Breaks: when ON, plays the same tick every second during break countdown. Default OFF.
Last 30s Ticking: when ON, plays a slightly louder tick every second during the FINAL 30 seconds of any countdown (focus or break). Independent of the focus/break tick toggles. Default ON.
AUDIO LIFECYCLE [CHANGED v3.1.7 - 2026-04-09]: Tick sounds are managed by GlobalTickEngine, a headless component mounted in the app layout (not the timer page). It survives ALL navigation: in-app links, browser back/forward, tab switch, mobile background/foreground. Polls /api/timer every 5s, plays ticks when running. Listens to visibilitychange, popstate, focus events. The Web Audio engine is a persistent singleton that survives in-app navigation. It must NOT be destroyed on component unmount — AudioContext requires a user gesture to re-create, and destroying it kills tick sounds when the user navigates to Settings and back. The engine is initialized once on the first user interaction and lives until the browser tab closes.
CRITICAL IMPLEMENTATION [CHANGED v3.1.3 - 2026-04-09]: Tick timing uses a 3-gate system: (1) only fire when the integer second changes, (2) enforce 950ms minimum between ticks to prevent jitter, (3) 2-second startup grace period after pressing play to establish clean cadence. All audio routes through a single shouldPlay() gate in the engine that checks initialized + not muted + not silent theme.
SOUND DESIGN [CHANGED v3.1.1 - 2026-04-09]: Tick is a two-layer water drop: 4ms filtered noise burst at 280Hz (the "blep") + 150Hz sine body (felt, not heard). 1% master volume — subliminal rhythm the brain tracks without conscious attention. Matches rain-on-leaf acoustic profile. When tick is ON, activation chime is suppressed (tick IS the rhythm). 1.5s grace period after play before first tick to establish clean cadence.
MUTE CONTROL [CHANGED v3.1.2 - 2026-04-09]: Prominent mute toggle on timer page with speaker icon (waves when on, X when muted). ALL audio routes through a single master gain node — mute sets gain to 0, unmute restores. No per-call-site checks. Mute state persists to localStorage across page refreshes. Mute before pressing Start = zero audio including start chime, ticks, and completion. Ambient sound stops on mute, resumes on unmute if session is active.
SOUND CHARACTER [CHANGED v3.1.2 - 2026-04-09]: All timer sounds use a handpan/tongue-drum character — triangle waves at meditative frequencies (D4=293.66Hz, A4=440Hz). Tick is a single handpan strike: D4 fundamental + A4 overtone (perfect 5th), 5ms attack, 450ms natural exponential decay. Volume 1.8% — present but never distracting. Designed for 90-minute listening without fatigue.
5.7.2 Ambient Sound + Tick Interaction [ADDED v3.1.1 - 2026-04-09]
FEATURE INTERACTION: Ambient Sound ON + Tick During Focus ON: both play simultaneously (they layer). However, the UX recommendation is that users who enable ambient sound typically want immersion — the tick can break that. The UI should show a hint: "Tip: Ambient sound works best without ticking enabled" when both are on. No auto-disable — let the user choose.
FEATURE INTERACTION: Ambient Sound pauses when timer paused, resumes on resume. Fades 3s in/out. Does NOT play during breaks (focus-only).
5.7.3 Sound Hierarchy [ADDED v3.1.1 - 2026-04-09]
Priority order (highest to lowest): Silent Theme > Respect Silent Mode > Master Volume 0% > Individual Toggles.
If Silent Theme is active: ALL sounds disabled, toggles grayed out with note "Sounds are disabled by Silent theme."
If Respect Silent Mode is ON and device is silenced: ALL sounds suppressed, haptic vibration used as fallback for completion/pause/resume events.
If Master Volume is 0%: behaves like Silent visually but toggle states preserved. Raising volume restores previous config.
Individual toggles only matter when none of the above overrides are active.
FEATURE INTERACTION: Completion Chime OFF + Desktop Notifications ON: in-app sound muted but browser notification still fires with sound. User is never silently abandoned.
Custom completion sound: .mp3/.wav/.ogg, max 500KB, 5 seconds. Cloud-stored. Preview + Reset to Default.
5.7.4 Haptic Feedback [UPDATED v3.1.1 - 2026-04-09]
Mobile only (auto-hidden on desktop). Sub-toggles: Completion (200ms vibration), Pause/Resume (100ms), Last 10s (50ms pulse every second during final 10 seconds). Haptic works independently of sound — even if sounds are silent, haptic still fires if enabled.
Ambient Sound: None/White Noise/Brown Noise/Rain/Coffee Shop/Lo-Fi Beats/Forest. Separate volume (0-100%, default 30%). Fades 3 seconds in/out. Focus-only (not during breaks).

6. Settings Page
6.0 Global Settings Behavior
Auto-save to Vercel KV within 500ms (debounced). No Save button. Toast: "Settings saved" (2s). Failure: "Couldn't save. Retrying..." (3 retries, 1s/2s/4s backoff). All retries fail: "Changes will sync when you're back online" (queued in memory).
Cross-device sync within 5 seconds. Last-write-wins by server UTC. Stale-while-revalidate for instant load. All defaults written on first login. Fully keyboard navigable (Tab/arrows/Space/Enter).
EDGE CASE: Settings changed while session is running: timer-related changes (Focus Duration) prompt: "Apply to current session (resets) or next session?" Non-timer changes (theme, sounds) apply immediately to the running session with no disruption.
EDGE CASE: Settings import while session is running: modal blocks import: "Please wait for your current session to complete before importing settings." This prevents mid-session configuration corruption.
6.1 Timer Durations
Focus: stepper +/–, range 1–120 min, step 1, default 25. Subtitle: "Minutes per focus block." Hold 500ms: rapid increment. Tap number: inline text edit. Validation: non-numeric reverts, < 1 snaps to 1, > 120 snaps to 120.
Short Break: same pattern, range 1–30, default 5.
Long Break: same, range 1–60, default 15.
Cycles: stepper, range 2–10, default 4. Subtitle: "Sessions before long break." Mid-cycle change prompt.
Minimum Countable Session (NEW): stepper, 1–25 min, default 10. Sessions shorter not logged/counted. DEPENDENCY: affects Session Log (excluded), Daily Goal (not counted), Streak (not counted), Dashboard stats (excluded).
Overtime Allowance (NEW): toggle, default OFF. Timer counts up after 00:00. DEPENDENCY: modifies completion behavior, chime volume (40%), ring display (depleted + pulse), session duration logging (includes overtime). INTERACTION with Strict Mode: see Section 5.2.4.
6.2 Behavior
Auto-Start Breaks: toggle, OFF. 5-second countdown overlay with Cancel. INTERACTION: works normally after Strict Mode focus completion.
Auto-Start Focus: toggle, OFF. Same countdown after break. Both independent. Both ON: fully automated Pomodoro loop.
Desktop Notifications: toggle, ON. Triggers browser permission prompt. Denied: reverts + helper text. Sub-toggles (collapsed): Session Complete (ON), Break Complete (ON), Daily Goal (ON), Streak Milestone (ON). Style: Standard (5s) or Persistent.
Daily Goal: stepper, 1–20, default 4. Mid-day: preserves completed count. INTERACTION with Streak Rule "Meet daily goal": changing goal may retroactively affect streak calculation.
Strict Mode (NEW): toggle, OFF. Disables Pause/Skip/Reset during focus. Shows Abandon button + lock icon. INTERACTION: Pause state (Section 5.2.5) never occurs. Overtime continues with "Stop Overtime" replacing Abandon. Auto-Start still works after completion.
Day Reset Time (NEW): time picker, default 12:00 AM local. Detected timezone with override. EDGE CASE: Changing mid-day (e.g., from midnight to 4AM at 2AM): current day's stats are recalculated. If the new reset time has already passed today, today's boundary shifts backward. Sessions are re-bucketed by the new boundary. A confirmation shows: "Changing Day Reset Time may affect today's stats. Continue?"
Streak Calculation (NEW): dropdown — "At least 1 session" (default), "Meet daily goal," "Open the app." Retroactive recalculation with preview. INTERACTION with Streak Freeze: rest days count as meeting ANY rule (including "Meet daily goal") for streak purposes. This is the entire purpose of rest days.
Streak Freeze (NEW): stepper, 0–8, default 2. Shows usage: "X/2 used this month." EDGE CASE: Freeze consumed on a day the user actually completed sessions (race condition if session completes after midnight): the freeze is NOT consumed if the user has any completed sessions for that day. Freezes are only consumed when the day ends with zero qualifying activity.
6.3 Display
Theme (NEW): Dark (default) | Light | System. 300ms crossfade. EDGE CASE: Light theme + Amber accent: all amber elements tested for WCAG AA contrast (4.5:1) against white background. Amber (#D97706) passes on white for large text but FAILS for small text. Resolution: on Light theme, accent darkens to #B45309 for small text elements automatically.
Font Size: slider SMALL (80%) | NORMAL (100%) | LARGE (120%) | XL (150%). Snaps to detents. Live preview. Maps to CSS --scale. Overflow warning.
Accent Color (NEW): 8 presets + custom hex. Live preview. INTERACTION with Color Blind Mode: all pattern overlays work with ANY accent color (patterns are grayscale, independent of color).
Break Accent Color (NEW): same picker, default Teal. Independent of focus accent.
Clock Font (NEW): Flip Clock (default), Digital, Minimal, Analog. INTERACTION with Reduced Motion: Flip Clock degrades to Minimal (instant updates, no flip animation).
Show Seconds (NEW): toggle, ON. OFF: shows minutes only, updates per minute. INTERACTION: Last 30s Ticking audio STILL PLAYS even when seconds are hidden (audio is independent of visual display).
Reduced Motion (NEW): toggle, OFF (auto-detected). Disables all animations. DEPENDENCY: automatically disables and grays out Completion Animation Intensity slider.
Completion Animation Intensity (NEW): Subtle | Standard (default) | Celebration. Disabled when Reduced Motion ON.
Tab Title Timer (NEW): toggle, ON. Dynamic Favicon (NEW): toggle, ON.
6.4 Sound
Sound Theme: Warm (default) | Minimal | Nature | Silent. Preview button. INTERACTION with Silent: all individual toggles grayed out with note "Sounds disabled by Silent theme."
Master Volume: slider 0–100%, default 60%. INTERACTION: 0% behaves like Silent visually but preserves individual toggle states (raising volume restores config).
Custom Completion Sound (NEW): upload .mp3/.wav/.ogg, max 500KB/5 seconds. Cloud-stored. Preview + Reset.
Tick During Focus: toggle, OFF. Tick During Breaks: toggle, OFF. Last 30s Ticking (NEW): toggle, ON (independent of focus/break ticks). All require Master Volume > 0% and Sound Theme ≠ Silent.
Haptic (NEW, mobile only): toggle, ON. Auto-hidden desktop. Sub: Completion (ON), Pause/Resume (ON), Last 10s (OFF).
Respect Silent Mode (NEW): toggle, ON. Ambient Sound (NEW): None (default) | 7 options. Separate volume 0–100% (default 30%). 3s fade in/out. Focus-only. INTERACTION: pauses when timer paused, does NOT play during breaks.
6.5 Session Categories (NEW)
Reorderable list: drag handle, colored dot, name, usage count, edit (pencil), delete (trash). Max 20. Defaults: General, Work, Study, Personal, Health, Creative.
Edit: inline text (max 24 chars, duplicate validation) + color picker (8 presets). Delete: confirm with relabel notice. "+ Add Category" (disabled at 20). Default Category dropdown.
EDGE CASE: Two categories with same color: allowed. Color is purely visual, not an identifier. Categories are identified by name (unique, case-insensitive).
EDGE CASE: Category renamed: future sessions use new name. Past sessions retain historical name (see Section 5.6.2). Session Log shows original name.
EDGE CASE: All categories deleted: "General" is auto-created as fallback. The user cannot have zero categories. If they delete the last one, General reappears with a toast: "At least one category is required. 'General' has been restored."
6.6 Keyboard Shortcuts (NEW)
Master toggle (ON). Table: Space, R, S, F, M, 1, 2, 3, ? (non-customizable). Change via "Press any key..." listener. Duplicate detection. Modifier combos supported. Cloud-synced. Reset All link.
6.7 Focus Mode (NEW)
Screen Wake Lock: toggle, ON. Wake Lock API. Fallback: silent audio loop. "Not supported" if unavailable.
Fullscreen Focus: toggle, OFF. Play triggers Fullscreen API. Only timer + controls. Exit does not pause. EDGE CASE: Fullscreen API unavailable (some mobile browsers): setting hidden from UI entirely. Tooltip on hover if grayed: "Fullscreen is not supported in this browser."
6.8 Streak & Goals (NEW)
Weekly Goal: toggle, OFF. Stepper 5–100, default 20. Independent of daily goal. INTERACTION: meeting daily goal 5/7 days does NOT necessarily meet weekly goal of 20 if daily goal is < 4.
Milestone Celebrations: toggle, ON. Badges (10/25/50/100/200/365 streaks, 100/500/1000 sessions, Early Bird, Night Owl, Perfect Week/Month).
6.9 Notifications (NEW additions)
Idle Reminder: toggle, OFF. Delay slider 5–60 min (default 15). Not during breaks or after goal met.
Daily Summary: toggle, OFF. Time picker (default 8 PM). Only if user was active.
Email Notifications: toggle, OFF. Weekly Summary (Mon), Streak at Risk (evening), Milestones. Email from Google OAuth (read-only). Unsubscribe link.
6.10 Session & Data (NEW additions)
Intent Autocomplete: toggle, ON. Clear Intent History (confirmation, does not affect session records).
Auto-Log Sessions: toggle, ON. OFF: prompt after each session.
Session Notes: toggle, OFF. ON: post-session text area (500 chars). DEPENDENCY: adds Notes icon column to Session Log.
6.11 Data Management
Export CSV: RFC 4180, UTF-8 BOM, timezone-aware. Disabled if no sessions.
JSON Backup: complete user data export with schemaVersion for migration.
Import: .json validation, preview, atomic with rollback. EDGE CASE: Import from different user: validated by checking userId in backup. If mismatched: "This backup belongs to a different account. Importing will overwrite your data with another user's data. Are you absolutely sure?" (double confirmation). This prevents accidental cross-account data corruption. EDGE CASE: Import with newer schemaVersion than current app: rejected with "This backup is from a newer version of Becoming.. Please update the app first."
Reset to Factory: settings only, keeps sessions. Confirmation.
Clear All Data: SUBTITLE FIX: "Deletes sessions and resets settings from our servers" (not "locally"). Typed "CLEAR" confirmation. Irreversible.
Delete Account: multi-step (info, type email, final red button). Server: purge all KV, revoke OAuth, decrement beta. EDGE CASE: Timer running during deletion: timer marked abandoned, then account deleted. EDGE CASE: Admin deleting own account: if they are the last admin, Super Admin is notified. Super Admin cannot delete own account via this UI.
6.12 Accessibility (NEW)
Screen Reader Verbosity: Standard | Minimal | Verbose. High Contrast: auto-detected + toggle, WCAG AAA. Large Tap Targets: toggle, OFF (56px min). Color Blind Mode: Off | Deuteranopia | Protanopia | Tritanopia (adds pattern/icon supplements).
6.13 Integrations (NEW, Future)
Coming Soon: Google Calendar (auto-log sessions), Slack Status (set while focusing), Webhooks (Super Admin, session payloads).
6.14 About & Legal (NEW)
App Version + changelog. TOS + Privacy Policy (modals, versioned). Open Source Licenses. Feedback link. Contact Support.
6.15 Settings Layout
Desktop 2-col: Timer|Behavior, Display|Sound, Categories|Shortcuts, Accessibility|Integrations, Data (full-width). Tablet/Mobile: single column. 8px card gap, 24px padding. Back to Top after 2 screen-heights.

7. Dashboard Page
Read-only analytics. Server-side computation. < 1 second load with skeletons. 30-second poll. First-load animations (numbers 600ms, bars 400ms, heatmap 30ms stagger). Subsequent visits: instant. Payload < 50KB, 30s cache.
7.1 Top Stats Row (5 cards)
FOCUS TODAY: amber, tappable → Session Log. Green + check when goal met. ALL TIME: comma format 999+, abbreviate 9999+.
TOTAL HOURS: rounded, tooltip precise. < 1 hour: "0" + tooltip minutes. GOAL RATE (NEW): % days meeting goal. "—" until first full day.
STREAK: singular/plural. Tappable → streak modal (current + start date, longest ever, 30-day calendar green/amber/red, rest days remaining).
7.2 Focus Hours Chart
Bar chart: 7D (default) | 30D | 90D | 1Y. Type toggle: bar/line. 7D: daily bars with day+date. 30D: daily. 90D: weekly (13 bars). 1Y: monthly (12 bars). Zero days: 2px stub. Today: pulsing glow. Goal-met: checkmark. Hover tooltip: sessions, time, categories.
7.3 Category Breakdown
List with dots, proportion bars, counts, %. Sorted desc. Syncs with Focus Hours range. Accordion expand: total time, avg duration, top intent, mini chart. Donut chart alongside (desktop) or above (mobile), synchronized hover. Center: total count.
7.4 Activity Heatmap
GitHub-style 7x4 grid. Intensity: 0=dark, 1=25%, 2=50%, 3=75%, 4+=100%. Today: amber border. Toggle: 4W|12W|6M|1Y. Legend: 5 swatches. Streak: green bottom border. Rest day: snowflake.
7.5–7.8 New Dashboard Cards
Top Intents: top 10 by frequency. Rank, text, count, time. Excludes 1-usage.
Peak Focus Hours: 7x24 heatmap. Auto-insight: "Most productive: Tuesday 9–11 AM."
Weekly Comparison: This vs Last Week. Sessions, Time, Goal Completion, Avg Length. Green ↑ / Red ↓.
Milestones: horizontal scrollable badges. Earned: full color + glow + tap detail. Next milestone progress bar.
7.9 Dashboard Layout
Desktop: stats row, Focus Hours (full), Category+Heatmap (50/50), Intents+Peak Hours (50/50), Weekly (full), Milestones (full). Responsive: tablet 3+2 stats; mobile single column.

8. Session Log Page
ONLY completed sessions (reached 00:00). Abandoned hidden by default ("Show abandoned" toggle). Server-side write at completion. Crash = not logged. Offline: queued + flushed. Durations from server UTC. Soft delete 30-day retention. Immutable except intent/category/notes.
8.1 Filters
Type: ALL|FOCUS|BREAK|LONG BREAK (separated, not lumped). Date Range: presets + custom. Category: multi-select with chips. Search: "Search intents..." (debounced 300ms). Show Abandoned: toggle OFF. All AND together. "Clear all filters" link.
8.2 Columns
DATE (M/D/YYYY, separators), TIME (HH:MM AM/PM), TYPE (pill: amber/teal/dark-teal), DURATION (Xm Ys + overtime), INTENT (renamed from TASK, 40 char truncate), CATEGORY (colored dot), STATUS (✓ green / ✗ red), NOTES ICON (conditional), ACTIONS (kebab: edit intent/category/note, delete).
CONTRADICTION FIX: Column named "TASK" in current UI must be renamed to "INTENT" to match timer page language. Existing data migrated: the underlying field name in KV can remain, but the display label changes.
8.3 Row Behavior
Hover: highlight + actions. Click: inline expand (full details including device). One at a time. Alternating rows. Date separators with daily summaries.
8.4 Sorting, Pagination, Bulk Actions, Export, Real-Time
Sort: newest first default. Clickable headers. Cursor-based pagination: 50 initial + infinite scroll 25. Bulk: select mode, floating bar (Delete/Change Category/Export/Cancel). Export: CSV or PDF (context-aware). Real-time: new sessions appear within 10s with slide + glow animation.
EDGE CASE: Export during active session: the currently running (incomplete) session is NOT included in exports. Only completed sessions. A note appears if a session is active: "Note: Your current running session is not included in this export."

9. Header Action Buttons (Feedback, Export, Keys)
9.1 Feedback Button
Modal: Category (Bug|Feature Request|General), Subject (required, 100 chars), Description (required, 2000 chars, min 10). Bug extras: Steps to Reproduce, Severity (Minor/Moderate/Major/Critical), auto-populated Browser/Device. Screenshot upload (3 files, 5MB, .png/.jpg/.gif/.webp) + optional Screen Capture API.
Auto-included metadata (invisible): userId, email, name, role, appVersion, page, browser/OS, viewport, timezone, settingsSnapshot, sessionState.
Submit: spinner + Sending. Success: checkmark + reference number (#1247) + 4s auto-close. Failure: error banner, content preserved.
Server storage: feedbackId, user info, category, subject, description, stepsToReproduce, severity, isUrgent, screenshots, metadata, status (new/in_review/planned/in_progress/resolved/wont_fix/duplicate), adminNotes, resolvedBy, resolvedAt, timestamps.
Admin view: table with all submissions, filters, inline status dropdown, internal admin notes per item (timestamped), feedback stats (Super Admin).
9.2 Export Button
Context-aware modal. Format: CSV or PDF (radio cards). Scope: filtered or all. Date range override. CSV include-options: details (always), intent/category (ON), notes (OFF), device (OFF), overtime (ON). PDF: summary (ON), charts (ON), table (ON), orientation.
Server-side generation. Auto-download. File: becoming_sessions_YYYY-MM-DD_HHmm. CSV: UTF-8 BOM, CRLF, RFC 4180, ISO dates, 24h times, decimal minutes. PDF: cover + stats + charts + table + page numbers + branding.
9.3 Keys Button
Modal (also ? key). Context-aware sections: Timer (Space/R/S/1/2/3/F/M), Navigation (G then T/D/L/S, 1s timeout), Session Log (/ arrows Enter E Delete Ctrl+A), Dashboard (arrows), Global (? Ctrl+E Ctrl+Shift+F Escape). Keycap rendering. Custom bindings shown. Customize link to Settings. Disabled banner with inline Enable.
Engine: globally active, suppressed in text input (except modifiers), debounced 100ms, visual feedback toast (800ms), inactive in modals, anonymous usage logging.

10. Admin & Super Admin Dashboard
10.1 Roles
Super Admin: ashkan.mofidi@gmail.com (hardcoded, non-removable). Full access. Admin: promoted by Super Admin from regular users. View analytics/feedback, manage feedback status. Regular: must have 1+ completed session before promotable. 403 on admin URLs.
Server-side role checks on every admin API request. Client-side is cosmetic.
EDGE CASE: Admin demoted while viewing admin dashboard: next API call returns 403. UI shows: "Your admin access has been revoked." Redirects to Timer. ADMIN section disappears from sidebar.
EDGE CASE: All admins demoted (only Super Admin remains): system continues normally. Super Admin handles all admin functions.
EDGE CASE: Beta cap reduced below current user count: existing users are NOT kicked out. They continue with full access. The cap only prevents NEW sign-ups. A warning in Admin: "Beta cap (8) is below current users (10). No new sign-ups possible until users are removed or cap is increased."
10.2 Real-Time Pulse
6 live stat cards with green LIVE dot, 10-second refresh: Active Right Now (users with running timer; list for Super Admin only), Today's Sessions (total + comparison vs yesterday), Today's Focus Hours (total + comparison), Today's Active Users (unique X/10), Beta Capacity (X/10 + progress bar), System Status (green/yellow/red dot from API + KV health check).
10.3 User Growth & Retention
User Growth: line chart, cumulative users, hover annotations with names, dashed line for deleted accounts.
DAU: bar chart with 50% target line. WAU/MAU: side-by-side line charts. DAU/MAU Stickiness: gauge 0-100% (red/yellow/green). Industry benchmark 25-35%. 90-day sparkline.
Retention Cohort: heatmap table. Rows: sign-up week. Columns: Week 0,1,2... Cells: retention % with red-to-green color scale.
10.4 Session Analytics
Total Sessions Over Time: area chart, dual Y-axis (daily count + cumulative dashed).
Sessions by Type: donut (Focus amber, Break teal, Long Break dark teal). Insight if break:focus ratio deviates from 1:4.
Average Session Duration: 3 horizontal bars (actual vs configured). Flags if avg < 80% or > 100%.
Completion vs Abandonment: stacked bar (amber/red). Trend overlay. Flag if abandonment > 25%.
Sessions per User: horizontal bars (named Super Admin, anonymized Admin). Color vs average.
Daily Goal Achievement: line chart, % meeting goal, 70% target. Flag if < 50%.
Streak Distribution: histogram (0, 1-3, 4-7, 8-14, 15-30, 30+).
10.5 Engagement & Behavior
Peak Usage Hours: 7x24 heatmap aggregated across all users. Auto-insight.
Feature Adoption Matrix: table (Feature | Users Enabled | % | Trend). Flag at < 15%.
Timer Config Distribution: histograms of Focus/Break/Goal/Cycles values.
Category Usage (All Users): treemap/stacked bar. Most/least popular.
Intent Word Cloud: aggregated, clickable. User attribution hidden for Admins.
10.6 User Health & Risk
Health Scorecard: table per user (Last Active, Sessions 7D, Streak, Goal Rate, Health). Scoring: Thriving (24h + streak>7 + goal>60%), Healthy (48h + streak>3 + goal>40%), At Risk (7 days, streak broken or goal<40%), Churning (inactive 7+ days), Dormant (30+ days). Sorted worst-first. Expandable profiles.
Churn Risk Alert: banner with urgent signals (inactive 7+ days, broken streaks). Dismissable. Future: re-engagement email.
10.7 System Metrics (Super Admin Only)
API Performance: P50/P95/P99 lines with SLA thresholds.
Error Rate: % 4xx/5xx, target <1%, recent errors table.
Storage: Vercel KV breakdown (keys, size, by type, growth, runway). Color bar.
Deploys: last 10 timeline. Uptime: 90-day bar.
10.8 TOS Compliance (Super Admin Only)
Acceptance Funnel: Signed in > Viewed > Accepted > First session. Dropoff %. Per-version funnels.
Version Status table: User | Version | Date | Current | Status.
10.9 User Management
User Table: Avatar, Name, Email, Role, Joined, Last Active, Sessions, Streak, Health, Actions. Filters: role/health/active/search.
Actions (Super Admin): View Profile, Promote to Admin, Demote, Deactivate (typed email), Delete (typed email + DELETE), Reset Session. Self-actions disabled.
Profile Panel: slide-in with profile header, account (TOS, devices), usage summary, settings snapshot, last 10 sessions, feedback count, admin notes (internal, timestamped).
Beta Invitations (Super Admin): slots counter, Increase Cap, Invite User (allowlist), Manage Allowlist (30-day expiry).
10.10 Audit Log (Super Admin Only)
Chronological reverse-sorted: Timestamp, Actor, Action, Target, Details. Events: role changes, account actions, feedback status, admin notes, beta cap, invitations, TOS updates, registrations, deletions, exports, failed logins. Filters: actor/action/date/search. Immutable, indefinite retention, CSV export.
10.11 Admin Export
PDF: key metrics, one-line summary, chart renders, health scorecard, auto-generated recommendations (e.g., 'completion rate <80%: reduce default focus duration,' 'DAU/MAU <30%: add streak recovery,' 'feature <15% adoption: improve discoverability'). Branded.
10.12 Admin Data Architecture
Server-side aggregation. Rate-limited 60/min. Double role verification. 60s cache (Pulse bypasses). Scalable to 1000+ users with indexed lookups and pre-computed aggregation tables.

11. Multi-Device Behavior
Timer: single controller model with heartbeat (15s interval, 60s timeout). BroadcastChannel for same-browser tabs. "Take over" transfers control.
Settings: 5-second sync, last-write-wins. Session Log: append-only, consistent. Dashboard: server-derived, 30s poll.
EDGE CASE: User on VPN changing IP mid-session: no impact. Sessions are identified by userId, not IP. IP is only logged for audit purposes.
EDGE CASE: Device goes to sleep during session (laptop lid close): Wake Lock prevents this on supported browsers. If wake lock fails, the timer continues running server-side. On device wake, the timer display reconciles from server timestamps. If session completed while asleep: completion is processed, and user sees the completion state on wake.

12. Responsive Design
Desktop ≥ 1024px: full layouts, sidebar. Tablet 768–1023px: single column, collapsible sidebar. Mobile < 768px: hamburger, cards, bottom sheets.
Mobile: 44px min tap targets (56px with Large Tap Targets). No iOS zoom (16px min font). Swipe gestures. Tables become card lists.

13. First-Time User Experience
After TOS acceptance, first-time users land on the Timer page with a subtle onboarding overlay (not a full tutorial, respecting the user's time):
Step 1: A pulsing amber spotlight highlights the timer with tooltip: "This is your focus timer. Set your intention and press play to start." (Next / Skip All)
Step 2: Spotlight on intent input: "Tell us what you're working on. This helps you track your focus over time." (Next / Skip All)
Step 3: Spotlight on sidebar stats: "Track your daily progress and build a streak. Consistency is key." (Got it!)
Onboarding is shown ONCE (tracked via onboardingCompleted: true in user KV record). If dismissed via Skip All, never shown again.
EDGE CASE: User clears all data (Section 6.11.5): onboarding is NOT re-shown. The user is experienced; repeating onboarding would be patronizing.
EDGE CASE: User imports backup from another account: onboarding is NOT re-shown (data import implies experience).

14. Loading States Catalog
Every asynchronous operation must have a visible loading indicator. The user should NEVER see a frozen/unresponsive UI.
Page load (Timer/Dashboard/Session Log/Settings): skeleton placeholders matching the layout. Dark gray pulsing rectangles. Duration: < 1 second target.
Session start (Play button): button shows brief spinner (200ms max before timer begins). If server is slow, timer starts optimistically and syncs server-side.
Settings save: subtle toast "Settings saved" after debounce. If slow: "Saving..." toast transitions to "Settings saved."
Export generation: button shows spinner + "Generating..." text. For CSV: < 2 seconds. For PDF: < 5 seconds. Progress indicator for large exports.
Feedback submission: button spinner + "Sending..." Disabled to prevent double-submit.
Data import: full-screen overlay with progress: "Validating..." → "Importing sessions (147 of 147)..." → "Applying settings..." → "Complete!"
Account deletion: full-screen overlay: "Deleting your account..." with a progress bar. No cancel once started.
Admin dashboard: each chart card has its own skeleton. Cards load independently (don't wait for all data). Fastest cards appear first.
Autocomplete dropdown: if intent history is still loading, show a single pulsing row. Never show an empty dropdown while data is being fetched.

15. Empty States Catalog
Every data-driven view must have an encouraging empty state with a clear call to action. Empty states must never feel broken or blank.
Timer (first visit): "25:00 READY TO FOCUS" with pulsing play button. Onboarding overlay (Section 13).
Dashboard (no sessions): each card shows encouraging text. Focus Today: "0 — Start your first session!" Focus Hours chart: "No focus sessions yet. Start a session to see your progress here." with "Go to Timer →" link. Category Breakdown: "Your focus categories will appear here." Heatmap: "Complete sessions to build your activity map. Each day you focus lights up!" Top Intents: "Your most-used focus intents will appear here." Peak Hours: "Focus during different hours to discover your peak productivity times." Weekly Comparison: "Complete sessions across two weeks to see your trends." Milestones: first badge "First Focus" shown as locked with text "Start your first session to earn your first badge!"
Session Log (no sessions): centered icon + "No sessions yet. Complete your first focus session to start building your log." + amber "Go to Timer →" button.
Session Log (filters return zero): table headers visible, body: "No sessions match your filters." + "Clear all filters" link.
Settings Categories (impossible state, but defensive): "No categories found." + auto-restore "General."
Admin Dashboard (no data): "Waiting for user activity. Analytics will populate as users complete sessions."
Admin Feedback (no submissions): "No feedback yet. Users can submit feedback via the 💬 button in the app header."
Admin Audit Log (new system): "No audit events recorded yet. Events will appear as admin actions occur."

16. Error Pages & Error Message Catalog
16.1 Error Pages
404 Not Found: "This page doesn't exist. It may have been moved or you may have typed the URL incorrectly." + "Go to Timer" button + app branding. No sidebar (user may not be authenticated).
403 Forbidden: "You don't have access to this page." + "Go to Timer" button. For admin routes accessed by regular users.
500 Internal Server Error: "Something went wrong on our end. Please try again in a moment." + "Retry" button + "If the problem persists, send us feedback." + Feedback link.
Offline: persistent top banner "⚠ You're offline. Changes will sync when you reconnect." Banner is amber, dismissable, reappears on next action that requires network. Timer continues running (uses server timestamps for reconciliation on reconnect).
16.2 Error Message Standards
All error messages follow the pattern: [What happened] + [What the user can do]. Never show raw error codes, stack traces, or technical details to users.
Toast errors (non-blocking): appear bottom-right, auto-dismiss after 5 seconds, include a dismiss X button.
Modal errors (blocking): require user acknowledgment. Used only for destructive action failures (delete, import) or critical auth issues.
Inline errors (field-level): appear below the relevant input field in red text. Clear when the user corrects the input.
Rate limit errors: "You're doing that too quickly. Please wait a moment and try again." (never reveal the specific rate limit numbers).

17. Security & Privacy
Auth: Google OAuth 2.0 + PKCE. No password storage. Sessions: httpOnly, secure, sameSite=strict cookies + server-side KV store. 30-day sliding.
Encryption: at rest (AES-256 via Vercel KV), in transit (TLS 1.3). Input sanitization server-side (HTML encoding, max lengths). OWASP Top 10 mitigations.
Rate limiting: 10 login/IP/min, 60 admin API/min, 100 general/min. CSRF: state parameter + SameSite. XSS: CSP headers, no inline scripts, output encoding.
No sensitive data in localStorage/sessionStorage (only non-sensitive UI prefs like sidebar collapsed state).
Dependency scanning: automated npm audit in CI/CD. GDPR/CCPA: Export Data, Delete Account, documented retention policies.
Audit trail: immutable log of admin actions, TOS, role changes. Incident response: alerts for elevated errors, auth anomalies, storage thresholds.
EDGE CASE: Feedback with XSS payload in description: all user-generated content (intents, categories, notes, feedback) is output-encoded on render. Raw HTML is never injected into the DOM. Markdown rendering (if used for feedback) uses a sanitizing renderer that strips script tags, event handlers, and data URIs.

18. Data Architecture
Vercel KV (Redis-compatible). Keys: user:{sub}, session:{userId}:{id}, timer:{userId}, tos:{userId}, auth:session:{token}, feedback:{id}, audit:{id}, intent_history:{userId}, beta:config, beta:invites:{email}.
All timestamps UTC ISO 8601. Timezone conversion client-side. Atomic key-level writes. Optimistic concurrency for multi-key ops.
Daily aggregations pre-computed on session completion. Nightly backup to secondary store. RPO < 24h, RTO < 1h.

19. Performance & Browser Support
19.1 Performance Budgets
First Contentful Paint: < 1.5s on 4G. Time to Interactive: < 3s. Bundle: < 500KB gzipped.
API: < 200ms P50, < 500ms P95, < 1000ms P99. All images lazy-loaded. Critical CSS inlined. Non-critical JS deferred.
19.2 Browser Support Matrix
Tier 1 (fully supported, tested in CI): Chrome 100+, Firefox 100+, Safari 16+, Edge 100+. Desktop and mobile.
Tier 2 (supported, not CI-tested): Chrome Android, Safari iOS 16+, Samsung Internet 20+.
Tier 3 (best-effort): older versions. Graceful degradation: features requiring modern APIs (Wake Lock, Fullscreen, BroadcastChannel) are hidden/disabled with appropriate messaging.
IE 11: NOT supported. Redirect to upgrade page.
19.3 Offline Strategy
Service worker caches: app shell (HTML, CSS, JS), static assets (icons, fonts, sound files). Network-first for API data.
Offline behavior: Timer continues running (local timestamps, reconciled on reconnect). Settings changes queued. Session completions queued in IndexedDB. Session Log shows cached data with stale indicator. Dashboard shows cached data with "Last updated X minutes ago" notice.
Online reconnection: queued operations flushed in order. Conflicts resolved last-write-wins. Toast: "Back online. Syncing your data..." → "All changes synced."
EDGE CASE: IndexedDB full: fallback to in-memory queue. If the user closes the browser before reconnecting, the queued data is LOST. A warning: "Storage is full. Please reconnect to the internet to avoid losing session data."

20. Analytics Event Taxonomy
All events are anonymous (no PII in event payloads). Events are used to power the Admin Dashboard metrics. No third-party analytics (no Google Analytics, no Mixpanel). All data stays in Vercel KV.
user.registered: { userId, timestamp, source: 'direct'|'invited' }
user.logged_in: { userId, timestamp, device }
user.logged_out: { userId, timestamp }
tos.accepted: { userId, version, timestamp }
session.started: { userId, mode, configuredDuration, intent, category, device }
session.completed: { userId, mode, actualDuration, overtime, intent, category }
session.abandoned: { userId, mode, elapsedBeforeAbandon, reason: 'skip'|'reset'|'switch'|'close'|'timeout' }
session.paused: { userId, elapsedAtPause }
session.resumed: { userId, pauseDuration }
goal.achieved: { userId, goal, sessionsCompleted }
streak.continued: { userId, streakLength }
streak.broken: { userId, previousLength }
streak.freeze_used: { userId, freezesRemaining }
milestone.earned: { userId, milestoneId }
settings.changed: { userId, setting, oldValue, newValue }
feedback.submitted: { userId, category, isUrgent }
export.generated: { userId, format, scope, recordCount }
shortcut.used: { shortcutKey, action, page }
admin.role_changed: { actorId, targetId, oldRole, newRole }
admin.account_action: { actorId, targetId, action: 'deactivate'|'delete'|'reset' }

Appendix A: Default Values Reference

Appendix B: Feature Interaction Matrix
This matrix documents every feature interaction where two settings combine to produce behavior that is not obvious from either setting alone. Each interaction has been explicitly designed and tested.
Strict Mode + Overtime: overtime continues after 00:00. Only "Stop Overtime" button available. Cannot pause during overtime.
Strict Mode + Auto-Start Breaks: auto-start countdown begins normally after strict focus completes. Strict mode only affects focus sessions.
Strict Mode + Pause: pause state never occurs during strict focus. Pause button hidden.
Overtime + Completion Animation: Phase 1 plays at 40% volume. Phases 2-3 deferred until user manually stops overtime.
Overtime + Daily Goal: overtime session counts as 1 session toward goal (same as non-overtime). Extra time logged but doesn't count as multiple sessions.
Overtime + Session exceeds 24 hours: display switches to HH:MM:SS. Single session record. No special handling needed.
Reduced Motion + Completion Animation Intensity: intensity slider disabled and grayed out. Forced to minimal visual.
Reduced Motion + Clock Font "Flip Clock": flip animation disabled. Degrades to Minimal (instant text change).
Show Seconds OFF + Last 30s Ticking: audio plays normally. Visual shows minutes only. Intentional disconnect (audio provides awareness, visual stays calm).
Sound Theme Silent + Individual Toggles: all individual toggles grayed out with note. Raising volume doesn't restore sounds until theme changed.
Master Volume 0% + Individual Toggles: toggles remain visually active (not grayed). Raising volume restores previous sound config.
Completion Chime OFF + Desktop Notifications ON: in-app silent but notification fires with sound.
Ambient Sound + Breaks: ambient is focus-only. Stops during breaks. Resumes on next focus.
Ambient Sound + Pause: fades out over 3 seconds. Fades in on resume.
Light Theme + Amber Accent: small text auto-darkens to #B45309 for AA contrast.
Color Blind Mode + Custom Accent: patterns are grayscale overlays, independent of accent color.
Streak Freeze + "Meet daily goal" rule: rest day counts as meeting the rule.
Day Reset Time change + running timer: session belongs to the day it STARTED (old boundary). New boundary applies to next idle period.
Daily Goal change + Streak Rule "Meet daily goal": retroactive recalculation uses the goal value active on each historical day, not the current goal.
Weekly Goal + Daily Goal: independent. Meeting daily 5/7 days ≠ meeting weekly 20 if daily < 4.
Min Countable Session + Auto-Log OFF: sessions under minimum are not prompted ("Log this session?"), they are silently discarded.
Fullscreen + Mobile browser without Fullscreen API: setting hidden from UI. Tooltip if hovered: "Not supported in this browser."
Session Notes ON + Session Log export: Notes column included in CSV only if "Include session notes" checkbox is checked (default OFF for privacy).
Multiple tabs same browser: BroadcastChannel negotiates single controller. Second tab shows "controlled in another tab" + Take over.

Appendix C: Contradictions Resolved
This appendix documents contradictions found in the current implementation vs. this specification, and how each is resolved.
1. Timer idle shows "00:00" in current UI. SPEC: must show configured duration (e.g., "25:00"). Resolution: implementation bug, fix required.
2. Logout in sidebar footer. SPEC: relocated to profile card area. Resolution: remove from footer, add to profile card.
3. "TASK" column in Session Log. SPEC: renamed to "INTENT." Resolution: UI label change, no data migration needed.
4. "Clear All Data" subtitle says "locally." SPEC: "from our servers." Resolution: text update required.
5. Alert Sound (mute/volume icon pair). SPEC: replaced by Sound Theme dropdown + Master Volume slider. Resolution: full UI redesign of Sound section.
6. "BETA · 10 USERS" (static). SPEC: "BETA · X/10 USERS" (dynamic). Resolution: make counter dynamic.
7. Breaks and Long Breaks lumped under "BREAK" filter. SPEC: separate BREAK and LONG BREAK. Resolution: add fourth filter option.
8. Session Log shows incomplete/abandoned sessions. SPEC: only completed sessions by default. Resolution: filter out abandoned, add "Show abandoned" toggle.

Appendix D: Complete Scope Summary (38 Areas)
1. Login Page with 12 edge cases including Google suspension, allowlist bypass, cookie blocking
2. OAuth 2.0 + PKCE authentication with 11-step sequence and session management
3. Versioned TOS consent with first-time/returning/updated flows and audit trail
4. Brand Identity Block with dynamic versioning from environment variables
5. User Identity Card with avatar fallbacks, role badges, and Google sync
6. Logout with session clearing, token revocation, and timer abandonment handling
7. Sidebar Navigation with CORE/SYSTEM/ADMIN sections and mobile drawer
8. Footer Stats with dynamic beta counter and tappable tiles
9. Timer Mode Selector with auto-advance, multi-device sync, and strict mode interaction
10. Circular Timer with 7 visual states, color warming, urgency build, and 3-phase completion
11. Full sensory spec: timing curves, frequencies, particle physics, shadow values
12. Playback Controls with morph animations, confirmations, strict mode override
13. Daily Goal with celebrations, overflow, mid-day changes, streak rule interaction
14. Pomodoro Cycle Tracker derived from session data with interrupted cycle handling
15. Session Intent with autocomplete, emoji/RTL support, historical preservation
16. Category Bar with inline creation, 20 limit, rename/delete edge cases
17. Sound System with 4 themes, 9 toggles, 7 ambient tracks, custom upload, haptics
18. Settings: Timer (6 controls with overtime and min countable dependencies)
19. Settings: Behavior (8 controls with strict mode, streak, and day reset interactions)
20. Settings: Display (10 controls with theme contrast, reduced motion dependencies)
21. Settings: Sound (8 controls with silent theme override, volume independence)
22. Settings: Categories (CRUD with 20 limit, zero-category fallback, rename preservation)
23. Settings: Shortcuts (9 bindings with conflict detection and cloud sync)
24. Settings: Data Management (export/import/reset/clear/delete with 7 edge cases)
25. Settings: Accessibility (4 controls with independence and override behaviors)
26. Dashboard: 5 stats + 6 chart cards + milestones with responsive layout
27. Session Log: 9 columns, 5 filters, bulk actions, export, real-time updates
28. Header Buttons: Feedback (admin routing + metadata), Export (CSV/PDF), Keys (shortcuts)
29. Admin Dashboard: 20+ metrics, real-time pulse, retention cohorts, churn alerts
30. User Management: roles, profile panels, beta invitations with cap edge cases
31. Audit Log + System Health + TOS Compliance (Super Admin only)
32. Multi-Device: single controller, heartbeat failover, BroadcastChannel for tabs
33. First-Time User Experience: 3-step spotlight onboarding
34. Loading States: 10 async operations with skeleton/spinner/progress patterns
35. Empty States: 12 data-driven views with encouraging messages and CTAs
36. Error Pages and Message Standards: 404/403/500/offline with user-friendly patterns
37. Security: OAuth PKCE, encryption, rate limiting, XSS/CSRF, GDPR, audit trail
38. Performance: budgets, browser matrix (Tier 1-3), offline strategy with service worker
Document Version | 2.0 (Final)
Date | April 8, 2026
Author | Ashkan Mofidi
Product | Becoming.. (becoming.ashmofidi.com)
Status | Final Draft
Classification | Confidential
Audience | Engineering, Design, QA, Legal, Security, Product

Focus Duration | 25 minutes
Short Break | 5 minutes
Long Break | 15 minutes
Cycles | 4
Daily Goal | 4 sessions
Min Countable | 10 minutes
Overtime | OFF
Auto-Start Breaks | OFF
Auto-Start Focus | OFF
Notifications | ON
Strict Mode | OFF
Day Reset | 12:00 AM
Streak Rule | 1+ session/day
Rest Days | 2/month
Theme | Dark
Accent | Amber #D97706
Break Accent | Teal #0D9488
Clock Font | Flip Clock
UI Scale | 100%
Show Seconds | ON
Reduced Motion | OFF (auto)
Animation | Standard
Sound Theme | Warm
Volume | 60%
Tick Focus | OFF
Tick Breaks | OFF
Last 30s | ON
Haptic | ON (mobile)
Ambient | None
Default Category | General
Shortcuts | ON
Wake Lock | ON
Fullscreen | OFF
Weekly Goal | OFF
Milestones | ON
Beta Cap | 10
Super Admin | ashkan.mofidi@gmail.com

