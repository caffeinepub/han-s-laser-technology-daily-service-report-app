# Specification

## Summary
**Goal:** Package an Android TWA build that uses a custom app icon by adding the required icon assets, ensuring the PWA manifest references them, and documenting the Bubblewrap build steps.

**Planned changes:**
- Add Android app icon PNG assets as static files under `frontend/public/assets/generated/` using the exact manifest-referenced filenames: `android-app-icon.dim_192x192.png` and `android-app-icon.dim_512x512.png`.
- Ensure `frontend/public/manifest.webmanifest` includes icon entries for sizes 192x192 and 512x512 pointing to `/assets/generated/android-app-icon.dim_192x192.png` and `/assets/generated/android-app-icon.dim_512x512.png`.
- Update `frontend/ANDROID_TWA_BUILD.md` with explicit Bubblewrap packaging instructions, including the exact icon URLs to provide and a short pre-build verification checklist (confirming manifest and icon URLs return HTTP 200).

**User-visible outcome:** The Android TWA (Bubblewrap/Android Studio flow) uses the custom app icon from the PWA manifest, and the repo contains clear instructions to verify icon URLs and build an APK/AAB.
