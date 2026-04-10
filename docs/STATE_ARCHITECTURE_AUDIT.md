# State Architecture Audit

**Generated:** 2026-04-09
**Purpose:** Map every source of truth. Flag dual-source bugs.

---

## 1. TIMER STATE

### Where is it managed?

| Location | What it holds | How it gets there |
|----------|--------------|-------------------|
| **KV** `timer:{userId}` | Server-authoritative TimerState | Written by timerService on every action |
| **SyncProvider** `timerState` | Polled copy of KV state | Polled GET `/api/timer` every 2-10s |
| **useTimer** `state` | Local working copy | Initialized from GET `/api/timer`, then updated from API responses AND synced from SyncProvider |
| **useAudioSync** `timerStateRef` | Minimal copy `{status, mode}` | Polled GET `/api/timer` every 2s (INDEPENDENT poll) |

### Dual-Source Analysis

**FLAG: REDUNDANT POLLING**
- `SyncProvider` polls `/api/timer` every 2-10s
- `useAudioSync` polls `/api/timer` every 2s (independently)
- `useTimer` fetches `/api/timer` on mount (once)
- Result: 2 independent poll loops hitting the same endpoint. At minimum, **3 requests/2s** for timer state.
- **Root cause:** useAudioSync was designed before SyncProvider existed. It should subscribe to SyncProvider instead of polling directly.

**FLAG: STATE SYNC LAG**
- useTimer receives `syncedState` from SyncProvider and compares via JSON.stringify
- If useTimer makes a local action (e.g., pause), it updates `state` immediately from API response
- Meanwhile SyncProvider's poll may return stale state (pre-pause) on next tick
- This triggers a comparison that finds them "different" and overwrites local state with stale server state
- **Mitigation exists:** `lastUpdatedRef` in SyncProvider prevents backwards time travel, but the hash comparison in useTimer (line 72-74) doesn't check timestamps — it just compares shapes.

### Verdict
- **Server (KV)** is the true source of truth
- **SyncProvider** is the canonical client-side cache
- **useTimer** should be the only consumer of sync state for the timer page
- **useAudioSync** should stop polling and read from SyncProvider instead

---

## 2. SETTINGS STATE

### Where is it managed?

| Location | What it holds | How it gets there |
|----------|--------------|-------------------|
| **KV** `settings:{userId}` | Server-authoritative UserSettings | Written by settingsRepo.save() (MERGE pattern) |
| **SettingsContext** `settings` | Client-side working copy | Fetched once on mount, then optimistically updated on every `updateSettings()` call, debounce-saved to server |
| **useAudioSync** `settingsRef` | Ref mirror of SettingsContext | Updated on every render via `settingsRef.current = settings` |

### Dual-Source Analysis

**CLEAN: Single source of truth**
- SettingsContext is the sole client-side owner
- All pages read from `useSettings()` — no independent fetches
- Settings page calls `updateSettings()` which updates context state immediately, then saves in background
- Timer page reads from context — never fetches settings independently
- **No dual-source bug.**

**CONCERN: Cross-device settings sync**
- When Device B changes settings, Device A's SettingsContext is NOT updated
- SyncProvider receives `'settings-changed'` Pusher event but does NOTHING with it (line 121-123 in SyncProvider: `channel.bind('settings-changed', () => { // SettingsProvider handles settings sync })`)
- But SettingsProvider does NOT handle settings sync — it fetches once on mount and never again
- **Result:** If you change settings on your phone, your laptop won't see the change until page refresh.
- **Severity:** Medium — settings changes are infrequent and a refresh fixes it

---

## 3. AUDIO STATE

### Where is it managed?

| Location | What it holds | How it gets there |
|----------|--------------|-------------------|
| **tick-engine.ts** (singleton) | `isRunning`, `isMuted`, `volumeLevel`, AudioContext, buffers | Called by useAudioSync: `startTick()`, `stopTick()`, `setTickMuted()`, `setTickVolume()` |
| **audio-engine.ts** (singleton) | `muted`, `volume`, `theme`, `initialized`, `ambientSource`, `ambientType`, buffers | Called by useAudioSync + useAudio |
| **useAudioSync** (hook) | `ambientActiveRef`, `timerStateRef` | Polls timer, reads settings, controls both engines |
| **useAudio** (hook) | `initializedRef` | Returns playback callbacks (chimes, bells); does NOT control tick/ambient |

### Dual-Source Analysis

**CLEAN: Single controller**
- useAudioSync at layout level is the ONLY component that calls `startTick/stopTick/startAmbientSound/stopAmbientSound`
- useAudio is READ-ONLY — it provides one-shot sound callbacks (playActivationChime, playCompletionBell, etc.)
- The comment in useAudio confirms: "Mute/theme/volume sync handled by AudioSyncProvider at layout level"
- **No dual-source bug.**

**CONCERN: Redundant polling** (same as timer state above)
- useAudioSync polls `/api/timer` every 2s to know if timer is running
- SyncProvider also polls `/api/timer` every 2-10s
- useAudioSync should subscribe to SyncProvider context instead

---

## 4. SESSION DATA

### Where is it managed?

