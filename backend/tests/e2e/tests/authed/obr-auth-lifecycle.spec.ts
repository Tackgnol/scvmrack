import {
  test,
  expect,
  createTestUser,
  createSeededCharacter,
} from '../../fixtures.js';

test('the callback waits for explicit approval before the receiving browser can redeem the account', async ({
  page,
  browser,
  testAuthUser,
}) => {
  const registered = await (
    await page.request.post('/api/auth/obr-handoff/register', { data: {} })
  ).json();
  const proof = { handoffId: registered.handoffId, secret: registered.secret };
  await page.goto(`/obr-auth-done?handoffId=${registered.handoffId}`);
  await expect(
    page.getByRole('heading', { name: 'Approve Owlbear sign-in' })
  ).toBeVisible();
  await expect(
    page.getByText(testAuthUser!.email, { exact: true })
  ).toBeVisible();
  expect(
    (
      await (
        await page.request.post('/api/auth/obr-handoff/take', { data: proof })
      ).json()
    ).state
  ).toBe('awaiting-approval');
  await page
    .getByRole('textbox', { name: 'Code from the extension' })
    .fill(registered.code);
  await page
    .getByRole('button', { name: 'Approve sign-in', exact: true })
    .click();
  await expect(
    page.getByText('Approved. Return to Owlbear.', { exact: true })
  ).toBeVisible();
  const receiving = await browser.newContext();
  try {
    const received = await receiving.request.post(
      '/api/auth/obr-handoff/redeem',
      { data: proof }
    );
    expect(received.status()).toBe(200);
    expect(
      (await (await receiving.request.get('/api/auth/get-session')).json()).user
        .id
    ).toBe(testAuthUser!.userId);
    expect(
      (
        await receiving.request.post('/api/auth/obr-handoff/redeem', {
          data: proof,
        })
      ).status()
    ).toBe(410);
  } finally {
    await receiving.close();
  }
});

test('a receiving tab asks before replacing a different first-party account', async ({
  page,
  testAuthUser,
}) => {
  const source = await createTestUser('Transfer source');
  const scvm = await createSeededCharacter(source.userId, {
    name: 'Transfer scvm',
  });
  const cookie = source.sessionCookie.match(
    /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=([^;]+)/
  )?.[1];
  expect(cookie).toBeTruthy();
  await page.addInitScript((token) => {
    sessionStorage.setItem('scvm.tabSession', token);
  }, decodeURIComponent(cookie!));
  await page.goto(`/faq?contractCharacter=${scvm.id}`);
  await page.addScriptTag({
    type: 'module',
    url: '/test/contracts/transfer.tsx',
  });
  const opening = page.waitForEvent('popup');
  await page
    .getByRole('button', { name: 'Open in scvmrack', exact: true })
    .click();
  const receiving = await opening;
  await expect(
    receiving.getByText(
      'This tab uses a different account. Continue as Transfer source?',
      { exact: true }
    )
  ).toBeVisible();
  expect(
    (await (await receiving.request.get('/api/auth/get-session')).json()).user
      .id
  ).toBe(testAuthUser!.userId);
  await receiving
    .getByRole('button', { name: 'Continue as Transfer source', exact: true })
    .click();
  await expect(receiving).toHaveURL(`/character/${scvm.id}`);
  expect(
    (await (await receiving.request.get('/api/auth/get-session')).json()).user
      .id
  ).toBe(source.userId);
  await receiving.close();
});

test('popup completion confirms the receiving identity and closing an unapproved popup keeps the guest', async ({
  page,
  browser,
  testAuthUser,
}) => {
  const guestContext = await browser.newContext();
  try {
    const guest = await guestContext.request.post(
      '/api/auth/sign-in/anonymous',
      { data: {} }
    );
    const bearer = guest.headers()['set-auth-token'];
    const guestId = (await guest.json()).user.id;
    expect(bearer).toBeTruthy();
    await page.addInitScript((token) => {
      sessionStorage.setItem('scvm.tabSession', token);
    }, bearer);
    // Identity fixture replaces only the external Logto step; every handoff endpoint is real.
    await page.context().route('**/api/auth/oauth2/login/logto?*', (route) => {
      const returnTo = new URL(route.request().url()).searchParams.get(
        'returnTo'
      )!;
      return route.fulfill({ status: 302, headers: { location: returnTo } });
    });
    await page.goto('/faq');
    await page.addScriptTag({
      type: 'module',
      url: '/test/contracts/signIn.tsx',
    });
    await expect(page.getByTestId('receiving-user')).toHaveText(guestId);
    let opening = page.waitForEvent('popup');
    await page
      .getByRole('button', { name: 'Start sign-in', exact: true })
      .click();
    const cancelled = await opening;
    await expect(
      cancelled.getByRole('heading', { name: 'Approve Owlbear sign-in' })
    ).toBeVisible();
    await cancelled.close();
    await expect(page.getByRole('alert')).toContainText('popup-closed');
    await expect(page.getByTestId('receiving-user')).toHaveText(guestId);
    opening = page.waitForEvent('popup');
    await page
      .getByRole('button', { name: 'Start sign-in', exact: true })
      .click();
    const approval = await opening;
    await expect(
      approval.getByRole('textbox', { name: 'Code from the extension' })
    ).toBeVisible();
    const code = await page.getByTestId('comparison-code').textContent();
    await approval
      .getByRole('textbox', { name: 'Code from the extension' })
      .fill(code!);
    await approval
      .getByRole('button', { name: 'Approve sign-in', exact: true })
      .click();
    await expect(page.getByTestId('receiving-user')).toHaveText(
      testAuthUser!.userId
    );
    await expect.poll(() => approval.isClosed()).toBe(true);
  } finally {
    await guestContext.close();
  }
});
