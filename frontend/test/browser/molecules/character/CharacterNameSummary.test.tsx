import { render } from 'vitest-browser-react';
import { expect, describe, it } from 'vitest';
import { page } from 'vitest/browser';
import CharacterNameSummary from '@/components/molecules/character/CharacterNameSummary';
import BrowserTestProvider from '../../BrowserTestProvider';

describe('CharacterNameSummary Browser', () => {
  const defaultProps = {
    label: 'NAME',
    name: 'Scum',
    trait1: 'cowardly',
    trait2: 'weak',
    classNameForTrait: 'Fanged Deserter',
  };

  it('renders label and name', async () => {
    await render(
      <BrowserTestProvider>
        <CharacterNameSummary {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect.element(page.getByText('NAME')).toBeVisible();
    await expect.element(page.getByText('Scum')).toBeVisible();

  });

  it('renders traits description via Trans', async () => {
    await render(
      <BrowserTestProvider>
        <CharacterNameSummary {...defaultProps} />
      </BrowserTestProvider>
    );

    await expect
      .element(page.getByText('Fanged Deserter: cowardly and weak', { exact: true }))
      .toBeVisible();

  });
});
