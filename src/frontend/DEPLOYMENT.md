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

1. **Set build version** (REQUIRED for deterministic versioning):
   ```bash
   export VITE_BUILD_VERSION="$(date +%Y%m%d-%H%M%S)"
   ```
   
   **Why this is required:**
   - Ensures the build identifier is deterministic and changes only on actual deploys
   - Enables service worker update detection for existing users
   - Makes the footer build indicator reflect the actual deployment time

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

5. **Verify deployment** (see Post-Deploy Smoke Tests below)

### State-Preserving Upgrade (Existing Application)

⚠️ **IMPORTANT**: Use this method to upgrade code while preserving user data and reports.

1. **Verify current state**:
   ```bash
   dfx canister --network ic call backend listUsers
   dfx canister --network ic call backend listReports
   ```

2. **Set NEW build version** (REQUIRED - must be different from current production):
   ```bash
   export VITE_BUILD_VERSION="$(date +%Y%m%d-%H%M%S)"
   ```
   
   **Critical:** This MUST be set to a new value for each production publish. Without it:
   - The footer build indicator will not change
   - Service worker will not detect the update
   - Users will not see the update banner
   - Cache invalidation may not work correctly
   
   **Verification:** After setting, verify it's exported:
   ```bash
   echo $VITE_BUILD_VERSION
   ```
   You should see a timestamp like `20260210-143022`. If empty, re-run the export command.

3. **Upgrade backend** (preserves state):
   ```bash
   dfx deploy --network ic backend --mode upgrade
   ```

4. **Upgrade frontend** (with new build version):
   ```bash
   dfx deploy --network ic frontend
   ```
   
   **Note:** The frontend build will use the `VITE_BUILD_VERSION` you set in step 2.

5. **Verify upgrade success** (see Post-Deploy Smoke Tests below)

### Post-Deploy Smoke Tests

After deployment, verify critical functionality in this order:

#### 1. Build Version Verification (FIRST - for upgrades)
- [ ] Open production app in browser
- [ ] Check footer: build indicator shows NEW version (different from pre-publish)
- [ ] If version unchanged, the build may not have used VITE_BUILD_VERSION correctly

#### 2. Service Worker Registration
- [ ] Open browser DevTools → Application → Service Workers
- [ ] Verify service worker is registered with versioned URL (e.g., `/sw.js?v=20260210-143022`)
- [ ] Check Console for service worker registration logs
- [ ] No errors in Console related to service worker

#### 3. Service Worker Update Flow (for upgrades with existing users)
**Test this with a browser that has the OLD version cached:**
- [ ] Open production app in a browser/tab that was using the old version
- [ ] Wait up to 60 seconds for automatic update check
- [ ] Orange update banner appears at top: "A new version is available"
- [ ] Click "Reload to Update" button
- [ ] Page reloads without errors
- [ ] Footer build indicator now shows the NEW version
- [ ] All functionality works normally after update
- [ ] **No admin-only cache reset required** for normal users

**If update banner does not appear:**
- Check browser Console for service worker logs
- Verify footer shows new build version
- Try hard refresh (Ctrl+Shift+R) to force update check
- See Troubleshooting section below

#### 4. Authentication
- [ ] Login with Internet Identity works
- [ ] Logout clears session correctly
- [ ] Session persists across page refreshes

#### 5. User Profiles
- [ ] New user signup (engineer role) works
- [ ] Admin signup with correct password works
- [ ] Profile data displays correctly

#### 6. Reports
- [ ] Create new service report
- [ ] View report history
- [ ] View individual report details
- [ ] Filter reports by date and text search

#### 7. Admin Functions (if admin user)
- [ ] View all users in admin panel
- [ ] View reports filtered by user
- [ ] Export reports to CSV
- [ ] Delete user (non-admin)

#### 8. PWA & Offline
- [ ] Manifest accessible at `/manifest.webmanifest`
- [ ] Icons load correctly (192x192, 512x512)
- [ ] Service worker registers successfully
- [ ] "Add to Home screen" prompt appears in Chrome Android
- [ ] Offline banner appears when network disconnected

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
- Verify `VITE_BUILD_VERSION` was set during build (check footer build indicator)
- If footer shows `dev-*` in production, VITE_BUILD_VERSION was not set correctly

### Service worker update not appearing after publish
**Symptoms:** After deploying a new version, users on the old version don't see the update banner.

**Diagnosis steps:**
1. **Verify new build version was set:**
   - Check footer build indicator in production
   - Should show timestamp like `Build: 20260210-143022`
   - If shows `dev-*`, VITE_BUILD_VERSION was not set during build

2. **Check service worker registration:**
   - Open DevTools → Application → Service Workers
   - Look for versioned URL: `/sw.js?v=<BUILD_VERSION>`
   - If version parameter missing or unchanged, rebuild with VITE_BUILD_VERSION set

3. **Force update check:**
   - Hard refresh (Ctrl+Shift+R) to bypass cache
   - Wait 60 seconds for automatic update check
   - Check Console for service worker update logs

**Solutions:**
- **If build version didn't change:** Re-deploy with new VITE_BUILD_VERSION
  ```bash
  export VITE_BUILD_VERSION="$(date +%Y%m%d-%H%M%S)"
  dfx deploy --network ic frontend
  ```
- **If service worker not detecting update:** Clear browser cache and reload
- **If update banner doesn't appear:** Check browser Console for JavaScript errors

### PWA not installable on Android
- Verify manifest is accessible and valid JSON
- Check all icon URLs return HTTP 200
- Use Chrome DevTools Lighthouse to diagnose PWA issues
- Ensure `display: "standalone"` is set in manifest

### Data loss after upgrade
- Always use `--mode upgrade` for state-preserving deployments
- Never use `--mode reinstall` unless intentionally resetting data
- Keep backups of critical data before major upgrades

### Build version shows "dev-*" in production
**Cause:** VITE_BUILD_VERSION was not set before building.

**Solution:**
1. Set the environment variable:
   ```bash
   export VITE_BUILD_VERSION="$(date +%Y%m%d-%H%M%S)"
   ```
2. Verify it's set:
   ```bash
   echo $VITE_BUILD_VERSION
   ```
3. Re-deploy frontend:
   ```bash
   dfx deploy --network ic frontend
   ```

## Additional Resources

- [Internet Computer Documentation](https://internetcomputer.org/docs)
- [DFX Command Reference](https://internetcomputer.org/docs/current/references/cli-reference/)
- [Canister Upgrades](https://internetcomputer.org/docs/current/developer-docs/backend/motoko/upgrades)
- [Android TWA Build Guide](./ANDROID_TWA_BUILD.md)
