# App-Wide Playwright QA Findings

Date: 2026-06-07
Target: `https://scvmrack.rpgtools.co/`
Method: production-safe Playwright probes guided by `qa-testing-playwright`, `playwright-cucumber-expert`, and `playwright-bdd`.

## Scope

This pass covered the user-facing app surface beyond security posture:

- Landing and first-run guest bootstrap
- Privacy/storage notice behavior
- FAQ and feedback dialog
- Release notes
- Guest characters list gate
- Character sheet editing
- Equipment search/add flow
- Print view
- Mobile drawer navigation
- Language switching

The full Cucumber/Playwright-BDD runner was not added to the repo in this pass. The requested skills were used to shape the probe matrix and BDD scenario backlog; concrete automation can be added later if these scenarios are approved.

## Findings

### P1 - Guest Character Is Created Before Storage Notice Acknowledgement

Evidence from a fresh browser context with no stored privacy settings:

- The page showed `DATA, TRACKING, AND STORAGE NOTICE`.
- Before any notice action, the app had already called `POST /api/characters/new?locale=en`.
- The browser URL became `/?character=ba00dad8-6c3b-4ba3-b899-c68fe1984000`.
- `localStorage` already contained `last-character-id` and `scvmrack-last-auth-kind-v1`.
- `localStorage` did not yet contain `scvmgrinder-privacy-settings-v1`.

Impact:

The notice says browser storage is required and explains backend character storage, but the first backend character creation and local storage writes happen before the user acknowledges the notice. If the notice is intended as informed acknowledgement, the order is backwards.

Suggested fix:

Gate guest pre-generation until after the notice has been acknowledged, or rewrite the notice to make clear that essential storage and guest character creation already occurred before acknowledgement. If pre-generation must stay immediate, avoid showing the acknowledgement as though it precedes storage.

**Resolution (2026-06-07):** Gated. Landing-page background pre-generation removed (`LandingPage.tsx`); `/character` auto-create now requires storage-notice acknowledgement (`useAutoCreateCharacter` + `usePrivacyAcknowledged`); an animated skeleton sheet (`CharacterSheetSkeleton`, min-display timegate via `useMinimumVisible`) renders until a character loads. No `POST /api/characters/new` fires before "Save Preferences".

### P2 - Polish Language Switch Does Not Translate Visible Copy

Evidence from `/faq`:

- Initial state: `html lang="en"`, `localStorage.i18nextLng = "en-GB"`, visible text in English.
- Clicking the Polish flag set `localStorage.i18nextLng = "pl"` and briefly set `html lang="pl"`.
- Visible FAQ/header text stayed English after waiting.
- After reload, `localStorage.i18nextLng` still remained `pl`, but `html lang` returned to `en` and visible text stayed English.

Likely source-level cause:

`frontend/src/i18n/index.ts` dynamically loads `pl.json`, but `changeLocale()` in `frontend/src/hooks/useCharacterActions.ts` calls `changeLanguage(newLocale)` without awaiting `loadLanguage(newLocale)` first. The app can switch language state before the Polish resource bundle is available, leaving fallback English rendered.

Impact:

The language control appears to accept Polish but does not translate the app, and reload state is internally inconsistent.

Suggested fix:

Ensure the target resource bundle is loaded before calling `i18n.changeLanguage`, or make the `languageChanged` handler refresh after the resource bundle is added. Add a browser test that clicks `Polski`, waits for a Polish FAQ/header label, reloads, and verifies the Polish state persists.

**Resolution (2026-06-07):** Multi-language scrapped for now. The app is English-only — `i18n` is locked to `lng: 'en'` and the language-switch flags are removed from the header. The i18n machinery, `Flag` component, and `pl.json` are intentionally kept as dead code for a future re-enable, so the broken switch is simply no longer reachable.

### P3 - FAQ Footer Uses Different Copyright Credit Than The Main Site

Evidence:

- Landing page footer: `MÖRK BORG is copyright Ockult Örtmästare Games and Stockholm Kartell`.
- FAQ footer: `MÖRK BORG is © Free League Publishing. This is an independent fan project.`
- Repo guidance says the independent-production credit should mention Ockult Örtmästare Games and Stockholm Kartell.

Impact:

