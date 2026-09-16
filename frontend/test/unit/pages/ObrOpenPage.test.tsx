import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    navigate: vi.fn(async (_path: string) => {}),
    redeem: vi.fn(async (_token: string) => {}),
    useAuth: vi.fn((_options: { bootstrapAnonymous: boolean }) => ({})),
}));

vi.mock('@/api', () => ({
    authKeys: { session: () => ['auth', 'session'] },
}));

vi.mock('@/auth/obrAuthClient', () => ({
    obrAuthClient: { redeemObrExchangeToken: mocks.redeem },
}));

vi.mock('@/hooks/useAuth', () => ({ useAuth: mocks.useAuth }));
vi.mock('@/router/history', () => ({
    appHistory: { replace: mocks.navigate },
}));

import { ObrOpenPage } from '../../../src/pages/ObrOpenPage';

function renderPage() {
    const queryClient = new QueryClient();
    const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
    render(
        <QueryClientProvider client={queryClient}>
            <ObrOpenPage />
        </QueryClientProvider>
    );
    return { invalidateQueries };
}

beforeEach(() => {
    window.history.replaceState({}, '', '/obr-open?token=exchange-token&character=character-1');
    mocks.navigate.mockClear();
    mocks.redeem.mockClear();
    mocks.redeem.mockResolvedValue(undefined);
    mocks.useAuth.mockClear();
});

test('redeems the token, scrubs it, and opens the carried character', async () => {
    const { invalidateQueries } = renderPage();

    expect(screen.getByText('Opening your scvm…')).toBeTruthy();
    expect(mocks.useAuth).toHaveBeenCalledWith({ bootstrapAnonymous: false });

    await waitFor(() => {
        expect(mocks.redeem).toHaveBeenCalledWith('exchange-token');
    });
    expect(window.location.search).toBe('?character=character-1');
    expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: ['auth', 'session'],
    });
    expect(mocks.navigate).toHaveBeenCalledWith('/character/character-1');
});

test('scrubs an expired token and tells the user to retry from Owlbear', async () => {
    mocks.redeem.mockRejectedValue(new Error('expired'));

    renderPage();

    await waitFor(() => {
        expect(
            screen.getByText('This link has expired or was already used. Go back to Owlbear and try again.')
        ).toBeTruthy();
    });
    expect(window.location.search).toBe('?character=character-1');
    expect(mocks.navigate).not.toHaveBeenCalled();
});

test('does not redeem an incomplete handoff URL', async () => {
    window.history.replaceState({}, '', '/obr-open?character=character-1');

    renderPage();

    await waitFor(() => {
        expect(
            screen.getByText('This link has expired or was already used. Go back to Owlbear and try again.')
        ).toBeTruthy();
    });
    expect(mocks.redeem).not.toHaveBeenCalled();
    expect(mocks.navigate).not.toHaveBeenCalled();
});
