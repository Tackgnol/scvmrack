# Getting Started with [Fastify-CLI](https://www.npmjs.com/package/fastify-cli)
This project was bootstrapped with Fastify-CLI.

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Starts the Docker dev stack with watch enabled:

- PostgreSQL on `localhost:5433`
- Fastify API on [http://localhost:3000](http://localhost:3000)
- Vite frontend on [http://localhost:5173](http://localhost:5173)
- Mailpit on [http://localhost:8025](http://localhost:8025)

This uses `compose.dev.yaml`, so the direct Docker equivalent is:

```bash
docker compose -f compose.dev.yaml up --build --watch
```

### `npm start`

For production mode

### `npm run test`

Run all unit tests (backend + frontend).

This does **not** run integration, browser, or E2E suites.
Use `npm run test:all` for the full verification run.

### `npm run test:all`

Run the full verification stack in this order: E2E, backend integration, unit tests, then frontend browser tests.

### `npm run test:unit`

Run all unit tests.

### `npm run test:unit:be`

Run backend unit tests from the dedicated test project at `tests/unit-be/`.

### `npm run test:unit:fe`

Run frontend unit tests from the frontend package (`client/test/unit/`).

### `npm run test:browser`

Run frontend browser tests from the frontend package (`client/test/browser/`).

### `npm run test:e2e`

Run full FE+BE end-to-end tests in Docker. This command:

1. Starts isolated `db` + `api` + `web` + `e2e` services from `compose.e2e.yaml`
2. Runs browser tests (Playwright + TypeScript) from `tests/e2e/`
3. Tears everything down (including volumes) after completion
4. Writes Playwright HTML report to `tests/e2e/playwright-report/index.html`

### `npm run test:integration:run`

Run backend integration tests from the dedicated test project at `tests/integration-be/` against an already running API (defaults to `http://localhost:3000`).

### `npm run test:integration`

Run backend integration tests fully in Docker. This command:

1. Starts isolated `db` + `api` + `integration` services from `compose.integration-be.yaml`
2. Runs integration tests from `tests/integration-be/`
3. Tears everything down (including volumes) after completion

### `npm run test:report`

Run the report-producing suites and regenerate `reports/index.html`.

### Legacy aliases

Older script names like `test:top-down`, `test:integration:be`, and `test:unit:be:run` still work, but the commands above are now the preferred ones.

## Bot Protection (Cloudflare Turnstile)

This project supports free captcha protection for auth endpoints (`sign-in`, `sign-up`, `magic-link`) using Cloudflare Turnstile.

Set these variables:

- Backend `.env`: `TURNSTILE_SECRET_KEY=your_turnstile_secret`
- Frontend `client/.env`: `VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key`

If those keys are empty, captcha validation is skipped.

## Error Monitoring (GlitchTip)

Set `GLITCHTIP_DSN` to enable backend GlitchTip/Sentry error reporting. Set
`VITE_GLITCHTIP_DSN` to enable frontend reporting to a separate GlitchTip
project. The transaction sample rate is `0.01`.

When deploying through Woodpecker, provide `glitchtip_dsn` for the backend and
`vite_glitchtip_dsn` for the frontend.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).
