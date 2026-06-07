@ui @content @playwright
Feature: Public app surfaces
  Public pages and navigation must stay coherent for first-time and returning players.

  # Automation anchor: docs/qa/app-wide-playwright-findings.md
  Scenario: FAQ bug report opens the feedback form
    Given I am viewing the FAQ
    When I open the bug-report FAQ item
    And I choose to open a bug report
    Then the feedback dialog is ready for my report

  # Automation anchor: docs/qa/app-wide-playwright-findings.md
  Scenario: Polish language selection translates and persists
    Given I am viewing the FAQ in English
    When I switch the language to Polish
    Then the FAQ text is shown in Polish
    When I reload the page
    Then the FAQ text remains in Polish

  # Automation anchor: docs/qa/app-wide-playwright-findings.md
  Scenario: Public pages use consistent MORK BORG attribution
    Given I visit each public information page
    Then each page shows the approved independent-production attribution

  # Automation anchor: docs/qa/app-wide-playwright-findings.md
  Scenario: Mobile navigation remains usable after privacy acknowledgement
    Given I am on a mobile viewport
    And I have accepted the storage notice
    When I open the navigation menu
    Then I can navigate to the FAQ page
