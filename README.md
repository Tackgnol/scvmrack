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

## Bot Protection (Cloudflare Turnstile)

This project supports free captcha protection for auth endpoints (`sign-in`, `sign-up`, `magic-link`) using Cloudflare Turnstile.

Set these variables:

- Backend `.env`: `TURNSTILE_SECRET_KEY=your_turnstile_secret`
- Frontend `client/.env`: `VITE_TURNSTILE_SITE_KEY=your_turnstile_site_key`

If those keys are empty, captcha validation is skipped.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://fastify.dev/docs/latest/).
