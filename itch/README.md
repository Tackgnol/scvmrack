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

## Known limitation: sessions inside the embed

Session cookies are `SameSite=Lax`. Inside the itch iframe the top-level site
is itch.io/itch.zone, so the browser treats requests to the API as cross-site
and won't send those cookies — anonymous sessions and login may not work in
the embed. The fallback/description link to scvmrack.rpgtools.co is the
escape hatch; full in-frame auth would need `SameSite=None; Partitioned`
(CHIPS) cookies in the shared-auth config.
