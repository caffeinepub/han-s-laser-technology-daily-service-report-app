# Specification

## Summary
**Goal:** Apply the uploaded Hans Laser logo as the app’s branding in the header and as the site favicon/app icons.

**Planned changes:**
- Generate production-ready PNG logo assets (app icon, favicon, apple touch icon) derived from `hans logo.jpeg` and save them under `frontend/public/assets/generated` with the required filenames.
- Update `frontend/src/components/AppHeader.tsx` to reference the newly generated logo asset (replacing the current hardcoded logo path).
- Update `frontend/index.html` to include favicon and apple-touch-icon links pointing to the newly generated PNG assets.

**User-visible outcome:** The app header displays the Hans Laser logo, and browser tabs/bookmarks (including Apple touch icons) show the new logo without missing asset requests.
