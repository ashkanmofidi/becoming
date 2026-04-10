# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability in Becoming.., please report it responsibly.

**Contact:** ashkan.mofidi@gmail.com
**Subject line:** [SECURITY] Becoming.. Vulnerability Report

**What to include:**
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

**Response timeline:**
- Acknowledgment: within 48 hours
- Initial assessment: within 5 business days
- Fix timeline: depends on severity (critical: 24-48 hours, high: 1 week, medium: 2 weeks)

**Safe Harbor:**
We will not pursue legal action against security researchers who:
- Act in good faith
- Do not access or modify other users' data
- Do not disrupt the service
- Report findings to us before public disclosure
- Allow reasonable time for remediation

## Security Measures

- All data encrypted in transit (TLS 1.3) and at rest (Upstash Redis encryption)
- Authentication via Google OAuth 2.0
- Session cookies: HttpOnly, Secure, SameSite
- Server-side session validation on every API request
- Rate limiting on all API endpoints
- Input sanitization and validation
- Content Security Policy headers
- No client-side storage of sensitive data
