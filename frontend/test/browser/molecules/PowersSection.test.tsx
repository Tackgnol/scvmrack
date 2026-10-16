import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import PowersSection from '@/components/molecules/PowersSection';
import BrowserTestProvider from '../BrowserTestProvider';
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

        await render(
            <BrowserTestProvider>
                <PowersSection />
            </BrowserTestProvider>
        );

        // The Provider wrapper exists, but PowersSection renders nothing
        await expect.element(page.getByText('POWERS', { exact: false })).not.toBeInTheDocument();
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

        await render(
            <BrowserTestProvider>
                <PowersSection showLabel={true} />
            </BrowserTestProvider>
        );

        await expect.element(page.getByText('POWERS', { exact: false })).toBeVisible();
        await expect.element(page.getByText('Fireball', { exact: false })).toBeVisible();
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

        await render(
            <BrowserTestProvider>
                <PowersSection showLabel={false} />
            </BrowserTestProvider>
        );

        await expect.element(page.getByText('POWERS', { exact: false })).not.toBeInTheDocument();
        await expect.element(page.getByText('Fireball', { exact: false })).toBeVisible();
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

        await render(
            <BrowserTestProvider>
                <PowersSection />
            </BrowserTestProvider>
        );

        // find the pip button
        const firstPip = page.getByRole('button', {
            name: 'Mark used: Frost use 1',
            exact: true,
        });
        await expect.element(firstPip).toBeVisible();

        await userEvent.click(firstPip);

        await expect.poll(() => mockMarkPipPending).toHaveBeenCalledWith(5, 0);
    });

    it('keeps duplicate scrolls apart through reorder and removal (RPG-310)', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        const spent = { item: { name: 'Fireball', key: 's1' }, equipmentIndex: 0, uses: [true] };
        const fresh = { item: { name: 'Fireball', key: 's1' }, equipmentIndex: 1, uses: [false] };
        const scrolls = (scrollsWithIndices: typeof spent[]) =>
            vi.mocked(powersHook.usePowersSection).mockReturnValue({
                scrollsWithIndices, hasPendingPipSave: false, isPipPending: mockIsPipPending, markPipPending: mockMarkPipPending,
            } as never);
        const pips = () => page.getByRole('button', { name: /Fireball use 1$/ });

        scrolls([spent, fresh]);
        const screen = await render(<BrowserTestProvider><PowersSection /></BrowserTestProvider>);
        await expect.element(pips().nth(0)).toHaveAccessibleName('Mark unused: Fireball use 1');
        await expect.element(pips().nth(1)).toHaveAccessibleName('Mark used: Fireball use 1');

        scrolls([{ ...fresh, equipmentIndex: 0 }, { ...spent, equipmentIndex: 1 }]);
        await screen.rerender(<BrowserTestProvider><PowersSection /></BrowserTestProvider>);
        await expect.element(pips().nth(0)).toHaveAccessibleName('Mark used: Fireball use 1');
        await expect.element(pips().nth(1)).toHaveAccessibleName('Mark unused: Fireball use 1');

        scrolls([{ ...spent, equipmentIndex: 1 }]);
        await screen.rerender(<BrowserTestProvider><PowersSection /></BrowserTestProvider>);
        await expect.element(pips().nth(1)).not.toBeInTheDocument();
        await userEvent.click(pips());
        await expect.poll(() => mockMarkPipPending).toHaveBeenCalledWith(1, 0);

        expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(/same key/);
        consoleError.mockRestore();
    });
});
