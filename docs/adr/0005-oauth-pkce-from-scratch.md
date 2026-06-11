# OAuth PKCE from Scratch (No Auth Library)

Decided to implement GitHub OAuth with PKCE by hand in Next.js API routes rather than using Auth.js (NextAuth) or an equivalent library.

**Context**: the portfolio's purpose is demonstrating engineering depth. Using `next-auth` — a library that reduces OAuth to ~10 lines of config — shows that the engineer can install npm packages. Implementing the OAuth 2.0 authorization code flow with PKCE by hand (~100-150 lines) demonstrates understanding of the protocol itself: code verifier/challenge generation, state parameter for CSRF protection, token exchange, and httpOnly cookie session management.

**What we're building, not buying**:
- Authorization code flow with PKCE (SHA-256 code challenge)
- State parameter validation (CSRF protection)
- Token exchange against GitHub's OAuth endpoint
- Session management via httpOnly, SameSite cookies
- No refresh token rotation (out of scope for a portfolio admin panel)

**Trade-off**: hand-rolled auth carries security risk if done incorrectly. Mitigating factors: (1) the admin surface is minimal (portfolio content management only), (2) GitHub is the sole OAuth provider — no multi-provider complexity, (3) the implementation follows the RFC precisely and will be documented inline with RFC references.

**Why this would surprise a reader**: "never roll your own auth" is good general advice. This decision says: "never roll your own auth in production with real users." A portfolio admin panel with one user (the engineer) is the correct context to demonstrate protocol-level understanding. The code IS the credential.
