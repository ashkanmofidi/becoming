# Becoming.. — TODO

**Last updated:** 2026-04-10
**Source:** Devil's Advocate Audit v2

---

## Priority Legend
- **P0** — Broken feature users can see. Fix before next demo.
- **P1** — Missing feature that has UI but no effect. Fix this sprint.
- **P2** — Technical debt. Schedule within 2 weeks.
- **P3** — Nice to have. Backlog.

---

## Stack-Ranked TODO List

### P0 — User-Visible Broken Features

- [ ] **1. Wire `clockFont` setting to TimerRing display**
  - Setting exists, UI toggle works, value persists — but TimerRing always renders default font
  - Read `settings.clockFont` in timer/page.tsx, pass to TimerRing as prop
  - Apply CSS class: `font-flip`, `font-digital`, `font-minimal`, `font-analog`
  - Create CSS for each font variant (flip clock animation, digital LCD style, minimal sans, analog serif)
  - Files: `timer/page.tsx`, `components/timer/TimerRing.tsx`, `globals.css`
  - Effort: Medium (CSS design work)

- [ ] **2. Wire `completionAnimationIntensity` to completion effect**
  - Setting exists, UI toggle works, reducedMotion interaction works — but animation is always the same
  - Read `settings.completionAnimationIntensity` in timer/page.tsx
  - `subtle`: brief glow, no particles
  - `standard`: glow + confetti burst (current default)
  - `celebration`: extended glow + more particles + screen flash
  - Files: `timer/page.tsx`, `globals.css`
  - Effort: Medium (animation design work)

### P1 — Dead Settings (UI exists, feature not built)

- [ ] **3. Implement `autoLogSessions` gate**
  - When OFF: show a "Log this session?" prompt after completion instead of auto-logging
  - Currently: sessions always auto-log regardless of this setting
  - Files: `timer/page.tsx` (onComplete callback), new `SessionPromptModal` component
  - Effort: Small

- [ ] **4. Implement `sessionNotes` prompt**
  - When ON: show a text area after session completion to add notes
  - Store notes in session record (field already exists in SessionRecord type)
  - Files: `timer/page.tsx`, new `SessionNotesModal` component
  - Effort: Small

- [ ] **5. Implement `intentAutocomplete`**
  - When ON: show autocomplete suggestions in IntentInput based on previous intents
  - Read from `intent_history:{userId}` KV key (key generator already exists)
  - Files: `components/timer/IntentInput.tsx`, new API endpoint or client-side filtering
  - Effort: Medium

- [ ] **6. Implement `respectSilentMode`**
  - Detect iOS/Android silent mode via AudioContext state or user agent heuristics
  - When detected: suppress all sounds regardless of mute setting
  - Files: `hooks/useAudioSync.ts`, `lib/sound-themes/audio-engine.ts`
  - Effort: Medium (platform-specific detection is tricky)

### P2 — Technical Debt

- [ ] **7. Migrate `@vercel/kv` to `@upstash/redis`**
  - @vercel/kv is deprecated, no longer maintained
  - Replace `import { kv } from '@vercel/kv'` with `import { Redis } from '@upstash/redis'`
  - API is similar but not identical — need to update `kv.client.ts`
  - Files: `repositories/kv.client.ts`, `package.json`
  - Effort: Medium (API differences, testing)

- [ ] **8. Fix dashboard chart tooltip for light theme**
  - Recharts tooltip uses hardcoded `#111111` background and `#3A3A3A` border
  - Read current theme from context or CSS variable, pass dynamic colors to tooltip
  - Files: `app/(app)/dashboard/page.tsx`
  - Effort: Small

- [ ] **9. Fix settings slider gradient for accent color**
  - Slider uses hardcoded `#D97706` in gradient
  - Read `--accent-color` CSS variable and apply dynamically
  - Files: `components/settings/primitives/Slider.tsx`
  - Effort: Small

- [ ] **10. Upgrade Next.js to fix npm vulnerabilities**
  - 8 vulnerabilities (4 moderate, 4 high) all in next.js
  - Requires next@16 which is a breaking change
  - Test thoroughly: App Router API changes, middleware changes, image optimization
  - Files: `package.json`, potentially all route files
  - Effort: Large (breaking changes)

