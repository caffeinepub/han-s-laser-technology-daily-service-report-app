# Specification

## Summary
**Goal:** Update the unauthenticated authentication screen to provide separate “Sign Up” and “Log In” actions with correct connecting/disabled feedback during Internet Identity authentication.

**Planned changes:**
- Replace the single combined “Sign Up / Log In” button on the LoginScreen with two distinct buttons: “Sign Up” and “Log In”.
- Wire both buttons to trigger the existing Internet Identity authentication flow (no backend changes).
- During `loginStatus === 'logging-in'`, disable both buttons and show a clear “Connecting...” loading state (spinner + text) in the auth call-to-action area; restore enabled state on success/error.

**User-visible outcome:** Users see separate “Sign Up” and “Log In” buttons on the authentication screen, and when either is pressed they get clear “Connecting...” feedback while both buttons are temporarily disabled to prevent duplicate attempts.
