@ui @playwright
Feature: Custom classes
  GMs can forge and resume classes, and players can read the class their scvm plays.

  Scenario: Class links load saved content without a hard reload
    Given I have a saved custom class draft and a saved custom class
    And a party member plays that custom class
    When I open Resume and Edit from My classes, returning to the list between visits
    Then each creator shows the selected saved identity, rules and items
    When the player opens the class link from their sheet
    Then the selected class details are shown
    And these links also show the same content after a reload
