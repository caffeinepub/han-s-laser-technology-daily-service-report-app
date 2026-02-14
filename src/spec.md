# Specification

## Summary
**Goal:** Ensure the user with username `sayedbaquar` is always treated as an admin, and make logout reliably clear session/authenticated UI state.

**Planned changes:**
- Update backend role/permission handling so `profile.username === "sayedbaquar"` is assigned/treated as `admin` consistently (including pending signup processing and admin role updates via the existing pathway).
- Fix frontend logout flow to fully clear authenticated session state and any identity-bound cached data (profile/admin status/reports) so the UI returns to an unauthenticated state after logout, without modifying immutable auth hook files.

**User-visible outcome:** `sayedbaquar` appears as an Admin in admin-only user listings and has admin permissions after signup/role changes, and logging out reliably removes all prior user data so switching accounts does not show stale profile or reports.
