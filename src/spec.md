# Specification

## Summary
**Goal:** Fix authentication/signup/logout flows so account switching is reliable, signup works for both engineer and admin, and no stale session or cached data can leak across users.

**Planned changes:**
- Update signup flow to always bind the newly authenticated Internet Identity principal to the correct new user profile, and ensure post-signup permissions allow immediate access to user endpoints (profile, reports).
- Align admin signup password handling between frontend and backend; remove any client-side hardcoded/admin-password value checks and rely on backend validation with clear error messaging.
- Strengthen logout/switch-account to fully clear client auth/session state and all user-specific cached UI/data so the app returns to a clean unauthenticated Login screen after logout and across refreshes.
- Add defensive checks to prevent cross-account data exposure during login/logout transitions (e.g., invalidate cached queries and actor/session bindings on identity changes; ensure backend enforces caller-based access for user-specific endpoints).
- Document regression test steps (as code comments or a short internal note) to verify no stale identity/session persists after logout and account switching.

**User-visible outcome:** Users can sign up and immediately use the app with the correct account (engineers can create/view their own reports), admins can sign up with backend-validated credentials, and logging out/switching accounts reliably returns to Login without showing any previous user’s data.
