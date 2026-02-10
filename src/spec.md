# Specification

## Summary
**Goal:** Publish the currently deployed draft (Draft Version 35) to the production (IC mainnet) environment.

**Planned changes:**
- Promote the deployed draft frontend and backend canisters to production (IC mainnet).
- Verify production accessibility via the production frontend canister URL.
- Ensure the in-app build/version indicator in the footer updates to a new value post-publish.
- Confirm the production service worker update flow shows an update banner when a new version is available and reload activates the latest assets without requiring an admin-only cache reset.

**User-visible outcome:** The production app is updated to the latest draft build, is accessible at the production canister URL, shows an updated build/version indicator in the footer, and supports a working service-worker-driven update banner/reload flow.
