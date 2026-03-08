import { expect, test, Page } from '@playwright/test';

const MAILPIT_URL = process.env.PLAYWRIGHT_MAILPIT_URL ?? 'http://mailpit:8025';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'scvmgrinder-privacy-settings-v1',
      JSON.stringify({ acknowledged: true, analyticsEnabled: false })
    );
  });
});

interface MailpitMessage {
  ID: string;
  Subject: string;
  To: { Address: string; Name: string }[];
  Created: string;
}

interface MailpitMessageDetail {
  HTML: string;
}

/**
 * Polls Mailpit for the most recent email to a given address containing a specific link pattern.
 * Uses a sinceDate to ignore emails from previous steps (like the original registration).
 */
async function pollEmailLink(
  email: string,
  linkRegex: RegExp,
  sinceDate: Date,
  maxAttempts = 15
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1000));
    }

    const res = await fetch(`${MAILPIT_URL}/api/v1/messages`);
    const data = (await res.json()) as { messages: MailpitMessage[] };

    // Find messages to the user sent AFTER the sinceDate, sorted most recent first
    const recentMessages = (data.messages || [])
      .filter((m) => {
        const isToUser = m.To?.some((t) => t.Address.toLowerCase() === email.toLowerCase());
        const isRecent = new Date(m.Created) > sinceDate;
        return isToUser && isRecent;
      })
      .sort((a, b) => new Date(b.Created).getTime() - new Date(a.Created).getTime());

    for (const message of recentMessages) {
      const detailRes = await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`);
      const detail = (await detailRes.json()) as MailpitMessageDetail;

      const match = detail.HTML?.match(linkRegex);
      if (match) {
        let extractedUrl = match[1].replace(/&amp;/g, '&');

        // Fix callbackURL to be absolute so Better Auth redirects back to the client, not the API
        const urlObj = new URL(extractedUrl);
        const callbackUrlParam = urlObj.searchParams.get('callbackURL');

        if (callbackUrlParam && callbackUrlParam.startsWith('/')) {
          const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
          urlObj.searchParams.set('callbackURL', new URL(callbackUrlParam, baseUrl).toString());
          extractedUrl = urlObj.toString();
        }

        return extractedUrl;
      }
    }
  }

  throw new Error(`Email link for ${email} matching ${linkRegex} not received after ${maxAttempts} attempts`);
}

/**
 * Helper to register a fresh user and verify their email so they are in a known good state.
 */
async function registerAndVerifyUser(page: Page, email: string) {
  const testStartTime = new Date();

  // Load the home page; start listening for the character fetch BEFORE navigating
  const characterLoaded = page.waitForResponse(
    (r) =>
      /\/characters\/[^/]+$/.test(new URL(r.url()).pathname) &&
      r.request().method() === 'GET' &&
      r.status() === 200,
    { timeout: 30000 }
  );

  await page.goto('/');
  await expect(page.getByTestId('app-title')).toBeVisible();

  // Wait for the character to be fully loaded
  await characterLoaded;

  // Open the auth modal
  await page.getByTestId('auth-button').click();

  // Switch to the Sign Up tab
  await page.getByTestId('tab-signup').click();

  // Fill in the registration form
  await page.getByTestId('signup-name-input').fill('Login Tester');
  await page.getByTestId('signup-email-input').fill(email);
  await page.getByTestId('signup-password-input').fill('testpassword123');

  // Submit
  await page.getByTestId('signup-submit-button').click();

  // Confirmation view should appear
  await expect(page.getByText('Check Your Email')).toBeVisible({ timeout: 10000 });

  // Fetch the verification URL from Mailpit
  const verifyUrl = await pollEmailLink(email, /href="([^"]*auth\/verify-email[^"]*)"/, testStartTime);

  // Navigate the browser to the verification link 
  await page.goto(verifyUrl);

  // "Scvms" nav link only appears when the user is authenticated
  await expect(page.getByTestId('nav-link-characters')).toBeVisible({ timeout: 15000 });

  // Logout to leave the browser in a logged out state
  await page.getByTestId('auth-button').click();
  await page.getByTestId('logout-button').click();

  // Clear the Logged Out modal by creating a new character
  await page.getByTestId('create-new-character-button').click();

  // Explicitly wait for the new guest character to finish saving so it's guaranteed to be loaded 
  // before the next test actions begin. This makes the Claim Character prompt deterministic!
  await expect(page.getByText('Synced', { exact: true })).toBeVisible({ timeout: 15000 });

  // Verify logged out state
  await expect(page.getByTestId('nav-link-characters')).not.toBeVisible();
}

test.describe('Login & Magic Link', () => {
  test('user can log in via email and password', async ({ page }) => {
    const email = `pwd_login_${Date.now()}@example.com`;

    // 1. Create and verify user, then log out
    await registerAndVerifyUser(page, email);

    // 2. Open auth modal
    await page.getByTestId('auth-button').click();

    // 3. Ensure we are on Login tab
    await page.getByTestId('tab-login').click();

    // 4. Fill in credentials
    await page.getByTestId('login-email-input').fill(email);
    await page.getByTestId('login-password-input').fill('testpassword123');

    // 5. Submit
    await page.getByTestId('login-submit-button').click();

    // 6. Handle Claim Character modal ("Save Your Character?")
    // The claim modal will always appear now because we deterministically generated a guest character!
    const claimYesBtn = page.getByTestId('claim-character-yes');
    const navCharacters = page.getByTestId('nav-link-characters');

    await expect(claimYesBtn).toBeVisible({ timeout: 15000 });
    await claimYesBtn.click();
    await expect(claimYesBtn).not.toBeVisible({ timeout: 10000 });

    // 7. Verify successful login
    await expect(navCharacters).toBeVisible({ timeout: 15000 });

    // Retry click until profile dialog actually opens (handles post-login re-renders)
    const authBtn = page.getByTestId('auth-button');
    const profileModal = page.getByRole('dialog', { name: 'Profile' });
    await expect(async () => {
      await authBtn.click();
      await expect(profileModal).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 15000 });

    await expect(profileModal.getByText('Login Tester')).toBeVisible();

    // Wait for the sync to ensure safe context teardown
    await expect(page.getByText('Synced', { exact: true })).toBeVisible({ timeout: 10000 });
  });

  test('user can log in via magic link', async ({ page }) => {
    const email = `magic_login_${Date.now()}@example.com`;

    // 1. Create and verify user, then log out
    await registerAndVerifyUser(page, email);

    const requestMagicLinkTime = new Date();

    // 2. Open auth modal
    await page.getByTestId('auth-button').click();

    // 3. Ensure we are on Login tab
    await page.getByTestId('tab-login').click();

    // 4. Fill email and request magic link
    await page.getByTestId('login-email-input').fill(email);
    // Click the central "Email me a Magic Link" button
    await page.getByTestId('magic-link-button').click();

    // 5. Verify success view
    await expect(page.getByTestId('magic-link-sent-view')).toBeVisible({ timeout: 10000 });

    // 6. Fetch magic link from Mailpit
    const magicLinkUrl = await pollEmailLink(email, /href="([^"]*auth\/magic-link[^"]*)"/, requestMagicLinkTime);

    // 7. Navigate to magic link
    await page.goto(magicLinkUrl);

    // 8. Handle Claim Character modal
    const claimYesBtn = page.getByTestId('claim-character-yes');
    const navCharacters = page.getByTestId('nav-link-characters');

    await expect(claimYesBtn).toBeVisible({ timeout: 15000 });
    await claimYesBtn.click();
    await expect(claimYesBtn).not.toBeVisible({ timeout: 10000 });

    // 9. Verify successful login
    await expect(navCharacters).toBeVisible({ timeout: 15000 });

    // Retry click until profile dialog actually opens (handles post-redirect re-renders)
    const authBtn = page.getByTestId('auth-button');
    const profileModal = page.getByRole('dialog', { name: 'Profile' });
    await expect(async () => {
      await authBtn.click();
      await expect(profileModal).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 15000 });

    await expect(profileModal.getByText('Login Tester')).toBeVisible();

    // Wait for the sync to ensure safe context teardown
    await expect(page.getByText('Synced', { exact: true })).toBeVisible({ timeout: 10000 });
  });
});
