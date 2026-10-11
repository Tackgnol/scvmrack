Feature: User-based Custom Class creation bans
  Moderators can stop one GM from starting new Custom Classes without banning their account.

  Scenario: Ban a GM from creating new Custom Classes
    Given a GM owns a Custom Class and has an unfinished new-class draft
    When a moderation administrator bans that GM by user ID with a reason
    Then the GM cannot start another new-class draft
    And the backend rejects saving a new Custom Class, including from the unfinished draft, on every device
    And the creator explains the creation restriction to the GM
    But the GM can still edit and publish the Custom Class they already own
    And their characters and unrelated account access remain available

  Scenario: Lift a creation ban
    Given a GM is banned from creating Custom Classes
    When a moderation administrator lifts the ban with a reason
    Then the GM can start and save new Custom Classes again

  Scenario: Review and protect ban decisions
    Given a GM has been banned and later unbanned
    When a moderation administrator reviews that GM's history
    Then the administrator sees both actions, their dates, actors, and reasons
    And people outside the moderation allowlist cannot view or change the ban history
