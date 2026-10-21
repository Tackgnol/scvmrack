import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const origin = 'https://scvmrack-canary.rpgtools.co';
const room = process.env.OWLBEAR_ROOM_URL;

test.skip(process.env.OWLBEAR_LIVE !== '1', 'Set OWLBEAR_LIVE=1 to authorize real QA room writes.');

async function extension(page: Page) {
  const frame = page.frameLocator(`iframe[src^="${origin}/"]`);
  await expect(frame.getByTestId('language-en')).toBeVisible();
  return frame;
}

async function toggleExtension(page: Page) {
  await page.getByLabel('Scvmrack', { exact: true }).getByRole('button').click();
}

/** Optional local frontend build over the real host and canary API. No API mocking. */
async function localBuild(context: BrowserContext) {
  const dist = process.env.OWLBEAR_LOCAL_DIST;
  if (!dist) {
    return;
  }
  const directory = resolve(dist);
  await context.route(`${origin}/**`, async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname !== '/obr.html' && !pathname.startsWith('/assets/')) {
      await route.continue();
      return;
    }
    const path = resolve(directory, `.${decodeURIComponent(pathname)}`);
    if (!path.startsWith(`${directory}${sep}`)) {
      throw new Error('Local build path is outside the supplied directory');
    }
    try {
      await stat(path);
    } catch {
      if (pathname === '/obr.html') {
        throw new Error('The supplied local build has no obr.html');
      }
      // The full-sheet handoff may load the currently deployed main bundle.
      await route.continue();
      return;
    }
    await route.fulfill({ path, headers: { 'cache-control': 'no-store' } });
  });
}

test('real GM admits a player who rolls, edits, reopens and hands off their scvm', async ({ browser }) => {
  if (!room || new URL(room).origin !== 'https://www.owlbear.rodeo') {
    throw new Error('Set OWLBEAR_ROOM_URL to the designated Owlbear QA room.');
  }
  // These are literal KEY=value lines. dotenv would truncate an unquoted '#'
  // in a password; never interpret the user's password as an inline comment.
  const credentials = Object.fromEntries(
    (await readFile(resolve(root, '.owlbear_account'), 'utf8')).split(/\r?\n/)
      .map(line => line.trim()).filter(line => /^OWLBEAR_(USER|PASS)=/.test(line))
      .map(line => {
        const separator = line.indexOf('=');
        const value = line.slice(separator + 1);
        return [line.slice(0, separator), value.replace(/^(["'])(.*)\1$/, '$2')];
      }),
  );
  if (!credentials.OWLBEAR_USER || !credentials.OWLBEAR_PASS) {
    throw new Error('The gitignored .owlbear_account must define OWLBEAR_USER and OWLBEAR_PASS.');
  }
  const gmContext = await browser.newContext();
  const playerContext = await browser.newContext();
  try {
    await localBuild(gmContext);
    await localBuild(playerContext);
    const gm = await gmContext.newPage();
    gm.on('response', response => {
      if (response.status() >= 400 && new URL(response.url()).origin !== origin) {
        // Status and path only: auth request URLs/bodies may hold credentials.
        const url = new URL(response.url());
        console.error(`Owlbear host request failed: ${response.status()} ${url.origin}${url.pathname}`);
      }
    });
    await gm.goto(room);
    await gm.getByRole('button', { name: 'Sign In', exact: true }).click();
    await gm.getByRole('textbox', { name: 'Email Address', exact: true }).fill(credentials.OWLBEAR_USER);
    await gm.getByRole('button', { name: 'Continue with Email', exact: true }).click();
    await gm.getByLabel('Password', { exact: true }).fill(credentials.OWLBEAR_PASS);
    await gm.getByRole('button', { name: 'Continue with Password', exact: true }).click();
    delete credentials.OWLBEAR_PASS;
    delete credentials.OWLBEAR_USER;
    await expect(gm.getByRole('button', { name: /^Asset Manager/ })).toBeVisible();

    const player = await playerContext.newPage();
    const name = `QA-OBR-${Date.now()}`;
    await player.goto(room);
    await player.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
    await player.getByRole('button', { name: 'Ask To Join', exact: true }).click();
    await expect(gm.getByText(`${name} wants to join`, { exact: true })).toBeVisible();
    await gm.getByRole('button', { name: 'Admit', exact: true }).click();
    await toggleExtension(player);
    const sheet = await extension(player);
    await sheet.getByRole('button', { name: 'Roll a scvm', exact: true }).click();
    // Anonymous session bootstrap can defer the first click.
    const picker = sheet.getByText('Choose a class', { exact: true });
    await expect(async () => {
      if (!(await picker.isVisible())) {
        await sheet.getByRole('button', { name: 'Roll a scvm', exact: true }).click();
      }
      await expect(picker).toBeVisible({ timeout: 2_000 });
    }).toPass();
    await sheet.getByRole('button', { name: /^Fanged Deserter / }).click();
    await expect(sheet.getByTestId('hp-input')).toBeVisible();
    await expect(sheet.getByText('Runtime Error', { exact: true })).toHaveCount(0);
    const hp = sheet.getByTestId('hp-input');
    const nextHp = String(Number(await hp.inputValue()) + 1);
    const saved = player.waitForResponse(response => response.url().includes('/api/characters/') && response.request().method() === 'PATCH' && response.ok());
    await hp.fill(nextHp);
    await hp.press('Tab');
    await saved;
    await toggleExtension(player);
    await toggleExtension(player);
    await expect(sheet.getByTestId('hp-input')).toHaveValue(nextHp);
    await sheet.getByTestId('language-pl').click();
    await expect(sheet.getByTestId('language-pl')).toHaveAttribute('aria-pressed', 'true');
    await sheet.getByTestId('language-en').click();
    await player.screenshot({ path: resolve(root, 'output/playwright/owlbear-live/player-sheet.png') });
    await toggleExtension(gm);
    const roster = await extension(gm);
    await expect(roster.getByRole('tab', { name: 'Party', exact: true })).toBeVisible();
    await expect(roster.getByText('Fanged Deserter', { exact: true }).first()).toBeVisible();
    await gm.screenshot({ path: resolve(root, 'output/playwright/owlbear-live/gm-roster.png') });
    const tabPromise = playerContext.waitForEvent('page');
    await sheet.getByRole('button', { name: 'Open in scvmrack', exact: true }).first().click();
    const fullSheet = await tabPromise;
    await expect(fullSheet.getByTestId('hp-input')).toHaveValue(nextHp);
  } finally {
    await playerContext.close();
    await gmContext.close();
  }
});
