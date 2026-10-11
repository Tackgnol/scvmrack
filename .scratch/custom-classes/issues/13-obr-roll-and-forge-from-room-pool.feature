Feature: Roll from an Owlbear room party pool
  Players choose from the room party's allowed classes and a completed roll joins and binds them in one operation.

  Scenario: Choose a room-pool class
    Given an Owlbear room has a Party Class Pool
    When a player opens Roll a scvm
    Then the picker shows Random first and then that room's allowed classes
    When the player confirms a choice
    Then one operation creates, joins, and binds the scvm

  Scenario: Stop a roll when the room party is full
    Given an Owlbear room party is full
    When a player confirms a roll
    Then no scvm is created
    And the player is told to ask the GM to make room

  Scenario: Roll in a room without a party
    Given an Owlbear room has no party
    When a player rolls a scvm
    Then only Book Classes are used
    And the scvm is bound without joining a party

  Scenario: Replace a guest scvm in the room party
    Given a guest's current scvm belongs to the room party
    When the guest confirms a replacement roll
    Then the old scvm leaves and the new scvm joins atomically