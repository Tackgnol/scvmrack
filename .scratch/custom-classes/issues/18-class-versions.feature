Feature: Custom Class versions and archive
  Game Masters can safely evolve a Custom Class without changing the rules of characters that already use it.

  Scenario: Saving an unplayed class updates its only version
    Given I own an unplayed Custom Class at version 1
    When I change it and explicitly save
    Then it remains version 1 with my changes

  Scenario: Saving a used class creates the next version
    Given 3 scvm play version 3 of my Custom Class
    When I edit the class
    Then I am told that saving will create version 4 and keep the 3 scvm on version 3
    When I explicitly save my changes
    Then new rolls use version 4
    And the existing 3 scvm still use version 3

  Scenario: Removing a used class archives its lineage
    Given a scvm plays my Custom Class
    When I remove the class
    Then the class is archived and leaves every pool and picker
    And the existing scvm keeps its class version
    When I restore the class
    Then its latest version can be used for new rolls again

  Scenario: An old class version is visible on an existing character
    Given a scvm plays an older version of a Custom Class
    When I view the party member
    Then I see an "Older rules" indicator for that scvm
  Scenario: A former GM's non-public classes are archived
    Given a GM owns a non-public Custom Class that existing scvm use
    When the GM account is deleted
    Then the class owner becomes a former GM and the lineage is archived
    And existing scvm keep their class version

  Scenario: A former GM's public classes remain visible
    Given a GM owns a public Custom Class
    When the GM account is deleted
    Then the class remains public in the system
    And it is not archived automatically
    And it credits its creator as a former GM

  Scenario: A GM asks for a public class to be hidden
    Given I own a public Custom Class
    When I report it with the reason "I no longer want this shown"
    Then the report is submitted for moderation
