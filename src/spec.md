# Specification

## Summary
**Goal:** Remove the Admin/Engineer access-code (admin special password) gate from signup so users can complete signup after selecting a role without entering any extra code.

**Planned changes:**
- Remove the “Admin Special Password” / “Access Code” field and all related UI copy from the “Complete Your Signup” form for Admin and Engineer roles.
- Remove any frontend validation and error messaging/translation logic related to access-code requirements (including 6-digit code validation and code-specific error translations).
- Update the signup mutation call to stop reading/sending any access code value (send null/omit per generated candid bindings).
- Update the backend signup flow in `backend/main.mo` to eliminate Admin/Engineer secret code checks and remove any hardcoded code values, allowing `signupWithRole` to succeed without an adminCode for Admin/Engineer.

**User-visible outcome:** Users can choose Admin or Engineer on the “Complete Your Signup” screen and successfully submit signup without seeing or entering any access code.
