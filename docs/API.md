# API Reference

All endpoints require authentication unless noted. Responses are JSON. Errors return `{ error: string }` with appropriate HTTP status codes.

## Authentication

- `GET /api/auth/session` — Check current session
- `POST /api/auth/logout` — Destroy session
- `GET /api/auth/callback` — OAuth callback
- `GET/POST /api/auth/tos` — TOS status/acceptance

## Timer

- `GET /api/timer` — Get current timer state
- `POST /api/timer` — Timer actions (start, pause, resume, skip, reset, complete, finishEarly, stopOvertime, heartbeat, takeOver, switchMode, abandon)

## Sessions

- `GET /api/sessions` — List sessions with filters
- `PATCH /api/sessions` — Update session (intent/category/notes)
- `DELETE /api/sessions` — Soft delete session(s)

## Settings

- `GET /api/settings` — Fetch user settings
- `PUT /api/settings` — Save user settings (merge, not overwrite)

## Dashboard

- `GET /api/dashboard` — Server-side analytics aggregation

## Feedback

- `POST /api/feedback` — Submit feedback

## Admin

- `GET /api/admin?view=pulse|users|feedback|audit|beta` — Admin data
- `POST /api/admin` — Admin actions (changeRole, updateFeedbackStatus)
