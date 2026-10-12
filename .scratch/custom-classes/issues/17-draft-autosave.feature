Feature: Class creator draft autosave
  GMs can safely pause a class forge and continue it on another device without
  accidentally publishing incomplete work or overwriting newer changes.

  Scenario: An interrupted new class is recovered
    Given I edit a new class
    When I pause for one second or leave the creator
    Then its invalid draft is saved locally and on the server
    And My classes offers Resume or Discard

  Scenario: A stale device cannot overwrite a newer draft
    Given the same draft changes on another device
    When I autosave my stale copy
    Then a conflict interrupts editing before either draft is overwritten
    And Load newer one warns that my edits here since the last save will be lost
    And Keep mine warns that the other device's newer draft will be overwritten
    When I choose Load newer one
    Then my stale edits are discarded and the newer draft is loaded

  Scenario: Draft limits and expiry are visible
    Given I have three new-class drafts
    When I try to create a fourth
    Then creation is blocked
    And drafts show their expiry status based on 90 days of inactivity

  Scenario: Explicit Save turns a draft into a class
    Given a valid draft exists
    When I explicitly save it
    Then the draft is removed only after the class save succeeds

  Scenario: An unfinished edit of a saved class is offered before editing
    Given a saved class has a draft last edited two days ago
    When I open that class for editing
    Then I can resume the draft or discard it and load the saved class

  Scenario: Unsynced local edits survive reopening
    Given I edit a draft while its server copy is older
    When I reopen the creator before those edits sync
    Then my local edits are restored
    And a change from another device still requires a conflict choice before server overwrite

  Scenario: Expired drafts cannot be revived
    Given a draft has had no edits for 90 days
    When I visit its Resume link or start another new-class draft
    Then the expired draft cannot be resumed
    And it does not count toward my three new-class drafts

  Scenario: Problems block saving without hiding why
    Given my class draft has three problems
    When I review it before saving
    Then the save action says Fix 3 things first and looks secondary
    And each problem offers a Fix jump to the field
    When I attempt to save
    Then no class is saved and the save status explains what blocks it
