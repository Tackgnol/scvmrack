import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import OriginSection from '@/components/molecules/character-descriptors/OriginSection';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('OriginSection Browser', () => {
  it('renders origin text', async () => {
    await render(
      <BrowserTestProvider>
        <OriginSection origin="From the valley." onChangeOrigin={vi.fn()} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('From the valley.')).toBeVisible();

  });

  it('triggers onChangeOrigin when text is changed', async () => {
    const onChangeOrigin = vi.fn();
    await render(
      <BrowserTestProvider>
        <OriginSection origin="" onChangeOrigin={onChangeOrigin} />
      </BrowserTestProvider>
    );

    const input = page.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.fill(input, 'New origin');

    await expect.poll(() => onChangeOrigin).toHaveBeenCalledWith('New origin');

  });
});
