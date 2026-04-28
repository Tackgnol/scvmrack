import { render } from 'vitest-browser-react';
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import DeadStamp from '@/components/organisms/stamp/DeadStamp';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('DeadStamp Browser', () => {
  it('renders the default dead stamp with generated date and distress filter', async () => {
    await render(
      <BrowserTestProvider>
        <DeadStamp />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText('DEAD')).toBeVisible();

    const svg = document.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 500 240');
    expect(svg?.style.maxWidth).toBe('500px');

    const filter = document.querySelector('filter#stamp-distress');
    expect(filter).not.toBeNull();
    expect(filter?.querySelector('feTurbulence')?.getAttribute('baseFrequency')).toBe('0.07');
    expect(filter?.querySelector('feDisplacementMap')?.getAttribute('scale')).toBe('3.5');

    const stampGroup = document.querySelector('g[filter="url(#stamp-distress)"]');
    expect(stampGroup).not.toBeNull();

    const dateText = [...document.querySelectorAll('text')]
      .map((text) => text.textContent)
      .find((text) => /^[A-Z]{3} \d{2} \d{4}$/.test(text ?? ''));
    expect(dateText).toBeDefined();
  });

  it('passes custom text, colors, date, and width through stamp layers', async () => {
    await render(
      <BrowserTestProvider>
        <DeadStamp
          mainText="DOOMED"
          date="APR 28 2026"
          mainColor="#111111"
          dateColor="#ff0033"
          maxWidthPx={320}
        />
      </BrowserTestProvider>,
    );

    await expect.element(page.getByText('DOOMED')).toBeVisible();
    await expect.element(page.getByText('APR 28 2026')).toBeVisible();

    expect(document.querySelector('svg')?.style.maxWidth).toBe('320px');

    const borders = [...document.querySelectorAll('.stamp-container rect')];
    expect(borders).toHaveLength(2);
    expect(borders[0]?.getAttribute('stroke')).toBe('#111111');
    expect(borders[0]?.getAttribute('stroke-width')).toBe('8');
    expect(borders[0]?.getAttribute('stroke-dasharray')).toBe('25, 2, 15, 1, 30, 3');
    expect(borders[1]?.getAttribute('stroke')).toBe('#111111');
    expect(borders[1]?.getAttribute('stroke-width')).toBe('3');
    expect(borders[1]?.getAttribute('stroke-dasharray')).toBe('10, 4, 20, 2');

    const textNodes = [...document.querySelectorAll('.stamp-typography text')];
    expect(textNodes).toHaveLength(2);
    expect(textNodes[0]?.getAttribute('fill')).toBe('#111111');
    expect(textNodes[0]?.getAttribute('font-size')).toBe('105');
    expect(textNodes[0]?.getAttribute('letter-spacing')).toBe('8');
    expect(textNodes[1]?.getAttribute('fill')).toBe('#ff0033');
    expect(textNodes[1]?.getAttribute('font-size')).toBe('46');
    expect(textNodes[1]?.getAttribute('letter-spacing')).toBe('8');
  });
});
