import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page } from 'vitest/browser';
import { Container } from '@mui/material';
import { Abilities } from '@/components/organisms/Abilities';
import BrowserTestProvider from '../BrowserTestProvider';
import * as CharacterContextModule from '@/CharacterContext/CharacterContext';

vi.mock('@/CharacterContext/CharacterContext', () => ({
  useCharacter: vi.fn(),
}));

describe('Abilities Component', () => {
  beforeEach(() => {
    vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
      character: {
        id: 'test-char',
        abilities: [],
      },
    } as any);
  });

  it('renders title and ability grid layout', async () => {
    await render(
      <BrowserTestProvider>
        <Abilities />
      </BrowserTestProvider>
    );

    // "ABILITIES" from translator fallback
    await expect.element(page.getByText('ABILITIES', { exact: false })).toBeVisible();
  });

  it.each([360, 320])('fits a %ipx phone without horizontal scroll', async (width) => {
    await page.viewport(width, 800);
    await render(
      <BrowserTestProvider>
        <Container maxWidth="md">
          <Abilities />
        </Container>
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('ABILITIES', { exact: false })).toBeVisible();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth
    );
  });
});
