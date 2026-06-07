@ui @playwright
Feature: Character sheet
  The sheet must let a player create, edit, persist, and retire a scvm without losing work.

  # Automation anchor: backend/tests/e2e/tests/guest/home.spec.ts
  Scenario: Guest opens the sheet and receives a playable character
    Given I have no saved app session
    When I open the character sheet
    Then the app creates or loads a character for me
    And the sheet shows the generate-new control

  # Automation anchor: docs/qa/app-wide-playwright-findings.md
  Scenario: First-run storage notice appears before guest character creation
    Given I have no stored privacy preferences
    When I open Scvm Rack
    Then the storage notice is shown before a guest character is created
    And no character id is stored before I acknowledge the notice

  # Automation anchor: docs/qa/app-wide-playwright-findings.md
  Scenario: Guest note is saved and included in print view
    Given I have accepted the storage notice
    And I have a guest character
    When I write a note on the sheet
    Then the note remains after reload
    And the printable sheet includes the note

  # Automation anchor: backend/tests/e2e/tests/authed/persistence.spec.ts
  Scenario: Edited fields survive a reload
    Given I am signed in
    And I have a seeded character
    When I change hit points, silver, traits, habit, notes, and a quick modifier
    And the sheet reports that it is synced
    And I reload the page
    Then the edited hit points are still shown
    And the edited silver is still shown
    And the edited traits and habit are still shown
    And the edited notes are still shown
    And the quick modifier is still shown

  # Automation anchor: backend/tests/e2e/tests/authed/resources.spec.ts
  Scenario: Resource edits are saved through the optimistic editor
    Given I am signed in
    And I have a seeded character
    When I update hit points and silver
    Then the sheet reports that it is synced
    And a reload shows the new hit points and silver

  # Automation anchor: backend/tests/e2e/tests/authed/descriptors.spec.ts
  Scenario: Character descriptors are editable
    Given I am signed in
    And I have a seeded character
    When I update traits, habit, and body description
    Then the sheet reports that it is synced
    And a reload shows the new descriptors

  # Automation anchor: backend/tests/e2e/tests/authed/abilities.spec.ts
  Scenario: Ability comments are editable
    Given I am signed in
    And I have a seeded character with at least one ability
    When I add a comment to the first ability
    Then the sheet reports that it is synced
    And a reload shows the ability comment

  # Automation anchor: backend/tests/e2e/tests/authed/kill-replace.spec.ts
  Scenario: Player can cancel and confirm killing a character
    Given I am signed in
    And I have a seeded character
    When I choose to kill the scvm
    Then the app asks for confirmation
    When I cancel the confirmation
    Then the original character remains open
    When I confirm the kill
    Then the original character is removed from my list
    And a replacement character is created for me
