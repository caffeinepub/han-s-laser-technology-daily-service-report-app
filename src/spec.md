# Specification

## Summary
**Goal:** Remove any Internet Identity login flow from the app experience and fix admin signup/provisioning so specified usernames are recognized as admins without a special-password step.

**Planned changes:**
- Update frontend authentication UX to use only the existing local-session (Ed25519) sign-in flow, removing Internet Identity prompts/redirects and any non-immutable code-path dependencies on Internet Identity hooks.
- Update backend admin provisioning to recognize usernames `sayedbaquar` and `bharatnikam` as admins instead of placeholder allowlist values.
- Set the backend admin signup password to exactly `Hans@987123` wherever it is still used.
- Remove the “admin special password” requirement from both the signup UI and backend gating so admin-eligible users are not blocked by an extra password step.

**User-visible outcome:** Users can sign in using local-session authentication without any Internet Identity UI, and admin-eligible usernames (`sayedbaquar`, `bharatnikam`) can sign up and access admin functionality (e.g., `/admin/users`) without a special-password field blocking them.
