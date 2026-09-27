# What does a signed-out user see on the GM tab?

Type: prototype
Status: open

## Question

Prototype a `GM features overview` page shown to signed-out users on the GM tab: what GM features exist (parties, enemy board, Custom Classes) and a `sign up now to become a GM` call to action.

## What exists today

- `/gm` renders `GmOverviewPage.tsx`, which is the **signed-in GM dashboard** (create a party, list parties), not an overview. A guest (anonymous session) sees only a warning, "You need to be logged in to run the GM dashboard", and a Back to Home button.
- The header hides the GM tab unless the user is signed in (`HeaderDesktopBar.tsx`, `HeaderDrawerNav.tsx`), so today a signed-out visitor never reaches `/gm` from the navigation.
- Sign-in is Logto through shared-auth: `loginUrl()` goes to `/api/auth/oauth2/login/logto`, which accepts a same-origin `returnTo` query parameter (the app doesn't pass one yet).
- When a guest signs up in the same browser, `onLinkAccount` moves the guest's characters to the new account.

## Assets

- Prototype: [prototypes/gm-overview.html](../prototypes/gm-overview.html). It mocks the app header with the GM tab shown to everyone. The prototype bar switches variants and a "guest with a scvm" state.
- **Round 1 (2026-09-27)**: two variants.
  - **A, recruitment poster**: a black hero band (after LandingPage) with the headline "Gather the warband. Watch it bleed.", a rotated live-warband mock and the sign-up button. Four numbered GM features (I–IV) alternate with small mocks of the real UI:
    - one invite link gathers the party
    - live HP, Omens and armour
    - choose the Party Class Pool and forge Custom Classes (tagged "With Custom Classes")
    - Owlbear Rodeo: token binding, room roster, enemy board
    
    A pink closing band repeats the call.
  - **B, behind the glass**: the real GM dashboard (Party control, the create form, party cards) locked behind a yellow grille. Numbered pins point at its parts, and a black slab over it reads "This is the GM screen. Sign up to run it." with three steps and the sign-up button. Owlbear and Custom Classes follow as two short notes. On phones the slab comes first and the dashboard sits dimmed below it.
  - **Both**: guests see "Your guest scvm comes with you". Sign up and log in both go to Logto with `returnTo=/gm`.

## Open questions for the owner

1. Variant A or B, or a mix?
2. Show the GM tab to everyone, signed-out visitors and guests included? The page only works if it's reachable.
3. Should the sign-up button open Logto's registration screen first rather than sign-in? That depends on whether shared-auth can pass it through. Either way it returns to `/gm`.
4. Which features to list: parties and the invite link, live vitals, the class pool and Custom Classes (only once they ship), and Owlbear. Guilds stay out until guild invites ship.
5. Index the signed-out page for search ("Mörk Borg GM tools")? `/gm` is `noIndex` today.
6. Copy claims to confirm: "free", "One rpgtools.co account. No card, no trial."
