# Specification

## Summary
**Goal:** Fix new-user signup gating so authenticated principals without profiles can reach ProfileSetup, and add targeted frontend logging to diagnose persistent signup issues without misrouting to session recovery.

**Planned changes:**
- Backend: Update `getCallerUserProfile()` to return `null` (not trap) when the authenticated caller has no profile yet, preserving existing behavior for users who do have profiles.
- Frontend: Adjust session-invalid detection/routing so the expected “no profile yet” state leads to ProfileSetup rather than SessionInvalidScreen, and avoid any login/profile-fetch/ProfileSetup looping.
- Frontend: Add sanitized console logging for authentication/identity presence, profile fetch status, and any profile-fetch error message (without logging secrets or PII inputs).

**User-visible outcome:** Brand-new authenticated users are taken to the ProfileSetup form (not SessionInvalidScreen), existing users continue to load normally, and developers can see clear console logs to debug signup/profile flow issues.
