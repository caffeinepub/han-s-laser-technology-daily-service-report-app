# Specification

## Summary
**Goal:** Add an admin-only “purge old data” operation that deletes all legacy reports and all user profiles except the calling admin, and expose it as a destructive action in the admin UI.

**Planned changes:**
- Backend: Add an admin-only purge function that deletes all `DailyServiceReport` records, deletes all `userProfiles` entries except the calling admin, and revokes/removes authorization roles for deleted users.
- Frontend: Add a destructive “Delete all old data” action on the Admin Users page with an explicit confirmation dialog and pending/error states.
- Frontend: Wire the action to a new React Query mutation calling the backend purge function and invalidate relevant cached queries (users, reports, currentUserProfile) on success.

**User-visible outcome:** Admins can permanently delete all reports and all users except themselves via the Admin Users page, with clear confirmation and UI refreshing to show only the remaining admin user and no report history.
