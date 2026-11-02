@ui @api @playwright
Feature: Reliable class and character workflows
  Players and GMs can save, revisit and manage their content without misleading controls or recovery paths.

  @RPG-358 @RPG-371
  Scenario Outline: Save and use an ability's catalog grant
    Given I am a signed-in GM creating a Custom Class
    When I add an ability with a <grant> from the shared catalog
    Then its Name and Rules text fields are marked required
    When I complete the required fields and save the class
    And I forge a scvm from that class
    Then the scvm receives the selected <grant>

    Examples:
      | grant |
      | item  |
      | pet   |

  @RPG-359 @RPG-372 @RPG-373
  Scenario: An author can revisit an archived class with clear content details
    Given I authored an English-only private class with no abilities
    And a scvm already plays that class
    When I archive the class and open its details
    Then I can still read its saved rules
    And the details identify English as the content language
    And the empty Abilities section is omitted
    And an unrelated visitor cannot read the private class

  @RPG-361
  Scenario: First save leaves the creator on the saved class
    Given I am a signed-in GM creating a valid Custom Class
    When I save the class for the first time
    Then the address identifies the saved class
    And reloading shows that saved class instead of a blank creator

  @RPG-362
  Scenario: Discard leaves the deleted draft behind
    Given I have resumed an unfinished Custom Class draft
    When I discard it and confirm
    Then I reach My classes or a fresh creator
    And reloading does not attempt to open the deleted draft

  @RPG-360
  Scenario: A GM reads another player's party sheet without failed edit attempts
    Given I am the GM of a party containing another player's scvm
    When I open that member's party sheet
    Then its editing controls are hidden or disabled
    And inspecting it sends no character edits
    And the character's owner can still edit their own sheet

  @RPG-363
  Scenario: Party view follows the scvm currently on screen
    Given I own scvms belonging to two different parties
    When I open each scvm's sheet and its header party view
    Then the view shows that scvm's party members
    And it does not select a different party from the account's roster order

  @RPG-364
  Scenario Outline: Review analytics choices from a public page
    Given I have acknowledged the privacy notice
    When I open <page> and review my privacy settings
    And I turn analytics off and save
    Then analytics stays off after a reload
    And reviewing the settings does not create a session or character

    Examples:
      | page    |
      | Start   |
      | FAQ     |
      | Privacy |

  @RPG-365
  Scenario Outline: A malformed character link has ordinary not-found recovery
    Given I am <visitor>
    When I open a character link containing a non-UUID id
    Then the normal not-found page is shown
    And I am not told that a nonexistent session expired
    And the header shows no sheet save status, validation chip or Print action

    Examples:
      | visitor   |
      | signed out |
      | signed in  |

  @RPG-365
  Scenario: A missing character offers the roster without pretending to be synced
    Given I am signed in and still own another scvm
    When I open a missing character's UUID link
    Then I can return to my roster from the recovery screen
    And the header shows no sheet save status, validation chip or Print action
    When I open my surviving scvm from the roster
    Then its saved data is unchanged

  @RPG-366
  Scenario Outline: An unreportable class is rejected before report submission
    Given I open the report form with a <reference> class reference
    Then the form explains that this class cannot be reported
    And I cannot submit a doomed report

    Examples:
      | reference |
      | private   |
      | unknown   |
      | malformed |

  @RPG-374
  Scenario: Pool reporting is offered for another author's public class
    Given my party pool contains my own public class and another author's public class
    When I inspect both rows
    Then only the other author's row offers Report a class
    When I follow that Report link
    Then the report form identifies the selected public class

  @RPG-367
  Scenario: Classless scvms are recognizable in the roster
    Given I have forged a Classless scvm
    When I open my roster in either language
    Then its Class column says Classless in that language

  @RPG-368
  Scenario: An ability input shows the bounded score that will be saved
    Given I am editing my scvm's Strength
    And no score-limit message is visible before I edit
    When I enter a score above 21
    Then the input immediately shows 21
    And a message in my selected language explains the score limit
    And its modifier and saved value agree
    And a reload still shows 21

  @RPG-369
  Scenario: Party creation and rename share the same name limit
    Given I am a signed-in GM
    When I create and then rename a party with a 100-character name
    Then both names save successfully
    And both forms and API writes reject names longer than 100 characters
    And each form explains the name limit without silently shortening my input

  @RPG-370
  Scenario Outline: Moderation controls stay hidden from non-admin visitors
    Given I am <visitor> without moderation access
    When I open the moderation page
    Then the normal not-found page is shown without the moderation shell
    And the backend still rejects moderation operations

    Examples:
      | visitor   |
      | signed out |
      | signed in  |

  @RPG-365
  Scenario Outline: Guests can leave an unavailable character link without a false expiry message
    Given I am a <visitor>
    When I open an unavailable character's UUID link
    Then I can return to Start from the recovery screen
    And a visitor without a session is told to sign in instead of being told their session expired
    And taking the recovery link does not create or delete a scvm

    Examples:
      | visitor                   |
      | guest with a session      |
      | visitor without a session |

  @RPG-368
  Scenario Outline: Forged ability scores stay within the approved range
    Given a Custom Class's Strength dice would produce <rawScore>
    When I preview and forge a scvm from that class
    Then both preview and saved Strength are <boundedScore>
    And the ability modifier matches that saved score

    Examples:
      | rawScore | boundedScore |
      | -4       | 1            |
      | 78       | 21           |
