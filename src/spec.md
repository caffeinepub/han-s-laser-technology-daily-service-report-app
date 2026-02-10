# Specification

## Summary
**Goal:** Make the existing web app installable and usable like an Android app via PWA support, and provide guidance to package it into an Android APK/AAB using a Trusted Web Activity (TWA) wrapper.

**Planned changes:**
- Add a web app manifest linked from the HTML entrypoint with required fields (name, short_name, start_url, standalone display, theme/background colors, and 192x192 + 512x512 icons).
- Add offline-capable service worker registration and offline behavior that preserves authenticated navigation (app shell loads and shows an English offline state/message when the network is unavailable).
- Add Android-appropriate app icon assets under `frontend/public/assets/generated` and reference them from the manifest.
- Add frontend repository documentation with step-by-step instructions to build an Android TWA wrapper for the production URL, including parameters, verification steps for manifest/icons, and how to produce a debug APK (not covering Play Store publishing/signing).

**User-visible outcome:** Users can install the app from Chrome on Android (“Add to Home screen”) and launch it in standalone mode with basic offline behavior; developers have written guidance to wrap the deployed app URL into an Android APK/AAB using TWA.
