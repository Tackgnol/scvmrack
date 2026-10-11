Feature: Render Custom Classes everywhere they are played
  Players see the class rules and attribution that belong to their scvm, while public readers see the latest version.

  Scenario: A sheet attributes a Custom Class and explains its authored language
    Given a scvm uses a Custom Class written only in English
    When a Polish-speaking player views that scvm's sheet
    Then the sheet shows the English class text as a fallback
    And it says that the class is written in English
    And it shows "created by <GM>" beneath the class name

  Scenario: Party cards keep attribution in the class tooltip
    Given a party member uses a Custom Class
    When I open that member's class tooltip
    Then I see the class attribution there
    And the compact party card does not add attribution text

  Scenario: Print preserves the full class rules
    Given a scvm has a Custom Class with long ability text and a reference table
    When I print the character sheet
    Then the class attribution appears under the class name
    And the full ability text and table flow onto subsequent pages without truncation

  Scenario: A permitted reader sees the latest public class detail
    Given version 3 is the latest public version of a Custom Class
    When I open its read-only class page
    Then I see version 3's attribution, origins, abilities, items, and Getting Better rule
    And I cannot edit the class from that page