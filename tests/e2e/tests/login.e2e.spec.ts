import { expect, test } from '@playwright/test';
import { pollEmailLink } from './utils/mailpit.js';
import { registerAndVerifyUser } from './utils/auth.js';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'scvmgrinder-privacy-settings-v1',
      JSON.stringify({ acknowledged: true, analyticsEnabled: false })
    );
  });
});


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
    
    // Explicitly wait for the sync badge first to ensure the UI has settled after saving
    await expect(page.getByText('Synced', { exact: true })).toBeVisible({ timeout: 15000 });

    await expect(async () => {
      await authBtn.click();
      await expect(profileModal).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 15000 });

    await expect(profileModal.getByText('Login Tester')).toBeVisible({ timeout: 10000 });

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
    
    // Explicitly wait for the sync badge first to ensure the UI has settled after saving
    await expect(page.getByText('Synced', { exact: true })).toBeVisible({ timeout: 15000 });

    await expect(async () => {
      await authBtn.click();
      await expect(profileModal).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 15000 });

    await expect(profileModal.getByText('Login Tester')).toBeVisible({ timeout: 10000 });

    // Wait for the sync to ensure safe context teardown
    await expect(page.getByText('Synced', { exact: true })).toBeVisible({ timeout: 10000 });
  });
});
