@ui @playwright @owlbear
Feature: Owlbear table play
  A GM and their players can run a warband in an Owlbear room while keeping
  their scvms, class rules and campaign state in Scvmrack.

  Scenario: Install the current release and open the extension
    Given I install the Scvmrack extension for release 0.7.0
    When I open its action in an Owlbear room
    Then the current extension opens with usable player and GM views
    And opening the extension outside Owlbear explains how to use it

  Scenario: Roll from the room pool and continue in the full sheet
    Given the room party allows a custom class with a starting item and ability
    When a guest rolls that class in the extension
    Then their scvm has that class, item and ability and belongs to the room party
    And their player is bound to that scvm
    When they open the full Scvmrack sheet and save a change
    Then the extension shows that same saved scvm after reopening

  Scenario: Respect the GM's class choices
    Given a GM attaches a party with a custom-only class pool to the room
    When the GM switches Classless off and a player opens Roll
    Then only the enabled custom classes and Random can be chosen
    When the GM switches Classless on and the player reopens Roll
    Then Classless can also be chosen and creates a classless party member

  Scenario: Bind an owned scvm to a token and keep its live card correct
    Given a player has an owned scvm and a character token in the open scene
    When the player picks their scvm and binds the selected token
    Then the token's Scvmrack card identifies that scvm
    When the player changes hit points, Omens and silver
    Then the token card and GM roster show the new values
    And reopening the extension keeps the binding and saved values
    When the player unbinds the token
    Then the token no longer shows that card and the saved scvm still exists

  Scenario: Keep a durable warband and protect GM enemy details
    Given a signed-in GM has attached a party to the room
    And the party contains a player scvm and an enemy with private GM notes
    When the GM changes the party's Miseries and wounds the enemy
    Then the player's sheet and safe enemy card update
    And the player cannot read the private notes or use GM enemy controls
    When the GM detaches and reattaches the party
    Then its members and saved enemy state are restored

  Scenario: Remain usable when there is no scene or persistent browser storage
    Given the room has no open scene and browser storage is unavailable
    When a guest opens the extension and rolls an allowed scvm
    Then the scvm and room roster remain usable for that visit
    And token-binding actions explain that an open scene is required
    When a scene opens
    Then token-binding actions become available without losing the scvm

  Scenario: Recover from cancelled sign-in and expired embedded sessions
    Given a player has an owned scvm open in the extension
    When they cancel the sign-in popup
    Then the extension still shows their guest scvm
    When their embedded session expires and a save fails
    Then the extension shows an explicit recovery action rather than claiming it saved
    When they complete sign-in and retry
    Then their owned scvm and the saved change remain available

  Scenario: Keep the compact extension usable in English and Polish
    Given a populated room party is open in the 420 by 600 extension panel
    When I use the player, GM, class picker and enemy views in English and Polish
    Then their primary actions remain visible and usable without horizontal page overflow
    And the views remain legible in Owlbear's light and dark themes

  # Automation anchor: frontend/test/browser/obr/EnemyPersistence.test.tsx
  Scenario: Create, clone and edit enemies from the GM panel
    Given a signed-in GM has attached a party to the room
    When the GM saves a new enemy with a name and hit points
    Then that enemy remains in the room after reopening the panel
    When the GM clones the enemy and edits the clone's name
    Then both enemies remain distinct after reopening the panel
    And editing the clone has not changed the original enemy

  # Automation anchor: frontend/test/browser/obr/EnemyPersistence.test.tsx
  Scenario: Keep every acknowledged enemy wound and heal
    Given a signed-in GM has an enemy at 8 of 8 hit points in the room
    When the GM rapidly wounds the enemy four times before saves settle
    Then the enemy has 4 of 8 hit points after the saves settle and the panel reopens
    When the GM rapidly heals the enemy four times before saves settle
    Then the enemy has 8 of 8 hit points after the saves settle and the panel reopens
    And further wounds or heals cannot move hit points outside zero to maximum

  # Automation anchor: frontend/test/browser/obr/EnemyPersistence.test.tsx
  Scenario: Continue queued enemy health actions after one save fails
    Given a signed-in GM has an enemy at 8 of 8 hit points in the room
    When the GM rapidly wounds the enemy four times
    And one wound fails to save while the other three succeed
    Then the GM sees the failed-save message
    And the enemy has 5 of 8 hit points after reopening the panel

  # Automation anchor: frontend/test/browser/obr/EnemyPersistence.test.tsx
  Scenario: Distinguish a deleted enemy from a missing room party
    Given a signed-in GM is viewing an enemy in an attached room party
    When that enemy is deleted elsewhere before the GM changes it
    Then the failed action does not claim the room party is missing
    And a genuinely missing room party still explains how to attach it
