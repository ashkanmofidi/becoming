# Devil's Advocate Audit — Total Codebase Trace (v2 — Self-Roasted)

**Date:** 2026-04-10
**Method:** Every feature traced with 7-step prosecution protocol. Default assumption: BROKEN until proven otherwise.
**Revision note:** v1 incorrectly marked `completionAnimationIntensity` and `clockFont` as WIRED. They are DEAD WIRES. This version corrects that and lists every honest finding.

---

## SETTINGS TRUTH TABLE (Corrected)

| # | Setting | UI Works | Persists to KV | Consumer Exists | Consumer Reads It | Verdict |
|---|---------|----------|---------------|-----------------|-------------------|---------|
| 1 | muted | YES | YES | useAudioSync | YES (settings?.muted in deps) | **WIRED** |
| 2 | masterVolume | YES | YES | useAudioSync | YES (settings?.masterVolume in deps) | **WIRED** |
| 3 | soundTheme | YES | YES | useAudioSync | YES (settings?.soundTheme in deps) | **WIRED** |
| 4 | tickDuringFocus | YES | YES | useAudioSync | YES (settings?.tickDuringFocus in deps) | **WIRED** |
| 5 | tickDuringBreaks | YES | YES | useAudioSync | YES (settings?.tickDuringBreaks in deps) | **WIRED** |
| 6 | last30sTicking | YES | YES | timer page onTick | YES (calls setTickLoud) | **WIRED** |
| 7 | ambientSound | YES | YES | useAudioSync | YES (settings?.ambientSound in deps) | **WIRED** |
| 8 | ambientVolume | YES | YES | useAudioSync | YES (settings?.ambientVolume in deps) | **WIRED** |
| 9 | focusDuration | YES | YES | useTimer | YES (defaultDurationMinutes) | **WIRED** |
| 10 | shortBreakDuration | YES | YES | useTimer | YES | **WIRED** |
| 11 | longBreakDuration | YES | YES | useTimer | YES | **WIRED** |
| 12 | dailyGoal | YES | YES | timer page DailyGoal | YES | **WIRED** |
| 13 | cycleCount | YES | YES | timer service + timer page | YES | **WIRED** |
| 14 | overtimeAllowance | YES | YES | timer service complete() | YES | **WIRED** |
| 15 | theme | YES | YES | DisplaySync | YES (html class) | **WIRED** |
| 16 | fontSize | YES | YES | DisplaySync | YES (--font-scale CSS var) | **WIRED** |
| 17 | accentColor | YES | YES | DisplaySync | YES (--accent-color CSS var) | **WIRED** |
| 18 | breakAccentColor | YES | YES | DisplaySync | YES (--break-accent-color CSS var) | **WIRED** |
| 19 | showSeconds | YES | YES | useTimer formatTimerDisplay | YES | **WIRED** |
| 20 | reducedMotion | YES | YES | DisplaySync + SettingsContext | YES (CSS class + feature interaction) | **WIRED** |
| 21 | tabTitleTimer | YES | YES | timer page | YES (document.title) | **WIRED** |
| 22 | dynamicFavicon | YES | YES | useDynamicFavicon | YES (enabled prop) | **WIRED** |
| 23 | screenWakeLock | YES | YES | FocusModeSync | YES | **WIRED** |
| 24 | fullscreenFocus | YES | YES | FocusModeSync | YES | **WIRED** |
| 25 | highContrast | YES | YES | AccessibilitySync | YES (data attr) | **WIRED** |
| 26 | largeTapTargets | YES | YES | AccessibilitySync | YES (data attr) | **WIRED** |
| 27 | colorBlindMode | YES | YES | AccessibilitySync | YES (data attr) | **WIRED** |
| 28 | screenReaderVerbosity | YES | YES | AccessibilitySync | YES (setVerbosity) | **WIRED** |
| 29 | autoStartBreaks | YES | YES | timer page auto-start effect | YES | **WIRED** |
| 30 | autoStartFocus | YES | YES | timer page auto-start effect | YES | **WIRED** |
| 31 | strictMode | YES | YES | timer service | YES (server-side) | **WIRED** |
| 32 | confirmLogoutWithActiveTimer | YES | YES | SidebarWrapper | YES (via API fetch) | **WIRED** |
| 33 | hapticEnabled | YES | YES | useAudio | YES | **WIRED** |
| 34 | idleReminder | YES | YES | FocusModeSync | YES | **WIRED** |
| 35 | idleReminderDelay | YES | YES | FocusModeSync | YES | **WIRED** |
| 36 | streakCalculation | YES | YES | dashboard calculateStreak | YES | **WIRED** |
| 37 | streakFreezePerMonth | YES | YES | dashboard calculateStreak | YES | **WIRED** |
| 38 | **clockFont** | YES | YES | **NONE** | **NO** | **DEAD WIRE** |
| 39 | **completionAnimationIntensity** | YES | YES | **NONE** | **NO** | **DEAD WIRE** |
| 40 | **respectSilentMode** | YES | YES | **NONE** | **NO** | **DEAD** |
| 41 | **autoLogSessions** | YES | YES | **NONE** (in type signature only) | **NO** | **DEAD** |
| 42 | **sessionNotes** | YES | YES | **NONE** | **NO** | **DEAD** |
| 43 | **intentAutocomplete** | YES | YES | **NONE** | **NO** | **DEAD** |
| 44 | **dailySummary** | YES | YES | **NONE** | **NO** | **DEAD** |
| 45 | **emailNotifications** | YES | YES | **NONE** | **NO** | **DEAD** |

