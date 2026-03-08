import { expect, test, Page } from '@playwright/test';

const MAILPIT_URL = process.env.PLAYWRIGHT_MAILPIT_URL ?? 'http://mailpit:8025';

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
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

async function registerAndLogin(page: Page, email: string) {
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

test.describe('Logged-in Editing', () => {
  test('Logged-in user can edit character sheet entirely and it saves', async ({ page }) => {
    // 18+ steps each with a 1-second debounce flush — plus login time
    test.setTimeout(90000);

    const email = `editor_${Date.now()}@example.com`;
    await registerAndLogin(page, email);

    // After logging in via the verification link, we should be on a valid character sheet (usually the one passed in callbackURL or a freshly loaded one).
    // Wait for the new user character to sync initially.
    const syncBadge = page.getByText('Synced', { exact: true });
    await expect(syncBadge).toBeVisible({ timeout: 20000 });

    // Step 1: Edit current Hit Points
    const hpInput = page.getByTestId('hp-input');
    await hpInput.fill('5');
    await hpInput.blur();
    await expect(syncBadge).toBeVisible(); // Saves

    // Step 2: Edit current Silver
    const silverInput = page.getByTestId('silver-input');
    await silverInput.fill('150');
    await silverInput.blur();
    await expect(syncBadge).toBeVisible();

    // Step 3: Add comments to abilities
    // Find the first comment text field among abilities. Note: this might not exist if class has no abilities.
    const firstCommentInput = page.getByTestId('ability-comment-0-input');
    if (await firstCommentInput.isVisible()) {
      await firstCommentInput.fill('My fun ability comment');
      await firstCommentInput.blur();
      await expect(syncBadge).toBeVisible();
    }

    // Step 4: Edit Trait 1
    const trait1Input = page.getByTestId('trait1-input');
    await trait1Input.fill('Obsessive');
    await trait1Input.blur();
    await expect(syncBadge).toBeVisible();

    // Step 5: Edit Trait 2
    const trait2Input = page.getByTestId('trait2-input');
    await trait2Input.fill('Paranoid');
    await trait2Input.blur();
    await expect(syncBadge).toBeVisible();

    // Step 6: Edit Habit
    const habitInput = page.getByTestId('habit-input');
    await habitInput.fill('Bites nails');
    await habitInput.blur();
    await expect(syncBadge).toBeVisible();

    // Step 7: Edit Body Description
    const bodyInput = page.getByTestId('body-description-input');
    await bodyInput.fill('Tall and lanky');
    await bodyInput.blur();
    await expect(syncBadge).toBeVisible();

    // Step 8: Add quick modifier
    const quickModInput = page.getByTestId('quick-mod-name-input');
    await quickModInput.fill('Quick Boost');
    const quickModValue = page.getByTestId('quick-mod-value-input');
    await quickModValue.click();
    await quickModValue.fill('1');
    await quickModValue.press('Enter');

    await expect(page.getByText('Quick Boost')).toBeVisible({ timeout: 20000 });
    await expect(syncBadge).toBeVisible();

    // Step 9: Add modifier via Modal
    const advancedModBtn = page.getByTestId('advanced-mod-btn');
    await advancedModBtn.click();
    const modModal = page.getByRole('dialog');
    await expect(modModal).toBeVisible();
    await page.getByTestId('modal-mod-name-input').fill('Modal Super Buff');
    await page.getByTestId('modal-mod-save-btn').click();
    await expect(modModal).not.toBeVisible();
    await expect(page.getByText('Modal Super Buff')).toBeVisible();
    await expect(syncBadge).toBeVisible();

    // Step 10: Add scroll to inventory
    const eqSearch = page.getByTestId('equipment-search-input');
    await eqSearch.fill('scroll'); // type "scroll"
    await page.waitForTimeout(500); // Wait for debounce/search
    await page.getByRole('option').first().click();
    await expect(syncBadge).toBeVisible();

    // Step 11: Add armor
    await eqSearch.fill('armor');
    await page.waitForTimeout(500);
    await page.getByRole('option').first().click();
    await expect(syncBadge).toBeVisible();

    // Step 12: Add weapon
    await eqSearch.fill('weapon');
    await page.waitForTimeout(500);
    await page.getByRole('option').first().click();
    await expect(syncBadge).toBeVisible();

    // Step 13-14: Equip/unequip weapon (inventory may or may not contain weapons)
    const weaponSlot = page.getByTestId('equipped-weapon-slot-0');
    await weaponSlot.click();
    const weaponOption = page.locator('[data-testid^="equip-weapon-option-"]').first();
    const hasWeaponToEquip = await weaponOption
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (hasWeaponToEquip) {
      await weaponOption.click();
      await expect(syncBadge).toBeVisible();

      await weaponSlot.click();
      await page.getByTestId('unequip-weapon-option').click();
      await expect(syncBadge).toBeVisible();
    } else {
      await page.keyboard.press('Escape');
    }

    // Step 15-16: Equip/unequip armor (inventory may or may not contain armor)
    const armorSlot = page.getByTestId('equipped-armor-slot');
    await armorSlot.click();
    const armorOption = page.locator('[data-testid^="equip-armor-option-"]').first();
    const hasArmorToEquip = await armorOption
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (hasArmorToEquip) {
      await armorOption.click();
      await expect(syncBadge).toBeVisible();

      await armorSlot.click();
      await page.getByTestId('unequip-armor-option').click();
      await expect(syncBadge).toBeVisible();
    } else {
      await page.keyboard.press('Escape');
    }

    // Step 17: Power usage dot clicked and saved
    const firstPip = page.getByTestId('power-pip').first();
    if (await firstPip.isVisible()) {
      await firstPip.click();
      await expect(syncBadge).toBeVisible();
    }

    // Step 18: Add a Note or Misery
    const notesInput = page.getByTestId('notes-input');
    await notesInput.fill('I am doomed');
    await notesInput.blur();
    await expect(syncBadge).toBeVisible();

    // Step 19: Refresh and all values are still edited
    await page.reload();
    await expect(page.getByTestId('app-title')).toBeVisible({ timeout: 15000 });

    // Verify
    await expect(page.getByTestId('hp-input')).toHaveValue('5');
    await expect(page.getByTestId('silver-input')).toHaveValue('150');
    if (await firstCommentInput.isVisible()) {
      await expect(firstCommentInput).toHaveValue('My fun ability comment');
    }
    await expect(page.getByTestId('trait1-input')).toHaveValue('Obsessive');
    await expect(page.getByTestId('habit-input')).toHaveValue('Bites nails');
    await expect(page.getByText('Quick Boost')).toBeVisible();
    await expect(page.getByText('Modal Super Buff')).toBeVisible();
    await expect(notesInput).toHaveValue('I am doomed');
  });
});
