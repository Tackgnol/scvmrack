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

test('user can reset their password and log in with the new one', async ({ page }) => {
  test.setTimeout(60000);

  const email = `reset_${Date.now()}@example.com`;
  const originalPassword = 'testpassword123';
  const newPassword = 'brandNewPassword456';

  // 1. Register, verify, and log out — leaves the browser in guest state
  await registerAndVerifyUser(page, email, 'Reset Tester');

  // 2. Open auth modal on the Login tab
  await page.getByTestId('auth-button').click();
  await page.getByTestId('tab-login').click();

  // 3. Fill in the email (needed for forgot-password to know which account)
  await page.getByTestId('login-email-input').fill(email);

  // 4. Click "Forgot password?"
  const resetRequestTime = new Date();
  await page.getByTestId('forgot-password-button').click();

  // 5. Verify the "check your email" confirmation view appears
  await expect(page.getByTestId('reset-email-sent-view')).toBeVisible({ timeout: 10000 });

  // 6. Fetch the reset link from Mailpit
  const resetUrl = await pollEmailLink(
    email,
    /href="([^"]*auth\/reset-password[^"]*)"/ ,
    resetRequestTime
  );

  // 7. Navigate to the reset link — Better Auth verifies the token and redirects
  //    to /reset-password?token=<token>
  await page.goto(resetUrl);

  // 8. We should land on the Reset Password page
  await expect(page.getByTestId('new-password-input')).toBeVisible({ timeout: 15000 });

  // 9. Fill in the new password
  await page.getByTestId('new-password-input').fill(newPassword);
  await page.getByTestId('confirm-password-input').fill(newPassword);

  // 10. Submit the reset form
  await page.getByTestId('reset-password-submit').click();

  // 11. Verify success message
  await expect(page.getByText('PASSWORD FORGED ANEW')).toBeVisible({ timeout: 10000 });

  // 12. Navigate back to home
  await page.goto('/');
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  // 13. Open auth modal and log in with the NEW password
  await page.getByTestId('auth-button').click();
  await page.getByTestId('tab-login').click();

  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(newPassword);
  await page.getByTestId('login-submit-button').click();

  // 14. Handle the Claim Character modal if it appears
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

  // 15. Verify successful login — "Scvms" nav link is the auth indicator
  await expect(navCharacters).toBeVisible({ timeout: 15000 });

  // 16. Open profile and verify the user name
  await expect(page.getByText('Synced', { exact: true })).toBeVisible({ timeout: 15000 });

  const authBtn = page.getByTestId('auth-button');
  const profileModal = page.getByRole('dialog', { name: 'Profile' });

  await expect(async () => {
    await authBtn.click();
    await expect(profileModal).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 15000 });

  await expect(profileModal.getByText('Reset Tester')).toBeVisible({ timeout: 10000 });

  // 17. Verify the OLD password no longer works
  // Log out first
  await page.getByTestId('logout-button').click();
  await page.getByTestId('create-new-character-button').click();
  await expect(page.getByText('Synced', { exact: true })).toBeVisible({ timeout: 15000 });

  // Try to log in with the old password
  await page.getByTestId('auth-button').click();
  await page.getByTestId('tab-login').click();
  await page.getByTestId('login-email-input').fill(email);
  await page.getByTestId('login-password-input').fill(originalPassword);
  await page.getByTestId('login-submit-button').click();

  // Should see an error, NOT the nav link
  await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 10000 });
  await expect(navCharacters).not.toBeVisible();
});
