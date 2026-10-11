Feature: GM overview behind the glass
  Signed-out visitors can understand the Game Master tools and return from Logto to begin using them.

  Scenario: A signed-out visitor opens the GM tab
    Given I am not signed in
    When I open the GM tab
    Then I see the locked Party control dashboard and its Game Master overview
    And the sign-up and log-in actions return to the GM tab after Logto

  Scenario: A guest opens the GM tab
    Given I have a guest scvm
    When I open the GM tab
    Then I see the Game Master overview
    And I am told that my guest scvm comes with me

  Scenario: A signed-in game master opens the GM tab
    Given I am signed in
    When I open the GM tab
    Then I can use the Party control dashboard
