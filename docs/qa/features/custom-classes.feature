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

  # Automation anchor: frontend/test/browser/pages/ClassManagementNavigation.test.tsx
  Scenario: My classes immediately exposes saved drafts and the latest class version
    Given I am a signed-in GM and have opened My classes
    When I forge a named custom class and wait for its draft to save
    And I return to My classes through normal navigation
    Then I can Resume that draft without reloading
    When I save the class and then save an edited version
    And I return to My classes through normal navigation
    Then Edit opens the latest saved version without reloading
    And a scvm already playing the earlier version keeps its original rules

  # Automation anchor: frontend/test/browser/pages/ClassManagementNavigation.test.tsx
  Scenario: Discover a draft whose navigation flush finishes after My classes loads
    Given I am a signed-in GM and have opened My classes
    When I edit a custom class draft and return before its idle autosave
    And the navigation save finishes after My classes has loaded
    Then My classes shows the saved draft without reloading
    And Resume opens its latest saved content
