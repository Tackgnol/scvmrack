# itch.io HTML project

Wrapper page that embeds the live app (https://scvmrack.rpgtools.co) in a
fullscreen iframe, so SCVMRACK gets itch.io's "Run in browser" button and
shows up in the web-playable browse filters.

This works because the production Caddy config (`Caddyfile.example`) sets
`frame-ancestors 'self' https://itch.io https://*.itch.io https://*.itch.zone`
— itch serves uploaded HTML from `*.itch.zone` inside the `itch.io` page, and
Chrome checks every ancestor in the chain, so both families must be allowed.
The header change must be deployed to the Caddy host before the itch page can
load the app.

## Uploading to itch.io

1. Zip the contents of this folder so `index.html` sits at the zip root
   (zip the files, not the folder):

   ```powershell
   Compress-Archive -Path itch\index.html -DestinationPath scvmrack-itch.zip -Force
   ```

2. On the itch.io project page: **Kind of project: HTML**, upload
   `scvmrack-itch.zip`, and check **"This file will be played in the browser"**.

3. Under **Embed options**, pick "Click to launch in fullscreen" or a large
   viewport (the app is responsive); enable **Mobile friendly**.

## Sessions inside the embed

The frontend detects it is framed (`window.self !== window.top`) and adds an
`x-embedded-session: 1` header to cookie-issuing requests (`/api/csrf-token`,
`/api/auth/*`). The backend (shared-auth >= 1.4.0 with `embeddedSessions:
true`) then issues session/CSRF cookies with `SameSite=None; Secure;
Partitioned` so anonymous play works inside the iframe. Direct visits keep
the default `SameSite=Lax` cookies.

Remaining caveats:

- `Partitioned` (CHIPS) means the embed session is separate from a
  direct-visit session; characters made on itch can be moved over with the
  claim-code flow.
- Safari blocks third-party cookies entirely — the embed stays session-less
  there; the fallback link is the escape hatch.
- Logto login inside the iframe is not supported (top-level redirect flow).
