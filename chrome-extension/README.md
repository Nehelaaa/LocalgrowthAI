# LocalGrowth AI – Chrome Extension (placeholder)

Basic structure for a future Chrome extension that:

- Detects when you're on a Google Maps page
- Lets you click **"Add to LocalGrowth AI"** to send the current place to the app

## Status

Placeholder only. To implement:

1. Add icons (`icon48.png`).
2. In `content.js`: parse the current place from the Maps URL or DOM.
3. Either open your LocalGrowth AI dashboard with prefilled params, or call your API to add the place by ID/name.

Load in Chrome via **Extensions → Load unpacked** and select this folder.
