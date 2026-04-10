# Devil's Advocate Audit — Total Codebase Trace

**Date:** 2026-04-10
**Method:** Every feature traced with 7-step prosecution protocol. Default assumption: BROKEN until proven otherwise.

---

## SETTINGS TRUTH TABLE

Every setting traced from UI toggle → state write → consumer read → effect.

| # | Setting | Write Path | Consumer | Read Path | Match? |
|---|---------|-----------|----------|-----------|--------|
| 1 | muted (Settings) | updateSettings({muted}) → SettingsContext | useAudioSync → setEngineMuted + setTickMuted | SettingsContext via useSettings | **YES** |
| 2 | muted (Timer btn) | updateSettings({muted}) → SettingsContext | useAudioSync → setEngineMuted + setTickMuted | SettingsContext via useSettings | **YES** |
| 3 | masterVolume | updateSettings → SettingsContext | useAudioSync → setEngineVolume + setTickVolume | SettingsContext | **YES** |
| 4 | soundTheme | updateSettings → SettingsContext | useAudioSync → setEngineTheme | SettingsContext | **YES** |
| 5 | tickDuringFocus | updateSettings → SettingsContext | useAudioSync → shouldTick evaluation | SettingsContext | **YES** |
| 6 | tickDuringBreaks | updateSettings → SettingsContext | useAudioSync → shouldTick evaluation | SettingsContext | **YES** |
| 7 | last30sTicking | updateSettings → SettingsContext | timer page onTick → setTickLoud() | SettingsContext | **YES** |
| 8 | ambientSound | updateSettings → SettingsContext | useAudioSync → startAmbientSound | SettingsContext | **YES** |
| 9 | ambientVolume | updateSettings → SettingsContext | useAudioSync → setAmbientVolume | SettingsContext | **YES** |
| 10 | focusDuration | updateSettings → SettingsContext | useTimer → defaultDurationMinutes | SettingsContext | **YES** |
| 11 | shortBreakDuration | updateSettings → SettingsContext | useTimer → defaultDurationMinutes | SettingsContext | **YES** |
| 12 | longBreakDuration | updateSettings → SettingsContext | useTimer → defaultDurationMinutes | SettingsContext | **YES** |
| 13 | dailyGoal | updateSettings → SettingsContext | timer page → DailyGoal component | SettingsContext | **YES** |
| 14 | cycleCount | updateSettings → SettingsContext | timer page → getCycleStatus + server getNextMode | SettingsContext + KV | **YES** |
| 15 | theme | updateSettings → SettingsContext | DisplaySync → html class | SettingsContext | **YES** |
| 16 | fontSize | updateSettings → SettingsContext | DisplaySync → --font-scale CSS var | SettingsContext | **YES** |
| 17 | accentColor | updateSettings → SettingsContext | DisplaySync → --accent-color CSS var | SettingsContext | **YES** |
| 18 | breakAccentColor | updateSettings → SettingsContext | DisplaySync → --break-accent-color CSS var | SettingsContext | **YES** |
| 19 | clockFont | updateSettings → SettingsContext | Timer page (indirect via CSS) | SettingsContext | **YES** |
| 20 | showSeconds | updateSettings → SettingsContext | useTimer → formatTimerDisplay | SettingsContext | **YES** |
| 21 | reducedMotion | updateSettings → SettingsContext | DisplaySync → reduced-motion class | SettingsContext | **YES** |
| 22 | completionAnimationIntensity | updateSettings → SettingsContext | Timer page (CSS animation class) | SettingsContext | **YES** |
| 23 | tabTitleTimer | updateSettings → SettingsContext | Timer page → document.title | SettingsContext | **YES** |
| 24 | dynamicFavicon | updateSettings → SettingsContext | useDynamicFavicon enabled prop | SettingsContext | **YES** |
| 25 | screenWakeLock | updateSettings → SettingsContext | FocusModeSync → Wake Lock API | SettingsContext | **YES** |
| 26 | fullscreenFocus | updateSettings → SettingsContext | FocusModeSync → Fullscreen API | SettingsContext | **YES** |
| 27 | highContrast | updateSettings → SettingsContext | AccessibilitySync → data attribute | SettingsContext | **YES** |
| 28 | largeTapTargets | updateSettings → SettingsContext | AccessibilitySync → data attribute | SettingsContext | **YES** |
| 29 | colorBlindMode | updateSettings → SettingsContext | AccessibilitySync → data attribute | SettingsContext | **YES** |
| 30 | screenReaderVerbosity | updateSettings → SettingsContext | AccessibilitySync → setVerbosity() | SettingsContext | **YES** |
| 31 | autoStartBreaks | updateSettings → SettingsContext | Timer page auto-start effect | SettingsContext | **YES** |
| 32 | autoStartFocus | updateSettings → SettingsContext | Timer page auto-start effect | SettingsContext | **YES** |
| 33 | strictMode | updateSettings → SettingsContext | timerService (server) | KV via settingsRepo | **YES** |
| 34 | overtimeAllowance | updateSettings → SettingsContext | timerService.complete() (server) | KV via settingsRepo | **YES** |
| 35 | confirmLogoutWithActiveTimer | updateSettings → SettingsContext | Sidebar (via SidebarWrapper fetch) | API fetch | **YES** |
| 36 | hapticEnabled | updateSettings → SettingsContext | useAudio haptic functions | SettingsContext | **YES** |
| 37 | idleReminder | updateSettings → SettingsContext | FocusModeSync idle timer | SettingsContext | **YES** |
| 38 | respectSilentMode | updateSettings → SettingsContext | — | — | **DEAD** |
| 39 | autoLogSessions | updateSettings → SettingsContext | — | — | **DEAD** |
| 40 | sessionNotes | updateSettings → SettingsContext | — | — | **DEAD** |
| 41 | intentAutocomplete | updateSettings → SettingsContext | — | — | **DEAD** |
| 42 | dailySummary | updateSettings → SettingsContext | — | — | **DEAD** |
| 43 | emailNotifications | updateSettings → SettingsContext | — | — | **DEAD** |