| Location | What it holds | How it gets there |
|----------|--------------|-------------------|
| **KV** `session:{userId}:{id}` + `sessions:{userId}` LIST | All session records | Written by sessionRepo.create() (called by timerService.finalizeSession) |
| **DataProvider** `sessions[]` | Cached array (limit 500) | Fetched on mount, refreshed every 30s, optimistic add on completion |
| **session-log/page.tsx** `sessions[]` | Page-local filtered copy | Fetched independently via GET `/api/sessions` |
| **Sidebar** `SidebarStats` | TODAY count + STREAK | Computed from DataProvider via `useMemo` |
| **timer/page.tsx** | `todayCompletedSessions`, `todayFocusSessions` | Computed from DataProvider sessions |

### Dual-Source Analysis

**FLAG: INDEPENDENT SESSION FETCH**
- DataProvider fetches `GET /api/sessions?type=all&limit=500`
- session-log/page.tsx fetches `GET /api/sessions` independently with its own filters
- These are different queries with potentially different results
- **This is acceptable** — session-log needs its own filters. But if a session is completed on the timer page, session-log won't see it until the user navigates away and back (or manually refreshes).

**FLAG: OPTIMISTIC SESSION ADD**
- Timer page calls `addOptimisticSession()` which inserts a session into DataProvider's array
- Sidebar reads from the same array, so TODAY count updates immediately
- But DataProvider also refreshes every 30s, which replaces the array
- If the server-side session create failed (rare but possible), the optimistic session would be corrected on next refresh
- **This is correct behavior.**

### Verdict
- **Server (KV)** is the source of truth
- **DataProvider** is the canonical client-side cache for counters/stats
- **session-log** has its own fetch (acceptable — different query)
- **No dual-source bug**, but redundant fetches exist

---

## 5. USER SESSION (AUTH)

### Where is it managed?

| Location | What it holds | How it gets there |
|----------|--------------|-------------------|
| **KV** `auth:session:{token}` | AuthSession (userId, email, role, expiry) | Created by authService.createSession, validated by authService.validateSession |
| **Cookie** `bm_sid` | Token string | Set in auth/callback, cleared in auth/logout |
| **SidebarWrapper** `user` state | `{name, email, picture, role}` | Fetched from GET `/api/auth/session` on mount |

### Dual-Source Analysis

**CLEAN: Cookie is just a key, KV is the source of truth**
- Cookie holds the token; KV holds the session data
- No component caches the session independently
- SidebarWrapper fetches once and uses it for display only
- **No dual-source bug.**

---

## 6. COMPLETE STATE MAP

```
SERVER (KV)                        CLIENT
═══════════                        ══════
timer:{userId}  ◄─── poll ───►    SyncProvider.timerState
                ◄─── poll ───►    useAudioSync.timerStateRef   ← REDUNDANT
                ◄── actions ──►   useTimer.state

settings:{userId} ◄── mount ──►  SettingsContext.settings
                                  useAudioSync.settingsRef (mirror)

sessions:{userId} ◄── mount ──►  DataProvider.sessions
                  ◄── mount ──►  session-log.sessions          ← SEPARATE QUERY (OK)

auth:session:{token} ◄─ mount ─► SidebarWrapper.user
                     (cookie)     (display only)
```

---

## 7. ROOT CAUSE BUGS (State Architecture)

### BUG 1: Redundant timer polling (MEDIUM)
- **What:** useAudioSync and SyncProvider both poll `/api/timer` independently
- **Impact:** ~3 requests per 2 seconds unnecessarily; potential state flicker
- **Root cause:** useAudioSync was built before SyncProvider; never migrated
- **Fix:** useAudioSync should read from SyncProvider context instead of polling

### BUG 2: Settings not synced across devices (MEDIUM)
- **What:** SettingsContext fetches once on mount, never refreshes
- **Impact:** Changing settings on Device A doesn't update Device B until refresh
- **Root cause:** SyncProvider receives 'settings-changed' Pusher event but doesn't forward it to SettingsContext
- **Fix:** Wire SyncProvider's settings-changed event to trigger SettingsContext refresh

### BUG 3: SyncProvider effects recreated every render (LOW-MEDIUM)
- **What:** `updateState` and `poll` callbacks recreate on every render, causing all useEffects to tear down and rebuild intervals/subscriptions
- **Impact:** Rapid setInterval/clearInterval churn; unnecessary Pusher re-subscribe attempts
- **Root cause:** useCallback dependency arrays include state that changes on every update
- **Fix:** Use refs for dedup state, make callbacks truly stable

### BUG 4: DataProvider refresh interval churn (LOW)
- **What:** Background refresh interval (30s) recreated every render because dependencies change
- **Impact:** Inefficiency, not data corruption
- **Root cause:** `refreshSessions` and `refreshDashboard` in useEffect deps but not memoized with stable deps
- **Fix:** Pass `[]` empty deps or move to stable refs

### BUG 5: useDynamicFavicon flash phase reset (LOW)
- **What:** Completion flash animation only shows for one frame
- **Impact:** Visual bug — animation doesn't play
- **Root cause:** `flashPhase` is a local variable inside useEffect, reset on every effect run
- **Fix:** Move flashPhase to a useRef
