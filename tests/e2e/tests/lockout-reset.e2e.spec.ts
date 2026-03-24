import { expect, test } from '@playwright/test';
import { pollEmailLink } from './utils/mailpit.js';
import { registerAndVerifyUser } from './utils/auth.js';

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

test('user resets password on a locked-out account and logs in with the new password', async ({
  page,
}) => {
  test.setTimeout(60000);

  const email = `lockreset_${Date.now()}@example.com`;
  const wrongPassword = 'totallyWrongPassword';
  const newPassword = 'freshPassword789';

  // 1. Register, verify, and log out
  await registerAndVerifyUser(page, email, 'Lockout Reset Tester');

  // 2. Fail login 5 times to trigger lockout
  for (let i = 0; i < 5; i++) {
    await page.getByTestId('auth-button').click();
    await page.getByTestId('tab-login').click();

    await page.getByTestId('login-email-input').fill(email);
    await page.getByTestId('login-password-input').fill(wrongPassword);
    await page.getByTestId('login-submit-button').click();

    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10000 });
    await page.getByLabel('Close modal').click();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  }

  // 3. Confirm lockout is active
  await page.getByTestId('auth-button').click();
  await page.getByTestId('tab-login').click();

  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(wrongPassword);
  await page.getByTestId('login-submit-button').click();

  await expect(page.getByText('Too many failed login attempts')).toBeVisible({ timeout: 10000 });

  // Close the modal
  await page.getByLabel('Close modal').click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

  // 4. Request a password reset while locked out
  const resetRequestTime = new Date();

  await page.getByTestId('auth-button').click();
  await page.getByTestId('tab-login').click();

  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('forgot-password-button').click();

  await expect(page.getByTestId('reset-email-sent-view')).toBeVisible({ timeout: 10000 });

  // Close the modal
  await page.getByLabel('Close modal').click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });

  // 5. Fetch the reset link from Mailpit
  const resetUrl = await pollEmailLink(
    email,
    /href="([^"]*auth\/reset-password[^"]*)"/ ,
    resetRequestTime
  );

  // 6. Navigate to the reset link — Better Auth redirects to /reset-password?token=...
  await page.goto(resetUrl);

  // 7. Fill in the new password
  await expect(page.getByTestId('new-password-input')).toBeVisible({ timeout: 15000 });
  await page.getByTestId('new-password-input').fill(newPassword);
  await page.getByTestId('confirm-password-input').fill(newPassword);
  await page.getByTestId('reset-password-submit').click();

  // 8. Verify success
  await expect(page.getByText('PASSWORD FORGED ANEW')).toBeVisible({ timeout: 10000 });

  // 9. Go home and log in with the new password
  await page.goto('/');
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  await page.getByTestId('auth-button').click();
  await page.getByTestId('tab-login').click();

  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(newPassword);
  await page.getByTestId('login-submit-button').click();

  // 10. Handle claim modal if it appears
  const claimYesBtn = page.getByTestId('claim-character-yes');
  const navCharacters = page.getByTestId('nav-link-characters');

  // Wait for authentication to complete
  await expect(navCharacters).toBeVisible({ timeout: 15000 });

  // The claim modal is triggered by a React effect that runs after auth settles.
  // Wait briefly for it to appear before deciding there's nothing to claim.
  try {
    await expect(claimYesBtn).toBeVisible({ timeout: 3000 });
    await claimYesBtn.click();
    await expect(claimYesBtn).not.toBeVisible({ timeout: 10000 });
  } catch {
    // No claim modal appeared — character was already transferred or not applicable
  }

  // 11. Verify successful login
  await expect(navCharacters).toBeVisible({ timeout: 15000 });

  await expect(page.getByText('Synced', { exact: true })).toBeVisible({ timeout: 15000 });

  const authBtn = page.getByTestId('auth-button');
  const profileModal = page.getByRole('dialog', { name: 'Profile' });

  await expect(async () => {
    await authBtn.click();
    await expect(profileModal).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 15000 });

  await expect(profileModal.getByText('Lockout Reset Tester')).toBeVisible({ timeout: 10000 });
});
