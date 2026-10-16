Feature: Equipping armor without phantom inventory

  # RPG-303: backend/tests/e2e/tests/authed/equipment.spec.ts
  Scenario: Equipping armor into an empty slot does not create a phantom item
    Given I am signed in
    And I have a seeded character with carried armor and an empty armor slot
    When I equip armor and wait for the sheet to sync
    And I reload the page
    Then the armor slot shows the equipped armor
    And my carried inventory contains only the remaining real items
    And encumbrance counts only the remaining real items
