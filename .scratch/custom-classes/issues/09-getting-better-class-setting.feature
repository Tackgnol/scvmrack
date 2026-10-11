Feature: Improve with the latest Custom Class rules
  A scvm keeps its existing class version, while future Getting Better rolls use the current rules for that class lineage.

  Scenario: Getting Better follows a newer Custom Class version
    Given a scvm uses version 1 of a Custom Class
    And version 2 changes its Getting Better rule, note, and random abilities
    When the player opens Getting Better
    Then the preview shows version 2's rule and note
    And any rolled class ability comes from version 2's random ability pool
    And abilities the scvm already holds are matched by their stable keys