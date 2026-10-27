@ui @playwright @monitoring
Feature: Report client errors across page navigation

  Reportable errors can reach the protected monitoring tunnel when a visitor leaves a page.
  Monitoring does not create a guest account or weaken request protection.

  Scenario: Send the first error report while leaving a public page
    Given a public page has finished loading with monitoring enabled and no account session
    When a reportable error occurs and the visitor leaves the page
    Then the monitoring tunnel accepts the error envelope with valid request protection
    And reporting does not start a failing CSRF fetch during page departure
    And no guest account is created

  Scenario: Recover from a rotated CSRF token during active browsing
    Given monitoring has prepared its request protection on an active page
    When the CSRF token rotates before the next reportable error
    Then reporting refreshes protection and retries the rejected envelope once
    And the monitoring service accepts that error only once
    And requests without valid CSRF protection remain rejected
