import {
  createSeededCharacter,
  createTestUser,
  expect,
  prepareActorContext,
  test,
} from '../../fixtures.js';
import { expectMiseryCount } from '../utils/character-sheet.js';

function isPath(url: string, re: RegExp): boolean {
  return re.test(new URL(url).pathname);
}

test('Game Master sets the Misery count for every player', async ({
  page,
  browser,
}) => {
  test.setTimeout(180000);

  await page.goto('/gm');
  const createPromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      isPath(response.url(), /^\/api\/parties$/) &&
      response.status() === 201
  );
  await page.getByRole('textbox').first().fill('Doomed Company');
  await page.getByRole('button', { name: /create party/i }).click();
  const party = (await (await createPromise).json()) as {
    id: string;
    inviteToken: string;
  };

  const guestContext = await browser.newContext();
  await guestContext.addInitScript(() => {
    localStorage.setItem(
      'scvmgrinder-privacy-settings-v1',
      JSON.stringify({ acknowledged: true, analyticsEnabled: false })
    );
  });
  const signedIn = await createTestUser('Signed-in Doom');
  const signedInCharacter = await createSeededCharacter(signedIn.userId, {
    name: 'Signed-in Scvm',
  });
  const signedInContext = await browser.newContext();
  await prepareActorContext(signedInContext, signedIn.sessionCookie);

  try {
    const guestPage = await guestContext.newPage();
    await guestPage.goto('/character');
    await expect(guestPage.getByTestId('generate-new-button')).toBeVisible({
      timeout: 30000,
    });
    await guestPage.goto(`/join/${party.inviteToken}`);
    const guestStream = guestPage.waitForResponse((response) =>
      isPath(response.url(), new RegExp(`^/api/parties/${party.id}/stream$`))
    );
    await guestPage.getByRole('button', { name: /join party/i }).click();
    await guestStream;
    await expect(guestPage).toHaveURL(
      new RegExp(`/party/${party.id}/character/[^/]+$`)
    );

    const signedInPage = await signedInContext.newPage();
    await signedInPage.goto(`/join/${party.inviteToken}`);
    await expect(signedInPage.getByText('Signed-in Scvm')).toBeVisible({
      timeout: 30000,
    });
    const signedInStream = signedInPage.waitForResponse((response) =>
      isPath(response.url(), new RegExp(`^/api/parties/${party.id}/stream$`))
    );
    await signedInPage.getByRole('button', { name: /join party/i }).click();
    await signedInStream;
    await expect(signedInPage).toHaveURL(
      new RegExp(`/party/${party.id}/character/${signedInCharacter.id}$`)
    );

    await expectMiseryCount(guestPage, 0);
    await expectMiseryCount(signedInPage, 0);
    await expect(page.getByText('Signed-in Scvm')).toBeVisible({
      timeout: 30000,
    });

    const control = page.getByTestId('gm-misery-control');
    await control.getByRole('button', { name: 'Misery IV' }).click();
    const updatePromise = page.waitForResponse(
      (response) =>
        response.request().method() === 'PUT' &&
        isPath(
          response.url(),
          new RegExp(`^/api/parties/${party.id}/miseries$`)
        ) &&
        response.status() === 200
    );
    await control
      .getByRole('button', { name: /set 4 \/ 7 for all scvms/i })
      .click();
    await updatePromise;

    await expectMiseryCount(guestPage, 4);
    await expectMiseryCount(signedInPage, 4);

    await Promise.all([guestPage.reload(), signedInPage.reload()]);
    await expectMiseryCount(guestPage, 4);
    await expectMiseryCount(signedInPage, 4);
  } finally {
    await guestContext.close();
    await signedInContext.close();
  }
});
