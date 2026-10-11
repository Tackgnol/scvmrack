Feature: Public Custom Classes and moderation
  Public class sharing is available only with a signed-in creator acknowledgement and a human-review reporting path.

  Scenario: An owner publishes a valid Custom Class
    Given I own a saved, valid Custom Class
    When I acknowledge that I made it or may share it and publish the class
    Then the latest class version is publicly readable and credited to me
    And another GM can add it to a Party Class Pool
    And I can unpublish it without changing characters already rolled from it

  Scenario: A signed-out rightsholder reports a public class
    Given a public Custom Class is visible
    When I submit a report without signing in with a reason, explanation, class reference, contact details, and a good-faith statement
    Then the report is recorded for human review
    And the reporting flow explains how to challenge its outcome

  Scenario: An administrator takes down a reported class
    Given an administrator is reviewing an open report
    When the administrator takes down the class with a statement of reasons
    Then the class is unavailable in public search and every Party Class Pool
    And the author can see the decision and appeal it
    And characters already rolled from the class retain their existing content

  Scenario: An administrator reviews reports by class version
    Given an administrator has open reports for two versions of the same Custom Class
    When the administrator opens the moderation queue
    Then the reports are grouped under that class
    And the latest version is previewed with links to its older versions
  Scenario: A visitor can report a public class wherever it appears
    Given a public class appears in a class search result, on its detail page, or on a character sheet
    When I choose Report a class
    Then the report form is prefilled with that class
    And I can submit the report without signing in

  Scenario: A non-administrator cannot access moderation decisions
    Given I am not an allowlisted moderation administrator
    When I request the moderation queue or try to decide a report
    Then both requests return Not found

  Scenario: An administrator restores a taken-down class
    Given an administrator previously took down a public Custom Class
    When the administrator restores it with a reason
    Then the class is publicly readable again
    And the decision no longer offers Restore
    And the moderation log keeps both actions and reasons
