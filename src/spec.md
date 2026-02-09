# Specification

## Summary
**Goal:** Ensure admin-only access to the full registered user list, and add a gated admin signup flow protected by a special password.

**Planned changes:**
- Fix/ensure the existing Admin Users page loads and displays the complete backend user list when the logged-in user is an admin.
- Block non-admin users from accessing the Admin Users page (show an access denied screen) and ensure the backend rejects non-admin user-list requests.
- Add an Admin option during signup that requires entering the admin signup password exactly `"Hans@987123"` to complete admin signup.
- Enforce the admin signup password validation on the backend (server-side) without persisting or logging the password.
- Update frontend error handling/translation so invalid or missing admin signup password failures display a concise, user-friendly English message without internal details.

**User-visible outcome:** Admins can view all registered users in the Admin Users page, non-admins are denied access, and users can only create an Admin account during signup if they enter the correct admin signup password (otherwise they see a clear English error).
