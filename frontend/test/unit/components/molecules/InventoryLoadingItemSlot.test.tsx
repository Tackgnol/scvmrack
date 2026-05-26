import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InventoryLoadingItemSlot from '@/components/molecules/InventoryLoadingItemSlot';
import UnitTestProvider from '../../UnitTestProvider';

describe('InventoryLoadingItemSlot', () => {
  it('updates the loading slot name while preserving its placeholder state', async () => {
    const { rerender } = render(
      <UnitTestProvider>
        <InventoryLoadingItemSlot name="MYSTERY ITEM" />
      </UnitTestProvider>
    );

    expect(screen.getByText('MYSTERY ITEM')).toBeTruthy();
    
    // Check for glitch block placeholder
    expect(screen.getByText('██████')).toBeTruthy();

    // Check for scan-line element presence
    expect(screen.getByTestId('scan-line')).toBeTruthy();

    rerender(
      <UnitTestProvider>
        <InventoryLoadingItemSlot name="LOADING ARMOR" />
      </UnitTestProvider>
    );

    expect(screen.getByText('LOADING ARMOR')).toBeTruthy();
    expect(screen.queryByText('MYSTERY ITEM')).toBeNull();
  });
});
