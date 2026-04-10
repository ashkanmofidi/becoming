# Full Application Audit — Findings

**Date:** 2026-04-07
**Auditor:** Claude (Opus 4.6)
**Scope:** Every file in the Becoming.. Enterprise Focus Timer codebase

---

## Executive Summary

**Total issues found: 80+**

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 8 | Data loss, security holes, broken core flows |
| HIGH | 22 | Broken features, accessibility violations, race conditions |
| MEDIUM | 28 | Silent failures, missing validation, UX gaps |
| LOW | 22+ | Hardcoded values, performance, code quality |

---

## PHASE 1: API ROUTES

### CRITICAL

1. **Payload size limit unused** — `middleware.ts:110-116`
   - `checkPayloadSize()` utility exists but NO route calls it. POST/PUT endpoints accept unlimited payloads.

2. **Timer action parameters unvalidated** — `api/timer/route.ts:30-31`
   - `action`, `deviceId`, `mode`, `intent`, `category`, `newMode` destructured from body without type validation. Any string passes through.

3. **Admin POST actions unvalidated** — `api/admin/route.ts:55-73`
   - `targetUserId`, `newRole`, `feedbackId`, `status` not validated before use in switch statement.

### HIGH

4. **Sessions query params unvalidated** — `api/sessions/route.ts:19-28`
   - `type` cast to `TimerMode | 'all'` without check. `dateFrom`/`dateTo` not validated as ISO dates. `limit` unbounded — client can request `limit=999999`.

5. **Settings PUT accepts arbitrary fields** — `api/settings/route.ts:32`
   - `body.settings as UserSettings` — direct cast. Only `focusDuration` bounds-checked (lines 39-46). All other fields pass through unvalidated.

6. **PATCH /sessions fields unvalidated** — `api/sessions/route.ts:73-74`
   - `sessionId`, `intent`, `category`, `notes` used without type/format validation.

7. **TOS accepted not type-checked** — `api/auth/tos/route.ts:35`
   - Uses `if (!body.accepted)` — accepts any truthy value, not just boolean.

8. **Error details in auth callback URL** — `api/auth/callback/route.ts:66`
   - Error messages encoded in redirect URL, visible in browser history and referrer logs.

9. **Admin POST missing try-catch** — `api/admin/route.ts:55+`
   - GET has try-catch (lines 36-45) but POST handler has none. Errors propagate as 500.

### MEDIUM

10. **Rate limiter off-by-one** — `middleware.ts:95-96`
    - Count incremented after check, so `limitPerMinute + 1` requests actually allowed.

11. **IP extraction spoofable** — `middleware.ts:85`
    - Uses `x-forwarded-for` without validation. Affects rate limiting and audit logs.

12. **Broadcast failures silently ignored** — `api/timer/route.ts:34-37`
    - Fire-and-forget pattern means devices can silently go out of sync.

13. **Dashboard service errors unhandled** — `api/dashboard/route.ts`
    - No try-catch around `dashboardService.getDashboardData()`.

14. **Feedback optional fields unvalidated** — `api/feedback/route.ts:53-63`
    - `stepsToReproduce`, `severity`, `page`, `viewport`, `timezone`, `sessionState` stored without sanitization.

---

## PHASE 2: SERVICES & REPOSITORIES

### CRITICAL

15. **Timer completion never retried on failure** — `timer.service.ts:433-436`
    - If `sessionRepo.create()` fails, timer state already updated to completed but session data is lost. No retry, no rollback.

16. **Cycle counter logic bug** — `timer.service.ts:186-191`
    - Cycle counter incremented AFTER mode set to 'idle'. The `nextMode === 'long_break'` check will never fire because state already changed. Long breaks may not trigger at correct intervals.

17. **Admin pulse data returns hardcoded zeros** — `admin.service.ts:21-31`
    - `activeNow`, `todaySessions`, `todayFocusHours`, `todayActiveUsers` all return `0`. Admin dashboard shows fake metrics.

### HIGH

18. **Settings save race condition** — `settings.repo.ts:28-40`
    - Read-modify-write without locks. Two simultaneous clients can lose each other's changes.

