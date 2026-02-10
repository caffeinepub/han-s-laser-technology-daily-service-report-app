# Specification

## Summary
**Goal:** Capture optional geolocation when submitting a daily service report, store it with the report, and show/export it wherever reports are viewed or downloaded.

**Planned changes:**
- Extend the backend `DailyServiceReport` model to include optional geolocation fields (at least latitude/longitude, optionally accuracy and captured timestamp) and persist them on report creation when provided.
- Add a backend migration to keep existing stored reports readable by initializing new geolocation fields to null/none.
- Update the report submission UI to optionally capture the user’s current location via the browser Geolocation API and include it in the `useCreateReport` payload, with clear non-blocking error handling when unavailable/denied/timeouts.
- Update report viewing and export surfaces to display location when present and include geolocation columns in CSV downloads (blank when not available), without breaking existing report browsing/filtering.

**User-visible outcome:** Users can attach their current location to a service report at submission time (optional), see the captured coordinates when viewing a report, and download CSVs that include location columns when available.
