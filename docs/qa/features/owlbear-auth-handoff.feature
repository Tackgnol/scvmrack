@ui @playwright @owlbear @security
Feature: Approve an Owlbear account handoff
  Players choose which account to bring into the extension and can stop an unfinished sign-in.

  Scenario: Approve sign-in and continue with the same scvm
    Given a guest has an owned scvm open in the extension
    When they start sign-in and authenticate with Logto
    Then the approval page shows the account and destination
    And only the initiating extension shows the comparison code
    When they approve the handoff with the matching code
    Then the extension confirms the receiving account before offering account controls
    And their guest scvm remains owned and editable after reopening

  Scenario: Opening a crafted handoff link does not transfer an account
    Given a player is signed in to Scvmrack
    When they open a handoff link registered by someone else
    Then their account is not transferred without explicit approval
    And an unregistered or expired handoff cannot be approved

  Scenario: Only the initiating extension can collect an approved handoff
    Given a player has explicitly approved a registered handoff
    When a different browser tries to collect it without the initiating secret
    Then that browser receives no account session
    When the initiating extension completes the handoff
    Then it confirms the approved account and can manage that account's scvms

  Scenario Outline: Recover from an unfinished sign-in
    Given a guest has an owned scvm open in the extension
    When they start sign-in and <interruption>
    Then the extension does not claim they are signed in
    And the unfinished handoff cannot later create an account session
    When they start a new sign-in and approve it
    Then the extension confirms their account and keeps their scvm

    Examples:
      | interruption                     |
      | cancel the handoff                |
      | let the handoff expire            |
      | close the popup without approval  |

  Scenario: Redeem an approved handoff only once
    Given a player has explicitly approved a registered handoff
    When two requests try to redeem it at the same time
    Then only one receiving session is created
    And replaying the handoff cannot create another session

  Scenario: Refresh room permissions when the account changes
    Given the extension shows room controls for one signed-in account
    When the player signs out and approves sign-in with a different account
    Then the roster and room controls reflect the new account's permissions
    And unsaved character edits are not overwritten by a room refresh

  Scenario: Open the full sheet without exposing a reusable account transfer
    Given a signed-in player has their owned scvm open in the extension
    When they open the full Scvmrack sheet
    Then the sheet opens the same scvm under the intended account
    And another browser cannot reuse that opening link to acquire the account
