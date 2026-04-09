Becoming..
ENTERPRISE FOCUS TIMER
Comprehensive Test Suite
Enterprise-Grade Quality Assurance Plan
285 Test Cases · 30 Test Suites · Triple Validation


Table of Contents

1. Testing Strategy & Automation Architecture
1.1 Testing Philosophy
Zero-defect tolerance. Every feature, edge case, and interaction documented in the PRD is tested at minimum 3 times: once in unit isolation, once in integration context, and once in full E2E flow. Dependent features are tested together after individual validation to catch interaction regressions. All tests run in CI/CD on every pull request (fast suite < 5 min) and nightly (full suite < 45 min). No code merges without 100% test pass.
1.2 Test Pyramid
Unit Tests (~400): Vitest. Pure logic: timer calculations, streak computation, goal tracking, role validation, input sanitization, date/timezone handling. Run in < 30 seconds.
Integration Tests (~150): Vitest + MSW (Mock Service Worker). API route handlers, Vercel KV operations, OAuth flow mocking, session management, multi-device state sync, data import/export. Run in < 3 minutes.
End-to-End Tests (~120): Playwright. Full browser automation across Chrome, Firefox, Safari. User journeys: signup to first session, full Pomodoro cycle, settings changes, admin workflows. Run in < 15 minutes (parallelized across 3 browsers).
Visual Regression Tests (~20): Playwright screenshots + Percy/Chromatic. Every page state (idle, running, paused, complete, break, error, empty) compared against baselines. Run in < 5 minutes.
Performance Tests: k6. Load testing (100/500/1000/5000/10000 concurrent users), stress testing (spike to 10000), soak testing (1000 users for 4 hours). Run nightly and before releases.
Security Tests: OWASP ZAP automated scan + custom scripts for auth bypass, XSS injection, CSRF, rate limiting validation. Run nightly.
Accessibility Tests: axe-core automated scan on every page + manual NVDA/VoiceOver verification for critical flows. Run on every PR.
1.3 Triple Validation Protocol
Pass 1 (Isolation): Each test case runs independently in a clean environment (fresh database, no prior state). Validates the feature works in isolation.
Pass 2 (Repeat): Same test runs again immediately after Pass 1 to catch timing-dependent or state-leaking bugs. If Pass 1 passes but Pass 2 fails, the test has a cleanup or state leak issue.
Pass 3 (Integration): After all isolation tests pass, the full suite runs in sequence (simulating real user behavior across features) to catch cross-feature regressions. Order: Auth > TOS > Timer > Settings > Dashboard > Session Log > Admin.
A test case is only marked GREEN when all 3 passes succeed. Any single failure = RED = blocks release.
1.4 Test Data Management
Each test run uses a dedicated Vercel KV namespace (test:{runId}:*) that is fully wiped after the run. No test data contaminates production or other test runs. Seed data factories generate consistent test users, sessions, categories, and settings for reproducibility. Time-dependent tests use a mockable clock (vi.useFakeTimers) to simulate midnight crossings, DST transitions, and timezone changes without waiting.
1.5 CI/CD Pipeline
On every Pull Request: lint + type check + unit tests + integration tests + accessibility scan + visual regression (< 5 min total). Block merge on failure.
On merge to main: full E2E suite across 3 browsers + security scan (< 20 min). Block deploy on failure.
Nightly: full E2E + performance load tests + soak test + OWASP scan + full visual regression. Alert on failure.
Pre-release: manual smoke test checklist (Section 22) executed by QA engineer on staging environment.

2. AUTH: Authentication & Login Tests
2.1 Happy Path




2.2 Beta Cap



2.3 Security & Edge Cases











3. TOS: Terms of Service Tests








4. TMR: Timer Core Functionality Tests
4.1 Idle State


4.2 Start & Countdown




4.3 Pause & Resume



4.4 Completion






4.5 Skip & Reset




4.6 Mode Switching



4.7 Edge Cases








4.8 Multi-Device Timer




5. TMR-VIS: Timer Visual & Audio Tests












6. GOAL: Daily Goal & Cycle Tests









7. INTENT: Session Intent & Category Tests











8. SET: Settings Tests















9. DASH: Dashboard Tests







10. LOG: Session Log Tests












11. ADM: Admin & Super Admin Tests












12. SEC: Security Tests










13. PERF: Performance & Load Tests








14. A11Y: Accessibility Tests






15. RESP: Responsive Design Tests





16. STATES: Loading & Empty State Tests






17. ERR: Error Page Tests




18. XBROWSER: Cross-Browser Tests





19. HDR: Header Button Tests







20. ONBOARD: First-Time User Experience Tests




21. INTEG: Cross-Feature Integration Tests
These tests validate that features work correctly together, catching regressions that isolated tests miss.








22. SMOKE: Pre-Release Smoke Test Checklist
This checklist is executed manually by a QA engineer on the staging environment before every production release. Every item must pass. Any failure blocks the release.
22.1 Critical Path (Must Pass)
[ ] Login via Google OAuth succeeds on Chrome, Firefox, Safari
[ ] First-time TOS acceptance gates access correctly
[ ] Timer starts, counts down, and completes a 1-min focus session (use custom duration)
[ ] Session appears in Session Log with correct duration, intent, and category
[ ] Daily goal counter increments
[ ] Dashboard shows correct stats (Today, All Time, Total Hours, Streak)
[ ] Settings changes save and persist after page refresh
[ ] Logout clears session and redirects to login
[ ] Admin dashboard loads for Super Admin with real-time data
[ ] Regular user cannot access /admin routes (403)
[ ] HTTPS enforced (HTTP redirects)
[ ] No console errors on any page
22.2 Secondary (Must Pass)
[ ] Timer survives page refresh mid-session
[ ] Break timer works (teal palette, no urgency)
[ ] Completion chime plays (Sound Theme: Warm)
[ ] Browser notification fires on completion (if tab backgrounded)
[ ] Session Log filters work (Type, Date, Category, Search)
[ ] Export CSV downloads valid file that opens in Excel
[ ] Feedback submission succeeds and appears in Admin feedback view
[ ] Keyboard shortcuts work (Space = play/pause, ? = shortcuts modal)
[ ] Mobile layout: hamburger menu, card-based Session Log, bottom sheets
[ ] Dark/Light/System theme switching works
[ ] axe-core scan: zero violations on Timer, Dashboard, Session Log, Settings
[ ] Privacy and Terms modal links work with version tracking
22.3 Sign-Off
QA Engineer: ___________________________ Date: _______________
Product Manager: ___________________________ Date: _______________
Engineering Lead: ___________________________ Date: _______________
Release approved: [ ] YES [ ] NO. If NO, list blocking issues below:
_______________________________________________________________
23. UI: Brand Identity, User Card & Sidebar Tests
23.1 Brand Identity Block



23.2 User Identity Card








23.3 Sidebar Navigation








24. TMR-ADD: Additional Timer Tests










25. SET-ADD: Additional Settings Tests














26. DASH-ADD: Additional Dashboard Tests







27. LOG-ADD: Additional Session Log Tests







28. ADM-ADD: Additional Admin Tests










29. MISC-ADD: Additional Header, Security, Accessibility & Performance Tests
29.1 Header Button Gaps





29.2 Security Gaps





29.3 Accessibility Gaps



29.4 Performance Gaps


29.5 Integration Gaps




30. SMOKE-ADD: Additional Smoke Test Items
Additions to the pre-release smoke checklist (Section 22):
[ ] First-time onboarding spotlight appears for new user
[ ] Multi-device: start timer on Chrome, verify visible on Firefox
[ ] Export JSON > Clear All Data > Import JSON: full restore verified
[ ] Brand identity shows correct version number from latest deploy
[ ] Avatar fallback works (test with user that has no Google avatar)
[ ] Category created in Settings appears in Timer dropdown
[ ] Strict Mode: only Abandon button visible during focus
[ ] Ambient sound plays during focus, stops during break
[ ] Skip-to-content link visible on first Tab press
[ ] Sequential shortcut G then T navigates to Timer


--- TABLE 1 ---
Document | Test Suite v1.0
Date | April 8, 2026
Author | Ashkan Mofidi
PRD Reference | Becoming.. PRD v2.0 Final
Total Test Cases | 285
Automation Framework | Playwright (E2E) + Vitest (Unit/Integration) + k6 (Load)
CI/CD | GitHub Actions (every PR + nightly full suite)
Triple Validation | Each test runs 3x in isolation + 1x integration pass


--- TABLE 2 ---
ID | AUTH-001 | Priority | P0
Title | Successful Google OAuth login | Automation | Playwright + Google OAuth test credentials
Preconditions | Clean browser, no existing session | Clean browser, no existing session | Clean browser, no existing session
Steps | 1. Navigate to becoming.ashmofidi.com. 2. Click Google sign-in chip. 3. Complete Google consent. 4. Observe redirect. | 1. Navigate to becoming.ashmofidi.com. 2. Click Google sign-in chip. 3. Complete Google consent. 4. Observe redirect. | 1. Navigate to becoming.ashmofidi.com. 2. Click Google sign-in chip. 3. Complete Google consent. 4. Observe redirect.
Expected Result | User redirected to TOS acceptance page (first-time) or Timer page (returning). Session cookie set (httpOnly, secure, sameSite=strict). KV session record created with correct userId, email, role, deviceInfo. | User redirected to TOS acceptance page (first-time) or Timer page (returning). Session cookie set (httpOnly, secure, sameSite=strict). KV session record created with correct userId, email, role, deviceInfo. | User redirected to TOS acceptance page (first-time) or Timer page (returning). Session cookie set (httpOnly, secure, sameSite=strict). KV session record created with correct userId, email, role, deviceInfo.


--- TABLE 3 ---
ID | AUTH-002 | Priority | P0
Title | Returning user login (TOS already accepted) | Automation | Playwright
Preconditions | User exists in KV with matching TOS version | User exists in KV with matching TOS version | User exists in KV with matching TOS version
Steps | 1. Navigate to login. 2. Sign in. 3. Observe redirect. | 1. Navigate to login. 2. Sign in. 3. Observe redirect. | 1. Navigate to login. 2. Sign in. 3. Observe redirect.
Expected Result | User goes directly to Timer page, skipping TOS. Session extended by 30 days. lastLoginAt updated. | User goes directly to Timer page, skipping TOS. Session extended by 30 days. lastLoginAt updated. | User goes directly to Timer page, skipping TOS. Session extended by 30 days. lastLoginAt updated.


--- TABLE 4 ---
ID | AUTH-003 | Priority | P0
Title | Session persists across page refresh | Automation | Playwright
Preconditions | Authenticated user on Timer page | Authenticated user on Timer page | Authenticated user on Timer page
Steps | 1. Refresh page (F5). 2. Observe state. | 1. Refresh page (F5). 2. Observe state. | 1. Refresh page (F5). 2. Observe state.
Expected Result | User remains authenticated. Timer page loads. No redirect to login. Session cookie unchanged. | User remains authenticated. Timer page loads. No redirect to login. Session cookie unchanged. | User remains authenticated. Timer page loads. No redirect to login. Session cookie unchanged.


--- TABLE 5 ---
ID | AUTH-004 | Priority | P0
Title | Logout clears session completely | Automation | Playwright + KV assertion
Preconditions | Authenticated user | Authenticated user | Authenticated user
Steps | 1. Click Logout in profile card. 2. Observe redirect. 3. Check KV. 4. Check cookies. | 1. Click Logout in profile card. 2. Observe redirect. 3. Check KV. 4. Check cookies. | 1. Click Logout in profile card. 2. Observe redirect. 3. Check KV. 4. Check cookies.
Expected Result | User redirected to login. Toast: 'You have been logged out.' KV session deleted. Cookie cleared (empty + expired). Navigating to /timer returns 302 to login. | User redirected to login. Toast: 'You have been logged out.' KV session deleted. Cookie cleared (empty + expired). Navigating to /timer returns 302 to login. | User redirected to login. Toast: 'You have been logged out.' KV session deleted. Cookie cleared (empty + expired). Navigating to /timer returns 302 to login.


--- TABLE 6 ---
ID | AUTH-005 | Priority | P0
Title | Beta cap reached, non-invited user rejected | Automation | Integration + Playwright
Preconditions | 10 users registered, beta cap = 10, new user not on allowlist | 10 users registered, beta cap = 10, new user not on allowlist | 10 users registered, beta cap = 10, new user not on allowlist
Steps | 1. New user attempts sign in. 2. OAuth succeeds at Google. 3. App processes. | 1. New user attempts sign in. 2. OAuth succeeds at Google. 3. App processes. | 1. New user attempts sign in. 2. OAuth succeeds at Google. 3. App processes.
Expected Result | Rejection screen: 'Becoming.. is currently in private beta and all 10 slots are filled.' No user record created. Google token revoked. Beta counter unchanged at 10/10. | Rejection screen: 'Becoming.. is currently in private beta and all 10 slots are filled.' No user record created. Google token revoked. Beta counter unchanged at 10/10. | Rejection screen: 'Becoming.. is currently in private beta and all 10 slots are filled.' No user record created. Google token revoked. Beta counter unchanged at 10/10.


--- TABLE 7 ---
ID | AUTH-006 | Priority | P0
Title | Beta cap reached, invited user succeeds | Automation | Integration
Preconditions | 10/10 users, new user email ON allowlist | 10/10 users, new user email ON allowlist | 10/10 users, new user email ON allowlist
Steps | 1. Invited user signs in. | 1. Invited user signs in. | 1. Invited user signs in.
Expected Result | Sign-in succeeds. User created. Counter becomes 11/10 (over cap). Invitation status changes to 'registered.' | Sign-in succeeds. User created. Counter becomes 11/10 (over cap). Invitation status changes to 'registered.' | Sign-in succeeds. User created. Counter becomes 11/10 (over cap). Invitation status changes to 'registered.'


--- TABLE 8 ---
ID | AUTH-007 | Priority | P0
Title | Two users claim last slot simultaneously | Automation | Load test simulation
Preconditions | 9/10 users, two new users sign in at same moment | 9/10 users, two new users sign in at same moment | 9/10 users, two new users sign in at same moment
Steps | 1. User A and User B click sign-in within 100ms. | 1. User A and User B click sign-in within 100ms. | 1. User A and User B click sign-in within 100ms.
Expected Result | Exactly one user gets the slot (first to write to KV). The other gets rejection screen. No race condition: KV atomic check-and-increment ensures no double-booking. Final count: 10/10 (never 11/10 for non-invited). | Exactly one user gets the slot (first to write to KV). The other gets rejection screen. No race condition: KV atomic check-and-increment ensures no double-booking. Final count: 10/10 (never 11/10 for non-invited). | Exactly one user gets the slot (first to write to KV). The other gets rejection screen. No race condition: KV atomic check-and-increment ensures no double-booking. Final count: 10/10 (never 11/10 for non-invited).


--- TABLE 9 ---
ID | AUTH-008 | Priority | P0
Title | CSRF protection via state parameter | Automation | Security test
Preconditions | Attacker crafts OAuth callback with forged state | Attacker crafts OAuth callback with forged state | Attacker crafts OAuth callback with forged state
Steps | 1. Intercept OAuth redirect. 2. Replace state parameter. 3. Submit to callback. | 1. Intercept OAuth redirect. 2. Replace state parameter. 3. Submit to callback. | 1. Intercept OAuth redirect. 2. Replace state parameter. 3. Submit to callback.
Expected Result | App rejects: state mismatch. User sees: 'Authentication failed. Please try again.' No session created. Event logged. | App rejects: state mismatch. User sees: 'Authentication failed. Please try again.' No session created. Event logged. | App rejects: state mismatch. User sees: 'Authentication failed. Please try again.' No session created. Event logged.


--- TABLE 10 ---
ID | AUTH-009 | Priority | P0
Title | Session cookie tampering | Automation | Playwright + manual cookie edit
Preconditions | Authenticated user | Authenticated user | Authenticated user
Steps | 1. Modify session cookie value in browser DevTools. 2. Make API request. | 1. Modify session cookie value in browser DevTools. 2. Make API request. | 1. Modify session cookie value in browser DevTools. 2. Make API request.
Expected Result | Server returns 401 (session not found in KV). User redirected to login. No data exposed. | Server returns 401 (session not found in KV). User redirected to login. No data exposed. | Server returns 401 (session not found in KV). User redirected to login. No data exposed.


--- TABLE 11 ---
ID | AUTH-010 | Priority | P0
Title | Rate limiting on login | Automation | k6 + integration
Preconditions | Same IP | Same IP | Same IP
Steps | 1. Attempt 11 logins within 1 minute. | 1. Attempt 11 logins within 1 minute. | 1. Attempt 11 logins within 1 minute.
Expected Result | After 10th attempt: 'Too many login attempts. Please wait a minute and try again.' 11th request returns 429. Rate limit resets after 60 seconds. | After 10th attempt: 'Too many login attempts. Please wait a minute and try again.' 11th request returns 429. Rate limit resets after 60 seconds. | After 10th attempt: 'Too many login attempts. Please wait a minute and try again.' 11th request returns 429. Rate limit resets after 60 seconds.


--- TABLE 12 ---
ID | AUTH-011 | Priority | P1
Title | Google account suspended | Automation | Manual verification
Preconditions | User exists in Becoming.., Google suspends account | User exists in Becoming.., Google suspends account | User exists in Becoming.., Google suspends account
Steps | 1. User attempts to sign in. | 1. User attempts to sign in. | 1. User attempts to sign in.
Expected Result | Google OAuth fails at Google's end. User sees Google's error page. Becoming.. data remains intact but inaccessible until Google account restored. | Google OAuth fails at Google's end. User sees Google's error page. Becoming.. data remains intact but inaccessible until Google account restored. | Google OAuth fails at Google's end. User sees Google's error page. Becoming.. data remains intact but inaccessible until Google account restored.


--- TABLE 13 ---
ID | AUTH-012 | Priority | P1
Title | Google email changed | Automation | Integration
Preconditions | User changes email in Google settings, sub unchanged | User changes email in Google settings, sub unchanged | User changes email in Google settings, sub unchanged
Steps | 1. User signs in after email change. | 1. User signs in after email change. | 1. User signs in after email change.
Expected Result | App updates stored email to new value. All data intact (keyed by sub, not email). Profile card shows new email. | App updates stored email to new value. All data intact (keyed by sub, not email). Profile card shows new email. | App updates stored email to new value. All data intact (keyed by sub, not email). Profile card shows new email.


--- TABLE 14 ---
ID | AUTH-013 | Priority | P0
Title | Session expiry after 30 days | Automation | Integration with mocked time
Preconditions | User authenticated 31 days ago, no activity | User authenticated 31 days ago, no activity | User authenticated 31 days ago, no activity
Steps | 1. User returns to app. | 1. User returns to app. | 1. User returns to app.
Expected Result | Session expired in KV (TTL). Cookie present but server returns 401. Redirect to login: 'Your session has expired.' Re-login creates new session. | Session expired in KV (TTL). Cookie present but server returns 401. Redirect to login: 'Your session has expired.' Re-login creates new session. | Session expired in KV (TTL). Cookie present but server returns 401. Redirect to login: 'Your session has expired.' Re-login creates new session.


--- TABLE 15 ---
ID | AUTH-014 | Priority | P1
Title | Expired session + return URL preservation | Automation | Playwright
Preconditions | Unauthenticated user navigates to /dashboard | Unauthenticated user navigates to /dashboard | Unauthenticated user navigates to /dashboard
Steps | 1. Navigate to /dashboard directly. | 1. Navigate to /dashboard directly. | 1. Navigate to /dashboard directly.
Expected Result | Redirect to login. After login, redirect back to /dashboard (not default Timer). Return URL stored in query param or session. | Redirect to login. After login, redirect back to /dashboard (not default Timer). Return URL stored in query param or session. | Redirect to login. After login, redirect back to /dashboard (not default Timer). Return URL stored in query param or session.


--- TABLE 16 ---
ID | AUTH-015 | Priority | P1
Title | Third-party cookies blocked | Automation | Playwright with cookie policy
Preconditions | Safari ITP or browser with cookies blocked | Safari ITP or browser with cookies blocked | Safari ITP or browser with cookies blocked
Steps | 1. User attempts login. | 1. User attempts login. | 1. User attempts login.
Expected Result | If OAuth fails due to cookie blocking: helper message appears: 'Please enable third-party cookies or try a different browser.' | If OAuth fails due to cookie blocking: helper message appears: 'Please enable third-party cookies or try a different browser.' | If OAuth fails due to cookie blocking: helper message appears: 'Please enable third-party cookies or try a different browser.'


--- TABLE 17 ---
ID | AUTH-016 | Priority | P1
Title | Concurrent Google access revocation | Automation | Integration
Preconditions | User revokes Becoming.. access in Google Account | User revokes Becoming.. access in Google Account | User revokes Becoming.. access in Google Account
Steps | 1. User is authenticated. 2. Revokes access in myaccount.google.com. 3. Makes next API call. | 1. User is authenticated. 2. Revokes access in myaccount.google.com. 3. Makes next API call. | 1. User is authenticated. 2. Revokes access in myaccount.google.com. 3. Makes next API call.
Expected Result | API returns 401. User redirected to login: 'Your Google access was revoked. Please sign in again.' Must re-consent on next login. | API returns 401. User redirected to login: 'Your Google access was revoked. Please sign in again.' Must re-consent on next login. | API returns 401. User redirected to login: 'Your Google access was revoked. Please sign in again.' Must re-consent on next login.


--- TABLE 18 ---
ID | AUTH-017 | Priority | P0
Title | Logout with active timer running | Automation | Playwright
Preconditions | User has timer running, clicks Logout | User has timer running, clicks Logout | User has timer running, clicks Logout
Steps | 1. Start focus timer. 2. Click Logout. | 1. Start focus timer. 2. Click Logout. | 1. Start focus timer. 2. Click Logout.
Expected Result | Timer session marked abandoned server-side. Timer state cleared (timer:{userId} deleted). User logged out. On re-login, timer page shows idle state, no stale running timer. | Timer session marked abandoned server-side. Timer state cleared (timer:{userId} deleted). User logged out. On re-login, timer page shows idle state, no stale running timer. | Timer session marked abandoned server-side. Timer state cleared (timer:{userId} deleted). User logged out. On re-login, timer page shows idle state, no stale running timer.


--- TABLE 19 ---
ID | AUTH-018 | Priority | P0
Title | Multiple simultaneous sessions | Automation | Playwright multi-browser
Preconditions | Same user logged in on Chrome desktop + Safari mobile | Same user logged in on Chrome desktop + Safari mobile | Same user logged in on Chrome desktop + Safari mobile
Steps | 1. Login on Chrome. 2. Login on Safari. | 1. Login on Chrome. 2. Login on Safari. | 1. Login on Chrome. 2. Login on Safari.
Expected Result | Both sessions valid. Both see same user data. Both get unique session tokens. No session invalidation of the other. | Both sessions valid. Both see same user data. Both get unique session tokens. No session invalidation of the other. | Both sessions valid. Both see same user data. Both get unique session tokens. No session invalidation of the other.


--- TABLE 20 ---
ID | TOS-001 | Priority | P0
Title | First-time user sees TOS gate | Automation | Playwright
Preconditions | New user, no TOS record | New user, no TOS record | New user, no TOS record
Steps | 1. Complete OAuth. 2. Observe redirect. | 1. Complete OAuth. 2. Observe redirect. | 1. Complete OAuth. 2. Observe redirect.
Expected Result | TOS acceptance page shown. Full document visible. 'I Accept' button DISABLED. Cannot navigate to Timer or any other page. | TOS acceptance page shown. Full document visible. 'I Accept' button DISABLED. Cannot navigate to Timer or any other page. | TOS acceptance page shown. Full document visible. 'I Accept' button DISABLED. Cannot navigate to Timer or any other page.


--- TABLE 21 ---
ID | TOS-002 | Priority | P0
Title | Accept button enables on scroll to bottom | Automation | Playwright scroll simulation
Preconditions | On TOS page | On TOS page | On TOS page
Steps | 1. Scroll TOS document to bottom. | 1. Scroll TOS document to bottom. | 1. Scroll TOS document to bottom.
Expected Result | 'I Accept' button becomes enabled (amber, clickable). Before scroll: button disabled with hint 'Please scroll to the bottom.' | 'I Accept' button becomes enabled (amber, clickable). Before scroll: button disabled with hint 'Please scroll to the bottom.' | 'I Accept' button becomes enabled (amber, clickable). Before scroll: button disabled with hint 'Please scroll to the bottom.'


--- TABLE 22 ---
ID | TOS-003 | Priority | P0
Title | Accepting TOS creates audit record | Automation | Integration + KV assertion
Preconditions | On TOS page, scrolled to bottom | On TOS page, scrolled to bottom | On TOS page, scrolled to bottom
Steps | 1. Click 'I Accept'. | 1. Click 'I Accept'. | 1. Click 'I Accept'.
Expected Result | KV record created: { acceptedVersion: '1.0', acceptedAt: UTC ISO, acceptedFromIP, userAgent }. User redirected to Timer. Record immutable. | KV record created: { acceptedVersion: '1.0', acceptedAt: UTC ISO, acceptedFromIP, userAgent }. User redirected to Timer. Record immutable. | KV record created: { acceptedVersion: '1.0', acceptedAt: UTC ISO, acceptedFromIP, userAgent }. User redirected to Timer. Record immutable.


--- TABLE 23 ---
ID | TOS-004 | Priority | P0
Title | Declining TOS logs user out | Automation | Playwright
Preconditions | On TOS page | On TOS page | On TOS page
Steps | 1. Click 'Decline'. | 1. Click 'Decline'. | 1. Click 'Decline'.
Expected Result | User logged out. Message: 'You must accept the Terms of Service to use Becoming..' Redirect to login. | User logged out. Message: 'You must accept the Terms of Service to use Becoming..' Redirect to login. | User logged out. Message: 'You must accept the Terms of Service to use Becoming..' Redirect to login.


--- TABLE 24 ---
ID | TOS-005 | Priority | P0
Title | Returning user with current TOS version | Automation | Playwright
Preconditions | User accepted v1.0, current is v1.0 | User accepted v1.0, current is v1.0 | User accepted v1.0, current is v1.0
Steps | 1. Login. | 1. Login. | 1. Login.
Expected Result | TOS screen skipped. Direct to Timer. | TOS screen skipped. Direct to Timer. | TOS screen skipped. Direct to Timer.


--- TABLE 25 ---
ID | TOS-006 | Priority | P0
Title | TOS version bumped, re-acceptance required | Automation | Integration
Preconditions | User accepted v1.0, current bumped to v1.1 | User accepted v1.0, current bumped to v1.1 | User accepted v1.0, current bumped to v1.1
Steps | 1. Login. | 1. Login. | 1. Login.
Expected Result | TOS screen shown with banner: 'Our Terms of Service have been updated from version 1.0 to 1.1.' Must accept to proceed. KV updated on acceptance. | TOS screen shown with banner: 'Our Terms of Service have been updated from version 1.0 to 1.1.' Must accept to proceed. KV updated on acceptance. | TOS screen shown with banner: 'Our Terms of Service have been updated from version 1.0 to 1.1.' Must accept to proceed. KV updated on acceptance.


