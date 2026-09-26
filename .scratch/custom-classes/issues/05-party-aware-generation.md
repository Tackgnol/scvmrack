# How do the join roll/forge flows roll from the Party Class Pool without changing their screens?

Type: grilling
Status: open

## Question

Today `JoinRollPage` and `JoinForgePage` create the character through the party-unaware flow and only then call `joinParty`. Decide how the party (invite token) reaches draft/generation so the random roll and the forge class picker use the Party Class Pool, what happens to the classless option, and what happens if the pool changes mid-forge. Screens must stay the same as a party without Custom Classes.
