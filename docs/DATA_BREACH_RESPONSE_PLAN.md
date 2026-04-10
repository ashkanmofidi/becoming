# Data Breach Response Plan

## Becoming.. Focus Timer
**Last updated:** April 9, 2026
**Responsible party:** Ashkan Mofidi (ashkan.mofidi@gmail.com)

## 1. Detection

Monitor for:
- Unusual KV access patterns (Upstash dashboard)
- Unauthorized admin actions (Audit Log)
- Failed login spikes (Vercel logs)
- User reports of unauthorized access
- Vercel security alerts

## 2. Assessment (within 4 hours)

- What data was exposed? (settings, sessions, emails, profile photos)
- How many users affected?
- How was access gained? (credential theft, API vulnerability, third-party breach)
- Is the breach ongoing? If yes, contain immediately.

## 3. Containment (immediately)

- Rotate all API keys and secrets (Vercel env vars)
- Invalidate all user sessions (clear KV session keys)
- If OAuth compromised: rotate Google client secret
- If KV compromised: contact Upstash support
- Deploy security fix if code vulnerability

## 4. Notification

### California (CCPA): "most expedient time possible"
### GDPR: within 72 hours to supervisory authority

**User notification template:**
Subject: Security Notice — Becoming..

Dear [Name],

We detected unauthorized access to Becoming.. on [date]. The following data may have been affected: [list data types].

What we've done: [containment steps].

What you should do: [recommendations — e.g., review your Google account security settings].

We sincerely apologize. Contact ashkan.mofidi@gmail.com with questions.

### Supervisory Authority (if EU users affected):
- Ireland DPC: info@dataprotection.ie (if data processed in EU)
- UK ICO: casework@ico.org.uk

## 5. Post-Breach

- Document root cause
- Implement preventive measures
- Update security measures
- Notify users of resolution
- Review and update this plan
