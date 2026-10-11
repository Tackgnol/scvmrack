Feature: Terms and legal contact pages
  Visitors can find the service rules and the operator's contact points in either supported language.

  Scenario: A visitor opens the English terms from the footer
    Given I am viewing the site in English
    When I open Terms from the footer
    Then I see the service rules, content licence, moderation and appeal process, and class limits
    And I see when the terms were last updated

  Scenario: A Polish visitor reads the regulation and contact details
    Given I am viewing the site in Polish
    When I open Terms and Contact from the footer
    Then the terms are available in Polish as the service regulation
    And the legal page names contact@rpgtools.co for users and authorities
    And the legal page names scvmrack-appeal@rpgtools.co for disputes
    And the legal page carries the MÖRK BORG Third Party License credit

  Scenario: A signed-out visitor can reach and index the legal pages
    Given I am not signed in
    When I open Terms, Contact, Privacy and Report from the footer
    Then each page works without signing in and allows search indexing
    And Terms has stable publishing, reporting, moderation and disputes section links

  Scenario: Publishing, reporting and takedown notices link to the relevant terms
    Given a GM can publish a Custom Class and a visitor can report a public class
    When they review the publish confirmation, report form and statement of reasons email
    Then each links to the relevant section of Terms

  Scenario: A significant terms change reaches affected GMs before taking effect
    Given the terms have a new effective date at least 14 days away
    And I am a signed-in GM with a public Custom Class
    When I next visit the site
    Then I see a banner with the change date and a summary of what changed
    And I receive the change notice by email
    And dismissing the banner hides it until the terms date changes again

  Scenario: A privacy update preserves the visitor's analytics choice
    Given I have chosen whether to allow analytics in the consent drawer
    When I open Privacy from that drawer or the footer
    Then I see the privacy notice and its last-updated date without changing my analytics choice
    And a significant privacy change is announced once to me when I am signed in

  Scenario Outline: A first visit does not contact Google for fonts
    Given I have not opted into analytics
    When I open <entry>
    Then the existing Scvm Rack typefaces load from Scvm Rack
    And my browser makes no request to Google Fonts

    Examples:
      | entry                 |
      | the Privacy page      |
      | the Owlbear extension |
