@ui @playwright
Feature: Equipment and inventory
  Equipment changes must keep the sheet, calculated stats, and persisted character state aligned.

  # Automation anchor: backend/tests/e2e/tests/authed/equipment.spec.ts
  Scenario: Player can equip and unequip a weapon
    Given I am signed in
    And I have a seeded character with carried weapons
    When I equip a weapon into the first weapon slot
    Then the slot shows the equipped weapon
    And the sheet reports that it is synced
    When I unequip the first weapon slot
    Then the slot is empty
    And the sheet reports that it is synced

  # Automation anchor: backend/tests/e2e/tests/authed/equipment.spec.ts
  Scenario: Player can equip and unequip armor
    Given I am signed in
    And I have a seeded character with carried armor
    When I equip armor
    Then the armor slot shows the equipped armor
    And armor-derived values are recalculated
    When I unequip armor
    Then the armor slot is empty
    And armor-derived values are recalculated again

  # Automation anchor: backend/tests/e2e/tests/authed/custom-item-header.spec.ts
  Scenario: Forged weapon with ammo can be equipped and spent
    Given I am signed in
    And I have a seeded character
    When I forge a custom weapon with arrow ammo
    Then the weapon appears in my inventory
    When I equip the forged weapon
    Then the weapon slot shows the weapon and its ammo count
    When I spend one ammo from the equipped weapon
    Then the ammo count decreases by one
    And the sheet reports that it is synced

  # Automation anchor: backend/tests/e2e/tests/utils/character-sheet.ts
  Scenario: Item use pips persist
    Given I am signed in
    And I have a seeded character with an item that has uses
    When I spend one use
    Then the item shows the spent use
    And a reload keeps the use spent


  # RPG-301: backend/tests/e2e/tests/authed/equipment.spec.ts
  Scenario: A stale inventory edit cannot erase an item saved in another tab
    Given I am signed in
    And I have a seeded character with two carried ropes
    And I have opened that character in two tabs
    When I add a hammer in the first tab and wait for it to save
    And I increase the rope quantity in the stale second tab
    Then the second tab explains that the character changed in another tab
    And a reload keeps the hammer and the last saved rope quantity

  # RPG-305: backend/tests/e2e/tests/authed/catalog-consumables.spec.ts
  Scenario: Torches added from the catalog have persistent use controls
    Given I am signed in
    And I have a seeded character
    When I add torches from equipment search
    And I spend one torch use in Consumables
    And I wait for the sheet to sync and reload the page
    Then the torches still show that use spent

