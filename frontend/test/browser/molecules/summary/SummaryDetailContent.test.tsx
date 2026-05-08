import { render } from 'vitest-browser-react';
import { expect, describe, it } from 'vitest';
import { page } from 'vitest/browser';
import SummaryDetailContent from '@/components/molecules/summary/SummaryDetailContent';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('SummaryDetailContent Browser', () => {
  const summaryMetrics = {
    agilityModifier: 1,
    strengthModifier: 2,
    presenceModifier: -1,
    toDodge: 11,
    toHitMelee: 14,
    toHitRanged: 11,
    dodgeBreakdown: { modifierTotal: 0, applicable: [] },
    meleeBreakdown: { modifierTotal: 0, applicable: [] },
    rangedBreakdown: { modifierTotal: 0, applicable: [] },
    encumbrance: 4,
    maxEncumbrance: 8,
    encumbranceItems: [{ key: 'item1', name: 'Item 1' }],
  };

  it('renders dodge breakdown when activeDetail is dodge', async () => {
    await render(
      <BrowserTestProvider>
        <SummaryDetailContent
          activeDetail="dodge"
          summaryMetrics={summaryMetrics as any}
          unknownOriginLabel="Unknown"
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Dodge DR')).toBeVisible();
    await expect.element(page.getByText('Target DR 11')).toBeVisible();

  });

  it('renders melee breakdown when activeDetail is melee', async () => {
    await render(
      <BrowserTestProvider>
        <SummaryDetailContent
          activeDetail="melee"
          summaryMetrics={summaryMetrics as any}
          unknownOriginLabel="Unknown"
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Melee DR')).toBeVisible();
    await expect.element(page.getByText('Target DR 14')).toBeVisible();

  });

  it('renders ranged breakdown when activeDetail is ranged', async () => {
    await render(
      <BrowserTestProvider>
        <SummaryDetailContent
          activeDetail="ranged"
          summaryMetrics={summaryMetrics as any}
          unknownOriginLabel="Unknown"
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Ranged DR')).toBeVisible();
    await expect.element(page.getByText('Target DR 11')).toBeVisible();

  });

  it('renders encumbrance breakdown when activeDetail is encumbrance', async () => {
    await render(
      <BrowserTestProvider>
        <SummaryDetailContent
          activeDetail="encumbrance"
          summaryMetrics={summaryMetrics as any}
          unknownOriginLabel="Unknown"
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('ENCUMBRANCE')).toBeVisible();
    await expect.element(page.getByText('4 / 8')).toBeVisible();
    await expect.element(page.getByText('Item 1')).toBeVisible();

  });

  it('renders null when activeDetail is null', async () => {
    const { container } = await render(
      <BrowserTestProvider>
        <SummaryDetailContent
          activeDetail={null}
          summaryMetrics={summaryMetrics as any}
          unknownOriginLabel="Unknown"
        />
      </BrowserTestProvider>
    );

    // BrowserTestProvider always renders a wrapper div, 
    // but the component itself should render nothing inside it.
    const wrapper = container.querySelector('.browser-test-wrapper');
    // The wrapper should have no visible elements besides the <style> tag from BrowserTestProvider
    // In Vitest Browser, the firstChild of the wrapper might be the style tag.
    // Let's check for any children that are NOT style or script
    const content = Array.from(wrapper?.children || []).filter(el => el.tagName !== 'STYLE' && el.tagName !== 'SCRIPT');
    expect(content.length).toBe(0);

  });
});
