Feature: Forge a scvm from Owlbear in a new tab
  An Owlbear player keeps their identity and room-party context while forging a new scvm outside the iframe.

  Scenario: A guest forges from their room party
    Given an anonymous Owlbear player has no scvm in a room with a Party Class Pool
    When the player chooses "Forge scvm"
    Then a new tab redeems the Owlbear identity
    And the forge shows that room's Party Class Pool
    When the player finishes forging
    Then the new scvm joins the room party and binds to the Owlbear player
    And the Owlbear panel shows the new scvm when it regains focus

  Scenario: A different signed-in account is not replaced silently
    Given Owlbear uses one signed-in identity
    And the forge tab is signed in as a different account
    When the forge tab redeems the Owlbear identity
    Then it explains the account mismatch before changing either account
  Scenario: A player explicitly chooses the Owlbear identity in a mismatched forge tab
    Given Owlbear uses one signed-in identity
    And the forge tab is signed in as a different account
    When the player chooses "Forge as the Owlbear identity"
    Then the forge tab signs out the different account
    And it redeems the Owlbear identity and opens the room-scoped forge

  Scenario: A player finishes a room-scoped forge in the new tab
    Given an Owlbear player is forging from a room party in a new tab
    When the player finishes forging
    Then the new tab shows "Forged. Back to Owlbear"
    And the Owlbear panel can show the bound scvm when it regains focus