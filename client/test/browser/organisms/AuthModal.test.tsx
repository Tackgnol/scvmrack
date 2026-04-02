import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { AuthModal } from '@/components/organisms/AuthModal';
import BrowserTestProvider from '../BrowserTestProvider';
import * as AuthContextModule from '@/hooks/useAuth';
import * as CharacterContextModule from '@/CharacterContext/CharacterContext';
import * as TurnstileModule from '@/hooks/useTurnstileChallenge';


vi.mock('@/hooks/useAuth', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@/CharacterContext/CharacterContext', () => ({
    useCharacter: vi.fn(),
}));

vi.mock('@/hooks/useTurnstileChallenge', () => ({
    useTurnstileChallenge: vi.fn(),
}));

vi.mock('@/router/navigation', () => ({
    buildHomeCallbackUrl: vi.fn().mockReturnValue('/mock-callback'),
    clearCurrentSearchParam: vi.fn(),
    getCurrentPendingClaimCharacterId: vi.fn().mockReturnValue(null),
    setCurrentPendingClaimCharacterId: vi.fn(),
    LOGGED_OUT_QUERY_PARAM: 'logged_out',
}));

vi.mock('@/analytics/googleAnalytics', () => ({
    trackEvent: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
    useRouterState: vi.fn().mockReturnValue({ location: { pathname: '/' } }),
    Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>,
}));

describe('AuthModal Component', () => {
    const mockSignIn = { mutateAsync: vi.fn(), isPending: false };
    const mockSignUp = { mutateAsync: vi.fn(), isPending: false };
    const mockSignOut = { mutateAsync: vi.fn(), isPending: false };
    const mockSignInMagicLink = { mutateAsync: vi.fn(), isPending: false };
    const mockForgotPassword = { mutateAsync: vi.fn(), isPending: false };

    const mockGenerateNew = vi.fn();
    const mockClaimCharacter = vi.fn();
    const mockOnClose = vi.fn();

    const renderModal = async (overrides = {}) => {
        const { auth = {}, character = {}, turnstile = {} } = overrides as any;

        vi.mocked(AuthContextModule.useAuth).mockReturnValue({
            isAuthenticated: false,
            isGuest: false,
            isAnonymous: true,
            user: null,
            signIn: mockSignIn,
            signUp: mockSignUp,
            signOut: mockSignOut,
            signInMagicLink: mockSignInMagicLink,
            forgotPassword: mockForgotPassword,
            ...auth,
        } as any);

        vi.mocked(CharacterContextModule.useCharacter).mockReturnValue({
            character: null,
            characterId: null,
            isJustLoggedOut: false,
            generateNew: mockGenerateNew,
            claimCharacter: mockClaimCharacter,
            ...character,
        } as any);

        vi.mocked(TurnstileModule.useTurnstileChallenge).mockReturnValue({
            token: 'mock-token',
            resetSignal: 0,
            onTokenChange: vi.fn(),
            reset: vi.fn(),
            ensureToken: vi.fn().mockReturnValue(true),
            ...turnstile,
        } as any);

        return render(
            <BrowserTestProvider>
                <AuthModal open={true} onClose={mockOnClose} />
            </BrowserTestProvider>
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Turnstile mock implicitly allowed because turnstileEnabled=false via env usually, or we assume true token
    });

    it('renders login form and submits signIn', async () => {
        await renderModal();

        const emailInput = page.getByTestId('login-email-input');
        const passInput = page.getByTestId('login-password-input');
        const submitBtn = page.getByTestId('login-submit-button');

        await userEvent.fill(emailInput, 'test@example.com');
        await userEvent.fill(passInput, 'password123');

        await userEvent.click(submitBtn);

        expect(mockSignIn.mutateAsync).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'test@example.com', password: 'password123' })
        );
    });

    it('renders signup form and submits signUp on tab switch', async () => {
        await renderModal();

        const signupTab = page.getByTestId('tab-signup');
        await userEvent.click(signupTab);

        const nameInput = page.getByTestId('signup-name-input');
        const emailInput = page.getByTestId('signup-email-input');
        const passInput = page.getByTestId('signup-password-input');
        const submitBtn = page.getByTestId('signup-submit-button');

        await userEvent.fill(nameInput, 'Tester');
        await userEvent.fill(emailInput, 'new@example.com');
        await userEvent.fill(passInput, 'password456');

        await userEvent.click(submitBtn);

        expect(mockSignUp.mutateAsync).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'new@example.com', password: 'password456', name: 'Tester' })
        );
    });

    it('requests magic link', async () => {
        await renderModal();

        const emailInput = page.getByTestId('login-email-input');
        await userEvent.fill(emailInput, 'magic@example.com');

        const magicBtn = page.getByTestId('magic-link-button');
        await userEvent.click(magicBtn);

        expect(mockSignInMagicLink.mutateAsync).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'magic@example.com' })
        );

        await expect.element(page.getByTestId('magic-link-sent-view')).toBeVisible();
    });

    it('requests password reset', async () => {
        await renderModal();

        const emailInput = page.getByTestId('login-email-input');
        await userEvent.fill(emailInput, 'reset@example.com');

        const forgotBtn = page.getByTestId('forgot-password-button');
        await userEvent.click(forgotBtn);

        expect(mockForgotPassword.mutateAsync).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'reset@example.com' })
        );

        await expect.element(page.getByTestId('reset-email-sent-view')).toBeVisible();
    });

    it('shows profile when authenticated', async () => {
        await renderModal({
            auth: { isAuthenticated: true, user: { name: 'VerifiedUser', email: 'verified@user.com', emailVerified: true } }
        });

        // Test Profile text is rendered
        await expect.element(page.getByText('VerifiedUser')).toBeVisible();
        await expect.element(page.getByText('verified@user.com')).toBeVisible();

        const logoutBtn = page.getByTestId('logout-button');
        await userEvent.click(logoutBtn);

        expect(mockSignOut.mutateAsync).toHaveBeenCalledOnce();
    });

    it('renders "Create New Character" when just logged out without character', async () => {
        await renderModal({
            character: { isJustLoggedOut: true, character: null }
        });

        const createNewBtn = page.getByTestId('create-new-character-button');
        await expect.element(createNewBtn).toBeVisible();

        await userEvent.click(createNewBtn);

        expect(mockGenerateNew).toHaveBeenCalledOnce();
        expect(mockOnClose).toHaveBeenCalledOnce();
    });
});
