Feature: Preserve Owlbear room party pools
  Owlbear rooms retain their Party Class Pool whether a GM claims or attaches a warband.

  Scenario: Claim a system-owned room party
    Given an Owlbear room has an unclaimed system party with a configured Party Class Pool
    When its signed-in GM claims the room party
    Then the GM can manage that same party
    And its existing Party Class Pool is unchanged

  Scenario: Attach a warband to a room with an empty system party
    Given an Owlbear room has an empty system party
    And a signed-in GM owns another warband
    When the GM attaches that warband to the room
    Then the system party is replaced by the GM's warband
    And the warband keeps its Party Class Pool

  Scenario: Protect a populated system party from replacement
    Given an Owlbear room has a system party with members
    When a signed-in GM tries to attach another warband
    Then the app explains that the GM must claim the existing room party