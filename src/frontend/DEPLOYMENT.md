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

## Go Live (Mainnet)

This section provides step-by-step instructions for deploying the application to the Internet Computer mainnet for production use.

### Preflight Checks

Before deploying to mainnet, verify the following:

#### 1. Environment Verification
