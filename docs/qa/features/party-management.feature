@ui @playwright @realtime
Feature: Party management
  A Game Master can control shared campaign state for every scvm in the warband.

  # Automation anchor: backend/tests/e2e/tests/authed/gm-miseries.spec.ts
  Scenario: Game Master sets the Misery count for every player
    Given I am signed in as a Game Master with a party
    And a guest player and a signed-in player have joined the party
    And both player sheets are open
    When I set the party Misery count to IV
    Then both player sheets show four of seven Miseries without a reload
    And reloading both player sheets still shows four of seven Miseries

  # Automation anchor: frontend/test/browser/organisms/party/PartyViewResize.test.tsx
  Scenario: Reach every party member after resizing the open party view
    Given a party contains four scvms
    And I open its party view at phone width
    When I resize the open view to desktop width
    Then Next scvm reveals the last member whenever it is outside the view
    When I resize the open view back to phone width
    Then I can page to every member and return to the first

  # Automation anchor: backend/tests/e2e/tests/authed/party.spec.ts
  Scenario Outline: Use each newly forged party scvm without reloading
    Given a GM's Party Class Pool allows <class>
    And I am signed in as a player with a scvm in that party
    When I forge two more scvms through the party invite using <class>
    Then each successful forge opens that new scvm's editable party sheet
    And I do not need to reload to use either new sheet
    And all three scvms remain in the party

    Examples:
      | class                  |
      | a Book Class           |
      | a private Custom Class |
