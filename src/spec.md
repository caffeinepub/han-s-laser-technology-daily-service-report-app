# Specification

## Summary
**Goal:** Remove the special admin signup password requirement and eliminate related UI messaging.

**Planned changes:**
- Update backend admin signup logic to no longer enforce any separate/hardcoded “admin signup password” check.
- Remove any admin signup UI field/step that asks for a special admin signup password.
- Remove or update any frontend helper text, banners, toasts, and translation/error mapping that states or implies admins require a special signup password.

**User-visible outcome:** Users can create an admin account (per existing eligibility rules) without providing an extra admin signup password, and the app no longer shows messages about needing a special admin signup password.