19. **Timer takeOver race condition** — `timer.service.ts:385-397`
    - Reads state, modifies `controllingDeviceId`, writes back. Another device could update between read and write.

20. **Session ID collision risk** — `timer.service.ts:417,453,490`
    - IDs use `Date.now()` + 6 random chars. Same-millisecond collisions possible (~1 in 2^24). No duplicate check.

21. **Admin user scan uses O(N) KEYS** — `admin.service.ts:37-49`
    - `kvClient.keys('user:*')` blocks Redis. Won't scale past ~1000 users.

22. **Unsafe type casting in settings enforcement** — `settings.service.ts:42`
    - `(current as unknown as Record<string, unknown>)[key] = value` bypasses all TypeScript safety.

23. **Strict mode bypass via mode switching** — `timer.service.ts:109-113`
    - Pause blocked during focus in strict mode, but user can switch mode then pause, circumventing strict mode.

24. **Silent audit log failures** — `auth.service.ts:149-156, 269-276`
    - `auditRepo.log()` awaited but errors not caught. Critical security events could go unlogged.

25. **Bulk operations partial failure** — `session.service.ts:150-157, 162-169`
    - If one delete/update fails in loop, remaining continue. No indication of which records failed.

26. **Session notes/intent XSS risk** — `session.service.ts:121-138`
    - Intent and notes stored without sanitization. If rendered in admin dashboard, XSS possible.

### MEDIUM

27. **Audit logs infinite retention** — `audit.repo.ts:9-20`
    - No TTL on audit keys. Redis grows unbounded.

28. **Rate limiter map unbounded** — `lib/rate-limiter.ts:9-18`
    - No max size. Under attack, memory grows unbounded.

29. **Audio buffer cache no size limit** — `lib/sound-themes/audio-engine.ts:22`
    - Comment says "< 10 files" but no enforcement.

30. **Skip vs Reset inconsistency** — `timer.service.ts:280 vs 315`
    - Reset logs abandoned session, Skip logs nothing. Skipped sessions invisible in audit trail.

---

## PHASE 3: CONTEXTS & HOOKS

### CRITICAL

31. **useTimer: No retry on completion API failure** — `useTimer.ts:98-101`
    - If `apiCall('complete', {})` fails, `completingRef.current` stays true. Session stuck — never completes, no retry.

32. **SyncProvider: Pusher bindings never unbound** — `SyncProvider.tsx:132-135`
    - Connection event bindings stack on re-mount. Memory leak.

### HIGH

33. **SyncProvider: Poll interval doesn't adapt** — `SyncProvider.tsx:194`
    - `pusherReady.current` checked at interval creation time only. If Pusher disconnects, stays at 10s instead of falling back to 2s.

34. **useBroadcast: Channel recreated on every render** — `useBroadcast.ts:36`
    - `onMessage` callback in dependency array likely changes every render. Channel destroyed and recreated constantly.

35. **useAudioSync: Circular dependency** — `useAudioSync.ts:120-130`
    - `syncAudio` in its own useEffect dependency array. Risk of excessive re-renders.

36. **useTimer: completingRef not reset on pause/resume** — `useTimer.ts:88`
    - Only reset when entering 'running'. If paused near zero and resumed, could skip completion.

37. **SyncProvider: Timestamp dedup fragile** — `SyncProvider.tsx:76-88`
    - Out-of-order async updates could apply stale state.

### MEDIUM

38. **SettingsContext: Debounce timeout not cleaned on unmount** — `SettingsContext.tsx:34,49-56`
    - Pending save fires after component unmounts.

39. **SettingsContext: No error state exposed** — `SettingsContext.tsx:14-18`
    - Consumers can't know if settings save failed.

40. **DataProvider: Silent error swallowing** — `DataProvider.tsx:71,81`
    - `catch { /* silent */ }` with no error state.

41. **useAudio: ensureInitialized not awaited** — `useAudio.ts:71`
    - Race condition: ambient might play before audio context resumed.

