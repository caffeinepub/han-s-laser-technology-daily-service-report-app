# Specification

## Summary
**Goal:** Tighten backend authorization and data integrity rules for user profiles and reports.

**Planned changes:**
- Require an existing user profile for access to user/report endpoints (getCallerUserProfile, saveCallerUserProfile, createReport, listReports, getReportById); if missing, trap with an English message instructing the caller to sign up first.
- Enforce server authority over privileged fields:
  - During signupWithCode, ignore any client-supplied profile.role and always persist role = #engineer for new signups.
  - During createReport, ignore any client-supplied report.createdBy and always persist createdBy = caller as the only stored creator value.
- Prevent report overwrites by rejecting createReport when the provided report id already exists, with a clear English trap message.
- On admin deleteUser, also revoke/remove the deleted principal’s authorization role(s) in AccessControl so they can’t continue passing permission checks post-deletion (while keeping existing delete behavior and self-delete prevention intact).

**User-visible outcome:** Users must sign up before they can create or access reports; signup/report creation can’t be used to set privileged fields; duplicate report IDs are rejected instead of overwriting; deleted users immediately lose backend permissions and must sign up again to regain access.
