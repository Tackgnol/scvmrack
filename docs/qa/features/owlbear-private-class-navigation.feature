@ui @playwright @owlbear
Feature: Private class rules from Owlbear
  A player can read the private class their GM enabled for the party.

  Scenario: Open private class rules from an embedded party character
    Given a guest has rolled a private Custom Class enabled in their room party
    When the guest opens that class's rules from the embedded sheet
    Then the full class page opens with that guest's existing party access
    And the guest can read the class without publishing it
    And a visitor outside that party still cannot read the private class
