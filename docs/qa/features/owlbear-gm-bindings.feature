@ui @playwright @owlbear
Feature: Owlbear GM room bindings
  A signed-in party owner can manage their room's characters without owning them.

  Scenario: Bind and unbind a party member's token as the GM
    Given a signed-in GM owns the party attached to the room
    And another player's scvm belongs to that party
    When the GM binds the selected token to that scvm
    Then View scvm shows the member's current character card
    When the GM unbinds the token
    Then the binding is removed and the player's saved scvm remains available
    And an unrelated account cannot manage the binding
    And the GM cannot bind an unrelated character through this permission