42. **useWakeLock: release() not awaited** — `useWakeLock.ts:40,56`
    - Async release called without await. Wake lock might not actually release.

43. **useWakeLock: Fallback audio memory leak** — `useWakeLock.ts:26-31`
    - Audio element created on mount, only paused (not cleaned) on unmount.

44. **useDynamicFavicon: requestAnimationFrame leak** — `useDynamicFavicon.ts:102`
    - Recursive render loop. Only last frame canceled on cleanup.

---

## PHASE 4: PAGES & COMPONENTS

### HIGH

45. **ConfirmModal: No focus trap** — `ConfirmModal.tsx:33`
    - `role="dialog"` but no `aria-modal="true"`. Keyboard users can tab outside modal.

46. **Settings: Native confirm()/prompt() dialogs** — `settings/page.tsx:252,269`
    - "Reset to Factory" and "Clear All Data" use native browser dialogs. Not accessible, breaks design system.

47. **DailyGoal: Missing progressbar role** — `DailyGoal.tsx:18`
    - Progress bar div has no `role="progressbar"`, `aria-valuenow`, or `aria-valuemax`.

48. **Logout modal: Missing aria-labelledby** — `Sidebar.tsx:170`
    - Dialog role present but no connection to title element.

### MEDIUM

49. **Session log: Silent fetch failure** — `session-log/page.tsx:32`
    - Error caught silently. User sees empty state, can't distinguish "no data" from "error".

50. **Dashboard: loading hardcoded false** — `dashboard/page.tsx:233`
    - If AppReadyGate fails, no loading skeleton shown.

51. **Dashboard: @ts-ignore usage** — `dashboard/page.tsx:279`
    - Type safety bypassed with `@ts-ignore` and `any` casts.

52. **CategorySelector: No Escape key handler** — `CategorySelector.tsx:22-30`
    - Click-outside works but keyboard users can't dismiss with Escape.

53. **FeedbackModal: Double-close race** — `header/FeedbackModal.tsx:42`
    - `setTimeout(onClose, 4000)` can fire after manual close.

54. **TOS: handleDecline doesn't await logout** — `tos/page.tsx:42-45`
    - Redirects before logout completes. Session may persist server-side.

55. **Timer page: Stale closure in confirm modal** — `timer/page.tsx:36-48`
    - Modal callbacks may reference stale state during navigation.

56. **IntentInput: Silent truncation** — `IntentInput.tsx:40-50`
    - Characters beyond maxLength vanish without visible feedback.

57. **Chart tooltip: No aria-label** — `dashboard/page.tsx:179`
    - Charts not described for screen readers.

58. **Export dropdown: Missing aria-haspopup** — `feedback/page.tsx:242-246`
    - Screen readers don't know dropdown exists.

### LOW

