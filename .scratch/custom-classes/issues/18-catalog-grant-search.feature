Feature: Search for ability grants in the class creator
  A GM can find shared catalog gear and this class's own items without seeing another class's private gear.

  Scenario: A fuzzy catalog match can be granted with the keyboard
    Given I am editing an ability in the class creator
    And the shared catalog contains the Brown Scimitar
    When I search for it with a misspelled name in the item grant field
    Then the Brown Scimitar remains a selectable result
    When I move to it with ArrowDown and press Enter
    Then the ability grants the Brown Scimitar
    And one Undo removes that grant

  Scenario: This class's items stay first and in the right grant slot
    Given my class has a weapon and a pet, and another class has its own item
    When I search in the ability's item and pet grant fields
    Then matching items from my class appear first under "This class" in their matching slot
    And matching shared catalog items follow
    And the other class's item does not appear
    And Escape closes the results without changing the grant
