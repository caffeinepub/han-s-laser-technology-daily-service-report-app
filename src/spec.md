# Specification

## Summary
**Goal:** Publish the currently deployed draft build to the IC mainnet production environment by deploying both backend and frontend canisters, with a new deterministic build/version identifier so the service worker and UI reflect the published version.

**Planned changes:**
- Deploy/upgrade the backend canister to IC mainnet using a state-preserving upgrade (no data loss).
- Deploy the frontend canister to IC mainnet with an updated `VITE_BUILD_VERSION` so `BUILD_VERSION` changes from the pre-publish value.
- Follow `frontend/DEPLOYMENT.md` runbook steps and complete the specified post-deploy smoke tests, including verifying the service worker update banner/update flow.

**User-visible outcome:** The production app loads on IC mainnet without blocking console errors, reflects the new published version, passes the documented smoke tests (auth, profile, reports, admin access, CSV export, PWA), and users on the prior version are prompted to update via the service worker update mechanism.
