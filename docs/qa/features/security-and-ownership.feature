@api @ui @playwright
Feature: Security and ownership
  Sessions, CSRF, and ownership checks must protect every state-changing or private character flow.

  # Automation anchor: backend/tests/integration-be/src/api.integration.test.ts
  Scenario: State-changing API routes reject missing CSRF token
    Given I have an anonymous session
    When I create a character without a CSRF token
    Then the API rejects the request with status 403
    When I create a character with a valid CSRF token
    Then the API creates the character

  # Automation anchor: backend/tests/integration-be/src/api.integration.test.ts
  Scenario: Characters are only readable by their owner
    Given owner A has a character
    And owner B has a different session
    When owner B requests owner A's character
    Then the API rejects the request with status 403
    And the error code is CHARACTER_ACCESS_DENIED

  # Automation anchor: backend/tests/integration-be/src/api.integration.test.ts
  Scenario: Characters are only editable by their owner
    Given owner A has a character
    And owner B has a different session
    When owner B patches owner A's character
    Then the API rejects the request with status 403
    And the error code is CHARACTER_ACCESS_DENIED

  # Automation anchor: backend/tests/integration-be/src/api.integration.test.ts
  Scenario: Characters are only deletable by their owner
    Given owner A has a character
    And owner B has a different session
    When owner B deletes owner A's character
    Then the API rejects the request with status 403
    And the error code is CHARACTER_ACCESS_DENIED

  # Automation anchor: backend/tests/e2e/tests/authed/error-paths.spec.ts
  Scenario: Unexpected editor failure can be reported
    Given I am signed in
    And I have a seeded character
    When an unexpected save failure is shown
    And I submit a feedback report
    Then the app confirms that the report was sent

  # Automation anchor: docs/qa/security-production-notes.md
  Scenario: OAuth login does not accept an untrusted callback URL
    Given I start the Logto login flow from Scvm Rack
    When the login request includes an external callback URL
    Then the auth layer rejects the callback URL
    And the browser is not redirected to the external URL

  # Automation anchor: docs/qa/security-production-notes.md
  Scenario: Profile link uses the same authenticated account origin
    Given I am signed in with a real account
    When I open the profile link from Scvm Rack
    Then the account center recognizes my active account session
    And I am not asked to sign in again on another auth origin

  # Automation anchor: docs/qa/security-production-notes.md
  Scenario: Signing out clears the real account session
    Given I am signed in with a real account
    When I sign out from Scvm Rack
    Then the app session becomes empty
    And the session cookie is not readable from JavaScript
