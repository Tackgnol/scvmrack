import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import PowersSection from '@/components/molecules/PowersSection';
import UnitTestProvider from '../../UnitTestProvider';
import * as powersHook from '@/hooks/usePowersSection';

vi.mock('@/hooks/usePowersSection', () => ({
    usePowersSection: vi.fn(),
}));

describe('PowersSection Component', () => {
    const mockMarkPipPending = vi.fn();
    const mockIsPipPending = vi.fn().mockReturnValue(false);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders null when there are no scrolls', async () => {
        vi.mocked(powersHook.usePowersSection).mockReturnValue({
            scrollsWithIndices: [],
            hasPendingPipSave: false,
            isPipPending: mockIsPipPending,
            markPipPending: mockMarkPipPending,
        } as any);

        render(
            <UnitTestProvider>
                <PowersSection />
            </UnitTestProvider>
        );

        // The Provider wrapper exists, but PowersSection renders nothing
        expect(screen.queryByText('POWERS', { exact: false })).toBeNull();
    });

    it('renders scrolls and shows label when showLabel is true', async () => {
        vi.mocked(powersHook.usePowersSection).mockReturnValue({
            scrollsWithIndices: [
                { item: { name: 'Fireball', key: 's1', description: 'burns' }, equipmentIndex: 2, uses: [false] }
            ],
            hasPendingPipSave: false,
            isPipPending: mockIsPipPending,
            markPipPending: mockMarkPipPending,
        } as any);

        render(
            <UnitTestProvider>
                <PowersSection showLabel={true} />
            </UnitTestProvider>
        );

        expect(screen.getByText('POWERS', { exact: false })).toBeTruthy();
        expect(screen.getByText('Fireball', { exact: false })).toBeTruthy();
    });

    it('renders scrolls and hides label when showLabel is false', async () => {
        vi.mocked(powersHook.usePowersSection).mockReturnValue({
            scrollsWithIndices: [
                { item: { name: 'Fireball', key: 's1', description: 'burns' }, equipmentIndex: 2, uses: [false] }
            ],
            hasPendingPipSave: false,
            isPipPending: mockIsPipPending,
            markPipPending: mockMarkPipPending,
        } as any);

        render(
            <UnitTestProvider>
                <PowersSection showLabel={false} />
            </UnitTestProvider>
        );

        expect(screen.queryByText('POWERS', { exact: false })).toBeNull();
        expect(screen.getByText('Fireball', { exact: false })).toBeTruthy();
    });

    it('interactions with TrackedUseRow trigger pip marking', async () => {
        vi.mocked(powersHook.usePowersSection).mockReturnValue({
            scrollsWithIndices: [
                { item: { name: 'Frost', description: 'freezes' }, equipmentIndex: 5, uses: [false, false] }
            ],
            hasPendingPipSave: false,
            isPipPending: mockIsPipPending,
            markPipPending: mockMarkPipPending,
        } as any);

        render(
            <UnitTestProvider>
                <PowersSection />
            </UnitTestProvider>
        );

        const user = userEvent.setup();
        // find the pip button
        const firstPip = screen.getByRole('button', {
            name: 'Mark used: Frost use 1',
            exact: true,
        });
        expect(firstPip).toBeTruthy();

        await user.click(firstPip);

        await waitFor(() => expect(mockMarkPipPending).toHaveBeenCalledWith(5, 0));
    });
});
