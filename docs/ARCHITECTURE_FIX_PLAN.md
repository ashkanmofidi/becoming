# Architecture Fix Plan

**Date:** 2026-04-07

---

## Systemic Root Causes

### Root Cause 1: No Input Validation Layer
**Affected issues:** #1-9, #26, #72
**Pattern:** API routes destructure request bodies and pass them directly to services without validation. The `checkPayloadSize()` utility exists but is never called.
**Fix:** Create a shared `validateBody()` utility. Wire `checkPayloadSize()` into all POST/PUT/PATCH routes. Add Zod schemas or manual validation for each action.

### Root Cause 2: No Atomic Read-Modify-Write in KV
**Affected issues:** #15, #18, #19, #25
**Pattern:** All state mutations follow read → modify → write without Redis transactions or optimistic locking. Two concurrent requests can lose each other's data.
**Fix:** For timer state, use a version counter or `WATCH`/`MULTI` if Upstash supports it. For settings, the merge pattern helps but doesn't prevent concurrent overwrites. Accept this as an inherent limitation of KV for now — document it.

### Root Cause 3: Fire-and-Forget Error Handling
**Affected issues:** #12, #15, #24, #31, #38-40, #49
**Pattern:** Async operations catch errors silently or ignore promise rejections. Critical operations (session logging, completion, audit) have no retry mechanism.
**Fix:** Add retry with exponential backoff for critical operations (session create, timer complete). Surface error states in contexts.

### Root Cause 4: Missing Accessibility Primitives
**Affected issues:** #45-48, #52, #57-58
**Pattern:** Modals lack focus traps, progress bars lack ARIA roles, dropdowns lack keyboard handlers. No shared accessible component primitives.
**Fix:** Add `aria-modal="true"` and focus trap to all dialogs. Add ARIA attributes to progress indicators. Add Escape key handler to dropdowns.

### Root Cause 5: Circular/Stale Dependencies in Hooks
**Affected issues:** #31, #33-37
**Pattern:** useEffect dependency arrays are either incomplete (stale closures) or contain their own output (circular). Refs used as guards without proper reset logic.
**Fix:** Audit each hook's dependency array. Extract stable references with useRef where needed. Add proper cleanup and guard resets.

---

## Fix Strategy

**Approach:** Fix in 8 batches, smallest blast radius first. Each batch is a single commit. Run type-check + lint after each batch.

| Batch | Focus | Issues | Risk |
|-------|-------|--------|------|
| 1 | Critical safety (completion, cycle) | #15,16,31,36 | HIGH — touches core timer flow |
| 2 | Input validation (API routes) | #1-9,26 | LOW — additive, no behavior change |
| 3 | Core flow bugs | #17,33,34 | MED — sync behavior changes |
| 4 | Hook stability | #32,35,37,38-44 | MED — React lifecycle changes |
| 5 | Accessibility | #45-48,52,58 | LOW — additive ARIA attrs |
| 6 | Error handling | #24,49,50 | LOW — additive error states |
| 7 | Shared package | #65,66,69,81 | LOW — tests only |
| 8 | Security hardening | #74,75 | MED — auth flow changes |
