# Specification

## Summary
**Goal:** Remove Internet Identity signup/login requirements so the core reporting pages work fully in anonymous mode, while keeping admin areas protected.

**Planned changes:**
- Remove/disable any route guards and redirects that force Internet Identity flows for core routes (/, /history, /report/:reportId), ensuring they render directly for anonymous users.
- Update header/navigation for anonymous mode: hide user/profile display, remove “Sign Out”, and ensure admin navigation never appears unless admin status is positively confirmed.
- Keep admin-only routes (e.g., /admin/users) protected: show an access denied screen for anonymous users without prompting Internet Identity login.
- Apply a consistent industrial/service-reporting visual theme across anonymous-mode pages and navigation, avoiding blue/purple as primary brand colors.

**User-visible outcome:** Users can open the app and create/view reports on the main pages without signing in, while admin sections remain inaccessible unless the app confirms the user is an admin.
