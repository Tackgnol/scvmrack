# QA Specs

This folder is the first product-facing QA layer above the existing unit, browser, integration, and Playwright e2e suites.

## Current Choice

- API workflow specs live in `arazzo/arazzo.yaml`.
- Product behavior specs live as Gherkin `.feature` files in `features/`.
- Automation should keep using Playwright Test first. The repo already has fixtures for guest, authenticated, CSRF, and seeded-character flows, and Playwright runs TypeScript directly.
- Add Cucumber.js or `playwright-bdd` later only if the team wants `.feature` files to be the executable source of truth. Until then, Gherkin is a reviewable acceptance layer mapped to Playwright specs.

## Why This Shape

- Arazzo is a better fit for API choreography than isolated OpenAPI endpoint examples. It describes call order, data dependencies, and success criteria.
- Gherkin is useful when scenarios need to be readable by product, QA, and engineering. It should stay focused on observable behavior, not selectors or implementation details.
- Playwright remains the practical automation runner for browser flows because the codebase already has working fixtures and reports.

## Source References

- Arazzo Specification v1.1.0: https://spec.openapis.org/arazzo/latest.html
- Cucumber/Gherkin docs: https://cucumber.io/docs/
- Playwright TypeScript docs: https://playwright.dev/docs/test-typescript

## Coverage Map

| Spec | Covers | Current automation anchor |
|---|---|---|
| `arazzo/arazzo.yaml#anonymousCharacterLifecycle` | session-bound create/list/fetch/patch/delete | `backend/tests/integration-be/src/api.integration.test.ts` |
| `arazzo/arazzo.yaml#characterOwnershipIsolated` | ownership enforcement | `backend/tests/integration-be/src/api.integration.test.ts` |
| `arazzo/arazzo.yaml#equipmentLookup` | search result to full item lookup | `backend/tests/integration-be/src/api.integration.test.ts` |
| `features/character-sheet.feature` | guest launch, save/reload, resource editing, kill/replace | `backend/tests/e2e/tests/guest`, `backend/tests/e2e/tests/authed` |
| `features/equipment-and-inventory.feature` | equip/unequip, custom item, use pips | `backend/tests/e2e/tests/authed/equipment.spec.ts`, `custom-item-header.spec.ts` |
| `features/public-app.feature` | FAQ, i18n, public attribution, mobile navigation | manual Playwright probes, proposed browser tests |
| `features/security-and-ownership.feature` | CSRF, session, ownership, feedback error path | integration and e2e error-path tests |
| `features/production-smoke.feature` | post-deploy production smoke and optional disposable-data smoke | `prod-release-gate.md` |
| `security-production-notes.md` | production-safe security posture checks and live findings | manual Playwright probes |
| `app-wide-playwright-findings.md` | app-wide UI/BDD findings and scenario backlog | manual Playwright probes guided by QA skills |
| `prod-release-gate.md` | finite pre-deploy, post-deploy, rollback, and no-go checklist | manual release gate |

## Runnable Production Smoke

Non-mutating production smoke is opt-in and requires an explicit target:

```bash
PROD_SMOKE_BASE_URL=https://scvmrack.rpgtools.co npm --prefix backend run test:prod-smoke
```

The disposable character smoke is skipped unless `ALLOW_MUTATING_PROD_SMOKE=1` is also set.

## Authoring Rules

- Keep one user-visible behavior per scenario.
- Prefer concrete examples over abstract phrasing.
- Do not put CSS selectors, test ids, implementation hook names, or database details in Gherkin.
- When a scenario becomes automated, add the automation file path to the scenario comment.
- When an API path gains a stable OpenAPI `operationId`, prefer `operationId` in Arazzo over `operationPath`.

## Known Gaps

- No Arazzo validator is installed yet; current validation is YAML parsing plus manual path checks against `frontend/src/api/schema.ts`.
- The backend OpenAPI routes do not define stable `operationId`s, so the Arazzo file uses `operationPath`.
- `GET /api/equipment/{itemType}/{id}` advertises `200` in OpenAPI but not a typed response body, which limits generated-client and workflow-validator value for that step.
- Shared-auth bootstrap routes are not in the app OpenAPI document, so session cookies and CSRF tokens are workflow inputs for now.
