# Harvest

A mobile-first Progressive Web App for tracking gospel conversations and following up faithfully with the people God has placed in your life.

**No account. No server. No App Store.** All data lives on your device.

---

## Features

- **People** — Add anyone you're in a gospel conversation with. Track their spiritual stage, log notes after each interaction, and set follow-up reminders.
- **Prayer** — A daily prayer list auto-populated from your people. Check off who you've prayed for, drag to reorder, and reset each morning.
- **Conversation Timeline** — Every logged conversation is recorded with date, notes, and stage changes so you can see the journey at a glance.
- **Follow-up Urgency** — Overdue and upcoming follow-ups surface automatically on the home screen so nothing falls through the cracks.
- **Stage Labels** — Six customizable spiritual stages from Unplanted to Bearing Fruit. Rename them in Settings to fit your context.
- **Export to CSV** — Download all your data anytime. Your data is yours.
- **Works Offline** — Install to your home screen and use it anywhere, no connection required after the first load.

---

## Install as a PWA

### iPhone (Safari)
1. Open the app URL in Safari
2. Tap the Share button → **Add to Home Screen**
3. Tap **Add** — the app opens in standalone mode with no browser chrome

### Android (Chrome)
1. Open the app URL in Chrome
2. Tap the menu → **Add to Home Screen** (or tap the install banner if it appears)

---

## Deploying to GitHub Pages

### Option A — Root deployment (`username.github.io/`)

Push the repo contents to your `gh-pages` branch (or `main` with Pages enabled). No code changes needed — paths are already configured for root deployment.

### Option B — Subdirectory deployment (`username.github.io/harvest/`)

Before pushing, make two edits:

**`manifest.json`** — update `start_url` and icon paths:
```json
"start_url": "/harvest/",
"icons": [
  { "src": "/harvest/icons/icon-192.png", ... },
  { "src": "/harvest/icons/icon-512.png", ... },
  { "src": "/harvest/icons/apple-touch-icon.png", ... }
]
```

**`sw.js`** — add `/harvest` prefix to every entry in `PRECACHE_URLS`:
```javascript
const PRECACHE_URLS = [
  '/harvest/',
  '/harvest/index.html',
  '/harvest/css/styles.css',
  // ... etc.
];
```

Then push and enable GitHub Pages under **Settings → Pages → Deploy from branch**.

---

## File Structure

```
/
├── index.html              Main app shell
├── manifest.json           PWA manifest
├── sw.js                   Service worker (cache-first)
├── css/
│   └── styles.css          All styles
├── js/
│   ├── data.js             localStorage read/write
│   ├── app.js              Navigation, screens, modals
│   └── drag.js             Touch drag-to-reorder
└── icons/
    ├── icon-192.png
    ├── icon-512.png
    └── apple-touch-icon.png
```

No build step. No dependencies. No bundler. Open `index.html` through any HTTP server and it works.

---

## Local Development

Any static file server works. With Python:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

---

## Data & Privacy

All data is stored in your browser's `localStorage` under keys prefixed with `harvest_`. Nothing is ever sent to a server. Clearing your browser data or switching devices will erase your data — use **Settings → Export to CSV** regularly to keep a backup.

---

## License

MIT
