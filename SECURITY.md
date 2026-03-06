# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |

## Reporting a Vulnerability

If you discover a security vulnerability in VibeCodes, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email: **security@vibecodes.co.uk**

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fix (optional)

## What to Expect

- **Acknowledgement** within 48 hours
- **Status update** within 7 days with an assessment and timeline
- **Fix or mitigation** as soon as practical, depending on severity
- **Credit** in the release notes (unless you prefer to remain anonymous)

## Scope

The following are in scope:
- The VibeCodes web application at [vibecodes.co.uk](https://vibecodes.co.uk)
- The remote MCP server endpoint (`/api/mcp`)
- OAuth 2.1 authentication flows
- Supabase Row Level Security policies
- API routes and server actions

The following are **out of scope**:
- Third-party services (Supabase, Vercel, GitHub, Resend)
- Denial of service attacks
- Social engineering
- Issues in dependencies (report these upstream)

## Security Measures

VibeCodes implements:
- Row Level Security (RLS) on all database tables
- OAuth 2.1 with PKCE for MCP authentication
- Server-side input validation on all mutations
- Encrypted storage for user API keys
- CAPTCHA (Cloudflare Turnstile) on auth forms
- Content Security Policy headers
- Rate limiting on AI endpoints
