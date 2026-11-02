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

  Scenario: Reloading GM controls preserves the party's existing Miseries
    Given I am signed in as a Game Master with a party
    And every scvm in the party has four of seven Miseries
    When I reload the party management page
    Then the party Misery control shows four of seven Miseries
    When I apply the displayed Misery count without changing it
    Then every scvm still has four of seven Miseries after a reload

  Scenario: Mixed member Miseries require an explicit party choice
    Given I am signed in as a Game Master with a party
    And the party's scvms have different Misery counts
    When I open the party management page
    Then I must choose a Misery count before applying it to everyone
    And the control shows mixed counts instead of a party count of zero
    When I choose three of seven Miseries and apply it
    Then every scvm has three of seven Miseries after a reload
