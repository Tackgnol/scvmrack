@ui @playwright
Feature: Deleted character recovery
  A stale sheet explains a deleted character and lets the player recover without changing surviving characters.

  # RPG-307: backend/tests/e2e/tests/authed/characters-list.spec.ts
  Scenario: A deleted character cannot falsely report a rejected edit as saved
    Given I have a character open and another owned character remains available
    When I delete the open character in another tab
    And I edit its stale sheet
    Then the sheet explains that the character no longer exists
    And it hides the rejected edit instead of reporting Synced
    When I choose missing-character recovery
    Then my surviving character opens with its saved data unchanged
