# Specification

## Summary
**Goal:** Show the logged-in user’s Internet Identity principal (user ID) in the app header after authentication.

**Planned changes:**
- Update the authenticated app header to display a “User ID:” label plus the current user’s principal (formatted using the existing short-form helper).
- Ensure the user ID appears consistently for both normal users and admins across all authenticated routes, and is hidden when not logged in.
- Adjust header layout styling as needed to keep it responsive on mobile and desktop without modifying read-only UI components or immutable auth hooks.

**User-visible outcome:** After logging in (as a user or admin), the app header displays “User ID: <principal>” on all authenticated screens; when logged out, no user ID is shown.
