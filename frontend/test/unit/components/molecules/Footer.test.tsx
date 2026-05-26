import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import Footer from '@/components/molecules/Footer';
import UnitTestProvider from '../../UnitTestProvider';
import * as privacyBus from '@/privacy/privacyDrawerBus';

vi.mock('@/privacy/privacyDrawerBus', () => ({
    requestOpenPrivacyDrawer: vi.fn(),
}));

describe('Footer Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders default Generate New button and handles click', async () => {
        const mockOnGenerateNew = vi.fn();
        render(
            <UnitTestProvider>
                <Footer onGenerateNew={mockOnGenerateNew} />
            </UnitTestProvider>
        );
        const user = userEvent.setup();

        const btn = screen.getByTestId('generate-new-button');
        expect(btn).toBeVisible();

        await user.click(btn);
        await waitFor(() => expect(mockOnGenerateNew).toHaveBeenCalledOnce());

        // Kill scvm shouldn't be here
        expect(screen.queryByTestId('kill-scvm-button')).not.toBeInTheDocument();
    });

    it('renders Kill Scvm button when provided and handles click', async () => {
        const mockOnGenerateNew = vi.fn();
        const mockOnKillScvm = vi.fn();

        render(
            <UnitTestProvider>
                <Footer onGenerateNew={mockOnGenerateNew} onKillScvm={mockOnKillScvm} generateNewLabel="Custom Gen" />
            </UnitTestProvider>
        );
        const user = userEvent.setup();

        const genBtn = screen.getByTestId('generate-new-button');
        expect(genBtn).toBeVisible();
        expect(genBtn).toHaveTextContent('Custom Gen');

        const killBtn = screen.getByTestId('kill-scvm-button');
        expect(killBtn).toBeVisible();

        await user.click(killBtn);
        await waitFor(() => expect(mockOnKillScvm).toHaveBeenCalledOnce());
    });

    it('opens privacy drawer when legal notice link is clicked', async () => {
        const mockOnGenerateNew = vi.fn();
        render(
            <UnitTestProvider>
                <Footer onGenerateNew={mockOnGenerateNew} />
            </UnitTestProvider>
        );
        const user = userEvent.setup();

        const privacyBtn = screen.getByRole('button', { name: /privacy settings/i });
        await user.click(privacyBtn);

        await waitFor(() => expect(privacyBus.requestOpenPrivacyDrawer).toHaveBeenCalledOnce());
    });
});