- [ ] **11. Resolve TS2307 path alias errors**
  - 155 TypeScript errors from `@/` path alias not resolving in strict `tsc --noEmit`
  - Works at runtime (Next.js handles it) but fails in CI type checking
  - Fix: add `paths` to root `tsconfig.json` or configure project references
  - Files: `tsconfig.json`
  - Effort: Small

- [ ] **12. Add error state to DataProvider**
  - Background refresh (30s interval) swallows errors silently
  - Add `refreshError` state, expose via context, show toast if repeated failures
  - Files: `contexts/DataProvider.tsx`
  - Effort: Small

### P3 — Roadmap Features (No existing UI or infrastructure)

- [ ] **13. Implement `dailySummary` notification**
  - Show a summary modal at `dailySummaryTime` (setting exists)
  - Content: sessions completed, focus time, goal progress, streak status
  - Requires: notification permission + scheduled check or service worker
  - Files: New `components/notifications/DailySummary.tsx`, `FocusModeSync.tsx`
  - Effort: Medium

- [ ] **14. Implement `emailNotifications` system**
  - Send email for: weekly summary, streak at risk, milestones
  - Settings exist: `emailWeeklySummary`, `emailStreakAtRisk`, `emailMilestones`
  - Requires: email service (Resend, SendGrid, etc.), cron job or Vercel edge function
  - Files: New `services/email.service.ts`, new API routes, Vercel cron config
  - Effort: Large

- [ ] **15. Activate Pusher real-time sync**
  - Infrastructure fully built, just needs credentials
  - User creates Pusher account, sets env vars, redeploys
  - See `/docs/PUSHER_SETUP.md` for instructions
  - Files: No code changes needed — just env vars
  - Effort: Tiny (config only)

- [ ] **16. Add E2E tests (Playwright)**
  - Test files exist as stubs: `__tests__/e2e/*.spec.ts`
  - Priority flows: login, start session, complete session, settings persist
  - Files: `__tests__/e2e/`, `playwright.config.ts`
  - Effort: Medium

- [ ] **17. Add admin user index (replace KEYS scan)**
  - `adminService.getUsers()` uses `kvClient.keys('user:*')` which is O(N) and blocks Redis
  - Maintain a Redis SET `index:users` that tracks all user IDs
  - Update on user create/delete
  - Files: `services/admin.service.ts`, `repositories/user.repo.ts`
  - Effort: Small

- [ ] **18. Add audit log TTL**
  - Audit logs grow unbounded in KV (no expiry)
  - Add 90-day TTL on audit entries, or implement log rotation
  - Files: `repositories/audit.repo.ts`
  - Effort: Small

---

## Completed (This Audit Session)

- [x] Timer completion no longer leaves timer stuck if session write fails
- [x] forcSync() after all timer actions (no 2s tick delay)
- [x] Last 30s ticking wired (setTickLoud in tick-engine)
- [x] Auto-start breaks/focus wired (5s countdown after completion)
- [x] useAudioSync subscribes to SyncProvider (no redundant polling)
- [x] Cross-device settings + session sync via Pusher event handlers
- [x] OAuth CSRF state parameter
- [x] Error details removed from auth callback URL
- [x] Session create cleanup on lpush failure
- [x] Audit log calls non-blocking (4 locations)
- [x] Bulk ops return succeeded + failed IDs
- [x] All API routes input-validated
- [x] Payload size limits on timer + settings routes
- [x] Dashboard route try-catch
- [x] TOS strict boolean check
- [x] Feedback severity + stepsToReproduce validated
- [x] SettingsContext: saveError state, AbortController, debounce cleanup
- [x] Session log error state with retry
- [x] ARIA: focus traps, progressbar, aria-modal, aria-labelledby, Escape handlers
- [x] Native confirm()/prompt() replaced with accessible modals
- [x] Settings page: removed explicit `any` type
- [x] Fixed 5 pre-existing TS errors (TS7053, TS2451)
- [x] Dead code removed (OnboardingOverlay, AriaLive, SOUND_FREQUENCIES)
- [x] Sidebar version from env var
- [x] Admin pulse data returns real metrics
- [x] 14 streak tests added
- [x] 2 integration tests fixed
- [x] Smoke test script (14 checks)
- [x] KV backup scripts
- [x] 7 audit documents created
