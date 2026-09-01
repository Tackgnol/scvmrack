import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import Footer from '@/components/molecules/Footer';
import BrowserTestProvider from '../BrowserTestProvider';
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
    await render(
      <BrowserTestProvider>
        <Footer onGenerateNew={mockOnGenerateNew} />
      </BrowserTestProvider>,
    );

    const btn = page.getByTestId('generate-new-button');
    await expect.element(btn).toBeVisible();

    await userEvent.click(btn);
    await expect.poll(() => mockOnGenerateNew).toHaveBeenCalledOnce();

    // Kill scvm shouldn't be here
    await expect
      .element(page.getByTestId('kill-scvm-button'))
      .not.toBeInTheDocument();
  });

  it('renders Kill Scvm button when provided and handles click', async () => {
    const mockOnGenerateNew = vi.fn();
    const mockOnKillScvm = vi.fn();

    await render(
      <BrowserTestProvider>
        <Footer
          onGenerateNew={mockOnGenerateNew}
          onKillScvm={mockOnKillScvm}
          generateNewLabel="Custom Gen"
        />
      </BrowserTestProvider>,
    );

    const genBtn = page.getByTestId('generate-new-button');
    await expect.element(genBtn).toBeVisible();
    expect(genBtn.element()?.textContent).toContain('Custom Gen');

    const killBtn = page.getByTestId('kill-scvm-button');
    await expect.element(killBtn).toBeVisible();

    await userEvent.click(killBtn);
    await expect.poll(() => mockOnKillScvm).toHaveBeenCalledOnce();
  });

  it('renders Get better when provided and handles click', async () => {
    const mockOnGenerateNew = vi.fn();
    const mockOnGetBetter = vi.fn();

    await render(
      <BrowserTestProvider>
        <Footer
          onGenerateNew={mockOnGenerateNew}
          onGetBetter={mockOnGetBetter}
        />
      </BrowserTestProvider>,
    );

    const getBetterBtn = page.getByTestId('get-better-button');
    await expect.element(getBetterBtn).toBeVisible();

    await userEvent.click(getBetterBtn);
    await expect.poll(() => mockOnGetBetter).toHaveBeenCalledOnce();
  });

  it('opens privacy drawer when legal notice link is clicked', async () => {
    const mockOnGenerateNew = vi.fn();
    await render(
      <BrowserTestProvider>
        <Footer onGenerateNew={mockOnGenerateNew} />
      </BrowserTestProvider>,
    );

    const privacyBtn = page.getByRole('button', { name: /privacy settings/i });
    await userEvent.click(privacyBtn);

    await expect
      .poll(() => privacyBus.requestOpenPrivacyDrawer)
      .toHaveBeenCalledOnce();
  });

  it('links the legal notice to the rpgtools suite', async () => {
    const mockOnGenerateNew = vi.fn();
    await render(
      <BrowserTestProvider>
        <Footer onGenerateNew={mockOnGenerateNew} />
      </BrowserTestProvider>,
    );

    await expect
      .element(page.getByRole('link', { name: /rpgtools\.co/i }))
      .toHaveAttribute('href', 'https://rpgtools.co');
  });
});
