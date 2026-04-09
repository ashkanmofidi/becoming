# Changelog

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

### Fixed
- Contradiction #1: Timer idle now shows configured duration, not "00:00" (PRD Appendix C)
- Contradiction #2: Logout relocated to profile card area (PRD Appendix C)
