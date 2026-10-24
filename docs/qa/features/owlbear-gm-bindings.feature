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

  # Automation anchor: frontend/test/browser/obr/RosterRemoval.test.tsx
  Scenario: Remove another player's bound scvm from the room roster
    Given a signed-in GM owns the party attached to the room
    And another player's scvm belongs to that party and has player and token bindings
    When the GM removes that scvm from the roster
    Then its player and token bindings and party membership are removed
    And refreshing the roster does not bring that scvm back
    And the player's saved scvm remains available

  # Automation anchor: frontend/test/browser/obr/RosterRemoval.test.tsx
  Scenario: Retry roster removal after binding cleanup fails
    Given a signed-in GM owns the party attached to the room
    And another player's scvm belongs to that party and has player and token bindings
    When the GM removes that scvm but one binding cannot be cleared
    Then the GM sees the cleanup failure and the scvm remains a party member
    When the failed binding can be cleared and the GM retries removal
    Then its remaining bindings and party membership are removed
    And the player's saved scvm remains available

  # Automation anchor: backend/tests/integration-be/src/owlbear-table.integration.test.ts
  Scenario: Clear a binding left behind by an earlier roster removal
    Given a signed-in GM owns the party attached to the room
    And a former member no longer belongs to that party but still has a binding in that room
    When the GM removes that former member from the roster
    Then the leftover binding is removed and stays absent after refresh
    And the player's saved scvm remains available
    And an unrelated account cannot clear the binding
    And owning a different room does not allow clearing the binding
