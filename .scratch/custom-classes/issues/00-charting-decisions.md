# What did charting settle about custom classes?

Type: grilling
Status: resolved

## Question

Fix the destination and the scope-shaping decisions for custom classes before any ticket is worked.

## Answer

- **Destination**: an implementation-ready spec that `/to-tickets` can slice.
- **Terms**: Book Class, Custom Class, Class Item, Party Class Pool (see `CONTEXT.md`).
- **Ownership**: a Custom Class belongs to the GM's account and is reusable across their parties. Optional `Make public` flag lets other GMs find and pool it. Public search has a `my classes only` filter and a language filter/badge.
- **Signed-in GMs only**: creating Custom Classes requires a Logto-signed-in account. Signed-out users get a `GM features overview` page with a sign-up call to action.
- **Who gets Custom Classes**: only characters rolled or forged through a party's join links. Existing characters joining a party keep their class; characters leaving a party keep their Custom Class (costs nothing: characters keep `classId`).
- **Creator scope**: full Book Class parity: stat dice per attribute (N dice of X sides ± modifier, optional drop-lowest), HP/weapon/armor dice, silver, description, fixed + random abilities and random count, origin table (the only flavour table), Getting Better setting.
- **Class Items**: a Custom Class can author its own weapons, armor, equipment and pets, grantable only by its abilities; abilities can also grant existing catalog items. Parity demands it (Book Classes do this today, e.g. `weapons.brown-scimitar`).
- **Getting Better**: a fixed menu (book default / also gain a random class ability you don't have yet) plus an optional free-text note; stay open to richer rules later.
- **Language**: a class is single-language (EN or PL) or dual (every text field in both, sheet shows the player's language). Single-language classes stay rollable for everyone and show their authored language.
- **Same mechanism**: joining a party shows the same roll/forge screens; the Party Class Pool only changes which classes they draw from.
- **Party Class Pool**: Book Classes selected by default, any class toggleable, searchable. On opening the GM screen, a check notifies `class X has been removed by Y` for pooled classes that are gone.
- **Player sees**: `playing custom class created by {name}` (author's Logto profile name).
- **Locking**: a Custom Class locks once used; the GM duplicates to change it; delete means archive. Existing characters never break.
- **Moderation**: small admin panel; admins are an allowlist of user ids delivered as a Woodpecker secret (`from_secret`, like `logto_app_secret`) into a backend env var. Report reasons include copyright (`I own this class and do not wish it on scvmrack`) and abusive/illegal content. Classes publish immediately; takedown hides from search and other GMs' pools, characters keep it.
- **Public classes in pools**: other GMs can pool a Public Custom Class; unpublish/takedown stops new rolls, existing characters keep it.
