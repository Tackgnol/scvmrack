import { expect, Page } from '@playwright/test';
import { pollEmailLink } from './mailpit.js';

/**
 * Helper to register a fresh user and verify their email so they are in a known good state.
 */
export async function registerAndVerifyUser(page: Page, email: string, name = 'Login Tester') {
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
  await page.getByTestId('signup-name-input').fill(name);
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

/**
 * Register a user and log in, staying on that authenticated session.
 */
export async function registerAndLogin(page: Page, email: string) {
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
  await page.getByTestId('signup-name-input').fill('Editor Scvm');
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
}
