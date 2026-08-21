# LocalLeadster – Chrome extension

Adds an **Add to LocalLeadster** button on Google Maps place pages. Clicking it opens the CRM with the business name, address, city, state, and phone prefilled in the manual “Add lead” dialog (you must be signed in).

## How it works

1. Content script runs on `https://www.google.com/maps/*`.
2. When a place listing is detected (URL `/maps/place/…` or Maps place `h1`), a floating button appears.
3. Click opens `https://localleadster.com/dashboard/leads?ext=1&name=…&address=…&city=…&state=…&phone=…`.
4. `/dashboard/leads` is already auth-gated via `proxy.ts` — unauthenticated users are sent to login with that URL as `callbackUrl`.

No Places API calls from the extension; parsing is DOM/URL only.

## Install (unpacked)

1. Chrome → **Extensions** → enable **Developer mode**.
2. **Load unpacked** → select this `chrome-extension/` folder.
3. Open a business on Google Maps and use **Add to LocalLeadster**.

To point at local dev, change `APP_ORIGIN` in `content.js` to `http://localhost:3000`.

## Files

- `manifest.json` — MV3
- `content.js` — inject button + open prefilled CRM URL
- `icon48.png` — toolbar / store icon
