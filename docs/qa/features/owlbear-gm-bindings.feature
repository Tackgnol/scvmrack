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

  # Automation anchor: backend/tests/e2e/tests/authed/obr-participation.spec.ts
  Scenario: Remove another player's bound scvm from the room roster
    Given a signed-in GM owns the party attached to the room
    And another player's scvm belongs to that party and has player and token bindings
    When the GM removes that scvm from the roster
    Then its player and token bindings and party membership are removed
    And refreshing the roster does not bring that scvm back
    And the player's saved scvm remains available

  Scenario: Finish scene cleanup after reopening the room
    Given a signed-in GM owns the party attached to the room
    And another player's scvm belongs to that party and has player and token bindings
    When the GM removes that scvm but Owlbear cannot clear its token metadata
    Then its party membership and active room bindings are removed
    And the GM sees that scene cleanup is pending
    When the GM reopens the extension and scene cleanup becomes available
    Then the old token metadata is cleared and cleanup is no longer pending
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

  Scenario: Remove a newly joined scvm before refreshing the roster
    Given a signed-in GM owns the party attached to the room
    And another player's scvm has just joined and acquired room bindings
    And the GM's displayed party membership is out of date
    When the GM removes that scvm from the roster once
    Then its party membership and active room bindings are removed
    And reopening the extension does not bring that scvm back

  Scenario Outline: Keep room participation consistent when leaving through the app
    Given a signed-in GM owns the party attached to the room
    And another player's scvm belongs to that party and has player and token bindings
    When <actor> removes that scvm through <action>
    Then its party membership and active room bindings are removed
    And scene cleanup remains available to the GM until completed
    And the player's saved scvm remains available

    Examples:
      | actor              | action                    |
      | the party owner    | the normal party kick     |
      | the scvm's owner   | the normal party leave    |

  Scenario: Reject removal by an unrelated account
    Given a signed-in GM owns the party attached to the room
    And another player's scvm belongs to that party and has player and token bindings
    When an unrelated account tries to remove that scvm
    Then removal is rejected
    And its membership, bindings and pending scene cleanup are unchanged

  Scenario: Recover an acknowledged removal after a lost response
    Given a signed-in GM owns the party attached to the room
    And another player's scvm belongs to that party and has player and token bindings
    When the GM removes that scvm but loses the response
    And the GM retries the same removal
    Then the GM sees the same completed removal and any pending scene cleanup
    And no duplicate cleanup is created

  Scenario: Preserve a deliberate rejoin while completing old cleanup
    Given a GM removed a scvm and its old scene cleanup is pending
    When the player deliberately rejoins and binds that scvm again
    And the old cleanup runs or the original removal request is retried
    Then the new membership and bindings remain usable
    And old scene metadata alone cannot restore a removed binding
