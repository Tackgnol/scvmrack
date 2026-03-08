# Getting Started with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli)
This project was bootstrapped with Fastify-CLI.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm start`

For production mode

### `npm run test`

Run the test cases.

### `npm run test:e2e`

Run full FE+BE end-to-end tests in Docker. This command:

1. Starts isolated `db` + `api` + `web` + `e2e` services from `compose.e2e.yaml`
2. Runs browser tests (Playwright + TypeScript) from `tests/e2e/`
3. Tears everything down (including volumes) after completion
4. Writes Playwright HTML report to `tests/e2e/playwright-report/index.html`

### `npm run test:integration:be:run`

Run backend integration tests from the dedicated test project at `tests/integration-be/` against an already running API (defaults to `http://localhost:3000`).

### `npm run test:integration:be`

Run backend integration tests fully in Docker. This command:

1. Starts isolated `db` + `api` + `integration` services from `compose.integration-be.yaml`
2. Runs integration tests from `tests/integration-be/`
3. Tears everything down (including volumes) after completion

### `npm run test:unit:be:run`

Run backend unit tests from the dedicated test project at `tests/unit-be/`.

### `npm run test:unit:fe:run`

Run frontend unit tests from the frontend package (`client/test/unit/`).

### `npm run test:top-down`

Run suites in this order: E2E (FE+BE) -> backend integration -> backend unit -> frontend unit.

## Bot Protection (Cloudflare Turnstile)

This project supports free captcha protection for auth endpoints (`sign-in`, `sign-up`, `magic-link`) using Cloudflare Turnstile.

Set these variables:

- Backend `.env`: `TURNSTILE_SECRET_KEY=your_turnstile_secret`
- Frontend `client/.env`: `VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key`

If those keys are empty, captcha validation is skipped.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).
