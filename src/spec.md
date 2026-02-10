# Specification

## Summary
**Goal:** Restore and improve admin access so allowlisted admins can list all users and view reports across all users, including per-user report drilldown in the UI.

**Planned changes:**
- Fix backend admin authorization so allowlisted admins can successfully call admin-only methods after signup/login (list all users; list all reports across users), while non-admins remain denied.
- Update the Admin Users page to add an action on each user to view that user’s reports (using existing report data via `createdBy` principal).
- Enhance the admin reports view to support switching between “All reports” and “Reports for <selected user>”, with clear English labels and an English empty state when no reports exist for the selected user.

**User-visible outcome:** Admins can access the admin Users page to see all users, drill into a selected user to view only their reports, and switch back to viewing all reports; non-admin users continue to see access denied for admin-only views.
