# MA7ALAK DZ v5.4 — Sidebar usability fix

- Hide the desktop sidebar on login, lock, and expired-access screens so it cannot cover the sign-in form.
- Reserve a dedicated 250px desktop column for the right-to-left sidebar; the content no longer renders underneath it.
- Keep the sidebar independently scrollable when its menu is taller than the viewport.
- Preserve the mobile navigation behavior.
- Bump the service-worker cache version to force browsers to fetch the updated layout.

Validation: CSS patch applied and ZIP archive integrity checked. Real browser/device testing is still required.
