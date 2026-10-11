Feature: GM removal history in moderation
  Moderators can review an author's prior class removals and reasons when deciding a new report.

  Scenario: Review repeated removals for a reported GM
    Given a GM's class was taken down, restored, and taken down again
    When an administrator reviews a new report about that GM's class
    Then the report shows two prior removal decisions
    And the administrator can inspect each decision's class, date, reason, and restoration outcome
    And people outside the moderation allowlist cannot see that history
