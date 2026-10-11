import { expect, test } from '../../fixtures';

test('signed-out visitors can read the legal and reporting pages', async ({ page, request }) => {
  for (const [path, title] of [
    ['/terms', 'Terms of Service'],
    ['/legal', 'Legal and contact'],
    ['/privacy', 'Privacy notice'],
    ['/report', 'Report a class'],
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
  }

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  const sitemapXml = await sitemap.text();
  for (const path of ['/terms', '/legal', '/privacy']) {
    expect(sitemapXml).toContain(`https://scvmrack.rpgtools.co${path}</loc>`);
  }

  const robots = await request.get('/robots.txt');
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain('Allow: /');
});

for (const path of ['/privacy', '/obr.html']) {
  test(`first visit to ${path} loads local fonts without contacting Google Fonts`, async ({ page }) => {
    const externalFontRequests: string[] = [];
    page.on('request', request => {
      if (/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//.test(request.url())) {
        externalFontRequests.push(request.url());
      }
    });

    await page.goto(path);
    for (const family of ['Bebas Neue', 'MedievalSharp', 'Alegreya', 'Antonio', 'Caveat Brush', 'Black Ops One']) {
      const loadedLocally = await page.evaluate(async name => {
        const faces = await document.fonts.load(`16px "${name}"`);
        return faces.some(face => face.status === 'loaded');
      }, family);
      expect(loadedLocally, `${family} should load on ${path}`).toBe(true);
    }
    expect(externalFontRequests).toEqual([]);
  });
}
