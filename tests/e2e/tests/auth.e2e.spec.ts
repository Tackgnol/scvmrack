import { expect, test } from '@playwright/test';
import { pollEmailLink } from './utils/mailpit.js';

// Pre-acknowledge the privacy notice so the drawer never opens and blocks clicks
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


test('user can register a new account and sign in via email verification', async ({ page }) => {
  const email = `test_${Date.now()}@example.com`;
  const testStartTime = new Date();

  await page.goto('/');
  await expect(page.getByTestId('app-title')).toBeVisible();

  // Wait for the character to be fully loaded (generate button means page is interactive)
  await expect(page.getByTestId('generate-new-button')).toBeVisible({ timeout: 30000 });

  // Open the auth modal
  await page.getByTestId('auth-button').click();

  // Switch to the Sign Up tab
  await page.getByTestId('tab-signup').click();

  // Fill in the registration form
  await page.getByTestId('signup-name-input').fill('Test Scvm');
  await page.getByTestId('signup-email-input').fill(email);
  await page.getByTestId('signup-password-input').fill('testpassword123');

  // Submit
  await page.getByTestId('signup-submit-button').click();

  // Confirmation view should appear
  await expect(page.getByText('Check Your Email')).toBeVisible({ timeout: 10000 });

  // Fetch the full verification URL from Mailpit (carries callbackURL with character ID)
  let verifyUrl = await pollEmailLink(email, /href="([^"]*auth\/verify-email[^"]*)"/, testStartTime);

  // Fix callbackURL to be absolute so Better Auth redirects back to the client, not the API
  const urlObj = new URL(verifyUrl);
  const callbackUrlParam = urlObj.searchParams.get('callbackURL');
  let expectedCharacterId: string | null = null;

  if (callbackUrlParam) {
    // Extract character ID if present
    const callbackMatch = callbackUrlParam.match(/character=([^&]+)/);
    if (callbackMatch) {
      expectedCharacterId = callbackMatch[1];
    }
    
    if (callbackUrlParam.startsWith('/')) {
      const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';
      urlObj.searchParams.set('callbackURL', new URL(callbackUrlParam, baseUrl).toString());
      verifyUrl = urlObj.toString();
    }
  }

  // Navigate the browser to the verification link so it follows the redirect,
  // picks up the session cookie, and lands on the callbackURL (e.g. /?character=<id>).
  await page.goto(verifyUrl);

  // "Scvms" nav link only appears when the user is authenticated
  await expect(page.getByTestId('nav-link-characters')).toBeVisible({ timeout: 15000 });
  
  // Verify that the ID in the URL matches the one from the callbackURL
  if (expectedCharacterId) {
    expect(page.url()).toContain(`character=${expectedCharacterId}`);
  }

  // Verify the Name fits by opening the Profile/Auth Modal again and checking its text
  await page.getByTestId('auth-button').click();
  await expect(page.getByText('Test Scvm')).toBeVisible();
});
