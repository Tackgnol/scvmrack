import { render } from 'vitest-browser-react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { SnackbarProvider, useSnackbar } from '@/SnackbarContext/SnackbarProvider';
import BrowserTestProvider from './BrowserTestProvider';

// Test-only consumer components
function InfoConsumer() {
  const { showSnackbar } = useSnackbar();
  return (
    <button type="button" onClick={() => showSnackbar('Task completed', 'info')}>
      Show Info
    </button>
  );
}

function ErrorConsumer() {
  const { showError } = useSnackbar();
  return (
    <button type="button" onClick={() => showError('Something went wrong')}>
      Show Error
    </button>
  );
}

function ActionConsumer({ onAction }: { onAction: () => void }) {
  const { showSnackbar } = useSnackbar();
  return (
    <button
      type="button"
      onClick={() =>
        showSnackbar('Saved', 'success', {
          action: { label: 'Undo', onClick: onAction },
          autoHideDuration: null,
        })
      }
    >
      Show With Action
    </button>
  );
}

describe('SnackbarProvider Browser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children without showing a snackbar', async () => {
    await render(
      <BrowserTestProvider>
        <SnackbarProvider>
          <p>Child content</p>
        </SnackbarProvider>
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('Child content')).toBeVisible();
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
  });

  it('shows an info snackbar when showSnackbar is called', async () => {
    await render(
      <BrowserTestProvider>
        <SnackbarProvider>
          <InfoConsumer />
        </SnackbarProvider>
      </BrowserTestProvider>
    );

    await userEvent.click(page.getByRole('button', { name: 'Show Info' }));

    await expect.element(page.getByText('Task completed')).toBeVisible();
  });

  it('shows an error snackbar when showError is called', async () => {
    await render(
      <BrowserTestProvider>
        <SnackbarProvider>
          <ErrorConsumer />
        </SnackbarProvider>
      </BrowserTestProvider>
    );

    await userEvent.click(page.getByRole('button', { name: 'Show Error' }));

    await expect.element(page.getByText('Something went wrong')).toBeVisible();
  });

  it('renders an action button inside the snackbar when an action is provided', async () => {
    const onAction = vi.fn();

    await render(
      <BrowserTestProvider>
        <SnackbarProvider>
          <ActionConsumer onAction={onAction} />
        </SnackbarProvider>
      </BrowserTestProvider>
    );

    await userEvent.click(page.getByRole('button', { name: 'Show With Action' }));

    await expect.element(page.getByRole('button', { name: 'Undo' })).toBeVisible();
  });

  it('calls the action handler and closes the snackbar when action button is clicked', async () => {
    const onAction = vi.fn();

    await render(
      <BrowserTestProvider>
        <SnackbarProvider>
          <ActionConsumer onAction={onAction} />
        </SnackbarProvider>
      </BrowserTestProvider>
    );

    await userEvent.click(page.getByRole('button', { name: 'Show With Action' }));
    await expect.element(page.getByRole('button', { name: 'Undo' })).toBeVisible();

    await userEvent.click(page.getByRole('button', { name: 'Undo' }));

    await expect.poll(() => onAction).toHaveBeenCalledOnce();
    await expect.element(page.getByText('Saved')).not.toBeInTheDocument();
  });
});