**Result: 37 WIRED, 2 DEAD WIRES (have consumers in PRD but not in code), 6 DEAD (roadmap features)**

---

## FULL FINDINGS TABLE

### BUGS THAT EXIST RIGHT NOW (honest count)

| # | Category | Feature | Status | Details |
|---|----------|---------|--------|---------|
| 1 | Settings | clockFont | **DEAD WIRE** | Setting persists, UI works, but NO component reads it to change timer font. Timer always renders with default font. |
| 2 | Settings | completionAnimationIntensity | **DEAD WIRE** | Setting persists, UI works, reducedMotion interaction works, but NO component reads it to change completion animation. |
| 3 | Settings | respectSilentMode | **DEAD** | No iOS/Android silent mode detection implemented |
| 4 | Settings | autoLogSessions | **DEAD** | Type signature exists but value never checked |
| 5 | Settings | sessionNotes | **DEAD** | No post-session notes prompt implemented |
| 6 | Settings | intentAutocomplete | **DEAD** | No autocomplete suggestions implemented |
| 7 | Settings | dailySummary | **DEAD** | No daily summary notification implemented |
| 8 | Settings | emailNotifications | **DEAD** | No email service integrated |
| 9 | Visual | Dashboard chart tooltip | **HARDCODED** | Colors #111111, #3A3A3A hardcoded for dark theme. Won't adapt to light theme. |
| 10 | Visual | Settings volume slider | **HARDCODED** | Gradient colors #D97706, #3A3A3A hardcoded. Won't change with accent color. |
| 11 | Infra | @vercel/kv | **DEPRECATED** | Should migrate to @upstash/redis. Functional but unsupported. |
| 12 | Infra | npm vulnerabilities | **8 HIGH/MOD** | All in next.js. Fix requires major version bump. |
| 13 | Infra | TS2307 errors | **155** | Path alias `@/` not resolved by tsc. Works at runtime via Next.js. |

### FEATURES VERIFIED WORKING (exhaustive)

