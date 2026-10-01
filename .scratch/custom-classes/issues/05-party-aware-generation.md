# How do the join roll/forge flows roll from the Party Class Pool without changing their screens?

Type: grilling
Status: resolved

## Question

Today `JoinRollPage` and `JoinForgePage` create the character through the party-unaware flow and only then call `joinParty`. Decide how the party (invite token) reaches draft/generation so the random roll and the forge class picker use the Party Class Pool, what happens to the classless option, and what happens if the pool changes mid-forge. Screens must stay the same as a party without Custom Classes.

## Answer

- **The party reaches generation via the invite token.** The join pages send it on `classes`, `draft`, `reroll` and `new`; the server resolves it to the party and its Party Class Pool.
- **Outside a party (no token): Book Classes only**, for now. Zine/Rack/Custom Classes are rejected server-side without a token whose pool contains them (drafts are client-held, so enforcement is server-only). A future toggle may open Zine/Rack Classes to solo players.
- **Every new party character goes through the forge class screen** (`ClassGate`): the blind "Roll and join" is dropped, `Random` stays a card, so every player sees the pool even at tables without Custom Classes.
- **Create and join happen in one server transaction** in the join flows, so a Custom Class character never exists outside a party because a join failed (full party, rotated token). Players who later leave keep their class.
- **Pool re-checked on confirm**: if the class was switched off, archived or taken down mid-forge, the player gets a friendly error and returns to `ClassGate` with the fresh pool; a landed roll is never silently swapped.
- **Classless** is a GM-screen toggle ("Enable classless scvm"), on by default (ticket 06).
- **Random** picks uniformly over the pool's classes; Classless is never randomly picked.
- **Visibility**: holders of the invite link see the full content of the pool's Custom Classes (accepted: the link is already the join capability).
- **Owlbear** gets the same rules keyed by room id; split into tickets 13 and 14.
