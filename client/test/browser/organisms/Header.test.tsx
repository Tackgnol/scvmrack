import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import Header from '@/components/organisms/Header';
import BrowserTestProvider from '../BrowserTestProvider';
import * as AuthContextModule from '@/hooks/useAuth';
import * as CharacterContextModule from '@/CharacterContext/CharacterContext';
import * as SessionExpiredFlagModule from '@/hooks/useSessionExpiredFlag';
import { $api } from '@/api';

vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@/CharacterContext/CharacterContext', () => ({
    useCharacter: vi.fn(),
}));

vi.mock('@/hooks/useSessionExpiredFlag', () => ({
    useSessionExpiredFlag: vi.fn(),
}));

vi.mock('@/api', () => ({
    $api: {
        useQuery: vi.fn(),
    },
}));

vi.mock('@/router/navigation', () => ({
    buildHomeCallbackUrl: vi.fn().mockReturnValue('/home'),
    buildPrintCallbackUrl: vi.fn().mockReturnValue('/print'),
    getCurrentPendingClaimCharacterId: vi.fn(),
    setCurrentPendingClaimCharacterId: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
    useRouterState: vi.fn().mockImplementation((opts) => {
        const state = { location: { pathname: '/' } };
        return opts?.select ? opts.select(state) : state;
    }),
    Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

// Mock AuthModal inside organisms, since we will test it separately
vi.mock('@/components/organisms/AuthModal', () => ({
    AuthModal: ({ open, onClose }: any) => (
        open ? <div data-testid="mock-auth-modal"><button onClick={onClose}>Close</button></div> : null
    ),
}));

vi.mock('@/router/history', () => ({
    appHistory: { push: vi.fn() },
}));

describe('Header Component', () => {
    const mockClearSessionExpiredFlag = vi.fn();

    const renderHeader = async (overrides = {}) => {
        const { auth = {}, character = {}, session = {}, queryReturn = undefined as any } = overrides as any;

        vi.mocked(AuthContextModule.useAuth).mockReturnValue({
            isAuthenticated: false,
            user: null,
            ...auth,
        } as any);

        vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
            isSaving: false,
            isJustLoggedOut: false,
            character: null,
            characterId: null,
            lastCharacterId: null,
            ...character,
        } as any);

        vi.mocked(SessionExpiredFlagModule.useSessionExpiredFlag).mockReturnValue({
            isSessionExpired: false,
            clearSessionExpiredFlag: mockClearSessionExpiredFlag,
            ...session,
        } as any);

        vi.mocked($api.useQuery).mockReturnValue({
            data: queryReturn,
        } as any);

        return render(
            <BrowserTestProvider>
                <Header />
            </BrowserTestProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Header title and top bar interactions correctly', async () => {
        await renderHeader();

        const title = page.getByTestId('app-title');
        await expect.element(title).toBeInTheDocument();
        
        const printBtn = page.getByTestId('header-print-button');
        await expect.element(printBtn).toBeVisible();
    });

    it('displays the saving chip when isSaving is true', async () => {
        await renderHeader({ character: { isSaving: true } });

        const savingChip = page.getByTestId('saving-chip');
        // Wait for it because showSaving has a 140ms delay
        await expect.element(savingChip).toBeVisible();
    });

    it('displays the synced chip when isSaving is false', async () => {
        await renderHeader({ character: { isSaving: false } });

        const syncedChip = page.getByTestId('synced-chip');
        await expect.element(syncedChip).toBeVisible();
    });

    it('opens Auth Modal when profile icon is clicked', async () => {
        await renderHeader();

        const authBtn = page.getByTestId('auth-button');
        await userEvent.click(authBtn);

        const modal = page.getByTestId('mock-auth-modal');
        await expect.element(modal).toBeVisible();
    });

    it('shows total count if query data exists', async () => {
        await renderHeader({
            queryReturn: { total: 42 }
        });

        const badge = page.getByTestId('scvm-count-badge');
        await expect.element(badge).toBeVisible();
        await expect.element(badge).toHaveTextContent(/42 SCVMS/i);
    });
});
