@production @smoke @manual
Feature: Production release smoke
  A release is safe enough to keep online only after low-impact production checks pass.

  # Automation anchor: docs/qa/prod-release-gate.md
  Scenario: Public API smoke passes after deploy
    Given production has just been deployed
    When I run the public API smoke checks
    Then health returns ok
    And public aggregate endpoints expose no private character data
    And validation errors keep the stable error envelope
    And untrusted OAuth callback URLs are rejected

  # Automation anchor: docs/qa/prod-release-gate.md
  Scenario: Public browser smoke passes after deploy
    Given production has just been deployed
    When I open the public app pages
    Then the pages render without unexpected API server errors
    And the accepted privacy notice behavior is visible
    And navigation works on desktop and mobile

  # Automation anchor: docs/qa/prod-release-gate.md
  @mutating
  Scenario: Optional disposable character API smoke cleans up after itself
    Given mutating production smoke has been explicitly allowed
    When I create a disposable anonymous character
    And I save a unique note
    And I fetch the character and verify the note
    And I delete the disposable character
    Then the deleted character is no longer accessible