59. **Google Client ID hardcoded** — `login/page.tsx:5`
    - Should use env var (though it's a public client ID, so security risk is minimal).

60. **Version string hardcoded** — `Sidebar.tsx:96`
    - "V3.1 ENTERPRISE BETA" should come from package.json.

61. **TOS effective date hardcoded** — `tos/page.tsx:63`
    - "April 8, 2026" will become stale.

62. **Dashboard: focusRange not persisted** — `dashboard/page.tsx:232`
    - 7d/30d selection resets on navigation.

63. **AdminUser type duplicated** — `users/page.tsx:5-15`
    - Local interface duplicates what should be in shared types.

64. **Sidebar streak: 365-day walk on every render** — `Sidebar.tsx:233-275`
    - Already memoized with useMemo, but memo key is `[sessions]` which is a reference that changes on every DataProvider update.

---

## PHASE 5: SHARED PACKAGE

### HIGH

65. **No test file for streak.ts** — `packages/shared/src/utils/streak.ts`
    - Complex logic with multiple modes, freeze logic, and edge cases. Zero test coverage.

66. **getCurrentDay/getDayBoundaries untested** — `packages/shared/src/utils/time.ts:10-24`
    - Day reset time and timezone logic untested. DST transitions untested.

67. **Cycle nextMode detection ambiguous** — `packages/shared/src/utils/cycle.ts:56-63`
    - `focusInCycle` calculation confusing. Boundary conditions for long_break trigger may be wrong.

68. **Streak longestEnd calculation fragile** — `packages/shared/src/utils/streak.ts:89`
    - `dates.indexOf(day) - runLength` may produce invalid array index. O(n) lookup inside loop.

### MEDIUM

69. **Goal test invalid parameters** — `packages/shared/src/utils/goal.test.ts:137+`
    - `getWeeklyGoalStatus()` called with 5 args but function takes 4. Tests pass but are misleading.

70. **dayResetTimezone missing from BEHAVIOR_DEFAULTS** — `packages/shared/src/constants/defaults.ts`
    - Required in UserSettings type but no default constant. Relies on runtime `Intl` API.

71. **Migration ignores schema version** — `packages/shared/src/utils/migration.ts:99`
    - Version number extracted but never used. No version-specific transformation logic.

72. **Email regex too permissive** — `packages/shared/src/utils/validation.ts:104`
    - Accepts `user@.com`, single-char TLDs.

73. **sanitizeString not re-exported** — `packages/shared/src/utils/index.ts`
    - Used internally and tested, but not available to consumers via public API.

---

## PHASE 6: SECURITY

### HIGH

74. **No CSRF protection** — All mutation endpoints
    - No CSRF/XSRF token validation on any state-changing endpoint. SameSite=lax helps but doesn't fully protect.

75. **No OAuth state parameter** — `login/page.tsx`, `api/auth/callback/route.ts`
    - OAuth flow has no `state` parameter. Vulnerable to CSRF on the OAuth redirect.

76. **Session tokens stored plain text in KV** — `auth.service.ts:202-206`
    - If KV compromised, all sessions compromised. No hashing.

77. **ID token verified via Google tokeninfo endpoint** — `auth.service.ts`
    - Should use JWKS for production-grade verification.

---

## PHASE 7: BUILD & DEPENDENCIES

### MEDIUM

78. **8 npm vulnerabilities** — 4 moderate, 4 high
    - Need `npm audit fix` and potential dependency updates.

79. **@vercel/kv deprecated** — Should migrate to `@upstash/redis`

### LOW

80. **ESLint warnings** — Unused variables
    - `CATEGORY_DEFAULTS`, `kvStats`, `setKvStats`, `failureHighAlert`, `DashboardData`, `UserSettings`, `forcSync`
    - `<img>` elements should use `next/image`

81. **TypeScript errors in test files** — `goal.test.ts`, `migration.test.ts`
    - Wrong argument counts, type cast issues.

---

## Priority Fix Order

### Batch 1: Critical Safety (Data Loss Prevention)
- #15 Timer completion retry logic
- #16 Cycle counter bug
- #31 useTimer completion guard retry
- #36 completingRef reset

### Batch 2: Security
- #1 Wire up payload size checks
- #2 Validate timer action params
- #3 Validate admin action params
- #74 Add CSRF protection or document risk
- #75 Add OAuth state parameter

### Batch 3: Core Flow Bugs
- #17 Admin pulse data (real metrics)
- #18 Settings save race condition
- #33 SyncProvider poll fallback
- #34 useBroadcast stability

### Batch 4: Input Validation
- #4 Sessions query param validation
- #5 Settings PUT validation
- #6 PATCH sessions validation
- #26 XSS sanitization

### Batch 5: Accessibility
- #45 Focus trap in modals
- #46 Replace native dialogs
- #47 Progressbar role
- #48 aria-labelledby on dialogs

### Batch 6: Memory Leaks & Performance
- #32 Pusher binding cleanup
- #35 useAudioSync circular dep
- #43 Wake lock audio cleanup
- #44 Favicon animation cleanup

### Batch 7: Error Handling
- #38-40 Context error states
- #49 Session log error display
- #24 Audit log error handling

### Batch 8: Tests & Docs
- #65 Streak tests
- #66 Time utility tests
- #69 Fix goal test params
- #81 Fix TS errors in tests
