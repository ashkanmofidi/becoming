# Record of Processing Activities

**Controller:** Ashkan Mofidi
**Contact:** ashkan.mofidi@gmail.com
**Last updated:** April 9, 2026

## Processing Activity 1: User Authentication

| Field | Value |
|-------|-------|
| Purpose | Authenticate users to provide the focus timer service |
| Lawful basis | Contractual necessity (Art. 6(1)(b)) |
| Data categories | Name, email, profile photo URL, Google user ID |
| Data subjects | App users |
| Recipients | Vercel (hosting), Upstash (storage) |
| International transfers | US (Vercel, Upstash) — SCCs in place |
| Retention | Until account deletion + 30-day grace period |
| Security | OAuth 2.0, encrypted storage, HttpOnly cookies |

## Processing Activity 2: Focus Session Tracking

| Field | Value |
|-------|-------|
| Purpose | Provide productivity tracking and analytics |
| Lawful basis | Contractual necessity |
| Data categories | Session timestamps, durations, modes, intents, categories |
| Data subjects | App users |
| Recipients | Upstash (storage) |
| International transfers | US (Upstash) |
| Retention | Until user deletes or account deletion |
| Security | Encrypted at rest and in transit |

## Processing Activity 3: User Settings

| Field | Value |
|-------|-------|
| Purpose | Persist user preferences across sessions and devices |
| Lawful basis | Contractual necessity |
| Data categories | Timer preferences, display preferences, sound preferences |
| Data subjects | App users |
| Recipients | Upstash (storage) |
| Retention | Until account deletion |

## Processing Activity 4: Feedback Collection

| Field | Value |
|-------|-------|
| Purpose | Collect user feedback to improve the service |
| Lawful basis | Consent (user voluntarily submits) |
| Data categories | Feedback text, category, user identity |
| Data subjects | App users who submit feedback |
| Recipients | Upstash (storage), admin (viewing) |
| Retention | Until admin deletes or account deletion |

## Sub-Processors

| Processor | Purpose | Location | DPA |
|-----------|---------|----------|-----|
| Vercel Inc. | Hosting, serverless functions | US | vercel.com/legal/dpa |
| Upstash | Redis database | US | upstash.com/trust |
| Google LLC | OAuth authentication | US | Google API ToS |
| Pusher Ltd | Real-time sync | US/EU | pusher.com/legal |
