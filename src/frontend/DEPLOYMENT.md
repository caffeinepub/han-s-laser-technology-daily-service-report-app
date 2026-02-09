# Deployment & Retry Runbook

## Overview
This document provides guidance for deploying the Han's Laser Tech India Service Report application, including both normal upgrades and fresh deployments.

## Deployment Types

### Normal Upgrade/Redeploy (State Preserved)
A normal deployment upgrades the application code while preserving all existing data:
- User accounts and profiles remain intact
- Service reports are preserved
- Access permissions are maintained
- Users can continue using the app without re-authentication

**When to use**: Regular updates, bug fixes, feature additions

### Fresh Publish (State Cleared)
A fresh publish deploys the application with an empty state:
- All user accounts are removed
- All service reports are deleted
- All access permissions are reset
- First user to sign up becomes the initial admin

**When to use**: Initial deployment, major version changes, or when explicitly requested to start fresh

## Triggering a Normal Redeploy
To trigger a rebuild and redeploy while preserving data:
1. Ensure all code is committed to the repository
2. Trigger the build process through the deployment system
3. Monitor the deployment pipeline for completion
4. Verify the app is accessible and data is intact

## Publish as Fresh App

### Prerequisites
Before performing a fresh publish, ensure:
- All stakeholders are informed that data will be lost
- Any necessary data backups have been created
- The decision to clear all data is intentional and approved

### Fresh Publish Procedure
To deploy the application with empty canister state:

1. **Admin-triggered reset (Recommended)**:
   - Log in as an admin user
   - Navigate to the Admin Users page
   - Click "Full System Reset" button
   - Confirm the destructive action in the dialog
   - You will be automatically logged out
   - The application is now in a fresh state

2. **Manual canister reinstall** (Alternative):
   - Stop the backend canister: `dfx canister stop backend`
   - Uninstall the canister: `dfx canister uninstall backend`
   - Reinstall with fresh state: `dfx canister install backend --mode reinstall`
   - Deploy frontend assets: `dfx deploy frontend`

### Post-Deploy Verification Checklist
After a fresh publish, verify the following:

- [ ] **Login requires new signup**: Attempting to log in prompts for signup form
- [ ] **Admin user list is empty**: Navigate to Admin Users page (after signup) shows no existing users
- [ ] **Report history is empty**: Report History page shows no existing reports
- [ ] **First signup becomes admin**: The first user to complete signup receives admin privileges
- [ ] **Access codes work**: Admin and Engineer signup codes function correctly
- [ ] **Report creation works**: New service reports can be created and saved
- [ ] **Role permissions work**: Admin can access Users page, Engineers cannot

### Distinguishing Normal vs Fresh Deployment

| Aspect | Normal Upgrade | Fresh Publish |
|--------|---------------|---------------|
| User accounts | Preserved | Deleted |
| Service reports | Preserved | Deleted |
| Access permissions | Preserved | Reset |
| User experience | Seamless | Must sign up again |
| Data continuity | Yes | No |
| Use case | Updates, fixes | Initial deploy, major reset |

## Deployment Steps
The deployment process includes:
1. **Build Phase**: TypeScript compilation and Vite bundling of frontend assets
2. **Backend Deploy**: Motoko canister compilation and deployment to Internet Computer
3. **Canister Install**: Installing/upgrading backend canister with current code
4. **Frontend Asset Upload**: Uploading compiled frontend assets to asset canister
5. **Verification**: Confirming the app is reachable at the deployed URL

## Troubleshooting Failed Deployments
If deployment fails, capture the following information:

### Identify the Failing Step
- **Build failure**: Check TypeScript compilation errors, missing dependencies
- **Deploy failure**: Check canister deployment logs, network connectivity
- **Canister install failure**: Check Motoko compilation errors, upgrade compatibility
- **Frontend asset upload failure**: Check asset size limits, network issues

### Capture Full Logs
For each failure, collect:
- Complete error output from the failing step
- Stack traces if available
- Timestamp of failure
- Environment details (node version, dfx version, etc.)

### Common Issues
- **TypeScript errors**: Run `pnpm typescript-check` locally to verify
- **Missing dependencies**: Ensure `pnpm install` completes successfully
- **Canister upgrade issues**: Check for state compatibility in backend changes
- **Asset size limits**: Verify frontend bundle size is within limits
- **State migration errors**: Review migration.mo for compatibility issues

## Current Application State
- **Features**: Service report management with role-based access control
- **Auth**: Internet Identity integration
- **Roles**: Admin (full access) and Engineer (own reports only)
- **Backend**: Motoko canister with authorization mixin
- **Frontend**: React + TypeScript + TanStack Router + shadcn/ui
- **Data Reset**: Admin-triggered full system reset capability

## Emergency Data Reset
If the application needs to be reset to a fresh state urgently:
1. Use the admin "Full System Reset" feature in the UI (preferred)
2. Or manually reinstall the backend canister (requires dfx access)
3. Verify all data is cleared using the post-deploy checklist above
4. Communicate the reset to all users who will need to sign up again