The legal/product credit is inconsistent across public pages. This is not an app-breaker, but it is the kind of public-page QA issue that should be caught by static route smoke checks.

Suggested fix:

Make the FAQ footer use the same credit language and links as the landing page.

**Resolution (2026-06-07):** FAQ footer (`faq.morkBorgCredit`) now reads "MÖRK BORG is copyright Ockult Örtmästare Games and Stockholm Kartell. This is an independent fan project." matching the landing credit (en + pl + JSX fallback updated).

## Checks That Passed

### Privacy Notice Dismissal Enables Editing

Fresh contexts open the privacy/storage drawer. After clicking `Save Preferences`, the drawer disappears and sheet inputs become interactable.

### Character Notes Persist

After dismissing the notice:

- Editing `notes-input` triggered `PATCH /api/characters/{id}` with status `200`.
- The PATCH response included the new notes value.
- Reload showed the edited note.
- Cleanup `DELETE /api/characters/{id}` returned `204`.

### Print Includes Saved Notes

After saving a note:

- `/print` opened the active character's print view.
- `/print?character={id}` also opened the expected print view.
- The print output included `NOTES & MISERIES` and the saved note.

### FAQ Bug Report Path Opens The Feedback Dialog

On `/faq`, after expanding `I found a bug! How do I report it?`:

- `Open bug report` was visible.
- Clicking it opened a dialog titled `REPORT A BUG`.
- The message textbox with `feedback-message` was visible.

### Guest Characters List Gate Works

`/characters` as a guest showed the login-required warning and did not expose the account character list.

### Mobile Drawer Navigation Works After Notice Acknowledgement

On a 390px-wide mobile viewport:

- The privacy notice appeared first.
- After saving preferences, the `Open menu` button was visible.
- The drawer contained `START`, `SHEET`, `FAQ`, and `UPDATES`.
- Navigating to `FAQ` from the drawer worked.

### CSRF Token Binding Works

Using two fresh anonymous browser contexts:

- Session A's CSRF token used from session B returned `403 FST_CSRF_INVALID_TOKEN`.
- Session B's own CSRF token successfully created a character with `201`.
- Cleanup returned `204`.

### Equipment Search/Add Flow Reaches The Server

On a disposable guest character:

- `equipment-search-input` was visible.
- Searching `bomb` returned `200` from `/api/equipment/search`.
- Selecting `Bomb EQUIPMENT` triggered `PATCH /api/characters/{id}` with status `200`.
- Cleanup returned `204`.

The probe did not assert the exact rendered inventory label after reload because the visible option text includes a type suffix; make the automated test assert the item key/name from the PATCH response instead of comparing the raw option label.

## BDD Scenario Backlog

These are proposed scenarios, not yet committed to `.feature` files. They follow the installed BDD skills' guidance: business-readable steps, meaningful outcomes, minimal implementation detail.

```gherkin
@privacy @smoke
Scenario: First-run storage notice appears before guest character creation
  Given I have no stored privacy preferences
  When I open Scvm Rack
  Then the storage notice is shown before a guest character is created
  And no character id is stored before I acknowledge the notice
```

```gherkin
@i18n @regression
Scenario: Polish language selection translates and persists
  Given I am viewing the FAQ in English
  When I switch the language to Polish
  Then the FAQ text is shown in Polish
  When I reload the page
  Then the FAQ text remains in Polish
```

```gherkin
@content @smoke
Scenario: Public pages use consistent MORK BORG attribution
  Given I visit each public information page
  Then each page shows the approved independent-production attribution
```

```gherkin
@character @smoke
Scenario: A guest note is saved and printed
  Given I have accepted the storage notice
  And I have a guest character
  When I write a note on the sheet
  Then the note remains after reload
  And the printable sheet includes the note
```

```gherkin
@feedback @smoke
Scenario: FAQ bug report opens the feedback form
  Given I am viewing the FAQ
  When I open the bug-report FAQ item
  And I choose to open a bug report
  Then the feedback dialog is ready for my report
```

```gherkin
@mobile @smoke
Scenario: Mobile navigation remains usable after privacy acknowledgement
  Given I am on a mobile viewport
  And I have accepted the storage notice
  When I open the navigation menu
  Then I can navigate to the FAQ page
```