--- TABLE 26 ---
ID | TOS-007 | Priority | P2
Title | TOS version data integrity error | Automation | Integration
Preconditions | User's acceptedVersion > CURRENT_TOS_VERSION | User's acceptedVersion > CURRENT_TOS_VERSION | User's acceptedVersion > CURRENT_TOS_VERSION
Steps | 1. Login. | 1. Login. | 1. Login.
Expected Result | Error logged server-side. User treated as needing re-acceptance. TOS screen shown. | Error logged server-side. User treated as needing re-acceptance. TOS screen shown. | Error logged server-side. User treated as needing re-acceptance. TOS screen shown.


--- TABLE 27 ---
ID | TOS-008 | Priority | P0
Title | TOS audit trail immutability | Automation | Security test
Preconditions | Super Admin attempts to modify TOS records | Super Admin attempts to modify TOS records | Super Admin attempts to modify TOS records
Steps | 1. Attempt to update tos:{userId} via any API. | 1. Attempt to update tos:{userId} via any API. | 1. Attempt to update tos:{userId} via any API.
Expected Result | No API endpoint exists to modify TOS records. Direct KV modification requires server access (not exposed via API). Audit trail is append-only. | No API endpoint exists to modify TOS records. Direct KV modification requires server access (not exposed via API). Audit trail is append-only. | No API endpoint exists to modify TOS records. Direct KV modification requires server access (not exposed via API). Audit trail is append-only.