**Result: 37 settings WIRED, 0 BROKEN, 6 DEAD (features not yet built — settings persist correctly, just no consumer)**

---

## FULL FINDINGS TABLE

### Category 1: Authentication & Session

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 1.1 | Google OAuth flow | **WORKING** | State param validated, tokeninfo endpoint verifies ID token, no hardcoded secrets, crypto.getRandomValues for session tokens |
| 1.2 | Session validation on every request | **WORKING** | All 17 endpoints use requireAuth/requireRole. UserId from session only, never from request body. |
| 1.3 | Logout | **WORKING** | Destroys server session (KV del), clears cookie, timer abandon, confirmation if active, "don't ask again" works |
| 1.4 | 3-day hard expiry | **WORKING** | SESSION_MAX_AGE_SECONDS = 259200. Checked on every validateSession(). No sliding window. KV TTL set. |
| 1.5 | Avatar display | **WORKING** | Google picture stored on user create/update. Sidebar, feedback, users pages all render with onError fallback to initials. |

### Category 2: Timer Engine

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 2.1 | Timer initialization | **WORKING** | Reads settings.focusDuration via SettingsContext. Fallback 25 only when settings null (pre-load). AppReadyGate prevents rendering before load. |
| 2.2 | Start focus session | **WORKING** | Play → ensureInitialized → actions.start → API → setState(running). forcSync() triggers immediate audio sync. |
| 2.3 | Countdown mechanism | **WORKING** | 100ms setInterval. Calculates remaining from startedAt timestamp (drift-immune). Effect guards prevent duplicate intervals. |
| 2.4 | Session completion | **FIXED** | Was: finalizeSession() failure left timer stuck in 'running'. Now: try-catch around finalizeSession, timer always transitions to idle. |
| 2.5 | Pause/resume | **WORKING** | Pause records pausedAt, resume adjusts startedAt to compensate. forcSync() stops/resumes tick instantly. |
| 2.6 | Skip session | **WORKING** | Focus: confirmation required, strict mode blocks. Break: immediate, no confirmation. Skip enabled during break (disabled={isFocusMode && idle}). |
| 2.7 | Finish early | **WORKING** | Calculates elapsed from startedAt. <10s shows "too short" modal. Logs as status='completed' with actual duration. |
| 2.8 | Long break logic | **WORKING** | getNextMode: cycleNumber % cycleCount === 0 → long_break. Configurable via settings.cycleCount. |
| 2.9 | Daily reset | **WORKING** | No explicit reset. Counters recomputed from session date filter on every render. UTC date changes automatically at midnight. |
| 2.10 | Counter exceeding goal | **WORKING** | No cap. Shows actual count (e.g., 9/8). exceeded flag set when count > target. No Math.min or modulo. |
| 2.11 | Focus today display | **WORKING** | Sums actualDuration of completed focus sessions + live elapsed of current running session. |
| 2.12 | Cycle dots | **WORKING** | getCycleStatus() from shared utils. Computed from today's completed sessions + cycleCount setting. |

### Category 3: Sound System

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 3.1 | Audio architecture | **WORKING** | Two singletons: tick-engine (tick scheduling) + audio-engine (chimes, ambient, haptics). Both module-level, survive navigation. useAudioSync is single controller. |
| 3.2 | Tick lifecycle | **WORKING** | Web Audio scheduled buffers (Chris Wilson pattern). startTick guards double-start. stopTick clears interval + resets loud flag. |
| 3.3 | Tick mute interaction | **WORKING** | Both timer button and settings toggle write settings.muted via SettingsContext. useAudioSync watches settings?.muted. Single source of truth. |
| 3.4 | Tick volume | **WORKING** | setTickVolume uses setTargetAtTime for smooth ramping. Volume 0 = gain 0 = silent. Applied on every slider change. |
| 3.5 | Ambient sound | **WORKING** | loop=true for seamless looping. Type change: stops old, loads new, starts with fade-in. Stop: fade-out + disconnect + null. Goes through masterGain (affected by master mute/volume). |
| 3.6 | Completion chime | **WORKING** | shouldPlay() gates on initialized + !muted + theme!='silent'. /sounds/chime-completion.ogg exists (30KB). |
| 3.7 | Sound files | **WORKING** | 14 OGG files in /public/sounds/. All referenced paths match actual files. OGG supported in all modern browsers. |

