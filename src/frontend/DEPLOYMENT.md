# Deployment & Retry Runbook

## Overview
This document provides guidance for redeploying the Han's Laser Tech India Service Report application without making functional changes.

## Triggering a Redeploy
To trigger a rebuild and redeploy of the current application state:
1. Ensure all code is committed to the repository
2. Trigger the build process through the deployment system
3. Monitor the deployment pipeline for completion

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

## Current Application State
- **Version**: Draft Version 8
- **Features**: Service report management with role-based access control
- **Auth**: Internet Identity integration
- **Roles**: Admin (full access) and Engineer (own reports only)
- **Backend**: Motoko canister with authorization mixin
- **Frontend**: React + TypeScript + TanStack Router + shadcn/ui

## No Code Changes Required
This deployment is a retry of the existing codebase. No functional changes are being made to:
- User authentication flow
- Signup/profile setup
- Report entry and management
- Admin user management
- Role-based access control
