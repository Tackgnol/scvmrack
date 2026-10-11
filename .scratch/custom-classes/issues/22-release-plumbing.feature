Feature: 0.7.0 Custom Classes release
  The release only describes functionality that has actually shipped and makes the new class tools understandable to players and GMs.

  Scenario: A visitor reads the 0.7.0 release notes
    Given Custom Classes, party pools, moderation, and the legal pages have shipped
    When I open the Updates page
    Then I see a 0.7.0 entry in English or Polish that explains Custom Classes, party pools, sharing, and the legal pages
    And the repository release index and both application package versions identify 0.7.0

  Scenario: A GM learns the Custom Classes rules from the FAQ
    Given I am viewing the FAQ in English or Polish
    When I read the Custom Classes questions
    Then I can learn who may create a class, where classes can be used, how versions behave, and how to contact the zine curator
    And I can learn how public classes and reports work once public sharing is available