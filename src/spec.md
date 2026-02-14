# Specification

## Summary
**Goal:** Remove all Internet Identity login/signup prompts and flows from the app so anonymous users can use core routes without being blocked or redirected.

**Planned changes:**
- Update routing/guards/conditional rendering (outside immutable paths) so anonymous users can access and use core routes: `/`, `/history`, and `/report/$reportId` without any Internet Identity prompts or redirects.
- Remove any UI elements, navigation paths, buttons/CTAs, and user-facing copy that reference or trigger Internet Identity login/signup flows.
- Keep admin-only routes protected by showing an access denied screen for anonymous users on `/admin/users`, and keep admin navigation hidden unless admin status is positively confirmed.

**User-visible outcome:** Users can create and view reports (home, history, and report detail pages) without seeing any Internet Identity login/signup messaging or screens, while admin pages remain inaccessible and show an access denied screen to non-admin/anonymous users.
