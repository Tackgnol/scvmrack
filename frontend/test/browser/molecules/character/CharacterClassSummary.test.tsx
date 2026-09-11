import { render } from 'vitest-browser-react';
import { expect, describe, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import CharacterClassSummary from '@/components/molecules/character/CharacterClassSummary';
import BrowserTestProvider from '../../BrowserTestProvider';

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
