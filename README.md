# SUARA PWA v1.2.0

English-language public participation PWA. Includes a client-side sign-in screen asking for name, 16-digit NIK, and age.

## Privacy and security note
The sign-in screen is a prototype interface, not identity verification or secure authentication. The NIK is validated in browser memory only and is not saved to localStorage/sessionStorage or sent to a server. Do not use real identity data until a secure backend, HTTPS deployment, access controls, retention policy, and privacy safeguards are implemented.

## Run locally
Serve this folder through localhost (for example, VS Code Live Server). For PWA installation and offline support, deploy over HTTPS.

## Files
- `index.html` — app UI and client-side behavior
- `manifest.webmanifest` — PWA metadata
- `sw.js` — offline caching
- `assets/` — app icons

All submissions/reviews remain in this browser's local storage. There is no server-side account or submission system yet.
