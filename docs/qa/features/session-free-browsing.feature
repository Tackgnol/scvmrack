@ui @auth @playwright
Feature: Session-free public browsing
  Visitors can explore Scvm Rack before starting a character.
  Returning players retain access to their existing scvm.

  Scenario: Explore public content without becoming a guest
    Given I have no session
    When I browse the landing page, FAQ, GM preview and a public class
    And I acknowledge the storage notice
    Then the public content remains usable
    And no guest session, private character list, character or draft is created

  Scenario: Start a character after browsing
    Given I have no session
    And I have acknowledged the storage notice
    When I choose to roll a character or start a draft
    Then a guest session starts before the character action
    And the resulting character belongs to that guest

  Scenario: Recover an existing character
    Given I have an existing guest or account session
    When I open my character sheet
    Then I can continue using my existing character
    And no replacement guest session is created

  Scenario: Open a private link without a session
    Given I have no session
    When I open a private character link
    Then I see the existing access or recovery flow
    And no replacement guest owner is created

  Scenario: Keep actionable crawler failures visible
    Given an outgoing event identifies a known crawler by User-Agent
    When an explicitly classified expected session outcome is reported
    Then that session noise is suppressed
    But public rendering, chunk-loading and server failures remain reportable
    And ambiguous session failures remain reportable
