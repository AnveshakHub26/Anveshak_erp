# AnveshakHub Authentication & CSRF Protection Strategy

## 1. Authentication Token Architecture
- **Token Delivery**: Access and Refresh tokens are delivered to the client browser via `HttpOnly`, `Secure` (production), `SameSite=Lax` HTTP cookies.
- **Client Storage**: Tokens are NEVER saved in `localStorage` or `sessionStorage` to prevent XSS credential theft.
- **Dual Extraction**: The NestJS API `JwtStrategy` accepts tokens from both `access_token` cookies (for browser UI navigation) and `Authorization: Bearer <token>` headers (for API clients).

## 2. CSRF (Cross-Site Request Forgery) Strategy
1. **SameSite Lax Cookies**: All authentication cookies are configured with `SameSite=Lax`, preventing third-party cross-site request inclusion on state-changing requests (`POST`, `PUT`, `DELETE`).
2. **Custom Header Requirement**: All mutating frontend API requests pass custom header `x-correlation-id`. Browsers block cross-origin requests with custom headers unless explicit pre-flight CORS approval is granted.
3. **Strict Origin Checking**: NestJS backend validates origin against explicit whitelist (`APP_URL`), rejecting `origin: "*"`.
4. **Idempotency & Double Submit Cookie**: High-risk financial/CRM handoff endpoints require an explicit `Idempotency-Key` header.

## 3. Session Expiration & Invalidation
- **Access Token Expiration**: 24 Hours (`1d`).
- **Refresh Token Expiration**: 7 Days (`7d`).
- **Logout Behavior**: `POST /api/v1/auth/logout` explicitly clears `access_token` and `refresh_token` cookies with `maxAge: 0`.
- **Password Reset / Change**: Executing a password reset immediately invalidates all active reset tokens (`passwordResetUsed = true`, `passwordResetToken = null`).