--- TABLE 28 ---
ID | TMR-001 | Priority | P0
Title | Timer shows configured duration in idle | Automation | Playwright + visual assertion
Preconditions | Authenticated user on Timer page, no active session | Authenticated user on Timer page, no active session | Authenticated user on Timer page, no active session
Steps | 1. Observe timer display. | 1. Observe timer display. | 1. Observe timer display.
Expected Result | Timer shows '25:00' (or user's configured focus duration). Status: 'READY TO FOCUS.' Ring at 100%. Play button enabled. Skip/Reset disabled. NOT '00:00' (bug fix validated). | Timer shows '25:00' (or user's configured focus duration). Status: 'READY TO FOCUS.' Ring at 100%. Play button enabled. Skip/Reset disabled. NOT '00:00' (bug fix validated). | Timer shows '25:00' (or user's configured focus duration). Status: 'READY TO FOCUS.' Ring at 100%. Play button enabled. Skip/Reset disabled. NOT '00:00' (bug fix validated).


--- TABLE 29 ---
ID | TMR-002 | Priority | P0
Title | Timer shows user-customized duration | Automation | Playwright
Preconditions | User set Focus to 50 min in Settings | User set Focus to 50 min in Settings | User set Focus to 50 min in Settings
Steps | 1. Navigate to Timer. | 1. Navigate to Timer. | 1. Navigate to Timer.
Expected Result | Timer shows '50:00' in idle. Ring at 100%. | Timer shows '50:00' in idle. Ring at 100%. | Timer shows '50:00' in idle. Ring at 100%.


--- TABLE 30 ---
ID | TMR-003 | Priority | P0
Title | Starting a focus session | Automation | Playwright + KV assertion + audio detection
Preconditions | Timer idle, Focus mode | Timer idle, Focus mode | Timer idle, Focus mode
Steps | 1. Click Play. | 1. Click Play. | 1. Click Play.
Expected Result | Timer starts counting down from configured duration. Server record created: status=running, startedAt=now(). Play morphs to Pause. Skip/Reset become enabled. Status: 'FOCUSING...' Activation chime plays. | Timer starts counting down from configured duration. Server record created: status=running, startedAt=now(). Play morphs to Pause. Skip/Reset become enabled. Status: 'FOCUSING...' Activation chime plays. | Timer starts counting down from configured duration. Server record created: status=running, startedAt=now(). Play morphs to Pause. Skip/Reset become enabled. Status: 'FOCUSING...' Activation chime plays.


--- TABLE 31 ---
ID | TMR-004 | Priority | P0
Title | Timer accuracy over 25 minutes | Automation | Unit test with mocked time
Preconditions | Timer running | Timer running | Timer running
Steps | 1. Start timer. 2. Wait 25 minutes (mocked). 3. Compare actual vs expected. | 1. Start timer. 2. Wait 25 minutes (mocked). 3. Compare actual vs expected. | 1. Start timer. 2. Wait 25 minutes (mocked). 3. Compare actual vs expected.
Expected Result | Timer reaches 00:00 within +/- 1 second of configured duration. Accuracy maintained even if browser throttles timers (uses server timestamps, not setInterval). | Timer reaches 00:00 within +/- 1 second of configured duration. Accuracy maintained even if browser throttles timers (uses server timestamps, not setInterval). | Timer reaches 00:00 within +/- 1 second of configured duration. Accuracy maintained even if browser throttles timers (uses server timestamps, not setInterval).


--- TABLE 32 ---
ID | TMR-005 | Priority | P0
Title | Timer survives page refresh mid-session | Automation | Playwright
Preconditions | Timer running at 18:42 | Timer running at 18:42 | Timer running at 18:42
Steps | 1. Refresh page (F5). | 1. Refresh page (F5). | 1. Refresh page (F5).
Expected Result | Timer reconstructs from server: remaining = configuredDuration - (now - startedAt). Display shows correct remaining time (approximately 18:42). No restart to 25:00. Ring depletion at correct position. | Timer reconstructs from server: remaining = configuredDuration - (now - startedAt). Display shows correct remaining time (approximately 18:42). No restart to 25:00. Ring depletion at correct position. | Timer reconstructs from server: remaining = configuredDuration - (now - startedAt). Display shows correct remaining time (approximately 18:42). No restart to 25:00. Ring depletion at correct position.


--- TABLE 33 ---
ID | TMR-006 | Priority | P0
Title | Timer survives browser tab backgrounding | Automation | Playwright with tab switching
Preconditions | Timer running, user switches to another tab | Timer running, user switches to another tab | Timer running, user switches to another tab
Steps | 1. Start timer. 2. Switch to another tab for 5 minutes. 3. Return. | 1. Start timer. 2. Switch to another tab for 5 minutes. 3. Return. | 1. Start timer. 2. Switch to another tab for 5 minutes. 3. Return.
Expected Result | Timer shows correct remaining time (reconciled from server timestamps). No visual jump (150ms crossfade). Tab title showed live countdown while backgrounded. | Timer shows correct remaining time (reconciled from server timestamps). No visual jump (150ms crossfade). Tab title showed live countdown while backgrounded. | Timer shows correct remaining time (reconciled from server timestamps). No visual jump (150ms crossfade). Tab title showed live countdown while backgrounded.


--- TABLE 34 ---
ID | TMR-007 | Priority | P0
Title | Pause during focus | Automation | Playwright + KV assertion
Preconditions | Timer running | Timer running | Timer running
Steps | 1. Click Pause. | 1. Click Pause. | 1. Click Pause.
Expected Result | Timer freezes. Server: status=paused, pausedAt=now(). Numerals dim to 70%. Status: 'PAUSED.' Ring pulses in desaturated amber. Pause sound plays. | Timer freezes. Server: status=paused, pausedAt=now(). Numerals dim to 70%. Status: 'PAUSED.' Ring pulses in desaturated amber. Pause sound plays. | Timer freezes. Server: status=paused, pausedAt=now(). Numerals dim to 70%. Status: 'PAUSED.' Ring pulses in desaturated amber. Pause sound plays.


--- TABLE 35 ---
ID | TMR-008 | Priority | P0
Title | Resume after pause | Automation | Playwright
Preconditions | Timer paused at 18:42 | Timer paused at 18:42 | Timer paused at 18:42
Steps | 1. Click Play (resume). | 1. Click Play (resume). | 1. Click Play (resume).
Expected Result | Timer resumes from 18:42. Server: new effective startedAt adjusted for pause duration. Full opacity restored. Resume sound plays. Ring re-energizes. | Timer resumes from 18:42. Server: new effective startedAt adjusted for pause duration. Full opacity restored. Resume sound plays. Ring re-energizes. | Timer resumes from 18:42. Server: new effective startedAt adjusted for pause duration. Full opacity restored. Resume sound plays. Ring re-energizes.


--- TABLE 36 ---
ID | TMR-009 | Priority | P0
Title | Pause not available in Strict Mode | Automation | Playwright + Settings dependency
Preconditions | Strict Mode ON, timer running | Strict Mode ON, timer running | Strict Mode ON, timer running
Steps | 1. Look for Pause button. | 1. Look for Pause button. | 1. Look for Pause button.
Expected Result | Pause button is HIDDEN. Only 'Abandon' button visible. No keyboard shortcut for pause works (Space does nothing). | Pause button is HIDDEN. Only 'Abandon' button visible. No keyboard shortcut for pause works (Space does nothing). | Pause button is HIDDEN. Only 'Abandon' button visible. No keyboard shortcut for pause works (Space does nothing).


--- TABLE 37 ---
ID | TMR-010 | Priority | P0
Title | Focus session completes at 00:00 | Automation | Playwright + KV + visual
Preconditions | Timer counting down | Timer counting down | Timer counting down
Steps | 1. Wait for timer to reach 00:00. | 1. Wait for timer to reach 00:00. | 1. Wait for timer to reach 00:00.
Expected Result | Three-phase celebration plays. Session logged server-side (status=completed, actualDuration computed). Daily goal counter increments. Cycle tracker advances. Completion card appears: 'Great focus session! Ready for a break?' | Three-phase celebration plays. Session logged server-side (status=completed, actualDuration computed). Daily goal counter increments. Cycle tracker advances. Completion card appears: 'Great focus session! Ready for a break?' | Three-phase celebration plays. Session logged server-side (status=completed, actualDuration computed). Daily goal counter increments. Cycle tracker advances. Completion card appears: 'Great focus session! Ready for a break?'


--- TABLE 38 ---
ID | TMR-011 | Priority | P0
Title | Session logged with correct duration | Automation | Integration + KV assertion
Preconditions | 25-min focus session | 25-min focus session | 25-min focus session
Steps | 1. Start timer. 2. Let it complete. | 1. Start timer. 2. Let it complete. | 1. Start timer. 2. Let it complete.
Expected Result | Session record: actualDuration matches configuredDuration (+/- 2 seconds). startedAt and endedAt are accurate UTC timestamps. | Session record: actualDuration matches configuredDuration (+/- 2 seconds). startedAt and endedAt are accurate UTC timestamps. | Session record: actualDuration matches configuredDuration (+/- 2 seconds). startedAt and endedAt are accurate UTC timestamps.


--- TABLE 39 ---
ID | TMR-012 | Priority | P0
Title | Completion with Overtime ON | Automation | Playwright + Settings dependency
Preconditions | Overtime enabled, timer reaches 00:00 | Overtime enabled, timer reaches 00:00 | Overtime enabled, timer reaches 00:00
Steps | 1. Enable Overtime in Settings. 2. Start focus. 3. Let it reach 00:00. | 1. Enable Overtime in Settings. 2. Start focus. 3. Let it reach 00:00. | 1. Enable Overtime in Settings. 2. Start focus. 3. Let it reach 00:00.
Expected Result | Chime plays at 40% volume. Timer flips to count-up: +00:01, +00:02. Ring stays depleted with gentle pulse. 'Overtime: +X:XX' banner with Stop button. NO completion card. Phase 2/3 deferred until manual stop. | Chime plays at 40% volume. Timer flips to count-up: +00:01, +00:02. Ring stays depleted with gentle pulse. 'Overtime: +X:XX' banner with Stop button. NO completion card. Phase 2/3 deferred until manual stop. | Chime plays at 40% volume. Timer flips to count-up: +00:01, +00:02. Ring stays depleted with gentle pulse. 'Overtime: +X:XX' banner with Stop button. NO completion card. Phase 2/3 deferred until manual stop.


--- TABLE 40 ---
ID | TMR-013 | Priority | P0
Title | Stopping overtime | Automation | Playwright
Preconditions | Timer in overtime at +05:32 | Timer in overtime at +05:32 | Timer in overtime at +05:32
Steps | 1. Click 'Stop Overtime' button. | 1. Click 'Stop Overtime' button. | 1. Click 'Stop Overtime' button.
Expected Result | Session logged with total duration = configured + overtime (e.g., 25:00 + 5:32 = 30:32). Full completion celebration plays. Cycle advances. | Session logged with total duration = configured + overtime (e.g., 25:00 + 5:32 = 30:32). Full completion celebration plays. Cycle advances. | Session logged with total duration = configured + overtime (e.g., 25:00 + 5:32 = 30:32). Full completion celebration plays. Cycle advances.


--- TABLE 41 ---
ID | TMR-014 | Priority | P0
Title | Completion with Auto-Start Breaks ON | Automation | Playwright + Settings dependency
Preconditions | Auto-Start Breaks enabled | Auto-Start Breaks enabled | Auto-Start Breaks enabled
Steps | 1. Focus session completes. | 1. Focus session completes. | 1. Focus session completes.
Expected Result | Instead of completion card, 5-second countdown overlay: 'Break starting in 5... 4... 3...' with Cancel button. After countdown: break timer auto-starts. | Instead of completion card, 5-second countdown overlay: 'Break starting in 5... 4... 3...' with Cancel button. After countdown: break timer auto-starts. | Instead of completion card, 5-second countdown overlay: 'Break starting in 5... 4... 3...' with Cancel button. After countdown: break timer auto-starts.


--- TABLE 42 ---
ID | TMR-015 | Priority | P1
Title | Cancel auto-start break | Automation | Playwright
Preconditions | Auto-Start overlay visible | Auto-Start overlay visible | Auto-Start overlay visible
Steps | 1. Click 'Cancel' during countdown. | 1. Click 'Cancel' during countdown. | 1. Click 'Cancel' during countdown.
Expected Result | Auto-start cancelled. App shows break-ready idle state. User can start break manually. | Auto-start cancelled. App shows break-ready idle state. User can start break manually. | Auto-start cancelled. App shows break-ready idle state. User can start break manually.


--- TABLE 43 ---
ID | TMR-016 | Priority | P0
Title | Skip running session | Automation | Playwright
Preconditions | Timer running at 18:00 | Timer running at 18:00 | Timer running at 18:00
Steps | 1. Click Skip. 2. See confirmation. 3. Confirm. | 1. Click Skip. 2. See confirmation. 3. Confirm. | 1. Click Skip. 2. See confirmation. 3. Confirm.
Expected Result | Confirmation: 'Skip this session? It won't count toward your goal.' On confirm: session marked abandoned, timer resets, mode auto-advances to Break. Session NOT in Session Log. | Confirmation: 'Skip this session? It won't count toward your goal.' On confirm: session marked abandoned, timer resets, mode auto-advances to Break. Session NOT in Session Log. | Confirmation: 'Skip this session? It won't count toward your goal.' On confirm: session marked abandoned, timer resets, mode auto-advances to Break. Session NOT in Session Log.


--- TABLE 44 ---
ID | TMR-017 | Priority | P0
Title | Reset running session | Automation | Playwright
Preconditions | Timer running at 18:00 | Timer running at 18:00 | Timer running at 18:00
Steps | 1. Click Reset. 2. See confirmation. 3. Confirm. | 1. Click Reset. 2. See confirmation. 3. Confirm. | 1. Click Reset. 2. See confirmation. 3. Confirm.
Expected Result | Confirmation: 'Reset timer to [25:00]?' On confirm: session marked abandoned, timer resets to same mode's full duration. Mode does NOT advance. | Confirmation: 'Reset timer to [25:00]?' On confirm: session marked abandoned, timer resets to same mode's full duration. Mode does NOT advance. | Confirmation: 'Reset timer to [25:00]?' On confirm: session marked abandoned, timer resets to same mode's full duration. Mode does NOT advance.


--- TABLE 45 ---
ID | TMR-018 | Priority | P1
Title | Skip disabled in idle | Automation | Playwright
Preconditions | Timer idle | Timer idle | Timer idle
Steps | 1. Check Skip button state. | 1. Check Skip button state. | 1. Check Skip button state.
Expected Result | Skip button disabled (grayed, aria-disabled=true, not clickable). | Skip button disabled (grayed, aria-disabled=true, not clickable). | Skip button disabled (grayed, aria-disabled=true, not clickable).


--- TABLE 46 ---
ID | TMR-019 | Priority | P1
Title | Reset disabled in idle | Automation | Playwright
Preconditions | Timer idle | Timer idle | Timer idle
Steps | 1. Check Reset button state. | 1. Check Reset button state. | 1. Check Reset button state.
Expected Result | Reset button disabled. | Reset button disabled. | Reset button disabled.


--- TABLE 47 ---
ID | TMR-020 | Priority | P0
Title | Switch mode while idle | Automation | Playwright
Preconditions | Timer idle on Focus | Timer idle on Focus | Timer idle on Focus
Steps | 1. Click Break tab. | 1. Click Break tab. | 1. Click Break tab.
Expected Result | Timer instantly shows Break duration (5:00). Ring color changes to teal. No confirmation needed. | Timer instantly shows Break duration (5:00). Ring color changes to teal. No confirmation needed. | Timer instantly shows Break duration (5:00). Ring color changes to teal. No confirmation needed.


--- TABLE 48 ---
ID | TMR-021 | Priority | P0
Title | Switch mode while running | Automation | Playwright
Preconditions | Timer running on Focus at 18:00 | Timer running on Focus at 18:00 | Timer running on Focus at 18:00
Steps | 1. Click Break tab. 2. See confirmation. 3. Confirm. | 1. Click Break tab. 2. See confirmation. 3. Confirm. | 1. Click Break tab. 2. See confirmation. 3. Confirm.
Expected Result | Confirmation: 'Switching will reset your current session.' On confirm: session abandoned, timer resets to Break 5:00. On cancel: nothing changes. | Confirmation: 'Switching will reset your current session.' On confirm: session abandoned, timer resets to Break 5:00. On cancel: nothing changes. | Confirmation: 'Switching will reset your current session.' On confirm: session abandoned, timer resets to Break 5:00. On cancel: nothing changes.


--- TABLE 49 ---
ID | TMR-022 | Priority | P0
Title | Auto-advance after Focus completion | Automation | Playwright + state tracking
Preconditions | Focus session completes | Focus session completes | Focus session completes
Steps | 1. Observe mode selector. | 1. Observe mode selector. | 1. Observe mode selector.
Expected Result | Mode auto-advances to Break. Timer shows Break duration. If this was the 4th focus: advances to Long Break instead. | Mode auto-advances to Break. Timer shows Break duration. If this was the 4th focus: advances to Long Break instead. | Mode auto-advances to Break. Timer shows Break duration. If this was the 4th focus: advances to Long Break instead.


--- TABLE 50 ---
ID | TMR-023 | Priority | P0
Title | Session crosses midnight (Day Reset Time) | Automation | Unit test with mocked time
Preconditions | Session starts at 11:50 PM, Day Reset at midnight | Session starts at 11:50 PM, Day Reset at midnight | Session starts at 11:50 PM, Day Reset at midnight
Steps | 1. Start session at 11:50 PM. 2. Session completes at 12:15 AM. | 1. Start session at 11:50 PM. 2. Session completes at 12:15 AM. | 1. Start session at 11:50 PM. 2. Session completes at 12:15 AM.
Expected Result | Session counts toward YESTERDAY's stats (day determined by startedAt). Today's counters show 0 until a new session starts. | Session counts toward YESTERDAY's stats (day determined by startedAt). Today's counters show 0 until a new session starts. | Session counts toward YESTERDAY's stats (day determined by startedAt). Today's counters show 0 until a new session starts.


--- TABLE 51 ---
ID | TMR-024 | Priority | P1
Title | DST transition during session | Automation | Unit test with mocked timezone
Preconditions | Session starts before DST, clocks jump during session | Session starts before DST, clocks jump during session | Session starts before DST, clocks jump during session
Steps | 1. Start timer at 1:50 AM. 2. DST: clocks jump to 3:00 AM at 2:00 AM. | 1. Start timer at 1:50 AM. 2. DST: clocks jump to 3:00 AM at 2:00 AM. | 1. Start timer at 1:50 AM. 2. DST: clocks jump to 3:00 AM at 2:00 AM.
Expected Result | Timer continues accurately (uses UTC). Display shows correct remaining time. Session duration in log is actual elapsed time, unaffected by DST. | Timer continues accurately (uses UTC). Display shows correct remaining time. Session duration in log is actual elapsed time, unaffected by DST. | Timer continues accurately (uses UTC). Display shows correct remaining time. Session duration in log is actual elapsed time, unaffected by DST.


--- TABLE 52 ---
ID | TMR-025 | Priority | P1
Title | Count-up session exceeds 60 minutes | Automation | Playwright with mocked time
Preconditions | Overtime ON, user doesn't stop for over an hour | Overtime ON, user doesn't stop for over an hour | Overtime ON, user doesn't stop for over an hour
Steps | 1. Start focus (25 min). 2. Let overtime run for 40 min. | 1. Start focus (25 min). 2. Let overtime run for 40 min. | 1. Start focus (25 min). 2. Let overtime run for 40 min.
Expected Result | Display switches from MM:SS to HH:MM:SS when exceeding 60 minutes (shows 1:05:00 etc.). Single session record with total duration 65 min. | Display switches from MM:SS to HH:MM:SS when exceeding 60 minutes (shows 1:05:00 etc.). Single session record with total duration 65 min. | Display switches from MM:SS to HH:MM:SS when exceeding 60 minutes (shows 1:05:00 etc.). Single session record with total duration 65 min.


--- TABLE 53 ---
ID | TMR-026 | Priority | P0
Title | Browser crash during running session | Automation | Integration + heartbeat mock
Preconditions | Timer running, browser force-closed | Timer running, browser force-closed | Timer running, browser force-closed
Steps | 1. Start timer. 2. Force-close browser (kill process). 3. Reopen app after 2 minutes. | 1. Start timer. 2. Force-close browser (kill process). 3. Reopen app after 2 minutes. | 1. Start timer. 2. Force-close browser (kill process). 3. Reopen app after 2 minutes.
Expected Result | Server detects no heartbeat for 60s. Timer state cleared to idle. Session marked abandoned. User sees idle timer on return (not stale running state). | Server detects no heartbeat for 60s. Timer state cleared to idle. Session marked abandoned. User sees idle timer on return (not stale running state). | Server detects no heartbeat for 60s. Timer state cleared to idle. Session marked abandoned. User sees idle timer on return (not stale running state).


--- TABLE 54 ---
ID | TMR-027 | Priority | P0
Title | Multiple tabs in same browser | Automation | Playwright multi-tab
Preconditions | Timer running in Tab A | Timer running in Tab A | Timer running in Tab A
Steps | 1. Open new tab with Becoming.. 2. Observe Tab B. | 1. Open new tab with Becoming.. 2. Observe Tab B. | 1. Open new tab with Becoming.. 2. Observe Tab B.
Expected Result | Tab B detects Tab A via BroadcastChannel. Shows: 'This session is controlled in another tab' with 'Take over' button. Controls disabled on Tab B. | Tab B detects Tab A via BroadcastChannel. Shows: 'This session is controlled in another tab' with 'Take over' button. Controls disabled on Tab B. | Tab B detects Tab A via BroadcastChannel. Shows: 'This session is controlled in another tab' with 'Take over' button. Controls disabled on Tab B.


--- TABLE 55 ---
ID | TMR-028 | Priority | P1
Title | Device clock manually changed during session | Automation | Integration with mocked clock
Preconditions | Timer running, user changes system clock | Timer running, user changes system clock | Timer running, user changes system clock
Steps | 1. Start timer. 2. Advance system clock by 10 minutes. | 1. Start timer. 2. Advance system clock by 10 minutes. | 1. Start timer. 2. Advance system clock by 10 minutes.
Expected Result | Timer reconciles from server time on next API call. Display corrects to accurate remaining time (may jump forward). No negative time or overflow. | Timer reconciles from server time on next API call. Display corrects to accurate remaining time (may jump forward). No negative time or overflow. | Timer reconciles from server time on next API call. Display corrects to accurate remaining time (may jump forward). No negative time or overflow.


--- TABLE 56 ---
ID | TMR-029 | Priority | P0
Title | Minimum countable session - too short | Automation | Integration
Preconditions | Min Countable = 10 min, session abandoned at 5 min | Min Countable = 10 min, session abandoned at 5 min | Min Countable = 10 min, session abandoned at 5 min
Steps | 1. Start timer. 2. Abandon after 5 minutes. | 1. Start timer. 2. Abandon after 5 minutes. | 1. Start timer. 2. Abandon after 5 minutes.
Expected Result | Session NOT logged (below minimum). No prompt to log. Daily goal unchanged. Streak unaffected. Session appears in admin analytics as abandoned but never in user's Session Log. | Session NOT logged (below minimum). No prompt to log. Daily goal unchanged. Streak unaffected. Session appears in admin analytics as abandoned but never in user's Session Log. | Session NOT logged (below minimum). No prompt to log. Daily goal unchanged. Streak unaffected. Session appears in admin analytics as abandoned but never in user's Session Log.


--- TABLE 57 ---
ID | TMR-030 | Priority | P0
Title | Strict Mode + Overtime + Stop | Automation | Playwright + Settings
Preconditions | Strict Mode ON, Overtime ON | Strict Mode ON, Overtime ON | Strict Mode ON, Overtime ON
Steps | 1. Start focus. 2. Timer reaches 00:00. 3. Overtime runs for 3 min. 4. Click 'Stop Overtime'. | 1. Start focus. 2. Timer reaches 00:00. 3. Overtime runs for 3 min. 4. Click 'Stop Overtime'. | 1. Start focus. 2. Timer reaches 00:00. 3. Overtime runs for 3 min. 4. Click 'Stop Overtime'.
Expected Result | During focus: only Abandon visible. At 00:00: Abandon transforms to 'Stop Overtime.' User stops at +03:00. Session logged: 28 min total. Full celebration. | During focus: only Abandon visible. At 00:00: Abandon transforms to 'Stop Overtime.' User stops at +03:00. Session logged: 28 min total. Full celebration. | During focus: only Abandon visible. At 00:00: Abandon transforms to 'Stop Overtime.' User stops at +03:00. Session logged: 28 min total. Full celebration.


--- TABLE 58 ---
ID | TMR-031 | Priority | P0
Title | Second device sees running timer | Automation | Playwright multi-context
Preconditions | Timer running on Device A | Timer running on Device A | Timer running on Device A
Steps | 1. Open app on Device B. | 1. Open app on Device B. | 1. Open app on Device B.
Expected Result | Device B shows timer mid-countdown (correct remaining time from server). Banner: 'Timer running on another device.' Controls disabled. 'Take over here' button visible. | Device B shows timer mid-countdown (correct remaining time from server). Banner: 'Timer running on another device.' Controls disabled. 'Take over here' button visible. | Device B shows timer mid-countdown (correct remaining time from server). Banner: 'Timer running on another device.' Controls disabled. 'Take over here' button visible.


--- TABLE 59 ---
ID | TMR-032 | Priority | P0
Title | Take over control | Automation | Playwright multi-context
Preconditions | Device B showing 'Take over' | Device B showing 'Take over' | Device B showing 'Take over'
Steps | 1. Click 'Take over here' on Device B. | 1. Click 'Take over here' on Device B. | 1. Click 'Take over here' on Device B.
Expected Result | Device B becomes controller (full controls enabled). Device A drops to view-only within 5s. Toast on A: 'Control moved to another device.' Server: controllingDeviceId updated. | Device B becomes controller (full controls enabled). Device A drops to view-only within 5s. Toast on A: 'Control moved to another device.' Server: controllingDeviceId updated. | Device B becomes controller (full controls enabled). Device A drops to view-only within 5s. Toast on A: 'Control moved to another device.' Server: controllingDeviceId updated.


--- TABLE 60 ---
ID | TMR-033 | Priority | P0
Title | Controller heartbeat timeout | Automation | Integration with network mock
Preconditions | Device A controlling, Device A goes offline | Device A controlling, Device A goes offline | Device A controlling, Device A goes offline
Steps | 1. Device A goes offline (disconnect network). 2. Wait 65 seconds. 3. Device B checks. | 1. Device A goes offline (disconnect network). 2. Wait 65 seconds. 3. Device B checks. | 1. Device A goes offline (disconnect network). 2. Wait 65 seconds. 3. Device B checks.
Expected Result | After 60s without heartbeat, server clears controllingDeviceId. Device B can now claim controller by pressing Play or Take Over. | After 60s without heartbeat, server clears controllingDeviceId. Device B can now claim controller by pressing Play or Take Over. | After 60s without heartbeat, server clears controllingDeviceId. Device B can now claim controller by pressing Play or Take Over.


--- TABLE 61 ---
ID | TMR-034 | Priority | P0
Title | Simultaneous Play on two idle devices | Automation | Load test simulation
Preconditions | Both devices idle | Both devices idle | Both devices idle
Steps | 1. Both devices click Play within 100ms. | 1. Both devices click Play within 100ms. | 1. Both devices click Play within 100ms.
Expected Result | Server processes first request, sets controllingDeviceId. Second request rejected. First device: timer starts. Second device: toast 'Timer started on another device' + view-only mode. | Server processes first request, sets controllingDeviceId. Second request rejected. First device: timer starts. Second device: toast 'Timer started on another device' + view-only mode. | Server processes first request, sets controllingDeviceId. Second request rejected. First device: timer starts. Second device: toast 'Timer started on another device' + view-only mode.


--- TABLE 62 ---
ID | VIS-001 | Priority | P1
Title | Breathing glow in idle | Automation | Visual regression + CSS assertion
Preconditions | Timer idle | Timer idle | Timer idle
Steps | 1. Observe ring. | 1. Observe ring. | 1. Observe ring.
Expected Result | Ring opacity oscillates 80%-100% on 4-second cycle. Box-shadow expands 0px-8px. CSS animation with ease-in-out. | Ring opacity oscillates 80%-100% on 4-second cycle. Box-shadow expands 0px-8px. CSS animation with ease-in-out. | Ring opacity oscillates 80%-100% on 4-second cycle. Box-shadow expands 0px-8px. CSS animation with ease-in-out.


--- TABLE 63 ---
ID | VIS-002 | Priority | P1
Title | Ring color warming during countdown | Automation | Playwright CSS computed style
Preconditions | Timer at various progress points | Timer at various progress points | Timer at various progress points
Steps | 1. Check ring color at 100%, 50%, 25%. | 1. Check ring color at 100%, 50%, 25%. | 1. Check ring color at 100%, 50%, 25%.
Expected Result | 100%: #D97706. 50%: approximately #F59E0B. 25%: approximately #FBBF24. Smooth linear transition. | 100%: #D97706. 50%: approximately #F59E0B. 25%: approximately #FBBF24. Smooth linear transition. | 100%: #D97706. 50%: approximately #F59E0B. 25%: approximately #FBBF24. Smooth linear transition.


--- TABLE 64 ---
ID | VIS-003 | Priority | P1
Title | Urgency build at last 5 minutes | Automation | Playwright with timed assertions
Preconditions | Timer countdown | Timer countdown | Timer countdown
Steps | 1. Observe at 5:00, 3:00, 1:00, 0:30, 0:10, 0:05. | 1. Observe at 5:00, 3:00, 1:00, 0:30, 0:10, 0:05. | 1. Observe at 5:00, 3:00, 1:00, 0:30, 0:10, 0:05.
Expected Result | Progressive intensification: pulse frequency increases, shadow expands, numerals scale up at 0:10, haptic at 0:05. All thresholds verified. | Progressive intensification: pulse frequency increases, shadow expands, numerals scale up at 0:10, haptic at 0:05. All thresholds verified. | Progressive intensification: pulse frequency increases, shadow expands, numerals scale up at 0:10, haptic at 0:05. All thresholds verified.


--- TABLE 65 ---
ID | VIS-004 | Priority | P1
Title | Three-phase completion animation | Automation | Visual regression + timeline
Preconditions | Timer reaches 00:00 | Timer reaches 00:00 | Timer reaches 00:00
Steps | 1. Observe full 3-second animation. | 1. Observe full 3-second animation. | 1. Observe full 3-second animation.
Expected Result | Phase 1 (0-500ms): flash + burst + chime. Phase 2 (500-1500ms): particles + gold glow + 'SESSION COMPLETE'. Phase 3 (1500-3000ms): cool down. All verified via screenshots at 500ms intervals. | Phase 1 (0-500ms): flash + burst + chime. Phase 2 (500-1500ms): particles + gold glow + 'SESSION COMPLETE'. Phase 3 (1500-3000ms): cool down. All verified via screenshots at 500ms intervals. | Phase 1 (0-500ms): flash + burst + chime. Phase 2 (500-1500ms): particles + gold glow + 'SESSION COMPLETE'. Phase 3 (1500-3000ms): cool down. All verified via screenshots at 500ms intervals.


--- TABLE 66 ---
ID | VIS-005 | Priority | P0
Title | Reduced Motion disables all animations | Automation | Playwright + prefers-reduced-motion emulation
Preconditions | Reduced Motion ON | Reduced Motion ON | Reduced Motion ON
Steps | 1. Complete a session. 2. Observe. | 1. Complete a session. 2. Observe. | 1. Complete a session. 2. Observe.
Expected Result | No breathing glow, no flip animation, no particles, no burst. Simple color change at completion. Instant text updates. Intensity slider grayed out. | No breathing glow, no flip animation, no particles, no burst. Simple color change at completion. Instant text updates. Intensity slider grayed out. | No breathing glow, no flip animation, no particles, no burst. Simple color change at completion. Instant text updates. Intensity slider grayed out.


--- TABLE 67 ---
ID | VIS-006 | Priority | P0
Title | Break state uses teal palette | Automation | Playwright CSS assertion
Preconditions | Timer in Break mode | Timer in Break mode | Timer in Break mode
Steps | 1. Start break. 2. Observe. | 1. Start break. 2. Observe. | 1. Start break. 2. Observe.
Expected Result | Ring is teal (#0D9488). Breathing glow at 6-second cycle. No urgency escalation. Label: 'TIME TO REST.' | Ring is teal (#0D9488). Breathing glow at 6-second cycle. No urgency escalation. Label: 'TIME TO REST.' | Ring is teal (#0D9488). Breathing glow at 6-second cycle. No urgency escalation. Label: 'TIME TO REST.'


--- TABLE 68 ---
ID | VIS-007 | Priority | P0
Title | Tab title shows countdown | Automation | Playwright page.title()
Preconditions | Timer running | Timer running | Timer running
Steps | 1. Check browser tab title. | 1. Check browser tab title. | 1. Check browser tab title.
Expected Result | Shows: '18:42 — Focusing | Becoming..' (updates every second). | Shows: '18:42 — Focusing | Becoming..' (updates every second). | Shows: '18:42 — Focusing | Becoming..' (updates every second).


--- TABLE 69 ---
ID | VIS-008 | Priority | P1
Title | Sound theme plays correct sounds | Automation | Integration with audio mock
Preconditions | Each theme (Warm, Minimal, Nature) | Each theme (Warm, Minimal, Nature) | Each theme (Warm, Minimal, Nature)
Steps | 1. Start session on each theme. 2. Complete session. | 1. Start session on each theme. 2. Complete session. | 1. Start session on each theme. 2. Complete session.
Expected Result | Warm: bell chime. Minimal: sine sweep. Nature: bird chirp. Correct sounds verified via Web Audio API spy. | Warm: bell chime. Minimal: sine sweep. Nature: bird chirp. Correct sounds verified via Web Audio API spy. | Warm: bell chime. Minimal: sine sweep. Nature: bird chirp. Correct sounds verified via Web Audio API spy.


--- TABLE 70 ---
ID | VIS-009 | Priority | P0
Title | Silent theme mutes all sounds | Automation | Playwright + audio spy
Preconditions | Silent theme selected | Silent theme selected | Silent theme selected
Steps | 1. Start and complete a session. | 1. Start and complete a session. | 1. Start and complete a session.
Expected Result | Zero audio output. Visual animations still play. All individual toggles grayed out. | Zero audio output. Visual animations still play. All individual toggles grayed out. | Zero audio output. Visual animations still play. All individual toggles grayed out.


--- TABLE 71 ---
ID | VIS-010 | Priority | P1
Title | Custom completion sound plays | Automation | Integration
Preconditions | User uploaded custom sound | User uploaded custom sound | User uploaded custom sound
Steps | 1. Complete a session. | 1. Complete a session. | 1. Complete a session.
Expected Result | Custom sound plays instead of theme default. Correct file from cloud storage. | Custom sound plays instead of theme default. Correct file from cloud storage. | Custom sound plays instead of theme default. Correct file from cloud storage.


--- TABLE 72 ---
ID | VIS-011 | Priority | P0
Title | Color Blind Mode adds patterns | Automation | Playwright + visual regression
Preconditions | Deuteranopia mode ON | Deuteranopia mode ON | Deuteranopia mode ON
Steps | 1. Focus mode: observe ring. 2. Break mode: observe ring. | 1. Focus mode: observe ring. 2. Break mode: observe ring. | 1. Focus mode: observe ring. 2. Break mode: observe ring.
Expected Result | Focus: solid ring stroke + sun icon. Break: dashed ring stroke + moon icon. Distinction is NOT color-only. | Focus: solid ring stroke + sun icon. Break: dashed ring stroke + moon icon. Distinction is NOT color-only. | Focus: solid ring stroke + sun icon. Break: dashed ring stroke + moon icon. Distinction is NOT color-only.


--- TABLE 73 ---
ID | VIS-012 | Priority | P1
Title | Dynamic favicon changes | Automation | Playwright
Preconditions | Timer running/paused/complete | Timer running/paused/complete | Timer running/paused/complete
Steps | 1. Start timer: check favicon. 2. Pause: check. 3. Complete: check. | 1. Start timer: check favicon. 2. Pause: check. 3. Complete: check. | 1. Start timer: check favicon. 2. Pause: check. 3. Complete: check.
Expected Result | Running: amber dot. Paused: gray dot. Complete: green checkmark. Favicon changes detected via link[rel=icon] src change. | Running: amber dot. Paused: gray dot. Complete: green checkmark. Favicon changes detected via link[rel=icon] src change. | Running: amber dot. Paused: gray dot. Complete: green checkmark. Favicon changes detected via link[rel=icon] src change.


--- TABLE 74 ---
ID | GOAL-001 | Priority | P0
Title | Daily goal increments on focus completion | Automation | Playwright
Preconditions | Goal: 4, completed: 0 | Goal: 4, completed: 0 | Goal: 4, completed: 0
Steps | 1. Complete a focus session. | 1. Complete a focus session. | 1. Complete a focus session.
Expected Result | Counter: 1/4. Progress bar: 25%. 'NO SESSIONS YET' replaced by indicator. | Counter: 1/4. Progress bar: 25%. 'NO SESSIONS YET' replaced by indicator. | Counter: 1/4. Progress bar: 25%. 'NO SESSIONS YET' replaced by indicator.


--- TABLE 75 ---
ID | GOAL-002 | Priority | P0
Title | Break does NOT increment goal | Automation | Integration
Preconditions | Goal: 4, completed: 2 | Goal: 4, completed: 2 | Goal: 4, completed: 2
Steps | 1. Complete a break session. | 1. Complete a break session. | 1. Complete a break session.
Expected Result | Counter stays at 2/4. Only focus sessions count. | Counter stays at 2/4. Only focus sessions count. | Counter stays at 2/4. Only focus sessions count.


--- TABLE 76 ---
ID | GOAL-003 | Priority | P0
Title | Goal met celebration | Automation | Playwright
Preconditions | Goal: 4, completing 4th session | Goal: 4, completing 4th session | Goal: 4, completing 4th session
Steps | 1. Complete 4th focus session. | 1. Complete 4th focus session. | 1. Complete 4th focus session.
Expected Result | Counter: 4/4 (green, checkmark). Progress bar 100%. Celebration animation (if Milestones ON). Goal Achievement Sound plays. | Counter: 4/4 (green, checkmark). Progress bar 100%. Celebration animation (if Milestones ON). Goal Achievement Sound plays. | Counter: 4/4 (green, checkmark). Progress bar 100%. Celebration animation (if Milestones ON). Goal Achievement Sound plays.


--- TABLE 77 ---
ID | GOAL-004 | Priority | P0
Title | Goal exceeded | Automation | Playwright
Preconditions | 5th focus session with goal of 4 | 5th focus session with goal of 4 | 5th focus session with goal of 4
Steps | 1. Complete 5th session. | 1. Complete 5th session. | 1. Complete 5th session.
Expected Result | Counter: 5/4. Progress bar 100% + overflow indicator. Still green. | Counter: 5/4. Progress bar 100% + overflow indicator. Still green. | Counter: 5/4. Progress bar 100% + overflow indicator. Still green.


--- TABLE 78 ---
ID | GOAL-005 | Priority | P0
Title | Goal changed mid-day | Automation | Playwright + Settings
Preconditions | 3 completed, goal changed from 4 to 6 | 3 completed, goal changed from 4 to 6 | 3 completed, goal changed from 4 to 6
Steps | 1. Go to Settings. 2. Change Daily Goal to 6. | 1. Go to Settings. 2. Change Daily Goal to 6. | 1. Go to Settings. 2. Change Daily Goal to 6.
Expected Result | Counter: 3/6. Progress bar: 50%. Completed count preserved. | Counter: 3/6. Progress bar: 50%. Completed count preserved. | Counter: 3/6. Progress bar: 50%. Completed count preserved.


--- TABLE 79 ---
ID | GOAL-006 | Priority | P1
Title | Goal reduced below completed | Automation | Integration
Preconditions | 5 completed, goal changed to 3 | 5 completed, goal changed to 3 | 5 completed, goal changed to 3
Steps | 1. Change goal to 3. | 1. Change goal to 3. | 1. Change goal to 3.
Expected Result | Counter: 5/3. Progress bar 100% + overflow. Day counts as 'goal met' for streak purposes. | Counter: 5/3. Progress bar 100% + overflow. Day counts as 'goal met' for streak purposes. | Counter: 5/3. Progress bar 100% + overflow. Day counts as 'goal met' for streak purposes.


--- TABLE 80 ---
ID | GOAL-007 | Priority | P0
Title | Daily reset at Day Reset Time | Automation | Integration with mocked time
Preconditions | Day Reset at midnight, user has 3 sessions | Day Reset at midnight, user has 3 sessions | Day Reset at midnight, user has 3 sessions
Steps | 1. Clock passes midnight. | 1. Clock passes midnight. | 1. Clock passes midnight.
Expected Result | Counter resets to 0/4. Streak continues (if qualified). Cycle resets. | Counter resets to 0/4. Streak continues (if qualified). Cycle resets. | Counter resets to 0/4. Streak continues (if qualified). Cycle resets.


--- TABLE 81 ---
ID | GOAL-008 | Priority | P0
Title | Cycle advances correctly | Automation | Playwright + visual
Preconditions | Default 4-cycle, completing each session | Default 4-cycle, completing each session | Default 4-cycle, completing each session
Steps | 1. Complete Focus 1. 2. Complete Break. 3. Continue through cycle. | 1. Complete Focus 1. 2. Complete Break. 3. Continue through cycle. | 1. Complete Focus 1. 2. Complete Break. 3. Continue through cycle.
Expected Result | Focus → Break → Focus → Break → Focus → Break → Focus → Long Break. Cycle counter: 'CYCLE 1.' After Long Break: 'CYCLE 2.' Dots fill progressively. | Focus → Break → Focus → Break → Focus → Break → Focus → Long Break. Cycle counter: 'CYCLE 1.' After Long Break: 'CYCLE 2.' Dots fill progressively. | Focus → Break → Focus → Break → Focus → Break → Focus → Long Break. Cycle counter: 'CYCLE 1.' After Long Break: 'CYCLE 2.' Dots fill progressively.


--- TABLE 82 ---
ID | GOAL-009 | Priority | P1
Title | Skipped break handling in cycle | Automation | Playwright
Preconditions | User skips break (Focus → Focus) | User skips break (Focus → Focus) | User skips break (Focus → Focus)
Steps | 1. Complete Focus 1. 2. Instead of Break, manually start Focus 2. | 1. Complete Focus 1. 2. Instead of Break, manually start Focus 2. | 1. Complete Focus 1. 2. Instead of Break, manually start Focus 2.
Expected Result | Break dot remains unfilled. Focus 2 dot fills. Cycle continues logically. | Break dot remains unfilled. Focus 2 dot fills. Cycle continues logically. | Break dot remains unfilled. Focus 2 dot fills. Cycle continues logically.


--- TABLE 83 ---
ID | INT-001 | Priority | P0
Title | Intent saved with session | Automation | Integration
Preconditions | Intent: 'Restock PRD' | Intent: 'Restock PRD' | Intent: 'Restock PRD'
Steps | 1. Type intent. 2. Start and complete session. | 1. Type intent. 2. Start and complete session. | 1. Type intent. 2. Start and complete session.
Expected Result | Session record includes intent='Restock PRD'. Intent field resets to placeholder on completion. | Session record includes intent='Restock PRD'. Intent field resets to placeholder on completion. | Session record includes intent='Restock PRD'. Intent field resets to placeholder on completion.


--- TABLE 84 ---
ID | INT-002 | Priority | P0
Title | Empty intent is valid | Automation | Integration
Preconditions | No intent typed | No intent typed | No intent typed
Steps | 1. Start and complete session. | 1. Start and complete session. | 1. Start and complete session.
Expected Result | Session logged with intent=null. No validation error. No prompt. | Session logged with intent=null. No validation error. No prompt. | Session logged with intent=null. No validation error. No prompt.


--- TABLE 85 ---
ID | INT-003 | Priority | P0
Title | Intent max length (120 chars) | Automation | Playwright
Preconditions | Type 121 characters | Type 121 characters | Type 121 characters
Steps | 1. Type 121 chars into intent field. | 1. Type 121 chars into intent field. | 1. Type 121 chars into intent field.
Expected Result | Input stops accepting at 120 chars. Counter shows '120/120' in red. | Input stops accepting at 120 chars. Counter shows '120/120' in red. | Input stops accepting at 120 chars. Counter shows '120/120' in red.


--- TABLE 86 ---
ID | INT-004 | Priority | P0
Title | Autocomplete suggests from history | Automation | Playwright
Preconditions | User has 3 prior sessions with 'Restock' | User has 3 prior sessions with 'Restock' | User has 3 prior sessions with 'Restock'
Steps | 1. Type 'Res' in intent field. | 1. Type 'Res' in intent field. | 1. Type 'Res' in intent field.
Expected Result | Dropdown shows 'Restock PRD (×3)'. Arrow keys navigate. Enter selects. Escape dismisses. | Dropdown shows 'Restock PRD (×3)'. Arrow keys navigate. Enter selects. Escape dismisses. | Dropdown shows 'Restock PRD (×3)'. Arrow keys navigate. Enter selects. Escape dismisses.


--- TABLE 87 ---
ID | INT-005 | Priority | P1
Title | Intent with emoji | Automation | Integration
Preconditions | Intent: '🚀 Launch prep' | Intent: '🚀 Launch prep' | Intent: '🚀 Launch prep'
Steps | 1. Type emoji intent. 2. Complete session. | 1. Type emoji intent. 2. Complete session. | 1. Type emoji intent. 2. Complete session.
Expected Result | Intent saved correctly. Displays in Session Log. CSV export handles UTF-8 with BOM. | Intent saved correctly. Displays in Session Log. CSV export handles UTF-8 with BOM. | Intent saved correctly. Displays in Session Log. CSV export handles UTF-8 with BOM.


--- TABLE 88 ---
ID | INT-006 | Priority | P1
Title | Intent with RTL text | Automation | Integration + visual
Preconditions | Intent in Arabic | Intent in Arabic | Intent in Arabic
Steps | 1. Type Arabic intent. 2. Complete session. | 1. Type Arabic intent. 2. Complete session. | 1. Type Arabic intent. 2. Complete session.
Expected Result | Text renders RTL via CSS direction:auto. Saved and displayed correctly. | Text renders RTL via CSS direction:auto. Saved and displayed correctly. | Text renders RTL via CSS direction:auto. Saved and displayed correctly.


--- TABLE 89 ---
ID | INT-007 | Priority | P0
Title | Category selection persists as default | Automation | Playwright
Preconditions | Select 'Work' category | Select 'Work' category | Select 'Work' category
Steps | 1. Select Work. 2. Complete session. 3. Start new session. | 1. Select Work. 2. Complete session. 3. Start new session. | 1. Select Work. 2. Complete session. 3. Start new session.
Expected Result | New session pre-selects 'Work' as default category. | New session pre-selects 'Work' as default category. | New session pre-selects 'Work' as default category.


--- TABLE 90 ---
ID | INT-008 | Priority | P0
Title | Create new category inline | Automation | Playwright
Preconditions | 19 existing categories | 19 existing categories | 19 existing categories
Steps | 1. Tap category button. 2. Tap '+ New Category'. 3. Type 'Research'. 4. Confirm. | 1. Tap category button. 2. Tap '+ New Category'. 3. Type 'Research'. 4. Confirm. | 1. Tap category button. 2. Tap '+ New Category'. 3. Type 'Research'. 4. Confirm.
Expected Result | Category created. Dropdown now shows 'Research'. Category count: 20. '+ New Category' becomes disabled: 'Limit reached (20/20)'. | Category created. Dropdown now shows 'Research'. Category count: 20. '+ New Category' becomes disabled: 'Limit reached (20/20)'. | Category created. Dropdown now shows 'Research'. Category count: 20. '+ New Category' becomes disabled: 'Limit reached (20/20)'.


--- TABLE 91 ---
ID | INT-009 | Priority | P0
Title | Category duplicate validation | Automation | Playwright
Preconditions | Category 'Work' exists | Category 'Work' exists | Category 'Work' exists
Steps | 1. Try to create 'Work' again. | 1. Try to create 'Work' again. | 1. Try to create 'Work' again.
Expected Result | Inline validation: 'Category already exists' (red text). Cannot confirm. | Inline validation: 'Category already exists' (red text). Cannot confirm. | Inline validation: 'Category already exists' (red text). Cannot confirm.


--- TABLE 92 ---
ID | INT-010 | Priority | P1
Title | Delete last category auto-restores General | Automation | Integration
Preconditions | Only 'Creative' remains | Only 'Creative' remains | Only 'Creative' remains
Steps | 1. Delete 'Creative'. | 1. Delete 'Creative'. | 1. Delete 'Creative'.
Expected Result | 'General' auto-created with toast: 'At least one category is required.' Category list shows General. | 'General' auto-created with toast: 'At least one category is required.' Category list shows General. | 'General' auto-created with toast: 'At least one category is required.' Category list shows General.


--- TABLE 93 ---
ID | INT-011 | Priority | P0
Title | Intent editable mid-session | Automation | Playwright
Preconditions | Timer running | Timer running | Timer running
Steps | 1. Start session with intent 'Draft'. 2. Change to 'Final Draft' while running. | 1. Start session with intent 'Draft'. 2. Change to 'Final Draft' while running. | 1. Start session with intent 'Draft'. 2. Change to 'Final Draft' while running.
Expected Result | Intent updates in real-time on server (debounced 500ms). Session record shows 'Final Draft' on completion. | Intent updates in real-time on server (debounced 500ms). Session record shows 'Final Draft' on completion. | Intent updates in real-time on server (debounced 500ms). Session record shows 'Final Draft' on completion.


--- TABLE 94 ---
ID | SET-001 | Priority | P0
Title | Settings auto-save | Automation | Playwright + KV assertion
Preconditions | Change Focus to 30 min | Change Focus to 30 min | Change Focus to 30 min
Steps | 1. Navigate to Settings. 2. Change Focus from 25 to 30. 3. Wait 1 second. | 1. Navigate to Settings. 2. Change Focus from 25 to 30. 3. Wait 1 second. | 1. Navigate to Settings. 2. Change Focus from 25 to 30. 3. Wait 1 second.
Expected Result | Toast: 'Settings saved.' KV updated with focusDuration=30. No Save button needed. | Toast: 'Settings saved.' KV updated with focusDuration=30. No Save button needed. | Toast: 'Settings saved.' KV updated with focusDuration=30. No Save button needed.


--- TABLE 95 ---
ID | SET-002 | Priority | P0
Title | Settings sync cross-device | Automation | Playwright multi-context
Preconditions | Change Focus on Device A | Change Focus on Device A | Change Focus on Device A
Steps | 1. Change Focus to 30 on Device A. 2. Check Device B within 10 seconds. | 1. Change Focus to 30 on Device A. 2. Check Device B within 10 seconds. | 1. Change Focus to 30 on Device A. 2. Check Device B within 10 seconds.
Expected Result | Device B shows Focus = 30 (synced via polling). Timer page on B shows 30:00 in idle. | Device B shows Focus = 30 (synced via polling). Timer page on B shows 30:00 in idle. | Device B shows Focus = 30 (synced via polling). Timer page on B shows 30:00 in idle.


--- TABLE 96 ---
ID | SET-003 | Priority | P0
Title | Settings save failure + retry | Automation | Playwright with network mock
Preconditions | Network disconnected during save | Network disconnected during save | Network disconnected during save
Steps | 1. Disconnect network. 2. Change Focus to 35. 3. Observe. | 1. Disconnect network. 2. Change Focus to 35. 3. Observe. | 1. Disconnect network. 2. Change Focus to 35. 3. Observe.
Expected Result | Toast: 'Couldn't save. Retrying...' 3 retry attempts. If all fail: 'Changes will sync when you're back online.' Value queued. On reconnect: auto-synced. | Toast: 'Couldn't save. Retrying...' 3 retry attempts. If all fail: 'Changes will sync when you're back online.' Value queued. On reconnect: auto-synced. | Toast: 'Couldn't save. Retrying...' 3 retry attempts. If all fail: 'Changes will sync when you're back online.' Value queued. On reconnect: auto-synced.


--- TABLE 97 ---
ID | SET-004 | Priority | P0
Title | Focus Duration change while timer running | Automation | Playwright
Preconditions | Timer running at 18:00, change Focus to 30 | Timer running at 18:00, change Focus to 30 | Timer running at 18:00, change Focus to 30
Steps | 1. Go to Settings. 2. Change Focus to 30. | 1. Go to Settings. 2. Change Focus to 30. | 1. Go to Settings. 2. Change Focus to 30.
Expected Result | Modal: 'Apply to current session (resets timer) or next session?' Apply Now: timer resets to 30:00. Next Session: timer continues at current time with old duration. | Modal: 'Apply to current session (resets timer) or next session?' Apply Now: timer resets to 30:00. Next Session: timer continues at current time with old duration. | Modal: 'Apply to current session (resets timer) or next session?' Apply Now: timer resets to 30:00. Next Session: timer continues at current time with old duration.


--- TABLE 98 ---
ID | SET-005 | Priority | P0
Title | Theme switch Light/Dark/System | Automation | Playwright + CSS assertion
Preconditions | Switch to each theme | Switch to each theme | Switch to each theme
Steps | 1. Select Light. 2. Select Dark. 3. Select System. | 1. Select Light. 2. Select Dark. 3. Select System. | 1. Select Light. 2. Select Dark. 3. Select System.
Expected Result | Light: white background, dark text. Dark: black background, white text. System: follows OS preference. 300ms crossfade on each switch. | Light: white background, dark text. Dark: black background, white text. System: follows OS preference. 300ms crossfade on each switch. | Light: white background, dark text. Dark: black background, white text. System: follows OS preference. 300ms crossfade on each switch.


--- TABLE 99 ---
ID | SET-006 | Priority | P0
Title | Light theme amber contrast | Automation | axe-core + CSS computed style
Preconditions | Light theme with Amber accent | Light theme with Amber accent | Light theme with Amber accent
Steps | 1. Switch to Light. 2. Check small amber text. | 1. Switch to Light. 2. Check small amber text. | 1. Switch to Light. 2. Check small amber text.
Expected Result | Small text amber auto-darkens to #B45309 for WCAG AA contrast (4.5:1 on white). axe-core reports no contrast violations. | Small text amber auto-darkens to #B45309 for WCAG AA contrast (4.5:1 on white). axe-core reports no contrast violations. | Small text amber auto-darkens to #B45309 for WCAG AA contrast (4.5:1 on white). axe-core reports no contrast violations.


--- TABLE 100 ---
ID | SET-007 | Priority | P0
Title | Reduced Motion cascading | Automation | Playwright
Preconditions | Enable Reduced Motion | Enable Reduced Motion | Enable Reduced Motion
Steps | 1. Toggle Reduced Motion ON. 2. Check Completion Animation Intensity. | 1. Toggle Reduced Motion ON. 2. Check Completion Animation Intensity. | 1. Toggle Reduced Motion ON. 2. Check Completion Animation Intensity.
Expected Result | Intensity slider automatically disabled and grayed out. All animations disabled globally. Clock font degrades from Flip Clock to Minimal. | Intensity slider automatically disabled and grayed out. All animations disabled globally. Clock font degrades from Flip Clock to Minimal. | Intensity slider automatically disabled and grayed out. All animations disabled globally. Clock font degrades from Flip Clock to Minimal.


--- TABLE 101 ---
ID | SET-008 | Priority | P0
Title | All steppers respect range limits | Automation | Playwright
Preconditions | Focus stepper | Focus stepper | Focus stepper
Steps | 1. Click + to go above 120. 2. Click – to go below 1. 3. Type '999'. 4. Type 'abc'. | 1. Click + to go above 120. 2. Click – to go below 1. 3. Type '999'. 4. Type 'abc'. | 1. Click + to go above 120. 2. Click – to go below 1. 3. Type '999'. 4. Type 'abc'.
Expected Result | +: snaps to 120 with tooltip. –: snaps to 1. '999': snaps to 120. 'abc': reverts to previous value. | +: snaps to 120 with tooltip. –: snaps to 1. '999': snaps to 120. 'abc': reverts to previous value. | +: snaps to 120 with tooltip. –: snaps to 1. '999': snaps to 120. 'abc': reverts to previous value.


--- TABLE 102 ---
ID | SET-009 | Priority | P0
Title | Import blocks during active session | Automation | Playwright
Preconditions | Timer running, user tries import | Timer running, user tries import | Timer running, user tries import
Steps | 1. Start timer. 2. Go to Settings. 3. Click Import. | 1. Start timer. 2. Go to Settings. 3. Click Import. | 1. Start timer. 2. Go to Settings. 3. Click Import.
Expected Result | Modal: 'Please wait for your current session to complete before importing settings.' Import button disabled. | Modal: 'Please wait for your current session to complete before importing settings.' Import button disabled. | Modal: 'Please wait for your current session to complete before importing settings.' Import button disabled.


--- TABLE 103 ---
ID | SET-010 | Priority | P0
Title | Import from different user | Automation | Integration
Preconditions | Upload backup with mismatched userId | Upload backup with mismatched userId | Upload backup with mismatched userId
Steps | 1. Click Import. 2. Select JSON from different user. | 1. Click Import. 2. Select JSON from different user. | 1. Click Import. 2. Select JSON from different user.
Expected Result | Warning: 'This backup belongs to a different account. Importing will overwrite your data.' Double confirmation required. | Warning: 'This backup belongs to a different account. Importing will overwrite your data.' Double confirmation required. | Warning: 'This backup belongs to a different account. Importing will overwrite your data.' Double confirmation required.


--- TABLE 104 ---
ID | SET-011 | Priority | P1
Title | Import with newer schema version | Automation | Integration
Preconditions | Upload backup with schemaVersion > current app | Upload backup with schemaVersion > current app | Upload backup with schemaVersion > current app
Steps | 1. Import backup from future version. | 1. Import backup from future version. | 1. Import backup from future version.
Expected Result | Rejected: 'This backup is from a newer version of Becoming.. Please update the app first.' | Rejected: 'This backup is from a newer version of Becoming.. Please update the app first.' | Rejected: 'This backup is from a newer version of Becoming.. Please update the app first.'


--- TABLE 105 ---
ID | SET-012 | Priority | P0
Title | Delete Account with running timer | Automation | Integration
Preconditions | Timer running, user deletes account | Timer running, user deletes account | Timer running, user deletes account
Steps | 1. Start timer. 2. Navigate to Settings. 3. Delete Account. | 1. Start timer. 2. Navigate to Settings. 3. Delete Account. | 1. Start timer. 2. Navigate to Settings. 3. Delete Account.
Expected Result | Timer marked abandoned. All KV data purged. OAuth revoked. Beta counter decremented. Redirect to login. | Timer marked abandoned. All KV data purged. OAuth revoked. Beta counter decremented. Redirect to login. | Timer marked abandoned. All KV data purged. OAuth revoked. Beta counter decremented. Redirect to login.


--- TABLE 106 ---
ID | SET-013 | Priority | P0
Title | Reset to Factory preserves sessions | Automation | Integration
Preconditions | User has 50 sessions + custom settings | User has 50 sessions + custom settings | User has 50 sessions + custom settings
Steps | 1. Click Reset to Factory. 2. Confirm. | 1. Click Reset to Factory. 2. Confirm. | 1. Click Reset to Factory. 2. Confirm.
Expected Result | Settings revert to defaults. Sessions: all 50 preserved. Streak preserved. Categories reset to defaults. Toast: 'Settings restored to defaults.' | Settings revert to defaults. Sessions: all 50 preserved. Streak preserved. Categories reset to defaults. Toast: 'Settings restored to defaults.' | Settings revert to defaults. Sessions: all 50 preserved. Streak preserved. Categories reset to defaults. Toast: 'Settings restored to defaults.'


--- TABLE 107 ---
ID | SET-014 | Priority | P1
Title | Day Reset Time change mid-day | Automation | Integration with mocked time
Preconditions | Change from midnight to 4AM at 2AM | Change from midnight to 4AM at 2AM | Change from midnight to 4AM at 2AM
Steps | 1. Change Day Reset to 4AM. | 1. Change Day Reset to 4AM. | 1. Change Day Reset to 4AM.
Expected Result | Confirmation: 'May affect today's stats.' Today's stats recalculated with new boundary. Sessions re-bucketed. | Confirmation: 'May affect today's stats.' Today's stats recalculated with new boundary. Sessions re-bucketed. | Confirmation: 'May affect today's stats.' Today's stats recalculated with new boundary. Sessions re-bucketed.


--- TABLE 108 ---
ID | SET-015 | Priority | P0
Title | Streak recalculation on rule change | Automation | Integration
Preconditions | Change from '1 session' to 'Meet daily goal' | Change from '1 session' to 'Meet daily goal' | Change from '1 session' to 'Meet daily goal'
Steps | 1. Change Streak Calculation Rule. | 1. Change Streak Calculation Rule. | 1. Change Streak Calculation Rule.
Expected Result | Preview: 'Your streak would change from 12 to 8 days. Apply?' On confirm: streak recalculated from full history. Dashboard/stats update. | Preview: 'Your streak would change from 12 to 8 days. Apply?' On confirm: streak recalculated from full history. Dashboard/stats update. | Preview: 'Your streak would change from 12 to 8 days. Apply?' On confirm: streak recalculated from full history. Dashboard/stats update.


--- TABLE 109 ---
ID | DASH-001 | Priority | P0
Title | Dashboard loads with correct stats | Automation | Playwright
Preconditions | User with 10 sessions, 3 today | User with 10 sessions, 3 today | User with 10 sessions, 3 today
Steps | 1. Navigate to Dashboard. | 1. Navigate to Dashboard. | 1. Navigate to Dashboard.
Expected Result | FOCUS TODAY: 3. ALL TIME: 10. TOTAL HOURS: correct. STREAK: correct. Stats animate on first load (count up from 0). | FOCUS TODAY: 3. ALL TIME: 10. TOTAL HOURS: correct. STREAK: correct. Stats animate on first load (count up from 0). | FOCUS TODAY: 3. ALL TIME: 10. TOTAL HOURS: correct. STREAK: correct. Stats animate on first load (count up from 0).


--- TABLE 110 ---
ID | DASH-002 | Priority | P0
Title | Dashboard empty state | Automation | Playwright + visual regression
Preconditions | New user, zero sessions | New user, zero sessions | New user, zero sessions
Steps | 1. Navigate to Dashboard. | 1. Navigate to Dashboard. | 1. Navigate to Dashboard.
Expected Result | All stats show 0 or '—'. Each chart shows encouraging empty state with 'Go to Timer' link. No blank cards. | All stats show 0 or '—'. Each chart shows encouraging empty state with 'Go to Timer' link. No blank cards. | All stats show 0 or '—'. Each chart shows encouraging empty state with 'Go to Timer' link. No blank cards.


--- TABLE 111 ---
ID | DASH-003 | Priority | P0
Title | Focus Hours chart 7D view | Automation | Playwright
Preconditions | User with 7 days of data | User with 7 days of data | User with 7 days of data
Steps | 1. Check chart with 7D selected (default). | 1. Check chart with 7D selected (default). | 1. Check chart with 7D selected (default).
Expected Result | 7 bars showing today + 6 prior days. Today's bar: pulsing glow. Correct day labels + dates. Hover shows tooltip. | 7 bars showing today + 6 prior days. Today's bar: pulsing glow. Correct day labels + dates. Hover shows tooltip. | 7 bars showing today + 6 prior days. Today's bar: pulsing glow. Correct day labels + dates. Hover shows tooltip.


--- TABLE 112 ---
ID | DASH-004 | Priority | P0
Title | Chart time range switching | Automation | Playwright + visual
Preconditions | Switch from 7D to 30D | Switch from 7D to 30D | Switch from 7D to 30D
Steps | 1. Click 30D button. | 1. Click 30D button. | 1. Click 30D button.
Expected Result | Chart animates to 30 bars. Previous bars morph. New bars appear. Category Breakdown syncs to same range. | Chart animates to 30 bars. Previous bars morph. New bars appear. Category Breakdown syncs to same range. | Chart animates to 30 bars. Previous bars morph. New bars appear. Category Breakdown syncs to same range.


--- TABLE 113 ---
ID | DASH-005 | Priority | P0
Title | Dashboard updates on session completion (cross-device) | Automation | Playwright multi-context
Preconditions | Dashboard open, session completes on other device | Dashboard open, session completes on other device | Dashboard open, session completes on other device
Steps | 1. Open Dashboard on Device A. 2. Complete session on Device B. | 1. Open Dashboard on Device A. 2. Complete session on Device B. | 1. Open Dashboard on Device A. 2. Complete session on Device B.
Expected Result | Dashboard A updates within 30 seconds. FOCUS TODAY increments. Chart bar grows. No page refresh needed. | Dashboard A updates within 30 seconds. FOCUS TODAY increments. Chart bar grows. No page refresh needed. | Dashboard A updates within 30 seconds. FOCUS TODAY increments. Chart bar grows. No page refresh needed.


--- TABLE 114 ---
ID | DASH-006 | Priority | P0
Title | Activity heatmap correct coloring | Automation | Playwright + CSS assertion
Preconditions | User with varied session counts | User with varied session counts | User with varied session counts
Steps | 1. Check heatmap cells. | 1. Check heatmap cells. | 1. Check heatmap cells.
Expected Result | 0 sessions: dark. 1: 25% amber. 2: 50%. 3: 75%. 4+: 100%. Today: amber border. Streak days: green bottom border. Rest days: snowflake indicator. | 0 sessions: dark. 1: 25% amber. 2: 50%. 3: 75%. 4+: 100%. Today: amber border. Streak days: green bottom border. Rest days: snowflake indicator. | 0 sessions: dark. 1: 25% amber. 2: 50%. 3: 75%. 4+: 100%. Today: amber border. Streak days: green bottom border. Rest days: snowflake indicator.


--- TABLE 115 ---
ID | DASH-007 | Priority | P1
Title | Milestone badge earned | Automation | Integration + Playwright
Preconditions | User completes 100th session | User completes 100th session | User completes 100th session
Steps | 1. Complete 100th all-time session. | 1. Complete 100th all-time session. | 1. Complete 100th all-time session.
Expected Result | 'Century' badge appears in Milestones section (full color + glow). Milestone Sound plays (if enabled). Badge detail modal shows date earned. | 'Century' badge appears in Milestones section (full color + glow). Milestone Sound plays (if enabled). Badge detail modal shows date earned. | 'Century' badge appears in Milestones section (full color + glow). Milestone Sound plays (if enabled). Badge detail modal shows date earned.


--- TABLE 116 ---
ID | LOG-001 | Priority | P0
Title | Only completed sessions shown | Automation | Playwright
Preconditions | User has 5 completed + 3 abandoned | User has 5 completed + 3 abandoned | User has 5 completed + 3 abandoned
Steps | 1. Navigate to Session Log. | 1. Navigate to Session Log. | 1. Navigate to Session Log.
Expected Result | Shows 5 rows. Abandoned sessions not visible. 'Show Abandoned' toggle: OFF. | Shows 5 rows. Abandoned sessions not visible. 'Show Abandoned' toggle: OFF. | Shows 5 rows. Abandoned sessions not visible. 'Show Abandoned' toggle: OFF.


--- TABLE 117 ---
ID | LOG-002 | Priority | P0
Title | Show abandoned toggle | Automation | Playwright
Preconditions | Toggle Show Abandoned ON | Toggle Show Abandoned ON | Toggle Show Abandoned ON
Steps | 1. Toggle ON. | 1. Toggle ON. | 1. Toggle ON.
Expected Result | Table shows 8 rows. Abandoned: '✗ ABANDONED' in red with reason tooltip. Completed: '✓ COMPLETED' in green. | Table shows 8 rows. Abandoned: '✗ ABANDONED' in red with reason tooltip. Completed: '✓ COMPLETED' in green. | Table shows 8 rows. Abandoned: '✗ ABANDONED' in red with reason tooltip. Completed: '✓ COMPLETED' in green.


--- TABLE 118 ---
ID | LOG-003 | Priority | P0
Title | Column INTENT (not TASK) | Automation | Playwright text assertion
Preconditions | Navigate to Session Log | Navigate to Session Log | Navigate to Session Log
Steps | 1. Check column headers. | 1. Check column headers. | 1. Check column headers.
Expected Result | Column header reads 'INTENT' not 'TASK'. This validates the rename from the PRD contradiction fix. | Column header reads 'INTENT' not 'TASK'. This validates the rename from the PRD contradiction fix. | Column header reads 'INTENT' not 'TASK'. This validates the rename from the PRD contradiction fix.


--- TABLE 119 ---
ID | LOG-004 | Priority | P0
Title | BREAK and LONG BREAK separated in filter | Automation | Playwright
Preconditions | Check type filter options | Check type filter options | Check type filter options
Steps | 1. Observe filter bar. | 1. Observe filter bar. | 1. Observe filter bar.
Expected Result | Four options: ALL | FOCUS | BREAK | LONG BREAK. Not three (BREAK was previously lumped). Contradiction fix validated. | Four options: ALL | FOCUS | BREAK | LONG BREAK. Not three (BREAK was previously lumped). Contradiction fix validated. | Four options: ALL | FOCUS | BREAK | LONG BREAK. Not three (BREAK was previously lumped). Contradiction fix validated.


--- TABLE 120 ---
ID | LOG-005 | Priority | P0
Title | Filter combination (AND) | Automation | Playwright
Preconditions | Type: FOCUS, Category: Work, Date: Last 7 Days | Type: FOCUS, Category: Work, Date: Last 7 Days | Type: FOCUS, Category: Work, Date: Last 7 Days
Steps | 1. Set all three filters. | 1. Set all three filters. | 1. Set all three filters.
Expected Result | Only sessions matching ALL criteria shown. Clear All Filters link visible. | Only sessions matching ALL criteria shown. Clear All Filters link visible. | Only sessions matching ALL criteria shown. Clear All Filters link visible.


--- TABLE 121 ---
ID | LOG-006 | Priority | P0
Title | Search intents | Automation | Playwright
Preconditions | Type 'PRD' in search | Type 'PRD' in search | Type 'PRD' in search
Steps | 1. Type 'PRD'. | 1. Type 'PRD'. | 1. Type 'PRD'.
Expected Result | Only sessions with 'PRD' in intent shown. Matching text highlighted in amber. | Only sessions with 'PRD' in intent shown. Matching text highlighted in amber. | Only sessions with 'PRD' in intent shown. Matching text highlighted in amber.


--- TABLE 122 ---
ID | LOG-007 | Priority | P0
Title | Edit intent after session | Automation | Playwright
Preconditions | Session with intent 'Draft' | Session with intent 'Draft' | Session with intent 'Draft'
Steps | 1. Click kebab menu. 2. Click Edit Intent. 3. Change to 'Final Draft'. 4. Confirm. | 1. Click kebab menu. 2. Click Edit Intent. 3. Change to 'Final Draft'. 4. Confirm. | 1. Click kebab menu. 2. Click Edit Intent. 3. Change to 'Final Draft'. 4. Confirm.
Expected Result | Intent updated. Auto-saved. Edit timestamp recorded server-side. | Intent updated. Auto-saved. Edit timestamp recorded server-side. | Intent updated. Auto-saved. Edit timestamp recorded server-side.


--- TABLE 123 ---
ID | LOG-008 | Priority | P0
Title | Delete single session | Automation | Playwright + KV
Preconditions | Session exists | Session exists | Session exists
Steps | 1. Kebab > Delete. 2. Confirmation. | 1. Kebab > Delete. 2. Confirmation. | 1. Kebab > Delete. 2. Confirmation.
Expected Result | Session removed from view. Stats recalculated (daily goal may change). Soft delete server-side (30-day retention). | Session removed from view. Stats recalculated (daily goal may change). Soft delete server-side (30-day retention). | Session removed from view. Stats recalculated (daily goal may change). Soft delete server-side (30-day retention).


--- TABLE 124 ---
ID | LOG-009 | Priority | P0
Title | Bulk delete 10+ sessions | Automation | Playwright
Preconditions | Select 12 sessions | Select 12 sessions | Select 12 sessions
Steps | 1. Enter select mode. 2. Check 12 sessions. 3. Click Delete. | 1. Enter select mode. 2. Check 12 sessions. 3. Click Delete. | 1. Enter select mode. 2. Check 12 sessions. 3. Click Delete.
Expected Result | Must type 'DELETE' to confirm (> 10 threshold). All 12 removed. Stats recalculated. | Must type 'DELETE' to confirm (> 10 threshold). All 12 removed. Stats recalculated. | Must type 'DELETE' to confirm (> 10 threshold). All 12 removed. Stats recalculated.


--- TABLE 125 ---
ID | LOG-010 | Priority | P1
Title | Export during active session excludes running | Automation | Playwright
Preconditions | Timer running, export CSV | Timer running, export CSV | Timer running, export CSV
Steps | 1. Start timer. 2. Export from Session Log. | 1. Start timer. 2. Export from Session Log. | 1. Start timer. 2. Export from Session Log.
Expected Result | Running session NOT included. Note: 'Your current running session is not included.' | Running session NOT included. Note: 'Your current running session is not included.' | Running session NOT included. Note: 'Your current running session is not included.'


--- TABLE 126 ---
ID | LOG-011 | Priority | P0
Title | Infinite scroll pagination | Automation | Playwright
Preconditions | 150 sessions | 150 sessions | 150 sessions
Steps | 1. Scroll to bottom. | 1. Scroll to bottom. | 1. Scroll to bottom.
Expected Result | First load: 50. Scroll near bottom: spinner, 25 more append. 'Showing 75 of 150.' Continue to 150. 'Showing all 150.' | First load: 50. Scroll near bottom: spinner, 25 more append. 'Showing 75 of 150.' Continue to 150. 'Showing all 150.' | First load: 50. Scroll near bottom: spinner, 25 more append. 'Showing 75 of 150.' Continue to 150. 'Showing all 150.'


--- TABLE 127 ---
ID | LOG-012 | Priority | P0
Title | New session appears in real-time | Automation | Playwright multi-context
Preconditions | Log open, session completes on other device | Log open, session completes on other device | Log open, session completes on other device
Steps | 1. Complete session on Device B. | 1. Complete session on Device B. | 1. Complete session on Device B.
Expected Result | Within 10 seconds: new row slides in at top with amber glow. If scrolled down: 'New session logged. Scroll to top' banner. | Within 10 seconds: new row slides in at top with amber glow. If scrolled down: 'New session logged. Scroll to top' banner. | Within 10 seconds: new row slides in at top with amber glow. If scrolled down: 'New session logged. Scroll to top' banner.


--- TABLE 128 ---
ID | ADM-001 | Priority | P0
Title | Regular user cannot access admin | Automation | Playwright
Preconditions | Regular user (role='user') | Regular user (role='user') | Regular user (role='user')
Steps | 1. Navigate to /admin/analytics. | 1. Navigate to /admin/analytics. | 1. Navigate to /admin/analytics.
Expected Result | 403 page: 'You don't have access.' No ADMIN section in sidebar. | 403 page: 'You don't have access.' No ADMIN section in sidebar. | 403 page: 'You don't have access.' No ADMIN section in sidebar.


--- TABLE 129 ---
ID | ADM-002 | Priority | P0
Title | Admin sees ADMIN section | Automation | Playwright
Preconditions | Admin user | Admin user | Admin user
Steps | 1. Login as admin. 2. Check sidebar. | 1. Login as admin. 2. Check sidebar. | 1. Login as admin. 2. Check sidebar.
Expected Result | ADMIN section visible: Analytics, User Management, Feedback. Audit Log and System Health NOT visible. | ADMIN section visible: Analytics, User Management, Feedback. Audit Log and System Health NOT visible. | ADMIN section visible: Analytics, User Management, Feedback. Audit Log and System Health NOT visible.


--- TABLE 130 ---
ID | ADM-003 | Priority | P0
Title | Super Admin sees all admin items | Automation | Playwright
Preconditions | Super Admin | Super Admin | Super Admin
Steps | 1. Login. 2. Check sidebar. | 1. Login. 2. Check sidebar. | 1. Login. 2. Check sidebar.
Expected Result | Full ADMIN section: Analytics, User Management, Feedback, Audit Log, System Health. | Full ADMIN section: Analytics, User Management, Feedback, Audit Log, System Health. | Full ADMIN section: Analytics, User Management, Feedback, Audit Log, System Health.


--- TABLE 131 ---
ID | ADM-004 | Priority | P0
Title | Promote user to Admin | Automation | Playwright + KV
Preconditions | Super Admin, regular user exists | Super Admin, regular user exists | Super Admin, regular user exists
Steps | 1. User Management > User row > Actions > Promote to Admin. | 1. User Management > User row > Actions > Promote to Admin. | 1. User Management > User row > Actions > Promote to Admin.
Expected Result | Confirmation. User's role changes to 'admin'. Audit log entry created. User sees ADMIN section on next page load. | Confirmation. User's role changes to 'admin'. Audit log entry created. User sees ADMIN section on next page load. | Confirmation. User's role changes to 'admin'. Audit log entry created. User sees ADMIN section on next page load.


--- TABLE 132 ---
ID | ADM-005 | Priority | P0
Title | Demote admin during active session | Automation | Playwright multi-user
Preconditions | Admin viewing Analytics, Super Admin demotes them | Admin viewing Analytics, Super Admin demotes them | Admin viewing Analytics, Super Admin demotes them
Steps | 1. Super Admin demotes. 2. Admin makes next API call. | 1. Super Admin demotes. 2. Admin makes next API call. | 1. Super Admin demotes. 2. Admin makes next API call.
Expected Result | API returns 403. Admin UI: 'Your admin access has been revoked.' ADMIN section disappears. Redirect to Timer. | API returns 403. Admin UI: 'Your admin access has been revoked.' ADMIN section disappears. Redirect to Timer. | API returns 403. Admin UI: 'Your admin access has been revoked.' ADMIN section disappears. Redirect to Timer.


--- TABLE 133 ---
ID | ADM-006 | Priority | P0
Title | Super Admin cannot self-delete | Automation | Playwright
Preconditions | Super Admin on own profile | Super Admin on own profile | Super Admin on own profile
Steps | 1. Click Actions on own row. | 1. Click Actions on own row. | 1. Click Actions on own row.
Expected Result | Actions dropdown shows no destructive options. Self-delete/self-demote disabled with tooltip: 'Cannot modify your own Super Admin account.' | Actions dropdown shows no destructive options. Self-delete/self-demote disabled with tooltip: 'Cannot modify your own Super Admin account.' | Actions dropdown shows no destructive options. Self-delete/self-demote disabled with tooltip: 'Cannot modify your own Super Admin account.'


--- TABLE 134 ---
ID | ADM-007 | Priority | P0
Title | Beta cap reduced below current users | Automation | Playwright
Preconditions | 10 users, Super Admin reduces cap to 8 | 10 users, Super Admin reduces cap to 8 | 10 users, Super Admin reduces cap to 8
Steps | 1. Change beta cap to 8. | 1. Change beta cap to 8. | 1. Change beta cap to 8.
Expected Result | Warning: 'Cap (8) below current users (10). No new sign-ups until users removed or cap increased.' Existing users unaffected. | Warning: 'Cap (8) below current users (10). No new sign-ups until users removed or cap increased.' Existing users unaffected. | Warning: 'Cap (8) below current users (10). No new sign-ups until users removed or cap increased.' Existing users unaffected.


--- TABLE 135 ---
ID | ADM-008 | Priority | P0
Title | Real-time pulse updates | Automation | Playwright with polling assertion
Preconditions | Admin Dashboard open | Admin Dashboard open | Admin Dashboard open
Steps | 1. Observe Active Right Now card. | 1. Observe Active Right Now card. | 1. Observe Active Right Now card.
Expected Result | Updates every 10 seconds. Shows current active timer count. Today's Sessions increments when sessions complete. | Updates every 10 seconds. Shows current active timer count. Today's Sessions increments when sessions complete. | Updates every 10 seconds. Shows current active timer count. Today's Sessions increments when sessions complete.


--- TABLE 136 ---
ID | ADM-009 | Priority | P0
Title | Feedback status management | Automation | Playwright + KV
Preconditions | Feedback submission exists | Feedback submission exists | Feedback submission exists
Steps | 1. Open feedback item. 2. Change status from 'New' to 'In Review'. 3. Add admin note. | 1. Open feedback item. 2. Change status from 'New' to 'In Review'. 3. Add admin note. | 1. Open feedback item. 2. Change status from 'New' to 'In Review'. 3. Add admin note.
Expected Result | Status updated. Note saved with timestamp + admin name. Audit log entry created. User who submitted feedback does NOT see admin notes (internal only). | Status updated. Note saved with timestamp + admin name. Audit log entry created. User who submitted feedback does NOT see admin notes (internal only). | Status updated. Note saved with timestamp + admin name. Audit log entry created. User who submitted feedback does NOT see admin notes (internal only).


--- TABLE 137 ---
ID | ADM-010 | Priority | P0
Title | Audit log immutability | Automation | Security test
Preconditions | Super Admin attempts to modify audit | Super Admin attempts to modify audit | Super Admin attempts to modify audit
Steps | 1. Try to delete audit entries via API. | 1. Try to delete audit entries via API. | 1. Try to delete audit entries via API.
Expected Result | No endpoint exists. Audit records have no update/delete operations. Records are append-only. | No endpoint exists. Audit records have no update/delete operations. Records are append-only. | No endpoint exists. Audit records have no update/delete operations. Records are append-only.


--- TABLE 138 ---
ID | ADM-011 | Priority | P0
Title | Admin API rate limiting | Automation | k6
Preconditions | Admin makes rapid requests | Admin makes rapid requests | Admin makes rapid requests
Steps | 1. Send 61 requests to admin API within 1 minute. | 1. Send 61 requests to admin API within 1 minute. | 1. Send 61 requests to admin API within 1 minute.
Expected Result | First 60: succeed. 61st: 429 'Rate limited. Please wait.' Resets after 1 minute. | First 60: succeed. 61st: 429 'Rate limited. Please wait.' Resets after 1 minute. | First 60: succeed. 61st: 429 'Rate limited. Please wait.' Resets after 1 minute.


--- TABLE 139 ---
ID | ADM-012 | Priority | P0
Title | User health scorecard accuracy | Automation | Integration
Preconditions | Users with varying activity levels | Users with varying activity levels | Users with varying activity levels
Steps | 1. Check health scores against criteria. | 1. Check health scores against criteria. | 1. Check health scores against criteria.
Expected Result | Thriving: active 24h + streak>7 + goal>60%. Healthy: 48h + >3 + >40%. At Risk: 7 days or broken streak. Churning: >7 days inactive. Dormant: >30 days. Each user correctly categorized. | Thriving: active 24h + streak>7 + goal>60%. Healthy: 48h + >3 + >40%. At Risk: 7 days or broken streak. Churning: >7 days inactive. Dormant: >30 days. Each user correctly categorized. | Thriving: active 24h + streak>7 + goal>60%. Healthy: 48h + >3 + >40%. At Risk: 7 days or broken streak. Churning: >7 days inactive. Dormant: >30 days. Each user correctly categorized.


--- TABLE 140 ---
ID | SEC-001 | Priority | P0
Title | XSS in intent field | Automation | Playwright + OWASP ZAP
Preconditions | Malicious input | Malicious input | Malicious input
Steps | 1. Type '<script>alert(1)</script>' in intent. 2. Submit. 3. View in Session Log. | 1. Type '<script>alert(1)</script>' in intent. 2. Submit. 3. View in Session Log. | 1. Type '<script>alert(1)</script>' in intent. 2. Submit. 3. View in Session Log.
Expected Result | Input stored safely. Output is HTML-encoded on render. No script execution. Shows literal text in log. | Input stored safely. Output is HTML-encoded on render. No script execution. Shows literal text in log. | Input stored safely. Output is HTML-encoded on render. No script execution. Shows literal text in log.


--- TABLE 141 ---
ID | SEC-002 | Priority | P0
Title | XSS in feedback description | Automation | Security scan
Preconditions | Malicious input | Malicious input | Malicious input
Steps | 1. Submit feedback with '<img onerror=alert(1)>' in description. 2. Admin views. | 1. Submit feedback with '<img onerror=alert(1)>' in description. 2. Admin views. | 1. Submit feedback with '<img onerror=alert(1)>' in description. 2. Admin views.
Expected Result | Content rendered safely. No execution. Output encoding verified. | Content rendered safely. No execution. Output encoding verified. | Content rendered safely. No execution. Output encoding verified.


--- TABLE 142 ---
ID | SEC-003 | Priority | P0
Title | Client-side role spoofing | Automation | Manual + Playwright
Preconditions | Regular user modifies localStorage/DOM to show admin | Regular user modifies localStorage/DOM to show admin | Regular user modifies localStorage/DOM to show admin
Steps | 1. User manually adds ADMIN section to DOM. 2. Clicks admin link. | 1. User manually adds ADMIN section to DOM. 2. Clicks admin link. | 1. User manually adds ADMIN section to DOM. 2. Clicks admin link.
Expected Result | Server returns 403. No data exposed. Client-side changes are cosmetic; server enforces roles. | Server returns 403. No data exposed. Client-side changes are cosmetic; server enforces roles. | Server returns 403. No data exposed. Client-side changes are cosmetic; server enforces roles.


--- TABLE 143 ---
ID | SEC-004 | Priority | P0
Title | SQL injection via search | Automation | Playwright
Preconditions | Malicious search query | Malicious search query | Malicious search query
Steps | 1. Type ' OR 1=1-- in Session Log search. | 1. Type ' OR 1=1-- in Session Log search. | 1. Type ' OR 1=1-- in Session Log search.
Expected Result | No SQL used (KV store). Input treated as literal search string. No data leak. | No SQL used (KV store). Input treated as literal search string. No data leak. | No SQL used (KV store). Input treated as literal search string. No data leak.


--- TABLE 144 ---
ID | SEC-005 | Priority | P0
Title | Session fixation | Automation | Security test
Preconditions | Attacker pre-sets session cookie | Attacker pre-sets session cookie | Attacker pre-sets session cookie
Steps | 1. Set session cookie to known value. 2. Victim logs in. | 1. Set session cookie to known value. 2. Victim logs in. | 1. Set session cookie to known value. 2. Victim logs in.
Expected Result | New session token generated on each login (not reusing existing). Attacker's preset value is invalid. | New session token generated on each login (not reusing existing). Attacker's preset value is invalid. | New session token generated on each login (not reusing existing). Attacker's preset value is invalid.


--- TABLE 145 ---
ID | SEC-006 | Priority | P0
Title | HTTPS enforcement | Automation | curl + Playwright
Preconditions | Access via HTTP | Access via HTTP | Access via HTTP
Steps | 1. Navigate to http://becoming.ashmofidi.com. | 1. Navigate to http://becoming.ashmofidi.com. | 1. Navigate to http://becoming.ashmofidi.com.
Expected Result | 301 redirect to https://. No content served over HTTP. | 301 redirect to https://. No content served over HTTP. | 301 redirect to https://. No content served over HTTP.


--- TABLE 146 ---
ID | SEC-007 | Priority | P0
Title | CSP headers present | Automation | Integration + header check
Preconditions | Any page | Any page | Any page
Steps | 1. Check response headers. | 1. Check response headers. | 1. Check response headers.
Expected Result | Content-Security-Policy header set. No unsafe-inline for scripts. No unsafe-eval. | Content-Security-Policy header set. No unsafe-inline for scripts. No unsafe-eval. | Content-Security-Policy header set. No unsafe-inline for scripts. No unsafe-eval.


--- TABLE 147 ---
ID | SEC-008 | Priority | P0
Title | No sensitive data in client storage | Automation | Playwright + storage inspection
Preconditions | Check localStorage, sessionStorage, cookies | Check localStorage, sessionStorage, cookies | Check localStorage, sessionStorage, cookies
Steps | 1. Login. 2. Inspect all client storage. | 1. Login. 2. Inspect all client storage. | 1. Login. 2. Inspect all client storage.
Expected Result | No auth tokens, no user PII, no session secrets in localStorage/sessionStorage. Only: sidebar collapsed state, theme preference (non-sensitive). Cookie: session token only (httpOnly, not readable by JS). | No auth tokens, no user PII, no session secrets in localStorage/sessionStorage. Only: sidebar collapsed state, theme preference (non-sensitive). Cookie: session token only (httpOnly, not readable by JS). | No auth tokens, no user PII, no session secrets in localStorage/sessionStorage. Only: sidebar collapsed state, theme preference (non-sensitive). Cookie: session token only (httpOnly, not readable by JS).


--- TABLE 148 ---
ID | SEC-009 | Priority | P0
Title | File upload validation for custom sound | Automation | Integration
Preconditions | Upload malicious file | Upload malicious file | Upload malicious file
Steps | 1. Upload a .exe renamed to .mp3. 2. Upload a 10MB .wav. 3. Upload a 30-second .mp3. | 1. Upload a .exe renamed to .mp3. 2. Upload a 10MB .wav. 3. Upload a 30-second .mp3. | 1. Upload a .exe renamed to .mp3. 2. Upload a 10MB .wav. 3. Upload a 30-second .mp3.
Expected Result | Renamed .exe: rejected (MIME type validation, not just extension). 10MB: 'File too large. Maximum 500KB.' 30s: 'Audio must be 5 seconds or shorter.' No file stored. | Renamed .exe: rejected (MIME type validation, not just extension). 10MB: 'File too large. Maximum 500KB.' 30s: 'Audio must be 5 seconds or shorter.' No file stored. | Renamed .exe: rejected (MIME type validation, not just extension). 10MB: 'File too large. Maximum 500KB.' 30s: 'Audio must be 5 seconds or shorter.' No file stored.


--- TABLE 149 ---
ID | SEC-010 | Priority | P0
Title | Data export contains only user's own data | Automation | Integration
Preconditions | User A exports CSV | User A exports CSV | User A exports CSV
Steps | 1. User A exports all sessions. | 1. User A exports all sessions. | 1. User A exports all sessions.
Expected Result | CSV contains ONLY User A's sessions. No other user's data leaked. Verified by checking userId in every row. | CSV contains ONLY User A's sessions. No other user's data leaked. Verified by checking userId in every row. | CSV contains ONLY User A's sessions. No other user's data leaked. Verified by checking userId in every row.


--- TABLE 150 ---
ID | PERF-001 | Priority | P0
Title | Page load time | Automation | Lighthouse + k6
Preconditions | Cold cache | Cold cache | Cold cache
Steps | 1. Navigate to Timer page. | 1. Navigate to Timer page. | 1. Navigate to Timer page.
Expected Result | First Contentful Paint < 1.5 seconds. Time to Interactive < 3 seconds. Total bundle < 500KB gzipped. | First Contentful Paint < 1.5 seconds. Time to Interactive < 3 seconds. Total bundle < 500KB gzipped. | First Contentful Paint < 1.5 seconds. Time to Interactive < 3 seconds. Total bundle < 500KB gzipped.


--- TABLE 151 ---
ID | PERF-002 | Priority | P0
Title | API response time P50/P95/P99 | Automation | k6
Preconditions | Normal load | Normal load | Normal load
Steps | 1. Measure 1000 API requests. | 1. Measure 1000 API requests. | 1. Measure 1000 API requests.
Expected Result | P50 < 200ms. P95 < 500ms. P99 < 1000ms. | P50 < 200ms. P95 < 500ms. P99 < 1000ms. | P50 < 200ms. P95 < 500ms. P99 < 1000ms.


--- TABLE 152 ---
ID | PERF-003 | Priority | P0
Title | 100 concurrent users | Automation | k6
Preconditions | 100 users running timers | 100 users running timers | 100 users running timers
Steps | 1. Simulate 100 users starting and completing sessions. | 1. Simulate 100 users starting and completing sessions. | 1. Simulate 100 users starting and completing sessions.
Expected Result | All sessions complete correctly. API response times within SLA. No 5xx errors. No data corruption. | All sessions complete correctly. API response times within SLA. No 5xx errors. No data corruption. | All sessions complete correctly. API response times within SLA. No 5xx errors. No data corruption.


--- TABLE 153 ---
ID | PERF-004 | Priority | P0
Title | 1000 concurrent users | Automation | k6
Preconditions | 1000 users | 1000 users | 1000 users
Steps | 1. Simulate 1000 concurrent. | 1. Simulate 1000 concurrent. | 1. Simulate 1000 concurrent.
Expected Result | P95 < 1 second. Error rate < 0.1%. All sessions logged correctly. | P95 < 1 second. Error rate < 0.1%. All sessions logged correctly. | P95 < 1 second. Error rate < 0.1%. All sessions logged correctly.


--- TABLE 154 ---
ID | PERF-005 | Priority | P0
Title | 10000 concurrent users | Automation | k6 stress
Preconditions | 10000 users (stress test) | 10000 users (stress test) | 10000 users (stress test)
Steps | 1. Simulate 10000 concurrent. | 1. Simulate 10000 concurrent. | 1. Simulate 10000 concurrent.
Expected Result | System degrades gracefully. No crashes. Error rate < 1%. Recovery within 30 seconds after load reduces. | System degrades gracefully. No crashes. Error rate < 1%. Recovery within 30 seconds after load reduces. | System degrades gracefully. No crashes. Error rate < 1%. Recovery within 30 seconds after load reduces.


--- TABLE 155 ---
ID | PERF-006 | Priority | P0
Title | Soak test (4 hours at 1000 users) | Automation | k6 soak
Preconditions | Sustained load | Sustained load | Sustained load
Steps | 1. Run 1000 concurrent users for 4 hours. | 1. Run 1000 concurrent users for 4 hours. | 1. Run 1000 concurrent users for 4 hours.
Expected Result | No memory leaks. Response times stable (no degradation over time). Error rate stays < 0.1%. | No memory leaks. Response times stable (no degradation over time). Error rate stays < 0.1%. | No memory leaks. Response times stable (no degradation over time). Error rate stays < 0.1%.


--- TABLE 156 ---
ID | PERF-007 | Priority | P0
Title | Dashboard load with 10000 sessions | Automation | k6 + Playwright
Preconditions | User with 10000 historical sessions | User with 10000 historical sessions | User with 10000 historical sessions
Steps | 1. Open Dashboard. | 1. Open Dashboard. | 1. Open Dashboard.
Expected Result | Loads in < 2 seconds. Server-side aggregation; client does not process 10000 records. Payload < 50KB. | Loads in < 2 seconds. Server-side aggregation; client does not process 10000 records. Payload < 50KB. | Loads in < 2 seconds. Server-side aggregation; client does not process 10000 records. Payload < 50KB.


--- TABLE 157 ---
ID | PERF-008 | Priority | P0
Title | Session Log with 10000 sessions | Automation | Playwright
Preconditions | Large history | Large history | Large history
Steps | 1. Open Session Log. 2. Scroll to load more. | 1. Open Session Log. 2. Scroll to load more. | 1. Open Session Log. 2. Scroll to load more.
Expected Result | Initial load: 50 sessions in < 1 second. Infinite scroll: 25 more in < 500ms. No jank. | Initial load: 50 sessions in < 1 second. Infinite scroll: 25 more in < 500ms. No jank. | Initial load: 50 sessions in < 1 second. Infinite scroll: 25 more in < 500ms. No jank.


--- TABLE 158 ---
ID | A11Y-001 | Priority | P0
Title | axe-core zero violations on all pages | Automation | axe-core automated
Preconditions | Authenticated user | Authenticated user | Authenticated user
Steps | 1. Run axe-core on: Login, TOS, Timer, Dashboard, Session Log, Settings. | 1. Run axe-core on: Login, TOS, Timer, Dashboard, Session Log, Settings. | 1. Run axe-core on: Login, TOS, Timer, Dashboard, Session Log, Settings.
Expected Result | Zero violations on all pages. Zero serious or critical issues. | Zero violations on all pages. Zero serious or critical issues. | Zero violations on all pages. Zero serious or critical issues.


--- TABLE 159 ---
ID | A11Y-002 | Priority | P0
Title | Keyboard-only navigation | Automation | Manual + Playwright
Preconditions | No mouse | No mouse | No mouse
Steps | 1. Tab through entire Timer page. 2. Use Enter/Space to interact. 3. Tab to Settings. | 1. Tab through entire Timer page. 2. Use Enter/Space to interact. 3. Tab to Settings. | 1. Tab through entire Timer page. 2. Use Enter/Space to interact. 3. Tab to Settings.
Expected Result | All interactive elements reachable via Tab. Focus indicators visible (2px amber). Play/Pause via Space. All modals closable via Escape. | All interactive elements reachable via Tab. Focus indicators visible (2px amber). Play/Pause via Space. All modals closable via Escape. | All interactive elements reachable via Tab. Focus indicators visible (2px amber). Play/Pause via Space. All modals closable via Escape.


--- TABLE 160 ---
ID | A11Y-003 | Priority | P0
Title | Screen reader announcements | Automation | Manual NVDA test
Preconditions | NVDA on Chrome | NVDA on Chrome | NVDA on Chrome
Steps | 1. Start timer. 2. Wait for announcements. 3. Complete session. | 1. Start timer. 2. Wait for announcements. 3. Complete session. | 1. Start timer. 2. Wait for announcements. 3. Complete session.
Expected Result | Announces: 'Timer started, 25 minutes focusing.' At 5 min: '5 minutes remaining.' Completion: 'Timer complete, session logged.' | Announces: 'Timer started, 25 minutes focusing.' At 5 min: '5 minutes remaining.' Completion: 'Timer complete, session logged.' | Announces: 'Timer started, 25 minutes focusing.' At 5 min: '5 minutes remaining.' Completion: 'Timer complete, session logged.'


--- TABLE 161 ---
ID | A11Y-004 | Priority | P0
Title | Color contrast WCAG AA | Automation | axe-core + manual
Preconditions | All pages | All pages | All pages
Steps | 1. Check all text against backgrounds. | 1. Check all text against backgrounds. | 1. Check all text against backgrounds.
Expected Result | Normal text: 4.5:1 minimum. Large text: 3:1 minimum. No violations. High Contrast mode achieves AAA (7:1). | Normal text: 4.5:1 minimum. Large text: 3:1 minimum. No violations. High Contrast mode achieves AAA (7:1). | Normal text: 4.5:1 minimum. Large text: 3:1 minimum. No violations. High Contrast mode achieves AAA (7:1).


--- TABLE 162 ---
ID | A11Y-005 | Priority | P0
Title | Focus/break distinction not color-only | Automation | Manual review
Preconditions | Color Blind Mode OFF | Color Blind Mode OFF | Color Blind Mode OFF
Steps | 1. Check timer in Focus vs Break mode. | 1. Check timer in Focus vs Break mode. | 1. Check timer in Focus vs Break mode.
Expected Result | Even without Color Blind Mode: labels ('FOCUSING' vs 'TIME TO REST') distinguish modes. Color alone is supplementary. | Even without Color Blind Mode: labels ('FOCUSING' vs 'TIME TO REST') distinguish modes. Color alone is supplementary. | Even without Color Blind Mode: labels ('FOCUSING' vs 'TIME TO REST') distinguish modes. Color alone is supplementary.


--- TABLE 163 ---
ID | A11Y-006 | Priority | P0
Title | Large Tap Targets mode | Automation | Playwright CSS assertion
Preconditions | Enable Large Tap Targets | Enable Large Tap Targets | Enable Large Tap Targets
Steps | 1. Toggle ON in Settings. 2. Verify button sizes. | 1. Toggle ON in Settings. 2. Verify button sizes. | 1. Toggle ON in Settings. 2. Verify button sizes.
Expected Result | All interactive elements minimum 56x56px. Verified via computed style. No overlapping click areas. | All interactive elements minimum 56x56px. Verified via computed style. No overlapping click areas. | All interactive elements minimum 56x56px. Verified via computed style. No overlapping click areas.


--- TABLE 164 ---
ID | RESP-001 | Priority | P0
Title | Timer page on mobile (375px) | Automation | Playwright viewport
Preconditions | iPhone SE viewport | iPhone SE viewport | iPhone SE viewport
Steps | 1. Load Timer at 375px width. | 1. Load Timer at 375px width. | 1. Load Timer at 375px width.
Expected Result | Sidebar hidden. Hamburger menu visible. Timer centered. Controls large enough (44px+). Intent input: 16px font (no iOS zoom). All elements visible without horizontal scroll. | Sidebar hidden. Hamburger menu visible. Timer centered. Controls large enough (44px+). Intent input: 16px font (no iOS zoom). All elements visible without horizontal scroll. | Sidebar hidden. Hamburger menu visible. Timer centered. Controls large enough (44px+). Intent input: 16px font (no iOS zoom). All elements visible without horizontal scroll.


--- TABLE 165 ---
ID | RESP-002 | Priority | P0
Title | Dashboard on tablet (768px) | Automation | Playwright viewport
Preconditions | iPad viewport | iPad viewport | iPad viewport
Steps | 1. Load Dashboard. | 1. Load Dashboard. | 1. Load Dashboard.
Expected Result | Stats row: 3+2 layout. Charts: single column. All readable. Touch-scrollable where needed. | Stats row: 3+2 layout. Charts: single column. All readable. Touch-scrollable where needed. | Stats row: 3+2 layout. Charts: single column. All readable. Touch-scrollable where needed.


--- TABLE 166 ---
ID | RESP-003 | Priority | P0
Title | Session Log on mobile | Automation | Playwright + visual regression
Preconditions | 375px width | 375px width | 375px width
Steps | 1. Load Session Log. | 1. Load Session Log. | 1. Load Session Log.
Expected Result | Table transforms to card list. Swipe left reveals Edit/Delete. Filters behind 'Filters' bottom-sheet button. | Table transforms to card list. Swipe left reveals Edit/Delete. Filters behind 'Filters' bottom-sheet button. | Table transforms to card list. Swipe left reveals Edit/Delete. Filters behind 'Filters' bottom-sheet button.


--- TABLE 167 ---
ID | RESP-004 | Priority | P0
Title | Settings on mobile | Automation | Playwright viewport
Preconditions | 375px width | 375px width | 375px width
Steps | 1. Load Settings. | 1. Load Settings. | 1. Load Settings.
Expected Result | Single column. Stepper buttons 48px+. Toggles 52px wide. Header buttons in overflow menu. | Single column. Stepper buttons 48px+. Toggles 52px wide. Header buttons in overflow menu. | Single column. Stepper buttons 48px+. Toggles 52px wide. Header buttons in overflow menu.


--- TABLE 168 ---
ID | RESP-005 | Priority | P0
Title | Header buttons collapse on mobile | Automation | Playwright
Preconditions | < 768px | < 768px | < 768px
Steps | 1. Check header. | 1. Check header. | 1. Check header.
Expected Result | Feedback/Export/Keys collapse to single ⋯ menu. Tapping reveals dropdown with all three options. | Feedback/Export/Keys collapse to single ⋯ menu. Tapping reveals dropdown with all three options. | Feedback/Export/Keys collapse to single ⋯ menu. Tapping reveals dropdown with all three options.


--- TABLE 169 ---
ID | STATE-001 | Priority | P0
Title | Skeleton loading on Dashboard | Automation | Playwright + network throttle
Preconditions | Slow network | Slow network | Slow network
Steps | 1. Throttle network to 3G. 2. Load Dashboard. | 1. Throttle network to 3G. 2. Load Dashboard. | 1. Throttle network to 3G. 2. Load Dashboard.
Expected Result | Skeleton placeholders (pulsing gray rectangles) appear instantly. Data hydrates progressively. No blank white space. | Skeleton placeholders (pulsing gray rectangles) appear instantly. Data hydrates progressively. No blank white space. | Skeleton placeholders (pulsing gray rectangles) appear instantly. Data hydrates progressively. No blank white space.


--- TABLE 170 ---
ID | STATE-002 | Priority | P0
Title | Empty Dashboard for new user | Automation | Playwright + visual
Preconditions | Zero sessions | Zero sessions | Zero sessions
Steps | 1. Login as new user. 2. Go to Dashboard. | 1. Login as new user. 2. Go to Dashboard. | 1. Login as new user. 2. Go to Dashboard.
Expected Result | Each card shows encouraging message with 'Go to Timer' link. No blank cards. No error states. | Each card shows encouraging message with 'Go to Timer' link. No blank cards. No error states. | Each card shows encouraging message with 'Go to Timer' link. No blank cards. No error states.


--- TABLE 171 ---
ID | STATE-003 | Priority | P0
Title | Empty Session Log | Automation | Playwright
Preconditions | Zero sessions | Zero sessions | Zero sessions
Steps | 1. Go to Session Log. | 1. Go to Session Log. | 1. Go to Session Log.
Expected Result | Centered: 'No sessions yet. Complete your first focus session.' + amber button. | Centered: 'No sessions yet. Complete your first focus session.' + amber button. | Centered: 'No sessions yet. Complete your first focus session.' + amber button.


--- TABLE 172 ---
ID | STATE-004 | Priority | P0
Title | Filters return zero results | Automation | Playwright
Preconditions | Session Log with active filters, no matches | Session Log with active filters, no matches | Session Log with active filters, no matches
Steps | 1. Set filters that match nothing. | 1. Set filters that match nothing. | 1. Set filters that match nothing.
Expected Result | Table headers visible. Body: 'No sessions match your filters.' + 'Clear all filters' link. NOT the 'no sessions ever' state. | Table headers visible. Body: 'No sessions match your filters.' + 'Clear all filters' link. NOT the 'no sessions ever' state. | Table headers visible. Body: 'No sessions match your filters.' + 'Clear all filters' link. NOT the 'no sessions ever' state.


--- TABLE 173 ---
ID | STATE-005 | Priority | P0
Title | Offline banner | Automation | Playwright + network mock
Preconditions | Network disconnected | Network disconnected | Network disconnected
Steps | 1. Disconnect network during use. | 1. Disconnect network during use. | 1. Disconnect network during use.
Expected Result | Banner: 'You're offline. Changes will sync when you reconnect.' Amber, persistent. Timer continues running. Settings changes queued. | Banner: 'You're offline. Changes will sync when you reconnect.' Amber, persistent. Timer continues running. Settings changes queued. | Banner: 'You're offline. Changes will sync when you reconnect.' Amber, persistent. Timer continues running. Settings changes queued.


--- TABLE 174 ---
ID | STATE-006 | Priority | P0
Title | Reconnection sync | Automation | Playwright + network mock
Preconditions | Offline with queued changes, reconnect | Offline with queued changes, reconnect | Offline with queued changes, reconnect
Steps | 1. Make changes offline. 2. Reconnect. | 1. Make changes offline. 2. Reconnect. | 1. Make changes offline. 2. Reconnect.
Expected Result | Toast: 'Back online. Syncing...' then 'All changes synced.' Queued operations flushed in order. | Toast: 'Back online. Syncing...' then 'All changes synced.' Queued operations flushed in order. | Toast: 'Back online. Syncing...' then 'All changes synced.' Queued operations flushed in order.


--- TABLE 175 ---
ID | ERR-001 | Priority | P0
Title | 404 page | Automation | Playwright
Preconditions | Invalid URL | Invalid URL | Invalid URL
Steps | 1. Navigate to /nonexistent. | 1. Navigate to /nonexistent. | 1. Navigate to /nonexistent.
Expected Result | 404 page: 'This page doesn't exist.' + 'Go to Timer' button. Branded. No sidebar (may be unauthenticated). | 404 page: 'This page doesn't exist.' + 'Go to Timer' button. Branded. No sidebar (may be unauthenticated). | 404 page: 'This page doesn't exist.' + 'Go to Timer' button. Branded. No sidebar (may be unauthenticated).


--- TABLE 176 ---
ID | ERR-002 | Priority | P0
Title | 403 page (admin URL as regular user) | Automation | Playwright
Preconditions | Regular user | Regular user | Regular user
Steps | 1. Navigate to /admin/analytics. | 1. Navigate to /admin/analytics. | 1. Navigate to /admin/analytics.
Expected Result | 403 page: 'You don't have access.' + 'Go to Timer.' No data exposed. | 403 page: 'You don't have access.' + 'Go to Timer.' No data exposed. | 403 page: 'You don't have access.' + 'Go to Timer.' No data exposed.


--- TABLE 177 ---
ID | ERR-003 | Priority | P0
Title | 500 page | Automation | Playwright + mock
Preconditions | Server error | Server error | Server error
Steps | 1. Trigger 500 (mock server failure). | 1. Trigger 500 (mock server failure). | 1. Trigger 500 (mock server failure).
Expected Result | 500 page: 'Something went wrong on our end.' + 'Retry' button + Feedback link. No stack traces shown. | 500 page: 'Something went wrong on our end.' + 'Retry' button + Feedback link. No stack traces shown. | 500 page: 'Something went wrong on our end.' + 'Retry' button + Feedback link. No stack traces shown.


--- TABLE 178 ---
ID | ERR-004 | Priority | P0
Title | Rate limit error UX | Automation | k6 + Playwright
Preconditions | User hits rate limit | User hits rate limit | User hits rate limit
Steps | 1. Trigger rate limit (rapid requests). | 1. Trigger rate limit (rapid requests). | 1. Trigger rate limit (rapid requests).
Expected Result | Toast: 'You're doing that too quickly. Please wait a moment.' No specific rate limit numbers revealed. | Toast: 'You're doing that too quickly. Please wait a moment.' No specific rate limit numbers revealed. | Toast: 'You're doing that too quickly. Please wait a moment.' No specific rate limit numbers revealed.


--- TABLE 179 ---
ID | XB-001 | Priority | P0
Title | Full E2E on Chrome 100+ | Automation | Playwright chromium
Preconditions | Chrome | Chrome | Chrome
Steps | 1. Run complete smoke test suite on Chrome. | 1. Run complete smoke test suite on Chrome. | 1. Run complete smoke test suite on Chrome.
Expected Result | All tests pass. All visual elements render correctly. | All tests pass. All visual elements render correctly. | All tests pass. All visual elements render correctly.


--- TABLE 180 ---
ID | XB-002 | Priority | P0
Title | Full E2E on Firefox 100+ | Automation | Playwright firefox
Preconditions | Firefox | Firefox | Firefox
Steps | 1. Run complete smoke test suite on Firefox. | 1. Run complete smoke test suite on Firefox. | 1. Run complete smoke test suite on Firefox.
Expected Result | All tests pass. Audio, animations, and layout verified. | All tests pass. Audio, animations, and layout verified. | All tests pass. Audio, animations, and layout verified.


--- TABLE 181 ---
ID | XB-003 | Priority | P0
Title | Full E2E on Safari 16+ | Automation | Playwright webkit
Preconditions | Safari | Safari | Safari
Steps | 1. Run complete smoke test suite on Safari. | 1. Run complete smoke test suite on Safari. | 1. Run complete smoke test suite on Safari.
Expected Result | All tests pass. Wake Lock API may not be supported; fallback verified. | All tests pass. Wake Lock API may not be supported; fallback verified. | All tests pass. Wake Lock API may not be supported; fallback verified.


--- TABLE 182 ---
ID | XB-004 | Priority | P0
Title | Mobile Chrome | Automation | Playwright mobile emulation
Preconditions | Android emulation | Android emulation | Android emulation
Steps | 1. Run critical path on mobile Chrome. | 1. Run critical path on mobile Chrome. | 1. Run critical path on mobile Chrome.
Expected Result | Touch interactions work. Bottom sheets render. No horizontal overflow. | Touch interactions work. Bottom sheets render. No horizontal overflow. | Touch interactions work. Bottom sheets render. No horizontal overflow.


--- TABLE 183 ---
ID | XB-005 | Priority | P0
Title | Mobile Safari | Automation | Playwright mobile emulation
Preconditions | iOS emulation | iOS emulation | iOS emulation
Steps | 1. Run critical path on mobile Safari. | 1. Run critical path on mobile Safari. | 1. Run critical path on mobile Safari.
Expected Result | No iOS zoom on inputs (16px font verified). Touch interactions work. | No iOS zoom on inputs (16px font verified). Touch interactions work. | No iOS zoom on inputs (16px font verified). Touch interactions work.


--- TABLE 184 ---
ID | HDR-001 | Priority | P0
Title | Feedback modal opens | Automation | Playwright
Preconditions | Any page | Any page | Any page
Steps | 1. Click Feedback button. | 1. Click Feedback button. | 1. Click Feedback button.
Expected Result | Modal opens with Category, Subject, Description fields. Subject auto-focused. | Modal opens with Category, Subject, Description fields. Subject auto-focused. | Modal opens with Category, Subject, Description fields. Subject auto-focused.


--- TABLE 185 ---
ID | HDR-002 | Priority | P0
Title | Feedback submit with metadata | Automation | Integration
Preconditions | Complete feedback form | Complete feedback form | Complete feedback form
Steps | 1. Fill form. 2. Submit. | 1. Fill form. 2. Submit. | 1. Fill form. 2. Submit.
Expected Result | Server receives: form data + invisible metadata (userId, appVersion, page, browser, settingsSnapshot). Confirmation with reference number. | Server receives: form data + invisible metadata (userId, appVersion, page, browser, settingsSnapshot). Confirmation with reference number. | Server receives: form data + invisible metadata (userId, appVersion, page, browser, settingsSnapshot). Confirmation with reference number.


--- TABLE 186 ---
ID | HDR-003 | Priority | P0
Title | Feedback submit failure preserves content | Automation | Playwright + network mock
Preconditions | Network error during submit | Network error during submit | Network error during submit
Steps | 1. Disconnect network. 2. Submit feedback. 3. See error. 4. Reconnect. 5. Retry. | 1. Disconnect network. 2. Submit feedback. 3. See error. 4. Reconnect. 5. Retry. | 1. Disconnect network. 2. Submit feedback. 3. See error. 4. Reconnect. 5. Retry.
Expected Result | Error banner shown. Form content preserved. Retry succeeds. | Error banner shown. Form content preserved. Retry succeeds. | Error banner shown. Form content preserved. Retry succeeds.


--- TABLE 187 ---
ID | HDR-004 | Priority | P0
Title | Export CSV from Session Log | Automation | Playwright + file validation
Preconditions | On Session Log with filters | On Session Log with filters | On Session Log with filters
Steps | 1. Click Export. 2. Select CSV + Filtered. 3. Download. | 1. Click Export. 2. Select CSV + Filtered. 3. Download. | 1. Click Export. 2. Select CSV + Filtered. 3. Download.
Expected Result | CSV contains only filtered sessions. UTF-8 BOM. RFC 4180. Opens correctly in Excel. | CSV contains only filtered sessions. UTF-8 BOM. RFC 4180. Opens correctly in Excel. | CSV contains only filtered sessions. UTF-8 BOM. RFC 4180. Opens correctly in Excel.


--- TABLE 188 ---
ID | HDR-005 | Priority | P0
Title | Keyboard shortcuts modal | Automation | Playwright
Preconditions | Any page | Any page | Any page
Steps | 1. Press '?' key. | 1. Press '?' key. | 1. Press '?' key.
Expected Result | Shortcuts modal opens showing all bindings for current page (highlighted). Press '?' again: closes (toggle). | Shortcuts modal opens showing all bindings for current page (highlighted). Press '?' again: closes (toggle). | Shortcuts modal opens showing all bindings for current page (highlighted). Press '?' again: closes (toggle).


--- TABLE 189 ---
ID | HDR-006 | Priority | P0
Title | Shortcuts disabled in text input | Automation | Playwright
Preconditions | Focus in intent field | Focus in intent field | Focus in intent field
Steps | 1. Focus intent input. 2. Press 'R'. | 1. Focus intent input. 2. Press 'R'. | 1. Focus intent input. 2. Press 'R'.
Expected Result | 'R' types into input. Does NOT trigger Reset. Single-key shortcuts suppressed during text input. | 'R' types into input. Does NOT trigger Reset. Single-key shortcuts suppressed during text input. | 'R' types into input. Does NOT trigger Reset. Single-key shortcuts suppressed during text input.


--- TABLE 190 ---
ID | HDR-007 | Priority | P0
Title | Modifier shortcuts work during text input | Automation | Playwright
Preconditions | Focus in intent field | Focus in intent field | Focus in intent field
Steps | 1. Focus input. 2. Press Ctrl+E. | 1. Focus input. 2. Press Ctrl+E. | 1. Focus input. 2. Press Ctrl+E.
Expected Result | Export modal opens. Modifier shortcuts NOT suppressed during text input. | Export modal opens. Modifier shortcuts NOT suppressed during text input. | Export modal opens. Modifier shortcuts NOT suppressed during text input.


--- TABLE 191 ---
ID | ONB-001 | Priority | P0
Title | Onboarding shows for new user | Automation | Playwright
Preconditions | First login after TOS acceptance | First login after TOS acceptance | First login after TOS acceptance
Steps | 1. Complete TOS. 2. Land on Timer. | 1. Complete TOS. 2. Land on Timer. | 1. Complete TOS. 2. Land on Timer.
Expected Result | 3-step spotlight overlay appears. Step 1: timer highlight. Step 2: intent input. Step 3: sidebar stats. 'Next' and 'Skip All' buttons. | 3-step spotlight overlay appears. Step 1: timer highlight. Step 2: intent input. Step 3: sidebar stats. 'Next' and 'Skip All' buttons. | 3-step spotlight overlay appears. Step 1: timer highlight. Step 2: intent input. Step 3: sidebar stats. 'Next' and 'Skip All' buttons.


--- TABLE 192 ---
ID | ONB-002 | Priority | P0
Title | Onboarding only shows once | Automation | Playwright
Preconditions | Complete onboarding | Complete onboarding | Complete onboarding
Steps | 1. Finish all 3 steps. 2. Refresh page. | 1. Finish all 3 steps. 2. Refresh page. | 1. Finish all 3 steps. 2. Refresh page.
Expected Result | Onboarding does NOT reappear. KV: onboardingCompleted=true. | Onboarding does NOT reappear. KV: onboardingCompleted=true. | Onboarding does NOT reappear. KV: onboardingCompleted=true.


--- TABLE 193 ---
ID | ONB-003 | Priority | P0
Title | Skip All dismisses forever | Automation | Playwright
Preconditions | Click Skip All on Step 1 | Click Skip All on Step 1 | Click Skip All on Step 1
Steps | 1. Click 'Skip All'. | 1. Click 'Skip All'. | 1. Click 'Skip All'.
Expected Result | Onboarding dismissed. Never shown again. | Onboarding dismissed. Never shown again. | Onboarding dismissed. Never shown again.


--- TABLE 194 ---
ID | ONB-004 | Priority | P1
Title | Clear All Data does NOT re-trigger onboarding | Automation | Integration
Preconditions | Experienced user clears data | Experienced user clears data | Experienced user clears data
Steps | 1. Clear All Data in Settings. 2. Navigate to Timer. | 1. Clear All Data in Settings. 2. Navigate to Timer. | 1. Clear All Data in Settings. 2. Navigate to Timer.
Expected Result | Onboarding does NOT appear. User is experienced; onboardingCompleted preserved separately from session data. | Onboarding does NOT appear. User is experienced; onboardingCompleted preserved separately from session data. | Onboarding does NOT appear. User is experienced; onboardingCompleted preserved separately from session data.


--- TABLE 195 ---
ID | INTEG-001 | Priority | P0
Title | Full Pomodoro cycle: login to 4 sessions | Automation | Playwright E2E
Preconditions | New user | New user | New user
Steps | 1. Login. 2. Accept TOS. 3. Complete onboarding. 4. Complete 4 Focus + 3 Break + 1 Long Break. 5. Check Dashboard. 6. Check Session Log. | 1. Login. 2. Accept TOS. 3. Complete onboarding. 4. Complete 4 Focus + 3 Break + 1 Long Break. 5. Check Dashboard. 6. Check Session Log. | 1. Login. 2. Accept TOS. 3. Complete onboarding. 4. Complete 4 Focus + 3 Break + 1 Long Break. 5. Check Dashboard. 6. Check Session Log.
Expected Result | All 8 sessions logged. Goal: 4/4 (met, green). Streak: 1. Cycle: completed 1 full cycle. Dashboard reflects all stats. Session Log shows 8 entries (4 Focus, 3 Break, 1 Long Break). Milestones: 'First Focus' earned. | All 8 sessions logged. Goal: 4/4 (met, green). Streak: 1. Cycle: completed 1 full cycle. Dashboard reflects all stats. Session Log shows 8 entries (4 Focus, 3 Break, 1 Long Break). Milestones: 'First Focus' earned. | All 8 sessions logged. Goal: 4/4 (met, green). Streak: 1. Cycle: completed 1 full cycle. Dashboard reflects all stats. Session Log shows 8 entries (4 Focus, 3 Break, 1 Long Break). Milestones: 'First Focus' earned.


--- TABLE 196 ---
ID | INTEG-002 | Priority | P0
Title | Settings change propagation to Timer | Automation | Playwright
Preconditions | Change Focus to 45 min | Change Focus to 45 min | Change Focus to 45 min
Steps | 1. Change Focus to 45. 2. Navigate to Timer. 3. Verify. | 1. Change Focus to 45. 2. Navigate to Timer. 3. Verify. | 1. Change Focus to 45. 2. Navigate to Timer. 3. Verify.
Expected Result | Timer shows 45:00 in idle. Starting a session counts down from 45:00. | Timer shows 45:00 in idle. Starting a session counts down from 45:00. | Timer shows 45:00 in idle. Starting a session counts down from 45:00.


--- TABLE 197 ---
ID | INTEG-003 | Priority | P0
Title | Category created in Settings used in Timer | Automation | Playwright
Preconditions | Create 'Research' category | Create 'Research' category | Create 'Research' category
Steps | 1. Settings > Categories > Add 'Research'. 2. Go to Timer. 3. Click category button. | 1. Settings > Categories > Add 'Research'. 2. Go to Timer. 3. Click category button. | 1. Settings > Categories > Add 'Research'. 2. Go to Timer. 3. Click category button.
Expected Result | 'Research' appears in dropdown with correct color. Selectable. Persists as default for next session. | 'Research' appears in dropdown with correct color. Selectable. Persists as default for next session. | 'Research' appears in dropdown with correct color. Selectable. Persists as default for next session.


--- TABLE 198 ---
ID | INTEG-004 | Priority | P0
Title | Streak across multiple days | Automation | Integration with mocked time
Preconditions | 3 consecutive days of sessions | 3 consecutive days of sessions | 3 consecutive days of sessions
Steps | 1. Complete sessions on Day 1, Day 2, Day 3 (mocked time). | 1. Complete sessions on Day 1, Day 2, Day 3 (mocked time). | 1. Complete sessions on Day 1, Day 2, Day 3 (mocked time).
Expected Result | Streak: 3 days. Dashboard heatmap: 3 colored cells. Footer stats: STREAK = 3. | Streak: 3 days. Dashboard heatmap: 3 colored cells. Footer stats: STREAK = 3. | Streak: 3 days. Dashboard heatmap: 3 colored cells. Footer stats: STREAK = 3.


--- TABLE 199 ---
ID | INTEG-005 | Priority | P0
Title | Streak breaks and freezes | Automation | Integration with mocked time
Preconditions | Day 4: no session, 1 freeze available | Day 4: no session, 1 freeze available | Day 4: no session, 1 freeze available
Steps | 1. Day 4 passes with no session. | 1. Day 4 passes with no session. | 1. Day 4 passes with no session.
Expected Result | Streak preserved (freeze consumed). Freezes remaining: 1/2 → 0/2. Streak: still 3. Day 5 no session + no freeze: streak breaks to 0. | Streak preserved (freeze consumed). Freezes remaining: 1/2 → 0/2. Streak: still 3. Day 5 no session + no freeze: streak breaks to 0. | Streak preserved (freeze consumed). Freezes remaining: 1/2 → 0/2. Streak: still 3. Day 5 no session + no freeze: streak breaks to 0.


--- TABLE 200 ---
ID | INTEG-006 | Priority | P0
Title | Export reflects all data accurately | Automation | Integration + file parsing
Preconditions | 50 sessions across categories | 50 sessions across categories | 50 sessions across categories
Steps | 1. Export CSV from Session Log (All Time). 2. Compare CSV rows to KV session records. | 1. Export CSV from Session Log (All Time). 2. Compare CSV rows to KV session records. | 1. Export CSV from Session Log (All Time). 2. Compare CSV rows to KV session records.
Expected Result | Every KV session record is represented in CSV. No duplicates. No missing sessions. Correct timestamps, durations, intents, categories. | Every KV session record is represented in CSV. No duplicates. No missing sessions. Correct timestamps, durations, intents, categories. | Every KV session record is represented in CSV. No duplicates. No missing sessions. Correct timestamps, durations, intents, categories.


--- TABLE 201 ---
ID | INTEG-007 | Priority | P0
Title | Import restores full state | Automation | Integration
Preconditions | Export then Delete All then Import | Export then Delete All then Import | Export then Delete All then Import
Steps | 1. Export JSON backup. 2. Clear All Data. 3. Import backup. | 1. Export JSON backup. 2. Clear All Data. 3. Import backup. | 1. Export JSON backup. 2. Clear All Data. 3. Import backup.
Expected Result | All settings restored. All sessions restored. Dashboard shows correct stats. Session Log shows all entries. Streak recalculated correctly. | All settings restored. All sessions restored. Dashboard shows correct stats. Session Log shows all entries. Streak recalculated correctly. | All settings restored. All sessions restored. Dashboard shows correct stats. Session Log shows all entries. Streak recalculated correctly.


--- TABLE 202 ---
ID | INTEG-008 | Priority | P0
Title | Admin + user actions together | Automation | Playwright multi-user
Preconditions | Super Admin manages while users work | Super Admin manages while users work | Super Admin manages while users work
Steps | 1. User completes session. 2. Admin changes feedback status. 3. Super Admin promotes user. 4. Check audit log. | 1. User completes session. 2. Admin changes feedback status. 3. Super Admin promotes user. 4. Check audit log. | 1. User completes session. 2. Admin changes feedback status. 3. Super Admin promotes user. 4. Check audit log.
Expected Result | All actions reflected correctly. Audit log shows all 3 events. No cross-contamination. User's session appears in admin analytics. | All actions reflected correctly. Audit log shows all 3 events. No cross-contamination. User's session appears in admin analytics. | All actions reflected correctly. Audit log shows all 3 events. No cross-contamination. User's session appears in admin analytics.


--- TABLE 203 ---
ID | UI-001 | Priority | P0
Title | Version displays from environment variable | Automation | Integration + env var
Preconditions | APP_VERSION=3.0, APP_LIFECYCLE_STAGE=beta | APP_VERSION=3.0, APP_LIFECYCLE_STAGE=beta | APP_VERSION=3.0, APP_LIFECYCLE_STAGE=beta
Steps | 1. Load any page. 2. Check sidebar top-left. | 1. Load any page. 2. Check sidebar top-left. | 1. Load any page. 2. Check sidebar top-left.
Expected Result | Shows 'Becoming..' with amber dots. Below: 'V3.0 · ENTERPRISE BETA'. Version NOT hardcoded (verified by changing env var and redeploying). | Shows 'Becoming..' with amber dots. Below: 'V3.0 · ENTERPRISE BETA'. Version NOT hardcoded (verified by changing env var and redeploying). | Shows 'Becoming..' with amber dots. Below: 'V3.0 · ENTERPRISE BETA'. Version NOT hardcoded (verified by changing env var and redeploying).


--- TABLE 204 ---
ID | UI-002 | Priority | P1
Title | Version updates without cache clear | Automation | Playwright + deploy mock
Preconditions | Deploy new version (3.1) | Deploy new version (3.1) | Deploy new version (3.1)
Steps | 1. User has app open. 2. New deploy occurs. 3. Wait 60 seconds or refresh. | 1. User has app open. 2. New deploy occurs. 3. Wait 60 seconds or refresh. | 1. User has app open. 2. New deploy occurs. 3. Wait 60 seconds or refresh.
Expected Result | Version updates to 'V3.1' silently. No user intervention. No stale cached version. | Version updates to 'V3.1' silently. No user intervention. No stale cached version. | Version updates to 'V3.1' silently. No user intervention. No stale cached version.


--- TABLE 205 ---
ID | UI-003 | Priority | P1
Title | Lifecycle badge changes post-beta | Automation | Integration
Preconditions | APP_LIFECYCLE_STAGE changed from 'beta' to 'production' | APP_LIFECYCLE_STAGE changed from 'beta' to 'production' | APP_LIFECYCLE_STAGE changed from 'beta' to 'production'
Steps | 1. Deploy with new lifecycle stage. | 1. Deploy with new lifecycle stage. | 1. Deploy with new lifecycle stage.
Expected Result | Badge changes from 'ENTERPRISE BETA' to 'ENTERPRISE'. No 'BETA' text. | Badge changes from 'ENTERPRISE BETA' to 'ENTERPRISE'. No 'BETA' text. | Badge changes from 'ENTERPRISE BETA' to 'ENTERPRISE'. No 'BETA' text.


--- TABLE 206 ---
ID | UI-004 | Priority | P0
Title | Avatar displays from Google profile | Automation | Playwright + attribute check
Preconditions | User with Google avatar | User with Google avatar | User with Google avatar
Steps | 1. Login. 2. Check sidebar profile card. | 1. Login. 2. Check sidebar profile card. | 1. Login. 2. Check sidebar profile card.
Expected Result | Circular avatar (40x40px) rendered from Google picture URL. crossorigin='anonymous'. referrerPolicy='no-referrer'. | Circular avatar (40x40px) rendered from Google picture URL. crossorigin='anonymous'. referrerPolicy='no-referrer'. | Circular avatar (40x40px) rendered from Google picture URL. crossorigin='anonymous'. referrerPolicy='no-referrer'.


--- TABLE 207 ---
ID | UI-005 | Priority | P0
Title | Avatar fallback when missing | Automation | Playwright + mock user
Preconditions | User with no Google avatar (picture=null) | User with no Google avatar (picture=null) | User with no Google avatar (picture=null)
Steps | 1. Login as user without avatar. | 1. Login as user without avatar. | 1. Login as user without avatar.
Expected Result | Fallback circle: first initial in white text on amber (#D97706) background. No broken image icon. | Fallback circle: first initial in white text on amber (#D97706) background. No broken image icon. | Fallback circle: first initial in white text on amber (#D97706) background. No broken image icon.


--- TABLE 208 ---
ID | UI-006 | Priority | P1
Title | Avatar fallback on load error | Automation | Playwright + network mock
Preconditions | Google CDN returns 404 for avatar URL | Google CDN returns 404 for avatar URL | Google CDN returns 404 for avatar URL
Steps | 1. Login. 2. Mock avatar URL to return 404. | 1. Login. 2. Mock avatar URL to return 404. | 1. Login. 2. Mock avatar URL to return 404.
Expected Result | Fallback initial circle shown. No broken image. No console error (handled gracefully). | Fallback initial circle shown. No broken image. No console error (handled gracefully). | Fallback initial circle shown. No broken image. No console error (handled gracefully).


--- TABLE 209 ---
ID | UI-007 | Priority | P0
Title | Role badge: Admin (amber) | Automation | Playwright
Preconditions | User with role='admin' | User with role='admin' | User with role='admin'
Steps | 1. Login as admin. | 1. Login as admin. | 1. Login as admin.
Expected Result | Amber (#D97706) pill badge 'Admin' visible below email. No gap if role='user'. | Amber (#D97706) pill badge 'Admin' visible below email. No gap if role='user'. | Amber (#D97706) pill badge 'Admin' visible below email. No gap if role='user'.


--- TABLE 210 ---
ID | UI-008 | Priority | P0
Title | Role badge: Super Admin (red) | Automation | Playwright
Preconditions | User with role='super_admin' | User with role='super_admin' | User with role='super_admin'
Steps | 1. Login as Super Admin. | 1. Login as Super Admin. | 1. Login as Super Admin.
Expected Result | Red (#DC2626) pill badge 'Super Admin' visible below email. | Red (#DC2626) pill badge 'Super Admin' visible below email. | Red (#DC2626) pill badge 'Super Admin' visible below email.


--- TABLE 211 ---
ID | UI-009 | Priority | P0
Title | Role badge: regular user (hidden) | Automation | Playwright
Preconditions | User with role='user' | User with role='user' | User with role='user'
Steps | 1. Login as regular user. | 1. Login as regular user. | 1. Login as regular user.
Expected Result | No badge rendered. No empty gap in layout. Profile card height is smaller. | No badge rendered. No empty gap in layout. Profile card height is smaller. | No badge rendered. No empty gap in layout. Profile card height is smaller.


--- TABLE 212 ---
ID | UI-010 | Priority | P1
Title | Long name truncation | Automation | Playwright
Preconditions | User name: 'Alexandra Bartholomew-Richardson III' | User name: 'Alexandra Bartholomew-Richardson III' | User name: 'Alexandra Bartholomew-Richardson III'
Steps | 1. Login. 2. Check name display. | 1. Login. 2. Check name display. | 1. Login. 2. Check name display.
Expected Result | Name truncated with ellipsis within sidebar width. Full name in tooltip on hover. | Name truncated with ellipsis within sidebar width. Full name in tooltip on hover. | Name truncated with ellipsis within sidebar width. Full name in tooltip on hover.


--- TABLE 213 ---
ID | UI-011 | Priority | P0
Title | Account view content | Automation | Playwright
Preconditions | Authenticated user | Authenticated user | Authenticated user
Steps | 1. Tap profile card. | 1. Tap profile card. | 1. Tap profile card.
Expected Result | Account view shows: avatar, name, email (read-only), role with description, TOS status ('Accepted v1.0 on Mar 15'), member-since date, data summary, active sessions with 'Sign out everywhere'. | Account view shows: avatar, name, email (read-only), role with description, TOS status ('Accepted v1.0 on Mar 15'), member-since date, data summary, active sessions with 'Sign out everywhere'. | Account view shows: avatar, name, email (read-only), role with description, TOS status ('Accepted v1.0 on Mar 15'), member-since date, data summary, active sessions with 'Sign out everywhere'.


--- TABLE 214 ---
ID | UI-012 | Priority | P0
Title | Active page highlighted by URL | Automation | Playwright
Preconditions | Navigate to /dashboard | Navigate to /dashboard | Navigate to /dashboard
Steps | 1. Navigate to Dashboard via URL bar. | 1. Navigate to Dashboard via URL bar. | 1. Navigate to Dashboard via URL bar.
Expected Result | Dashboard nav item: amber text, 10% amber bg, 3px left border. Other items muted gray. Determined by URL, not click. | Dashboard nav item: amber text, 10% amber bg, 3px left border. Other items muted gray. Determined by URL, not click. | Dashboard nav item: amber text, 10% amber bg, 3px left border. Other items muted gray. Determined by URL, not click.


--- TABLE 215 ---
ID | UI-013 | Priority | P0
Title | Sidebar keyboard navigation | Automation | Playwright keyboard
Preconditions | No mouse, Tab into sidebar | No mouse, Tab into sidebar | No mouse, Tab into sidebar
Steps | 1. Tab to first nav item. 2. Arrow Down through items. 3. Enter to activate. | 1. Tab to first nav item. 2. Arrow Down through items. 3. Enter to activate. | 1. Tab to first nav item. 2. Arrow Down through items. 3. Enter to activate.
Expected Result | All items reachable. Focus ring (2px amber). Arrow keys move between items. Enter navigates. Escape blurs. | All items reachable. Focus ring (2px amber). Arrow keys move between items. Enter navigates. Escape blurs. | All items reachable. Focus ring (2px amber). Arrow keys move between items. Enter navigates. Escape blurs.


--- TABLE 216 ---
ID | UI-014 | Priority | P0
Title | Mobile hamburger drawer | Automation | Playwright mobile
Preconditions | Viewport 375px | Viewport 375px | Viewport 375px
Steps | 1. Tap hamburger icon. 2. Observe drawer. 3. Tap nav item. 4. Observe close. | 1. Tap hamburger icon. 2. Observe drawer. 3. Tap nav item. 4. Observe close. | 1. Tap hamburger icon. 2. Observe drawer. 3. Tap nav item. 4. Observe close.
Expected Result | Drawer slides in from left over backdrop. Contains profile + nav + stats. Tap item: navigates + auto-closes. Tap backdrop: closes. Swipe left: closes. | Drawer slides in from left over backdrop. Contains profile + nav + stats. Tap item: navigates + auto-closes. Tap backdrop: closes. Swipe left: closes. | Drawer slides in from left over backdrop. Contains profile + nav + stats. Tap item: navigates + auto-closes. Tap backdrop: closes. Swipe left: closes.


--- TABLE 217 ---
ID | UI-015 | Priority | P0
Title | Footer stats tappable navigation | Automation | Playwright
Preconditions | Tap STREAK tile | Tap STREAK tile | Tap STREAK tile
Steps | 1. Tap STREAK stat tile in sidebar footer. | 1. Tap STREAK stat tile in sidebar footer. | 1. Tap STREAK stat tile in sidebar footer.
Expected Result | Opens streak detail modal (current streak, longest ever, 30-day calendar, rest days remaining). | Opens streak detail modal (current streak, longest ever, 30-day calendar, rest days remaining). | Opens streak detail modal (current streak, longest ever, 30-day calendar, rest days remaining).


--- TABLE 218 ---
ID | UI-016 | Priority | P0
Title | Footer GOAL tile inline edit | Automation | Playwright
Preconditions | Tap GOAL tile | Tap GOAL tile | Tap GOAL tile
Steps | 1. Tap GOAL tile. 2. Change from 4 to 6. 3. Tap away. | 1. Tap GOAL tile. 2. Change from 4 to 6. 3. Tap away. | 1. Tap GOAL tile. 2. Change from 4 to 6. 3. Tap away.
Expected Result | GOAL becomes inline editable (stepper). Change saves to Settings. Timer page updates. Footer shows new value. | GOAL becomes inline editable (stepper). Change saves to Settings. Timer page updates. Footer shows new value. | GOAL becomes inline editable (stepper). Change saves to Settings. Timer page updates. Footer shows new value.


--- TABLE 219 ---
ID | UI-017 | Priority | P0
Title | Beta counter dynamic | Automation | Playwright + KV assertion
Preconditions | 7 of 10 beta slots filled | 7 of 10 beta slots filled | 7 of 10 beta slots filled
Steps | 1. Check footer. | 1. Check footer. | 1. Check footer.
Expected Result | Shows 'BETA · 7/10 USERS' (not static '10'). Updates when users join/leave. | Shows 'BETA · 7/10 USERS' (not static '10'). Updates when users join/leave. | Shows 'BETA · 7/10 USERS' (not static '10'). Updates when users join/leave.


--- TABLE 220 ---
ID | UI-018 | Priority | P0
Title | Privacy/Terms modal from footer | Automation | Playwright
Preconditions | Click 'Terms' link in footer | Click 'Terms' link in footer | Click 'Terms' link in footer
Steps | 1. Click 'Terms'. | 1. Click 'Terms'. | 1. Click 'Terms'.
Expected Result | Modal overlay (NOT new tab) with TOS document, version, full text. If user's version differs: banner with acceptance button. | Modal overlay (NOT new tab) with TOS document, version, full text. If user's version differs: banner with acceptance button. | Modal overlay (NOT new tab) with TOS document, version, full text. If user's version differs: banner with acceptance button.


--- TABLE 221 ---
ID | UI-019 | Priority | P0
Title | ADMIN section hidden for regular user | Automation | Playwright DOM assertion
Preconditions | Role='user' | Role='user' | Role='user'
Steps | 1. Login. 2. Inspect sidebar DOM. | 1. Login. 2. Inspect sidebar DOM. | 1. Login. 2. Inspect sidebar DOM.
Expected Result | ADMIN section completely absent from DOM (not hidden, not display:none, not rendered at all). | ADMIN section completely absent from DOM (not hidden, not display:none, not rendered at all). | ADMIN section completely absent from DOM (not hidden, not display:none, not rendered at all).


--- TABLE 222 ---
ID | TMR-035 | Priority | P1
Title | Ambient sound fades in on session start | Automation | Integration + audio spy
Preconditions | Ambient = Rain, Focus session | Ambient = Rain, Focus session | Ambient = Rain, Focus session
Steps | 1. Start focus session. | 1. Start focus session. | 1. Start focus session.
Expected Result | Rain audio fades in over 3 seconds (volume 0% to configured 30%). Not instant. Smooth fade. | Rain audio fades in over 3 seconds (volume 0% to configured 30%). Not instant. Smooth fade. | Rain audio fades in over 3 seconds (volume 0% to configured 30%). Not instant. Smooth fade.


--- TABLE 223 ---
ID | TMR-036 | Priority | P0
Title | Ambient sound stops during breaks | Automation | Playwright + audio spy
Preconditions | Ambient ON, break starts | Ambient ON, break starts | Ambient ON, break starts
Steps | 1. Complete focus. 2. Start break. | 1. Complete focus. 2. Start break. | 1. Complete focus. 2. Start break.
Expected Result | Ambient fades out over 3 seconds. Does NOT play during break. Resumes on next focus. | Ambient fades out over 3 seconds. Does NOT play during break. Resumes on next focus. | Ambient fades out over 3 seconds. Does NOT play during break. Resumes on next focus.


--- TABLE 224 ---
ID | TMR-037 | Priority | P1
Title | Ambient pauses when timer paused | Automation | Integration
Preconditions | Ambient playing during focus | Ambient playing during focus | Ambient playing during focus
Steps | 1. Pause timer. | 1. Pause timer. | 1. Pause timer.
Expected Result | Ambient fades out 3 seconds. On resume: fades back in 3 seconds. | Ambient fades out 3 seconds. On resume: fades back in 3 seconds. | Ambient fades out 3 seconds. On resume: fades back in 3 seconds.


--- TABLE 225 ---
ID | TMR-038 | Priority | P0
Title | Wake Lock active during session | Automation | Playwright + API spy
Preconditions | Screen Wake Lock ON | Screen Wake Lock ON | Screen Wake Lock ON
Steps | 1. Start focus session. 2. Check Wake Lock API. | 1. Start focus session. 2. Check Wake Lock API. | 1. Start focus session. 2. Check Wake Lock API.
Expected Result | navigator.wakeLock.request('screen') called. Lock held during session. Released on completion/pause/navigate. | navigator.wakeLock.request('screen') called. Lock held during session. Released on completion/pause/navigate. | navigator.wakeLock.request('screen') called. Lock held during session. Released on completion/pause/navigate.


--- TABLE 226 ---
ID | TMR-039 | Priority | P1
Title | Wake Lock fallback on unsupported browser | Automation | Integration + mock
Preconditions | Wake Lock API unavailable | Wake Lock API unavailable | Wake Lock API unavailable
Steps | 1. Mock Wake Lock API as undefined. 2. Start session. | 1. Mock Wake Lock API as undefined. 2. Start session. | 1. Mock Wake Lock API as undefined. 2. Start session.
Expected Result | Setting shows 'Not supported in this browser'. Silent audio fallback activates (if configured). | Setting shows 'Not supported in this browser'. Silent audio fallback activates (if configured). | Setting shows 'Not supported in this browser'. Silent audio fallback activates (if configured).


--- TABLE 227 ---
ID | TMR-040 | Priority | P0
Title | Break Extend +2 min button | Automation | Playwright
Preconditions | Break completing | Break completing | Break completing
Steps | 1. Complete break. 2. Click 'Extend Break (+2 min)'. | 1. Complete break. 2. Click 'Extend Break (+2 min)'. | 1. Complete break. 2. Click 'Extend Break (+2 min)'.
Expected Result | Break timer restarts at 2:00. Can click multiple times (2:00 + 2:00 = resets to 2:00 each time). Each extension logged. | Break timer restarts at 2:00. Can click multiple times (2:00 + 2:00 = resets to 2:00 each time). Each extension logged. | Break timer restarts at 2:00. Can click multiple times (2:00 + 2:00 = resets to 2:00 each time). Each extension logged.


--- TABLE 228 ---
ID | TMR-041 | Priority | P0
Title | Auto-Start Focus after break | Automation | Playwright
Preconditions | Auto-Start Focus ON | Auto-Start Focus ON | Auto-Start Focus ON
Steps | 1. Complete break session. | 1. Complete break session. | 1. Complete break session.
Expected Result | 5-second countdown: 'Focus starting in 5...' with Cancel. After countdown: focus auto-starts. | 5-second countdown: 'Focus starting in 5...' with Cancel. After countdown: focus auto-starts. | 5-second countdown: 'Focus starting in 5...' with Cancel. After countdown: focus auto-starts.


--- TABLE 229 ---
ID | TMR-042 | Priority | P0
Title | Fullscreen Focus mode | Automation | Playwright + Fullscreen API
Preconditions | Fullscreen Focus ON | Fullscreen Focus ON | Fullscreen Focus ON
Steps | 1. Start focus session. | 1. Start focus session. | 1. Start focus session.
Expected Result | Browser enters fullscreen. Only timer + controls visible. Sidebar/nav hidden. 'Exit Fullscreen' in corner. Exiting does not pause. | Browser enters fullscreen. Only timer + controls visible. Sidebar/nav hidden. 'Exit Fullscreen' in corner. Exiting does not pause. | Browser enters fullscreen. Only timer + controls visible. Sidebar/nav hidden. 'Exit Fullscreen' in corner. Exiting does not pause.


--- TABLE 230 ---
ID | TMR-043 | Priority | P1
Title | Fullscreen hidden on unsupported browser | Automation | Playwright + API mock
Preconditions | Fullscreen API unavailable | Fullscreen API unavailable | Fullscreen API unavailable
Steps | 1. Check Settings > Focus Mode. | 1. Check Settings > Focus Mode. | 1. Check Settings > Focus Mode.
Expected Result | Fullscreen Focus toggle is NOT shown (hidden from UI entirely). No error. No grayed toggle. | Fullscreen Focus toggle is NOT shown (hidden from UI entirely). No error. No grayed toggle. | Fullscreen Focus toggle is NOT shown (hidden from UI entirely). No error. No grayed toggle.


--- TABLE 231 ---
ID | TMR-044 | Priority | P1
Title | Notification sound matches theme | Automation | Playwright + notification API
Preconditions | Warm theme, session completes while backgrounded | Warm theme, session completes while backgrounded | Warm theme, session completes while backgrounded
Steps | 1. Start session. 2. Background tab. 3. Wait for completion. | 1. Start session. 2. Background tab. 3. Wait for completion. | 1. Start session. 2. Background tab. 3. Wait for completion.
Expected Result | Browser notification fires. Notification sound matches Warm theme chime. Clicking notification focuses tab. | Browser notification fires. Notification sound matches Warm theme chime. Clicking notification focuses tab. | Browser notification fires. Notification sound matches Warm theme chime. Clicking notification focuses tab.


--- TABLE 232 ---
ID | SET-016 | Priority | P0
Title | Clear All Data typed confirmation | Automation | Playwright
Preconditions | User clicks Clear All Data | User clicks Clear All Data | User clicks Clear All Data
Steps | 1. Click Clear. 2. Type 'CLEAR' in confirmation. 3. Submit. | 1. Click Clear. 2. Type 'CLEAR' in confirmation. 3. Submit. | 1. Click Clear. 2. Type 'CLEAR' in confirmation. 3. Submit.
Expected Result | Typed 'CLEAR' required (case-insensitive). On submit: all sessions + settings purged. Account preserved. Counter resets to 0. Toast: 'All data cleared.' | Typed 'CLEAR' required (case-insensitive). On submit: all sessions + settings purged. Account preserved. Counter resets to 0. Toast: 'All data cleared.' | Typed 'CLEAR' required (case-insensitive). On submit: all sessions + settings purged. Account preserved. Counter resets to 0. Toast: 'All data cleared.'


--- TABLE 233 ---
ID | SET-017 | Priority | P0
Title | Strict Mode lock icon on timer | Automation | Playwright + visual
Preconditions | Strict Mode ON, session running | Strict Mode ON, session running | Strict Mode ON, session running
Steps | 1. Enable Strict Mode. 2. Start session. 3. Observe timer. | 1. Enable Strict Mode. 2. Start session. 3. Observe timer. | 1. Enable Strict Mode. 2. Start session. 3. Observe timer.
Expected Result | Small lock icon visible on or near timer ring. Communicates restricted mode visually. | Small lock icon visible on or near timer ring. Communicates restricted mode visually. | Small lock icon visible on or near timer ring. Communicates restricted mode visually.


--- TABLE 234 ---
ID | SET-018 | Priority | P1
Title | Idle Reminder notification | Automation | Integration + mocked time
Preconditions | Idle Reminder ON (15 min), app open, no session | Idle Reminder ON (15 min), app open, no session | Idle Reminder ON (15 min), app open, no session
Steps | 1. Open app. 2. Wait 15 minutes without starting session. | 1. Open app. 2. Wait 15 minutes without starting session. | 1. Open app. 2. Wait 15 minutes without starting session.
Expected Result | Notification: 'Ready to start focusing?' Does NOT fire during breaks or after goal met. | Notification: 'Ready to start focusing?' Does NOT fire during breaks or after goal met. | Notification: 'Ready to start focusing?' Does NOT fire during breaks or after goal met.


--- TABLE 235 ---
ID | SET-019 | Priority | P1
Title | Daily Summary notification | Automation | Integration + mocked time
Preconditions | Daily Summary ON (8 PM) | Daily Summary ON (8 PM) | Daily Summary ON (8 PM)
Steps | 1. Enable. 2. Mock time to 8 PM. 3. Observe. | 1. Enable. 2. Mock time to 8 PM. 3. Observe. | 1. Enable. 2. Mock time to 8 PM. 3. Observe.
Expected Result | Notification: 'Today: 3/4 sessions, 75 min focused. Streak: 5 days.' Only fires if user was active today. | Notification: 'Today: 3/4 sessions, 75 min focused. Streak: 5 days.' Only fires if user was active today. | Notification: 'Today: 3/4 sessions, 75 min focused. Streak: 5 days.' Only fires if user was active today.


--- TABLE 236 ---
ID | SET-020 | Priority | P1
Title | Screen Reader verbosity: Verbose | Automation | Manual NVDA + ARIA assertion
Preconditions | Verbosity set to Verbose | Verbosity set to Verbose | Verbosity set to Verbose
Steps | 1. Start and complete session. | 1. Start and complete session. | 1. Start and complete session.
Expected Result | ARIA announcements every minute: '24 minutes remaining', '23 minutes remaining', etc. Plus start and completion. | ARIA announcements every minute: '24 minutes remaining', '23 minutes remaining', etc. Plus start and completion. | ARIA announcements every minute: '24 minutes remaining', '23 minutes remaining', etc. Plus start and completion.


--- TABLE 237 ---
ID | SET-021 | Priority | P0
Title | High Contrast mode | Automation | axe-core + Playwright
Preconditions | Toggle ON | Toggle ON | Toggle ON
Steps | 1. Enable High Contrast. 2. Check all pages. | 1. Enable High Contrast. 2. Check all pages. | 1. Enable High Contrast. 2. Check all pages.
Expected Result | Pure white text on pure black bg. No grays. Solid borders replace shadows. WCAG AAA (7:1) verified by axe-core. | Pure white text on pure black bg. No grays. Solid borders replace shadows. WCAG AAA (7:1) verified by axe-core. | Pure white text on pure black bg. No grays. Solid borders replace shadows. WCAG AAA (7:1) verified by axe-core.


--- TABLE 238 ---
ID | SET-022 | Priority | P0
Title | Shortcut customization | Automation | Playwright
Preconditions | Change Reset from R to Ctrl+R | Change Reset from R to Ctrl+R | Change Reset from R to Ctrl+R
Steps | 1. Settings > Shortcuts > R row > Click Change. 2. Press Ctrl+R. | 1. Settings > Shortcuts > R row > Click Change. 2. Press Ctrl+R. | 1. Settings > Shortcuts > R row > Click Change. 2. Press Ctrl+R.
Expected Result | Binding updated to Ctrl+R. Keys modal shows Ctrl+R with '(custom)' label. R key no longer triggers Reset. | Binding updated to Ctrl+R. Keys modal shows Ctrl+R with '(custom)' label. R key no longer triggers Reset. | Binding updated to Ctrl+R. Keys modal shows Ctrl+R with '(custom)' label. R key no longer triggers Reset.


--- TABLE 239 ---
ID | SET-023 | Priority | P0
Title | Shortcut conflict detection | Automation | Playwright
Preconditions | Assign 'S' (skip) to Play/Pause | Assign 'S' (skip) to Play/Pause | Assign 'S' (skip) to Play/Pause
Steps | 1. Change Play/Pause to 'S'. 2. Observe. | 1. Change Play/Pause to 'S'. 2. Observe. | 1. Change Play/Pause to 'S'. 2. Observe.
Expected Result | Warning: 'S is already assigned to Skip. Replace?' Replace: swaps bindings. Cancel: reverts. | Warning: 'S is already assigned to Skip. Replace?' Replace: swaps bindings. Cancel: reverts. | Warning: 'S is already assigned to Skip. Replace?' Replace: swaps bindings. Cancel: reverts.


--- TABLE 240 ---
ID | SET-024 | Priority | P1
Title | Category color assignment | Automation | Playwright
Preconditions | Edit category, change color | Edit category, change color | Edit category, change color
Steps | 1. Settings > Categories > Edit 'Work'. 2. Pick blue swatch. | 1. Settings > Categories > Edit 'Work'. 2. Pick blue swatch. | 1. Settings > Categories > Edit 'Work'. 2. Pick blue swatch.
Expected Result | Blue dot appears next to 'Work' in list. Timer category dropdown shows blue dot. Session Log shows blue dot. | Blue dot appears next to 'Work' in list. Timer category dropdown shows blue dot. Session Log shows blue dot. | Blue dot appears next to 'Work' in list. Timer category dropdown shows blue dot. Session Log shows blue dot.


--- TABLE 241 ---
ID | SET-025 | Priority | P1
Title | Category drag-to-reorder | Automation | Playwright drag simulation
Preconditions | Drag 'Study' above 'Work' | Drag 'Study' above 'Work' | Drag 'Study' above 'Work'
Steps | 1. Grab drag handle on 'Study'. 2. Drag above 'Work'. 3. Release. | 1. Grab drag handle on 'Study'. 2. Drag above 'Work'. 3. Release. | 1. Grab drag handle on 'Study'. 2. Drag above 'Work'. 3. Release.
Expected Result | Order changes. Timer dropdown reflects new order. Saved to KV. | Order changes. Timer dropdown reflects new order. Saved to KV. | Order changes. Timer dropdown reflects new order. Saved to KV.


--- TABLE 242 ---
ID | SET-026 | Priority | P0
Title | Category renamed: historical sessions | Automation | Integration
Preconditions | Rename 'Work' to 'Professional' | Rename 'Work' to 'Professional' | Rename 'Work' to 'Professional'
Steps | 1. Rename category. 2. Check Session Log for old 'Work' sessions. | 1. Rename category. 2. Check Session Log for old 'Work' sessions. | 1. Rename category. 2. Check Session Log for old 'Work' sessions.
Expected Result | Past sessions show 'Work' (historical name at time of logging). Future sessions use 'Professional'. No retroactive rename. | Past sessions show 'Work' (historical name at time of logging). Future sessions use 'Professional'. No retroactive rename. | Past sessions show 'Work' (historical name at time of logging). Future sessions use 'Professional'. No retroactive rename.


--- TABLE 243 ---
ID | SET-027 | Priority | P1
Title | Autocomplete with toggle OFF | Automation | Playwright
Preconditions | Intent Autocomplete OFF | Intent Autocomplete OFF | Intent Autocomplete OFF
Steps | 1. Disable Autocomplete. 2. Type 'Res' in intent. | 1. Disable Autocomplete. 2. Type 'Res' in intent. | 1. Disable Autocomplete. 2. Type 'Res' in intent.
Expected Result | No dropdown appears. No suggestions. Input accepts text normally. | No dropdown appears. No suggestions. Input accepts text normally. | No dropdown appears. No suggestions. Input accepts text normally.


--- TABLE 244 ---
ID | SET-028 | Priority | P1
Title | Weekly Goal independent of daily | Automation | Integration + mocked time
Preconditions | Weekly Goal ON (20), Daily Goal 4 | Weekly Goal ON (20), Daily Goal 4 | Weekly Goal ON (20), Daily Goal 4
Steps | 1. Meet daily goal Mon-Fri (5 days × 4 = 20 sessions). 2. Check weekly goal. | 1. Meet daily goal Mon-Fri (5 days × 4 = 20 sessions). 2. Check weekly goal. | 1. Meet daily goal Mon-Fri (5 days × 4 = 20 sessions). 2. Check weekly goal.
Expected Result | Weekly goal met (20/20). But: daily goal met 3/7 days (not Mon) also counts as weekly 12/20 (not met). | Weekly goal met (20/20). But: daily goal met 3/7 days (not Mon) also counts as weekly 12/20 (not met). | Weekly goal met (20/20). But: daily goal met 3/7 days (not Mon) also counts as weekly 12/20 (not met).


--- TABLE 245 ---
ID | SET-029 | Priority | P0
Title | Goal Rate calculation | Automation | Integration
Preconditions | User: 10 days since first session, 7 days met goal | User: 10 days since first session, 7 days met goal | User: 10 days since first session, 7 days met goal
Steps | 1. Check Dashboard GOAL RATE. | 1. Check Dashboard GOAL RATE. | 1. Check Dashboard GOAL RATE.
Expected Result | Shows '70%'. Calculation: 7/10 × 100 = 70%. Tooltip: '7 of 10 days.' | Shows '70%'. Calculation: 7/10 × 100 = 70%. Tooltip: '7 of 10 days.' | Shows '70%'. Calculation: 7/10 × 100 = 70%. Tooltip: '7 of 10 days.'


--- TABLE 246 ---
ID | DASH-008 | Priority | P0
Title | Category Breakdown donut chart | Automation | Playwright + visual
Preconditions | User with 3 categories used | User with 3 categories used | User with 3 categories used
Steps | 1. Check donut chart. | 1. Check donut chart. | 1. Check donut chart.
Expected Result | Three segments sized proportionally. Center: total count. Hover segment: highlights both segment and list row. Colors match category colors. | Three segments sized proportionally. Center: total count. Hover segment: highlights both segment and list row. Colors match category colors. | Three segments sized proportionally. Center: total count. Hover segment: highlights both segment and list row. Colors match category colors.


--- TABLE 247 ---
ID | DASH-009 | Priority | P0
Title | Top Intents card | Automation | Playwright
Preconditions | User with 20+ different intents | User with 20+ different intents | User with 20+ different intents
Steps | 1. Check Top Intents card. | 1. Check Top Intents card. | 1. Check Top Intents card.
Expected Result | Top 10 shown, sorted by frequency. Each: rank, text (40 char truncate), count, total time. Intents with 1 usage excluded. | Top 10 shown, sorted by frequency. Each: rank, text (40 char truncate), count, total time. Intents with 1 usage excluded. | Top 10 shown, sorted by frequency. Each: rank, text (40 char truncate), count, total time. Intents with 1 usage excluded.


--- TABLE 248 ---
ID | DASH-010 | Priority | P1
Title | Peak Focus Hours heatmap | Automation | Playwright
Preconditions | User with 30+ sessions across different hours | User with 30+ sessions across different hours | User with 30+ sessions across different hours
Steps | 1. Check Peak Focus Hours. | 1. Check Peak Focus Hours. | 1. Check Peak Focus Hours.
Expected Result | 7x24 grid rendered. Darkest cell = 0 minutes. Brightest = max. Auto-insight: 'Most productive: [day] [time].' Requires 10+ sessions for insight. | 7x24 grid rendered. Darkest cell = 0 minutes. Brightest = max. Auto-insight: 'Most productive: [day] [time].' Requires 10+ sessions for insight. | 7x24 grid rendered. Darkest cell = 0 minutes. Brightest = max. Auto-insight: 'Most productive: [day] [time].' Requires 10+ sessions for insight.


--- TABLE 249 ---
ID | DASH-011 | Priority | P0
Title | Weekly Comparison card | Automation | Playwright
Preconditions | Data for current and last week | Data for current and last week | Data for current and last week
Steps | 1. Check Weekly Comparison. | 1. Check Weekly Comparison. | 1. Check Weekly Comparison.
Expected Result | Side-by-side: This Week vs Last Week. Sessions, Time, Goal Completion, Avg Length. Green/red arrows for changes. Note if current week in-progress. | Side-by-side: This Week vs Last Week. Sessions, Time, Goal Completion, Avg Length. Green/red arrows for changes. Note if current week in-progress. | Side-by-side: This Week vs Last Week. Sessions, Time, Goal Completion, Avg Length. Green/red arrows for changes. Note if current week in-progress.


--- TABLE 250 ---
ID | DASH-012 | Priority | P1
Title | Dashboard Export PDF | Automation | Playwright + PDF validation
Preconditions | Click Export > PDF | Click Export > PDF | Click Export > PDF
Steps | 1. Click Export on Dashboard. 2. Select PDF. 3. Download. | 1. Click Export on Dashboard. 2. Select PDF. 3. Download. | 1. Click Export on Dashboard. 2. Select PDF. 3. Download.
Expected Result | PDF contains: cover with branding, summary stats, static chart images, session table. Multi-page. Branded footer. | PDF contains: cover with branding, summary stats, static chart images, session table. Multi-page. Branded footer. | PDF contains: cover with branding, summary stats, static chart images, session table. Multi-page. Branded footer.


--- TABLE 251 ---
ID | DASH-013 | Priority | P0
Title | Streak detail modal | Automation | Playwright
Preconditions | Click STREAK stat card | Click STREAK stat card | Click STREAK stat card
Steps | 1. Tap STREAK tile on Dashboard. | 1. Tap STREAK tile on Dashboard. | 1. Tap STREAK tile on Dashboard.
Expected Result | Modal shows: current streak (22 days, started Mar 17), longest ever (22 days), 30-day calendar (green/amber/red cells), rest days remaining (1/2). | Modal shows: current streak (22 days, started Mar 17), longest ever (22 days), 30-day calendar (green/amber/red cells), rest days remaining (1/2). | Modal shows: current streak (22 days, started Mar 17), longest ever (22 days), 30-day calendar (green/amber/red cells), rest days remaining (1/2).


--- TABLE 252 ---
ID | DASH-014 | Priority | P1
Title | Chart type toggle bar/line | Automation | Playwright
Preconditions | Click line chart toggle | Click line chart toggle | Click line chart toggle
Steps | 1. On Focus Hours, click line chart icon. | 1. On Focus Hours, click line chart icon. | 1. On Focus Hours, click line chart icon.
Expected Result | Chart switches from bars to smooth line with amber gradient fill. Same data points. Same tooltips. Toggle persists in settings. | Chart switches from bars to smooth line with amber gradient fill. Same data points. Same tooltips. Toggle persists in settings. | Chart switches from bars to smooth line with amber gradient fill. Same data points. Same tooltips. Toggle persists in settings.


--- TABLE 253 ---
ID | LOG-013 | Priority | P0
Title | Sort by Duration column | Automation | Playwright
Preconditions | Click Duration header | Click Duration header | Click Duration header
Steps | 1. Click 'DURATION' column header. | 1. Click 'DURATION' column header. | 1. Click 'DURATION' column header.
Expected Result | Rows sorted by duration descending (longest first). Arrow icon ↓ appears. Click again: ascending ↑. | Rows sorted by duration descending (longest first). Arrow icon ↓ appears. Click again: ascending ↑. | Rows sorted by duration descending (longest first). Arrow icon ↓ appears. Click again: ascending ↑.


--- TABLE 254 ---
ID | LOG-014 | Priority | P0
Title | Date separator rows | Automation | Playwright
Preconditions | Sessions spanning 3 days | Sessions spanning 3 days | Sessions spanning 3 days
Steps | 1. Scroll through Session Log. | 1. Scroll through Session Log. | 1. Scroll through Session Log.
Expected Result | Between days: separator row 'Sunday, April 6, 2026' with daily summary '3 sessions · 1h 45m'. Groups sessions visually. | Between days: separator row 'Sunday, April 6, 2026' with daily summary '3 sessions · 1h 45m'. Groups sessions visually. | Between days: separator row 'Sunday, April 6, 2026' with daily summary '3 sessions · 1h 45m'. Groups sessions visually.


--- TABLE 255 ---
ID | LOG-015 | Priority | P0
Title | Row expansion detail panel | Automation | Playwright
Preconditions | Click a session row | Click a session row | Click a session row
Steps | 1. Click a row. | 1. Click a row. | 1. Click a row.
Expected Result | Inline expansion below row: full date range, configured vs actual duration, overtime, intent (full), category, note, device. One at a time (clicking another collapses previous). | Inline expansion below row: full date range, configured vs actual duration, overtime, intent (full), category, note, device. One at a time (clicking another collapses previous). | Inline expansion below row: full date range, configured vs actual duration, overtime, intent (full), category, note, device. One at a time (clicking another collapses previous).


--- TABLE 256 ---
ID | LOG-016 | Priority | P0
Title | Edit category after session | Automation | Playwright
Preconditions | Session with 'General' category | Session with 'General' category | Session with 'General' category
Steps | 1. Kebab > Edit Category. 2. Select 'Work'. 3. Confirm. | 1. Kebab > Edit Category. 2. Select 'Work'. 3. Confirm. | 1. Kebab > Edit Category. 2. Select 'Work'. 3. Confirm.
Expected Result | Category updates to 'Work'. Dashboard stats recalculate. Edit timestamp recorded server-side. | Category updates to 'Work'. Dashboard stats recalculate. Edit timestamp recorded server-side. | Category updates to 'Work'. Dashboard stats recalculate. Edit timestamp recorded server-side.


--- TABLE 257 ---
ID | LOG-017 | Priority | P0
Title | Add note after session | Automation | Playwright
Preconditions | Session Notes enabled, session without note | Session Notes enabled, session without note | Session Notes enabled, session without note
Steps | 1. Kebab > Add Note. 2. Type reflection (max 500 chars). 3. Save. | 1. Kebab > Add Note. 2. Type reflection (max 500 chars). 3. Save. | 1. Kebab > Add Note. 2. Type reflection (max 500 chars). 3. Save.
Expected Result | Note saved. Notes icon (💬) appears on this row. Note visible in expansion panel. | Note saved. Notes icon (💬) appears on this row. Note visible in expansion panel. | Note saved. Notes icon (💬) appears on this row. Note visible in expansion panel.


--- TABLE 258 ---
ID | LOG-018 | Priority | P1
Title | Export PDF from Session Log | Automation | Playwright + PDF validation
Preconditions | Click Export > PDF | Click Export > PDF | Click Export > PDF
Steps | 1. Export > PDF with summary stats and charts enabled. | 1. Export > PDF with summary stats and charts enabled. | 1. Export > PDF with summary stats and charts enabled.
Expected Result | PDF: summary header (total sessions, time, categories), formatted session table, page numbers, Becoming.. branding. | PDF: summary header (total sessions, time, categories), formatted session table, page numbers, Becoming.. branding. | PDF: summary header (total sessions, time, categories), formatted session table, page numbers, Becoming.. branding.


--- TABLE 259 ---
ID | LOG-019 | Priority | P0
Title | Session Log mobile card layout | Automation | Playwright mobile viewport
Preconditions | Viewport 375px | Viewport 375px | Viewport 375px
Steps | 1. Load Session Log on mobile. | 1. Load Session Log on mobile. | 1. Load Session Log on mobile.
Expected Result | Table transforms to card list. Each card: Type badge + Date/Time, Duration + Category, Intent + Status. Tap expands. Swipe left: Edit/Delete. | Table transforms to card list. Each card: Type badge + Date/Time, Duration + Category, Intent + Status. Tap expands. Swipe left: Edit/Delete. | Table transforms to card list. Each card: Type badge + Date/Time, Duration + Category, Intent + Status. Tap expands. Swipe left: Edit/Delete.


--- TABLE 260 ---
ID | ADM-013 | Priority | P0
Title | Deactivate user account | Automation | Playwright + KV
Preconditions | Super Admin, target user exists | Super Admin, target user exists | Super Admin, target user exists
Steps | 1. User Management > Actions > Deactivate. 2. Type email to confirm. | 1. User Management > Actions > Deactivate. 2. Type email to confirm. | 1. User Management > Actions > Deactivate. 2. Type email to confirm.
Expected Result | User cannot login. Data preserved. Beta slot freed. Audit log entry. User can be reactivated later. | User cannot login. Data preserved. Beta slot freed. Audit log entry. User can be reactivated later. | User cannot login. Data preserved. Beta slot freed. Audit log entry. User can be reactivated later.


--- TABLE 261 ---
ID | ADM-014 | Priority | P0
Title | Delete user with typed confirmation | Automation | Playwright + KV
Preconditions | Super Admin, target user | Super Admin, target user | Super Admin, target user
Steps | 1. Actions > Delete. 2. Type email + 'DELETE'. | 1. Actions > Delete. 2. Type email + 'DELETE'. | 1. Actions > Delete. 2. Type email + 'DELETE'.
Expected Result | All KV data purged for user. OAuth revoked. Beta counter decremented. Cannot be undone. Audit logged. | All KV data purged for user. OAuth revoked. Beta counter decremented. Cannot be undone. Audit logged. | All KV data purged for user. OAuth revoked. Beta counter decremented. Cannot be undone. Audit logged.


--- TABLE 262 ---
ID | ADM-015 | Priority | P0
Title | Beta invitation create and expire | Automation | Integration + mocked time
Preconditions | Super Admin | Super Admin | Super Admin
Steps | 1. Invite user@example.com. 2. Check allowlist. 3. Wait 30 days (mock). | 1. Invite user@example.com. 2. Check allowlist. 3. Wait 30 days (mock). | 1. Invite user@example.com. 2. Check allowlist. 3. Wait 30 days (mock).
Expected Result | Invitation created (status: pending). After 30 days: status changes to 'expired'. Expired invitations cannot be used to sign up. | Invitation created (status: pending). After 30 days: status changes to 'expired'. Expired invitations cannot be used to sign up. | Invitation created (status: pending). After 30 days: status changes to 'expired'. Expired invitations cannot be used to sign up.


--- TABLE 263 ---
ID | ADM-016 | Priority | P0
Title | TOS compliance funnel | Automation | Playwright + data validation
Preconditions | Super Admin views TOS analytics | Super Admin views TOS analytics | Super Admin views TOS analytics
Steps | 1. Navigate to Admin > Analytics > TOS section. | 1. Navigate to Admin > Analytics > TOS section. | 1. Navigate to Admin > Analytics > TOS section.
Expected Result | Funnel: Signed In (10) > Viewed TOS (10) > Accepted (9) > First Session (8). Dropoff percentages between each step. | Funnel: Signed In (10) > Viewed TOS (10) > Accepted (9) > First Session (8). Dropoff percentages between each step. | Funnel: Signed In (10) > Viewed TOS (10) > Accepted (9) > First Session (8). Dropoff percentages between each step.


--- TABLE 264 ---
ID | ADM-017 | Priority | P1
Title | Admin Export PDF report | Automation | Playwright + PDF validation
Preconditions | Super Admin clicks Export Report | Super Admin clicks Export Report | Super Admin clicks Export Report
Steps | 1. Click Export Report on Analytics page. | 1. Click Export Report on Analytics page. | 1. Click Export Report on Analytics page.
Expected Result | PDF: key metrics, one-line summary, chart renders, user health scorecard, auto-recommendations. Branded. | PDF: key metrics, one-line summary, chart renders, user health scorecard, auto-recommendations. Branded. | PDF: key metrics, one-line summary, chart renders, user health scorecard, auto-recommendations. Branded.


--- TABLE 265 ---
ID | ADM-018 | Priority | P0
Title | Feature adoption matrix accuracy | Automation | Integration
Preconditions | Various settings enabled across users | Various settings enabled across users | Various settings enabled across users
Steps | 1. Check Feature Adoption Matrix. | 1. Check Feature Adoption Matrix. | 1. Check Feature Adoption Matrix.
Expected Result | Table shows correct counts per feature. Sorted by adoption %. Trend arrows (up/down/flat) based on 30-day change. Low adoption (<15%) flagged amber. | Table shows correct counts per feature. Sorted by adoption %. Trend arrows (up/down/flat) based on 30-day change. Low adoption (<15%) flagged amber. | Table shows correct counts per feature. Sorted by adoption %. Trend arrows (up/down/flat) based on 30-day change. Low adoption (<15%) flagged amber.


--- TABLE 266 ---
ID | ADM-019 | Priority | P0
Title | Retention cohort table | Automation | Integration
Preconditions | Users signed up in different weeks | Users signed up in different weeks | Users signed up in different weeks
Steps | 1. Check Retention Cohort. | 1. Check Retention Cohort. | 1. Check Retention Cohort.
Expected Result | Rows: sign-up week cohorts. Columns: Week 0,1,2... Cells: percentage retained. Colors: red(0-20%), green(80-100%). Hover: exact user count. | Rows: sign-up week cohorts. Columns: Week 0,1,2... Cells: percentage retained. Colors: red(0-20%), green(80-100%). Hover: exact user count. | Rows: sign-up week cohorts. Columns: Week 0,1,2... Cells: percentage retained. Colors: red(0-20%), green(80-100%). Hover: exact user count.


--- TABLE 267 ---
ID | ADM-020 | Priority | P0
Title | Storage usage display | Automation | Playwright + KV stats
Preconditions | Super Admin > System Health | Super Admin > System Health | Super Admin > System Health
Steps | 1. Check Storage card. | 1. Check Storage card. | 1. Check Storage card.
Expected Result | Shows: total keys, size (MB), breakdown by type (Sessions, Settings, Feedback), growth rate, projected runway. Color bar (green<50%, amber<80%, red>80%). | Shows: total keys, size (MB), breakdown by type (Sessions, Settings, Feedback), growth rate, projected runway. Color bar (green<50%, amber<80%, red>80%). | Shows: total keys, size (MB), breakdown by type (Sessions, Settings, Feedback), growth rate, projected runway. Color bar (green<50%, amber<80%, red>80%).


--- TABLE 268 ---
ID | ADM-021 | Priority | P0
Title | API latency display | Automation | Playwright
Preconditions | Super Admin > System Health | Super Admin > System Health | Super Admin > System Health
Steps | 1. Check API Performance card. | 1. Check API Performance card. | 1. Check API Performance card.
Expected Result | Line chart: P50/P95/P99. SLA reference lines (<200ms/<500ms/<1000ms). Alert if P95 > 500ms. | Line chart: P50/P95/P99. SLA reference lines (<200ms/<500ms/<1000ms). Alert if P95 > 500ms. | Line chart: P50/P95/P99. SLA reference lines (<200ms/<500ms/<1000ms). Alert if P95 > 500ms.


--- TABLE 269 ---
ID | ADM-022 | Priority | P1
Title | Admin dashboard responsive | Automation | Playwright viewport
Preconditions | Tablet viewport 768px | Tablet viewport 768px | Tablet viewport 768px
Steps | 1. Load Admin Analytics on tablet. | 1. Load Admin Analytics on tablet. | 1. Load Admin Analytics on tablet.
Expected Result | Single column layout. Charts resize. Heatmaps scrollable. All readable. No horizontal overflow. | Single column layout. Charts resize. Heatmaps scrollable. All readable. No horizontal overflow. | Single column layout. Charts resize. Heatmaps scrollable. All readable. No horizontal overflow.


--- TABLE 270 ---
ID | HDR-008 | Priority | P0
Title | Feedback screenshot upload | Automation | Playwright + file upload
Preconditions | Submit bug report | Submit bug report | Submit bug report
Steps | 1. Select Bug category. 2. Click Attach Screenshot. 3. Upload .png (3MB). 4. Submit. | 1. Select Bug category. 2. Click Attach Screenshot. 3. Upload .png (3MB). 4. Submit. | 1. Select Bug category. 2. Click Attach Screenshot. 3. Upload .png (3MB). 4. Submit.
Expected Result | Screenshot uploaded (thumbnail visible, X to remove). Included in server payload as cloud URL. Thumbnail 80x80px. | Screenshot uploaded (thumbnail visible, X to remove). Included in server payload as cloud URL. Thumbnail 80x80px. | Screenshot uploaded (thumbnail visible, X to remove). Included in server payload as cloud URL. Thumbnail 80x80px.


--- TABLE 271 ---
ID | HDR-009 | Priority | P1
Title | Feedback urgent flag | Automation | Integration
Preconditions | Mark feedback as urgent | Mark feedback as urgent | Mark feedback as urgent
Steps | 1. Check 'Mark as urgent' checkbox. 2. Submit. | 1. Check 'Mark as urgent' checkbox. 2. Submit. | 1. Check 'Mark as urgent' checkbox. 2. Submit.
Expected Result | Server record: isUrgent=true. Admin view: red flag icon at top of list. Higher visibility. | Server record: isUrgent=true. Admin view: red flag icon at top of list. Higher visibility. | Server record: isUrgent=true. Admin view: red flag icon at top of list. Higher visibility.


--- TABLE 272 ---
ID | HDR-010 | Priority | P0
Title | Feedback Bug severity field | Automation | Playwright
Preconditions | Select Bug category | Select Bug category | Select Bug category
Steps | 1. Select Bug. 2. Check for Severity dropdown. | 1. Select Bug. 2. Check for Severity dropdown. | 1. Select Bug. 2. Check for Severity dropdown.
Expected Result | Severity dropdown visible (Minor/Moderate/Major/Critical, default Moderate). Steps to Reproduce text area visible. Browser/Device auto-populated (read-only). | Severity dropdown visible (Minor/Moderate/Major/Critical, default Moderate). Steps to Reproduce text area visible. Browser/Device auto-populated (read-only). | Severity dropdown visible (Minor/Moderate/Major/Critical, default Moderate). Steps to Reproduce text area visible. Browser/Device auto-populated (read-only).


--- TABLE 273 ---
ID | HDR-011 | Priority | P0
Title | Sequential navigation shortcut G then T | Automation | Playwright keyboard
Preconditions | On Dashboard | On Dashboard | On Dashboard
Steps | 1. Press G. 2. Within 1 second, press T. | 1. Press G. 2. Within 1 second, press T. | 1. Press G. 2. Within 1 second, press T.
Expected Result | Navigates to Timer page. During wait: floating badge 'G → ...' visible. If second key not pressed in 1s: sequence cancels. | Navigates to Timer page. During wait: floating badge 'G → ...' visible. If second key not pressed in 1s: sequence cancels. | Navigates to Timer page. During wait: floating badge 'G → ...' visible. If second key not pressed in 1s: sequence cancels.


--- TABLE 274 ---
ID | HDR-012 | Priority | P1
Title | Export PDF report format | Automation | Playwright + PDF parsing
Preconditions | Export > PDF from any page | Export > PDF from any page | Export > PDF from any page
Steps | 1. Click Export. 2. Select PDF. 3. Enable all options. 4. Download. | 1. Click Export. 2. Select PDF. 3. Enable all options. 4. Download. | 1. Click Export. 2. Select PDF. 3. Enable all options. 4. Download.
Expected Result | PDF pages: Cover (branding, user, date), Summary stats (2x3 grid), Charts (Focus Hours + Category donut), Session table (formatted with zebra rows), Footer (page numbers, Becoming.. branding). | PDF pages: Cover (branding, user, date), Summary stats (2x3 grid), Charts (Focus Hours + Category donut), Session table (formatted with zebra rows), Footer (page numbers, Becoming.. branding). | PDF pages: Cover (branding, user, date), Summary stats (2x3 grid), Charts (Focus Hours + Category donut), Session table (formatted with zebra rows), Footer (page numbers, Becoming.. branding).


--- TABLE 275 ---
ID | SEC-011 | Priority | P0
Title | CSRF on settings endpoint | Automation | Security test
Preconditions | Attacker sends cross-origin POST to /api/settings | Attacker sends cross-origin POST to /api/settings | Attacker sends cross-origin POST to /api/settings
Steps | 1. From external site, POST to /api/settings with forged cookie. | 1. From external site, POST to /api/settings with forged cookie. | 1. From external site, POST to /api/settings with forged cookie.
Expected Result | Request rejected: SameSite=strict cookie not sent cross-origin. Settings unchanged. | Request rejected: SameSite=strict cookie not sent cross-origin. Settings unchanged. | Request rejected: SameSite=strict cookie not sent cross-origin. Settings unchanged.


--- TABLE 276 ---
ID | SEC-012 | Priority | P0
Title | General API rate limiting | Automation | k6
Preconditions | Non-admin user | Non-admin user | Non-admin user
Steps | 1. Send 101 requests within 1 minute to /api/*. | 1. Send 101 requests within 1 minute to /api/*. | 1. Send 101 requests within 1 minute to /api/*.
Expected Result | First 100: succeed. 101st: 429. Different from admin limit (60/min) and login limit (10/min). | First 100: succeed. 101st: 429. Different from admin limit (60/min) and login limit (10/min). | First 100: succeed. 101st: 429. Different from admin limit (60/min) and login limit (10/min).


--- TABLE 277 ---
ID | SEC-013 | Priority | P0
Title | Content-Type validation on upload | Automation | Integration
Preconditions | Upload .exe with audio Content-Type header | Upload .exe with audio Content-Type header | Upload .exe with audio Content-Type header
Steps | 1. Upload file with Content-Type: audio/mpeg but actual content is executable. | 1. Upload file with Content-Type: audio/mpeg but actual content is executable. | 1. Upload file with Content-Type: audio/mpeg but actual content is executable.
Expected Result | Server validates file magic bytes (not just Content-Type header or extension). Rejected: 'Invalid audio file.' | Server validates file magic bytes (not just Content-Type header or extension). Rejected: 'Invalid audio file.' | Server validates file magic bytes (not just Content-Type header or extension). Rejected: 'Invalid audio file.'


--- TABLE 278 ---
ID | SEC-014 | Priority | P0
Title | SameSite cookie enforcement verification | Automation | Integration + header check
Preconditions | Check Set-Cookie header | Check Set-Cookie header | Check Set-Cookie header
Steps | 1. Login. 2. Inspect Set-Cookie response header. | 1. Login. 2. Inspect Set-Cookie response header. | 1. Login. 2. Inspect Set-Cookie response header.
Expected Result | Cookie attributes: HttpOnly; Secure; SameSite=Strict; Path=/; Domain=becoming.ashmofidi.com. All verified. | Cookie attributes: HttpOnly; Secure; SameSite=Strict; Path=/; Domain=becoming.ashmofidi.com. All verified. | Cookie attributes: HttpOnly; Secure; SameSite=Strict; Path=/; Domain=becoming.ashmofidi.com. All verified.


--- TABLE 279 ---
ID | SEC-015 | Priority | P0
Title | Dependency vulnerability scan | Automation | CI/CD automated
Preconditions | CI/CD pipeline | CI/CD pipeline | CI/CD pipeline
Steps | 1. Run npm audit in pipeline. | 1. Run npm audit in pipeline. | 1. Run npm audit in pipeline.
Expected Result | Zero high or critical vulnerabilities. Medium vulnerabilities documented with mitigation timeline. Pipeline fails on high/critical. | Zero high or critical vulnerabilities. Medium vulnerabilities documented with mitigation timeline. Pipeline fails on high/critical. | Zero high or critical vulnerabilities. Medium vulnerabilities documented with mitigation timeline. Pipeline fails on high/critical.


--- TABLE 280 ---
ID | A11Y-007 | Priority | P0
Title | Skip-to-content link | Automation | Playwright keyboard
Preconditions | Any page, keyboard user | Any page, keyboard user | Any page, keyboard user
Steps | 1. Press Tab once on page load. | 1. Press Tab once on page load. | 1. Press Tab once on page load.
Expected Result | First focusable element: 'Skip to main content' link (visually hidden until focused). Pressing Enter jumps focus to main content area, skipping sidebar nav. | First focusable element: 'Skip to main content' link (visually hidden until focused). Pressing Enter jumps focus to main content area, skipping sidebar nav. | First focusable element: 'Skip to main content' link (visually hidden until focused). Pressing Enter jumps focus to main content area, skipping sidebar nav.


--- TABLE 281 ---
ID | A11Y-008 | Priority | P0
Title | ARIA landmarks | Automation | axe-core + DOM assertion
Preconditions | Any page | Any page | Any page
Steps | 1. Inspect DOM for landmarks. | 1. Inspect DOM for landmarks. | 1. Inspect DOM for landmarks.
Expected Result | nav (sidebar), main (content area), complementary (sidebar stats). All present. No duplicate main landmarks. | nav (sidebar), main (content area), complementary (sidebar stats). All present. No duplicate main landmarks. | nav (sidebar), main (content area), complementary (sidebar stats). All present. No duplicate main landmarks.


--- TABLE 282 ---
ID | A11Y-009 | Priority | P0
Title | Focus trap in modals | Automation | Playwright keyboard
Preconditions | Open any modal (Feedback, TOS, Shortcuts) | Open any modal (Feedback, TOS, Shortcuts) | Open any modal (Feedback, TOS, Shortcuts)
Steps | 1. Open modal. 2. Tab through elements. 3. Tab past last element. | 1. Open modal. 2. Tab through elements. 3. Tab past last element. | 1. Open modal. 2. Tab through elements. 3. Tab past last element.
Expected Result | Focus wraps back to first element inside modal (does not escape to page behind). Escape closes modal. | Focus wraps back to first element inside modal (does not escape to page behind). Escape closes modal. | Focus wraps back to first element inside modal (does not escape to page behind). Escape closes modal.


--- TABLE 283 ---
ID | PERF-009 | Priority | P0
Title | Spike test: 0 to 10000 in 30 seconds | Automation | k6 spike scenario
Preconditions | Zero load baseline | Zero load baseline | Zero load baseline
Steps | 1. Ramp from 0 to 10000 users in 30 seconds. 2. Hold for 2 minutes. 3. Ramp down. | 1. Ramp from 0 to 10000 users in 30 seconds. 2. Hold for 2 minutes. 3. Ramp down. | 1. Ramp from 0 to 10000 users in 30 seconds. 2. Hold for 2 minutes. 3. Ramp down.
Expected Result | System handles spike without crash. Error rate < 5% during ramp. Recovery within 60 seconds after ramp-down. No data corruption. | System handles spike without crash. Error rate < 5% during ramp. Recovery within 60 seconds after ramp-down. No data corruption. | System handles spike without crash. Error rate < 5% during ramp. Recovery within 60 seconds after ramp-down. No data corruption.


--- TABLE 284 ---
ID | PERF-010 | Priority | P1
Title | Admin dashboard with maximum users | Automation | k6 + Playwright
Preconditions | Admin dashboard, 10000 users in system | Admin dashboard, 10000 users in system | Admin dashboard, 10000 users in system
Steps | 1. Load Admin Analytics. | 1. Load Admin Analytics. | 1. Load Admin Analytics.
Expected Result | Page loads in < 3 seconds. All charts render. No timeout. Payload < 100KB (server-side aggregation, not raw data). | Page loads in < 3 seconds. All charts render. No timeout. Payload < 100KB (server-side aggregation, not raw data). | Page loads in < 3 seconds. All charts render. No timeout. Payload < 100KB (server-side aggregation, not raw data).


--- TABLE 285 ---
ID | INTEG-009 | Priority | P0
Title | Multi-device: timer on A, dashboard on B | Automation | Playwright multi-context
Preconditions | Device A running timer, Device B on Dashboard | Device A running timer, Device B on Dashboard | Device A running timer, Device B on Dashboard
Steps | 1. Start timer on A. 2. Open Dashboard on B. 3. Complete session on A. 4. Observe B. | 1. Start timer on A. 2. Open Dashboard on B. 3. Complete session on A. 4. Observe B. | 1. Start timer on A. 2. Open Dashboard on B. 3. Complete session on A. 4. Observe B.
Expected Result | Dashboard on B updates within 30 seconds: FOCUS TODAY increments, chart updates, stats refresh. No page reload. | Dashboard on B updates within 30 seconds: FOCUS TODAY increments, chart updates, stats refresh. No page reload. | Dashboard on B updates within 30 seconds: FOCUS TODAY increments, chart updates, stats refresh. No page reload.


--- TABLE 286 ---
ID | INTEG-010 | Priority | P0
Title | Settings change affects timer on another device | Automation | Playwright multi-context
Preconditions | Change Focus to 45 on Device A, Timer idle on Device B | Change Focus to 45 on Device A, Timer idle on Device B | Change Focus to 45 on Device A, Timer idle on Device B
Steps | 1. Change Focus to 45 on A. 2. Check Timer on B within 10 seconds. | 1. Change Focus to 45 on A. 2. Check Timer on B within 10 seconds. | 1. Change Focus to 45 on A. 2. Check Timer on B within 10 seconds.
Expected Result | Timer on B shows 45:00 in idle. Settings synced. No stale 25:00. | Timer on B shows 45:00 in idle. Settings synced. No stale 25:00. | Timer on B shows 45:00 in idle. Settings synced. No stale 25:00.


--- TABLE 287 ---
ID | INTEG-011 | Priority | P0
Title | Admin promotes user while user is active | Automation | Playwright multi-user
Preconditions | User on Timer, Super Admin promotes to Admin | User on Timer, Super Admin promotes to Admin | User on Timer, Super Admin promotes to Admin
Steps | 1. User is on Timer page. 2. Super Admin promotes. 3. User refreshes or navigates. | 1. User is on Timer page. 2. Super Admin promotes. 3. User refreshes or navigates. | 1. User is on Timer page. 2. Super Admin promotes. 3. User refreshes or navigates.
Expected Result | After page load: ADMIN section appears in sidebar. User now has admin access. No logout required. | After page load: ADMIN section appears in sidebar. User now has admin access. No logout required. | After page load: ADMIN section appears in sidebar. User now has admin access. No logout required.

