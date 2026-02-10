# Deployment Guide

This guide covers deploying the Han's Laser Daily Service Report application to the Internet Computer.

## Prerequisites

- [DFX SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install/) installed
- Internet Computer wallet with cycles for mainnet deployment
- Backend and frontend code ready for deployment

## Local Development

1. **Start local replica**:
   ```bash
   dfx start --clean --background
   ```

2. **Deploy locally**:
   ```bash
   dfx deploy
   ```

3. **Access the application**:
   - Frontend: `http://localhost:4943/?canisterId=<frontend-canister-id>`
   - Backend: Check canister IDs with `dfx canister id backend`

## Go Live (Mainnet)

### Preflight Checks

Before deploying to production, verify:

- [ ] All features tested locally and working correctly
- [ ] Authentication flow (Internet Identity) tested
- [ ] Admin and engineer roles tested with correct permissions
- [ ] Report creation, viewing, and CSV export tested
- [ ] User management (admin only) tested
- [ ] Offline functionality and PWA manifest tested
- [ ] All environment-specific configurations reviewed
- [ ] Backup of current production state (if upgrading existing deployment)

### Fresh Deployment (New Application)

⚠️ **WARNING**: This will create a new canister with no existing data.

1. **Set build version** (for deterministic versioning):
   ```bash
   export VITE_BUILD_VERSION="$(date +%Y%m%d-%H%M%S)"
   ```

2. **Deploy to mainnet**:
   ```bash
   dfx deploy --network ic
   ```

3. **Note your canister IDs**:
   ```bash
   dfx canister --network ic id backend
   dfx canister --network ic id frontend
   ```

4. **Access your production app**:
   ```
   https://<frontend-canister-id>.ic0.app
   ```

### State-Preserving Upgrade (Existing Application)

⚠️ **IMPORTANT**: Use this method to upgrade code while preserving user data and reports.

1. **Verify current state**:
   ```bash
   dfx canister --network ic call backend listUsers
   dfx canister --network ic call backend listReports
   ```

2. **Set build version** (for deterministic versioning and cache invalidation):
   ```bash
   export VITE_BUILD_VERSION="$(date +%Y%m%d-%H%M%S)"
   ```
   
   This ensures:
   - The footer build indicator shows a new version after publish
   - Service worker detects the update and shows the update banner
   - Users can reload to get the latest version

3. **Upgrade backend** (preserves state):
   ```bash
   dfx deploy --network ic backend --mode upgrade
   ```

4. **Upgrade frontend** (with build version):
   ```bash
   dfx deploy --network ic frontend
   ```

5. **Verify upgrade success** (see Post-Deploy Smoke Tests below)

### Post-Deploy Smoke Tests

After deployment, verify critical functionality:

1. **Authentication**:
   - [ ] Login with Internet Identity works
   - [ ] Logout clears session correctly
   - [ ] Session persists across page refreshes

2. **User Profiles**:
   - [ ] New user signup (engineer role) works
   - [ ] Admin signup with correct password works
   - [ ] Profile data displays correctly

3. **Reports**:
   - [ ] Create new service report
   - [ ] View report history
   - [ ] View individual report details
   - [ ] Filter reports by date and text search

4. **Admin Functions** (if admin user):
   - [ ] View all users in admin panel
   - [ ] View reports filtered by user
   - [ ] Export reports to CSV
   - [ ] Delete user (non-admin)

5. **PWA & Offline**:
   - [ ] Manifest accessible at `/manifest.webmanifest`
   - [ ] Icons load correctly (192x192, 512x512)
   - [ ] Service worker registers successfully
   - [ ] "Add to Home screen" prompt appears in Chrome Android
   - [ ] Offline banner appears when network disconnected

6. **Build Version & Service Worker Update** (for upgrades):
   - [ ] Footer build indicator shows new version (different from pre-publish value)
   - [ ] After publishing a new version, the update banner appears for users on old version
   - [ ] Clicking "Reload to Update" activates the new version without errors
   - [ ] No admin-only cache reset required for normal updates

### Rollback Procedure

If issues are discovered after deployment:

1. **Identify the issue**:
   - Check browser console for errors
   - Review backend logs: `dfx canister --network ic logs backend`
   - Test specific failing functionality

2. **Quick fix** (if possible):
   - Make code changes locally
   - Test thoroughly
   - Set new build version: `export VITE_BUILD_VERSION="$(date +%Y%m%d-%H%M%S)-hotfix"`
   - Deploy upgrade: `dfx deploy --network ic --mode upgrade`

3. **Full rollback** (if needed):
   - Restore previous canister WASM from backup
   - Reinstall: `dfx canister --network ic install backend --mode reinstall --wasm <backup.wasm>`
   - ⚠️ **WARNING**: `reinstall` mode will erase all data. Only use if you have a data backup.

### Monitoring and Logs

1. **View backend logs**:
   ```bash
   dfx canister --network ic logs backend
   ```

2. **Check canister status**:
   ```bash
   dfx canister --network ic status backend
   dfx canister --network ic status frontend
   ```

3. **Monitor cycles balance**:
   ```bash
   dfx canister --network ic status backend | grep Balance
   ```

## Android App Deployment

For instructions on packaging this web application as an Android app using Trusted Web Activity (TWA), see [ANDROID_TWA_BUILD.md](./ANDROID_TWA_BUILD.md).

The Android app wraps the production web app URL and provides:
- Native Android app experience
- Full-screen mode without browser chrome
- App icon on device home screen
- Offline functionality via service worker

## Troubleshooting

### Deployment fails with "out of cycles"
- Top up your canister with cycles
- Check cycles balance: `dfx canister --network ic status backend`

### Authentication not working in production
- Verify Internet Identity integration is configured for production URL
- Check browser console for CORS or authentication errors
- Ensure canister IDs are correctly configured

### Service worker not registering
- Verify `sw.js` is accessible at production URL root
- Check browser console for service worker errors
- Ensure HTTPS is enabled (required for service workers)
- Verify `VITE_BUILD_VERSION` was set during build

### Service worker update not appearing after publish
- Verify footer build indicator shows a new version
- Check browser console for service worker registration logs
- Ensure `VITE_BUILD_VERSION` was set to a new value during build
- Wait up to 60 seconds for automatic update check
- Hard refresh (Ctrl+Shift+R) to force service worker update check

### PWA not installable on Android
- Verify manifest is accessible and valid JSON
- Check all icon URLs return HTTP 200
- Use Chrome DevTools Lighthouse to diagnose PWA issues
- Ensure `display: "standalone"` is set in manifest

### Data loss after upgrade
- Always use `--mode upgrade` for state-preserving deployments
- Never use `--mode reinstall` unless intentionally resetting data
- Keep backups of critical data before major upgrades

## Additional Resources

- [Internet Computer Documentation](https://internetcomputer.org/docs)
- [DFX Command Reference](https://internetcomputer.org/docs/current/references/cli-reference/)
- [Canister Upgrades](https://internetcomputer.org/docs/current/developer-docs/backend/motoko/upgrades)
- [Android TWA Build Guide](./ANDROID_TWA_BUILD.md)
