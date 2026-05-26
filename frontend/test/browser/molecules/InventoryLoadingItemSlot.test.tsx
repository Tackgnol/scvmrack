import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import InventoryLoadingItemSlot from '@/components/molecules/InventoryLoadingItemSlot';
import BrowserTestProvider from '../BrowserTestProvider';

describe('InventoryLoadingItemSlot Browser', () => {
  it('updates the loading slot name while preserving its placeholder state', async () => {
    const { rerender } = await render(
      <BrowserTestProvider>
        <InventoryLoadingItemSlot name="MYSTERY ITEM" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('MYSTERY ITEM')).toBeVisible();
    
    // Check for glitch block placeholder
    await expect.element(page.getByText('██████')).toBeVisible();

    // Check for scan-line element presence
    await expect.element(page.getByTestId('scan-line')).toBeInTheDocument();

    await rerender(
      <BrowserTestProvider>
        <InventoryLoadingItemSlot name="LOADING ARMOR" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('LOADING ARMOR')).toBeVisible();
    await expect.element(page.getByText('MYSTERY ITEM')).not.toBeInTheDocument();

  });
});
