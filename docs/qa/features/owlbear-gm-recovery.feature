@ui @playwright @owlbear
Feature: Owlbear GM session recovery
  A GM can sign in and recover access without leaving their room.

  Scenario: Recover an expired GM session and continue managing the room
    Given a GM has a room party open with an expired Scvmrack session
    When the GM completes sign-in through the extension's visible recovery action
    Then the extension remains in the room's GM view
    And the GM can manage their party without reopening the room
    When the GM's session expires again
    Then the extension offers recovery again without losing the room roster

  Scenario Outline: Retry an interrupted sign-in in the compact GM panel
    Given a GM has the 420-pixel room panel open in <language>
    When sign-in fails and the recovery message is shown
    Then the recovery action remains reachable with the pointer above the GM tabs
    When the GM retries and cancels sign-in from the extension
    Then the GM can retry again and use both room tabs without losing the roster

    Examples:
      | language |
      | English  |
      | Polish   |
