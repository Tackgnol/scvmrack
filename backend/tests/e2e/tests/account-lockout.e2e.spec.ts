import { expect, test } from '@playwright/test';
import { pollEmailLink } from './utils/mailpit.js';
import { acceptClaimPrompt, registerAndVerifyUser } from './utils/auth.js';

test.beforeEach(async ({ page }) => {
  // Clear cookies to prevent stale session issues between parallel tests
  await page.context().clearCookies();
  await page.addInitScript(() => {
    localStorage.setItem(
      'scvmgrinder-privacy-settings-v1',
      JSON.stringify({ acknowledged: true, analyticsEnabled: false })
    );
  });
});

test('user gets locked out after 5 wrong passwords but can still log in via magic link', async ({
  page,
}) => {
  test.setTimeout(60000);

  const email = `lockout_${Date.now()}@example.com`;
  const correctPassword = 'testpassword123';
  const wrongPassword = 'totallyWrongPassword';

  // 1. Register, verify, and log out
  await registerAndVerifyUser(page, email, 'Lockout Tester');

  // 2. Attempt to log in with the wrong password 5 times
  for (let i = 0; i < 5; i++) {
    await page.getByTestId('auth-button').click();
    await page.getByTestId('tab-login').click();

    await page.getByTestId('login-email-input').fill(email);
    await page.getByTestId('login-password-input').fill(wrongPassword);
    await page.getByTestId('login-submit-button').click();

    // Each attempt should show a login error
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10000 });

    // Close the modal to reset state for the next attempt
    await page.getByLabel('Close modal').click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  }

  // 3. Attempt #6 — should be locked out with the specific lockout message
  await page.getByTestId('auth-button').click();
  await page.getByTestId('tab-login').click();

  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(correctPassword); // even correct password is blocked
  await page.getByTestId('login-submit-button').click();

  // Should see the lockout message mentioning magic link
  await expect(page.getByText('Too many failed login attempts')).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId('magic-link-button')).toBeVisible();

  // Close the modal
  await page.getByLabel('Close modal').click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

  // 4. Log in via magic link — lockout does NOT block magic links
  const magicLinkRequestTime = new Date();

  await page.getByTestId('auth-button').click();
  await page.getByTestId('tab-login').click();

  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('magic-link-button').click();

  // Verify magic link sent confirmation
  await expect(page.getByTestId('magic-link-sent-view')).toBeVisible({ timeout: 10000 });

  // 5. Fetch the magic link from Mailpit
  const magicLinkUrl = await pollEmailLink(
    email,
    /href="([^"]*auth\/magic-link[^"]*)"/ ,
    magicLinkRequestTime
  );

  // 6. Navigate to the magic link
  await page.goto(magicLinkUrl);

  const navCharacters = page.getByTestId('nav-link-characters');

  await acceptClaimPrompt(page);

  // 8. Verify successful login
  await expect(navCharacters).toBeVisible({ timeout: 15000 });

  // Open profile and confirm it's the right user
  await expect(page.getByText('Synced', { exact: true })).toBeVisible({ timeout: 15000 });

  const authBtn = page.getByTestId('auth-button');
  const profileModal = page.getByRole('dialog', { name: 'Profile' });

  await expect(async () => {
    await authBtn.click();
    await expect(profileModal).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 15000 });

  await expect(profileModal.getByText('Lockout Tester')).toBeVisible({ timeout: 10000 });
});