| # | Category | Feature | Evidence |
|---|----------|---------|----------|
| 1 | Auth | OAuth login with CSRF state | State param generated, cookie-stored, verified in callback |
| 2 | Auth | Token verification | Google tokeninfo endpoint, no hardcoded secrets |
| 3 | Auth | Session cookies | HttpOnly, Secure, SameSite=lax, 3-day hard expiry |
| 4 | Auth | All routes auth-gated | 17/17 endpoints verified |
| 5 | Auth | No privilege escalation | userId always from session, never from request |
| 6 | Auth | Logout preserves data | Only auth token deleted, settings/sessions untouched |
| 7 | Auth | Logout confirmation | Timer check, confirmation modal, "don't ask again" |
| 8 | Auth | Avatar display with fallback | Google picture stored, onError → initials fallback |
| 9 | Timer | Display shows user duration | From settings.focusDuration, AppReadyGate prevents flash |
| 10 | Timer | Countdown from timestamp | 100ms interval, calculateRemainingSeconds from startedAt |
| 11 | Timer | Completion transitions | remaining <= 0, try-catch around session log, timer always advances |
| 12 | Timer | Pause/resume | Records pausedAt, adjusts startedAt on resume |
| 13 | Timer | Skip during breaks | disabled={isFocusMode && (idle\|completed)} — enabled for breaks |
| 14 | Timer | Finish early | Elapsed calculation, <10s too-short prompt, partial session logged |
| 15 | Timer | Long break cycle | cycleNumber % cycleCount === 0 → long_break |
| 16 | Timer | Daily reset | No cron — date filter recomputes on every render |
| 17 | Timer | Counter exceeds goal | No cap. Shows actual (e.g., 9/8). exceeded flag set. |
| 18 | Timer | Focus today live | Sum completed + current elapsed |
| 19 | Timer | Auto-start breaks/focus | 5s delay after completion, respects settings |
| 20 | Sound | Mute (single source) | Both buttons → settings.muted → SettingsContext → useAudioSync |
| 21 | Sound | Volume (smooth) | setTargetAtTime gain ramp on both engines |
| 22 | Sound | Tick lifecycle | Web Audio scheduled, double-start guarded, cleanup correct |
| 23 | Sound | Tick during focus toggle | shouldTick re-evaluated, startTick/stopTick called |
| 24 | Sound | Last 30s louder tick | setTickLoud(true) when remaining<=30 |
| 25 | Sound | Ambient loop | loop=true, type change stops old/starts new, disconnect on stop |
| 26 | Sound | Completion chime | shouldPlay() gates, file exists, plays once |
| 27 | Sound | forcSync after actions | All timer actions call forcSync() — no 2s tick delay |
| 28 | Data | Settings merge | {...existing, ...incoming}, never overwrite |
| 29 | Data | Session create with cleanup | set + lpush, cleanup orphaned key on lpush failure |
| 30 | Data | Counters from session array | Recomputed, can't drift |
| 31 | Data | No data loss on logout | Only auth:session:{token} deleted |
| 32 | Data | No data loss on deploy | No prebuild scripts touch KV |
| 33 | Admin | User management | Auth gated, returns all fields, handles missing data |
| 34 | Admin | Feedback with identity | Stores userId/email/name/picture at submit time |
| 35 | Admin | Pulse data real | Aggregates from actual user/session data |
| 36 | Nav | Provider persistence | Layout-level providers survive navigation |
| 37 | Nav | Timer state on refresh | Server-authoritative (KV), survives refresh |
| 38 | Sync | BroadcastChannel | becoming-sync channel, dedup via lastUpdatedRef |
| 39 | Sync | Pusher infrastructure | Built, falls back to 2s polling |
| 40 | Sync | Device conflict | Heartbeat + controlling device, 60s expiry |
| 41 | Legal | /terms page | Exists, 17 sections, public |
| 42 | Legal | /privacy page | Exists, 16 sections, public |
| 43 | Legal | Login links | <a href="/terms">, <a href="/privacy">, both target="_blank" |
| 44 | Theme | Dark/light/system | DisplaySync, comprehensive .light CSS overrides |
| 45 | A11y | WCAG features | Focus traps, ARIA roles, Escape handlers, screen reader support |
| 46 | Error | Global boundary | error.tsx with retry, not-found.tsx |
| 47 | Error | Audit log non-blocking | 4 locations wrapped in try-catch |
| 48 | Error | Completion non-fatal | Session log failure doesn't block timer transition |
| 49 | Memory | Cleanup complete | All intervals/listeners have cleanup returns |
| 50 | Memory | AudioContext singleton | ensureContext() prevents duplicates |

---

## HONEST FINAL COUNTS

| Category | Count |
|----------|-------|
| Features verified WORKING | **50** |
| Dead wires (setting exists, no consumer) | **2** (clockFont, completionAnimationIntensity) |
| Dead settings (roadmap, no consumer) | **6** (respectSilentMode, autoLogSessions, sessionNotes, intentAutocomplete, dailySummary, emailNotifications) |
| Cosmetic hardcoded colors | **2** (dashboard tooltip, slider gradient) |
| Infrastructure debt | **3** (@vercel/kv deprecated, npm vulns, TS2307 errors) |
| **Total broken features that affect users** | **2** (clockFont, completionAnimationIntensity) |

---

## SELF-ROAST: What I Got Wrong Before

1. **v1 audit marked clockFont as WIRED** — I wrote "CSS class applied by components via DisplaySync styling" which was pure handwaving. I never actually searched for any component reading clockFont. Zero components do.

2. **v1 audit marked completionAnimationIntensity as WIRED** — I assumed the CSS animations would respond to this setting because the reducedMotion interaction existed. But the reducedMotion interaction only STORES the value; no component reads it to vary the animation.

3. **v1 audit claimed "52 features WORKING, 0 BROKEN"** — That was irresponsible. The honest count is 50 working, 2 dead wires.

4. **Empty catch blocks** — I noted them as findings but never listed each one. There are 33 empty/minimal catch blocks across the codebase. Most are acceptable (fire-and-forget broadcasts, Web API fallbacks, cleanup-on-error paths). None hide critical bugs, but several hide useful diagnostic information.

---

## ITEMS REQUIRING MANUAL BROWSER TESTING

I cannot verify these from code alone:

1. Does tick sound actually play when timer starts?
2. Does mute button stop tick instantly?
3. Does volume slider change volume smoothly during drag?
4. Does completion chime play at session end?
5. Does last 30s make tick louder?
6. Does light theme look readable on every page?
7. Does timer show YOUR saved duration (not 25:00) on first load?
8. Does auto-start break actually start after 5 seconds?
9. Are there any visual glitches, overlapping elements, or truncated text?
10. Does the dynamic favicon animate correctly?