### Category 4: Settings

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 4.1 | Settings persistence | **WORKING** | settingsRepo.save() does {...existing, ...incoming} merge. Never overwrites. Debounced save (500ms). |
| 4.2 | Settings reactivity | **WORKING** | 37/43 settings wired. 6 are dead (features not built). 0 broken wiring. All use same SettingsContext. |

### Category 5: Data Integrity

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 5.1 | Session logging | **WORKING** | Single write path: sessionRepo.create (set + lpush). Cleanup on lpush failure. Retry on first failure. |
| 5.2 | Counter consistency | **WORKING** | Counters recomputed from session array (not stored separately). Cannot drift. |
| 5.3 | Data loss on deploy | **WORKING** | No prebuild/postbuild scripts touch KV. No initialization overwrites existing data. |
| 5.4 | Data loss on logout | **WORKING** | Logout only deletes auth:session:{token}. Settings, sessions, profile untouched. |
| 5.5 | Settings overwrite | **WORKING** | Merge pattern verified: {...existing, ...incoming}. |

### Category 6: Admin Pages

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 6.1 | User Management | **WORKING** | requireRole enforced. Returns name, email, picture, role, sessions count, health status. |
| 6.2 | Feedback | **WORKING** | Submission stores userId/email/name/picture. Display renders avatar + name + email per card. |
| 6.3 | Analytics/Audit/System | **WORKING** | Each page has API route, auth check, error handling. Pulse data now returns real metrics. |

### Category 7: Navigation & State

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 7.1 | Mount/unmount | **WORKING** | Providers in layout never unmount. Tick engine is module singleton. |
| 7.2 | Browser back/forward | **WORKING** | Next.js client-side routing. No full page reload. |
| 7.3 | Tab visibility | **WORKING** | Countdown uses timestamp math (not decrement). Correct on refocus. SyncProvider re-polls on visibility change. |
| 7.4 | State across refresh | **WORKING** | Timer state stored in KV (server-authoritative). Settings stored in KV. Refresh re-fetches from server. |

### Category 8: Multi-Tab & Multi-Device

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 8.1 | BroadcastChannel | **WORKING** | Channel 'becoming-sync'. Timer updates broadcast to other tabs. Dedup via lastUpdatedRef. |
| 8.2 | Pusher | **WORKING** | Infrastructure built. Falls back to 2s polling when not configured. |
| 8.3 | Sync conflicts | **WORKING** | Server-authoritative. Heartbeat + controlling device pattern. 60s expiry for stale controllers. |

### Category 9: Visual & Theme

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 9.1 | Theme switching | **WORKING** | DisplaySync adds class to html. globals.css has comprehensive .light overrides with !important. |
| 9.2 | Responsive | **WORKING** | Sidebar hidden on <lg. Timer centered. All pages use max-w containers. |

### Category 10: Legal Pages

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 10.1 | /terms | **WORKING** | Page exists, 17 sections, accessible without auth. |
| 10.2 | /privacy | **WORKING** | Page exists, 16 sections, accessible without auth. |
| 10.3 | Login terms link | **WORKING** | `<a href="/terms" target="_blank">` — verified in HTML output. |
| 10.4 | Login privacy link | **WORKING** | `<a href="/privacy" target="_blank">` — verified in HTML output. |

### Category 11: Error Handling

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 11.1 | Global error boundary | **WORKING** | error.tsx exists with retry button. |
| 11.2 | API error responses | **WORKING** | All routes return proper status codes. Admin has try-catch. Timer has typed error handling. |
| 11.3 | KV failure | **PARTIAL** | kvClient has 3x retry with exponential backoff. But no global fallback if KV is down for extended period. |

### Category 12: Memory & Performance

| # | Feature | Status | Details |
|---|---------|--------|---------|
| 12.1-4 | Cleanup (intervals, timeouts, listeners, effects) | **WORKING** | All setInterval/setTimeout/addEventListener have cleanup. Verified in prior trace. |
| 12.5 | AudioContext | **WORKING** | Singleton pattern. ensureContext() prevents duplicates. 2 contexts total (tick + audio engine). |

---

## SUMMARY

| Status | Count |
|--------|-------|
| **WORKING** | 52 |
| **FIXED in this audit** | 1 (completion stuck timer) |
| **DEAD SETTINGS** | 6 (features not yet built) |
| **PARTIAL** | 1 (KV extended outage) |
| **BROKEN** | 0 |

## DEAD SETTINGS (Features Not Yet Built)

These settings have UI toggles that persist correctly to KV, but no consumer reads them yet. They are roadmap features, not bugs:

1. **respectSilentMode** — Would detect iOS/Android silent mode via AudioContext state
2. **autoLogSessions** — Would gate whether sessions are auto-logged on completion
3. **sessionNotes** — Would show a notes prompt after session completion
4. **intentAutocomplete** — Would show autocomplete suggestions in intent input
5. **dailySummary** — Would show/send a daily summary notification
6. **emailNotifications** — Would send email notifications (requires email service integration)
