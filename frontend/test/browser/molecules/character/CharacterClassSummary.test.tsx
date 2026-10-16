import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import CharacterClassSummary from '@/components/molecules/character/CharacterClassSummary';
import type { ReactNode } from 'react';
import BrowserTestProvider from '../../BrowserTestProvider';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, search, ...props }: { children: ReactNode; to: string; search?: Record<string, string> }) => (
    <a href={to + (search ? `?${new URLSearchParams(search)}` : '')} {...props}>
      {children}
    </a>
  ),
}));

describe('CharacterClassSummary Browser', () => {
  it('renders label and class name', async () => {
    await render(
      <BrowserTestProvider>
        <CharacterClassSummary label="CLASS" className="Fanged Deserter" />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('CLASS')).toBeVisible();
    await expect.element(page.getByText('Fanged Deserter')).toBeVisible();

  });

  it('renders description when provided', async () => {
    await render(
      <BrowserTestProvider>
        <CharacterClassSummary 
          label="CLASS" 
          className="Fanged Deserter" 
          classDescription="A coward who has seen too much."
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('A coward who has seen too much.')).toBeVisible();

  });

  it('shows the moderation notice when class content was removed', async () => {
    await render(
      <BrowserTestProvider>
        <CharacterClassSummary
          label="CLASS"
          className="[removed by moderation]"
          classContentRemoved
        />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText("Some of this class's text was removed by moderation.")).toBeVisible();
  });
  it('links a public Custom Class to its report form', async () => {
    await render(
      <BrowserTestProvider>
        <CharacterClassSummary label="CLASS" className="Public Wretch" reportClassId={77} />
      </BrowserTestProvider>
    );

    await expect
      .element(page.getByRole('link', { name: 'Report a class' }))
      .toHaveAttribute('href', '/report?classId=77');
  });

  it('keeps the class action clickable', async () => {
    const onClick = vi.fn();

    await render(
      <BrowserTestProvider>
        <CharacterClassSummary
          label="CLASS"
          className="Fanged Deserter"
          action={<button onClick={onClick}>Get better</button>}
        />
      </BrowserTestProvider>
    );

    const action = page.getByRole('button', { name: 'Get better' });
    await expect.element(action).toBeVisible();
    await userEvent.click(action);
    await expect.poll(() => onClick).toHaveBeenCalledOnce();
  });
});
