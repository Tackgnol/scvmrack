Feature: Keep the ability order already saved on a scvm
  Class ability positions govern new rolls, but must not rearrange abilities on existing character sheets.

  Scenario: An existing scvm keeps its saved ability order
    Given an existing Wretched Royalty scvm has two random abilities saved in reverse class order
    When the player opens or prints that scvm's sheet
    Then those abilities appear in their saved order

  Scenario: A new scvm follows the current class order
    Given a class has ordered fixed and random abilities
    When the player rolls a new scvm from that class
    Then its abilities appear in class order on the sheet and print page
    And the random abilities are still selected evenly
