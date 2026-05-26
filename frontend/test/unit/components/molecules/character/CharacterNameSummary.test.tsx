import { render, screen } from '@testing-library/react';
import { expect, describe, it } from 'vitest';
import CharacterNameSummary from '@/components/molecules/character/CharacterNameSummary';
import UnitTestProvider from '../../../UnitTestProvider';

describe('CharacterNameSummary Unit', () => {
  const defaultProps = {
    label: 'NAME',
    name: 'Scum',
    trait1: 'cowardly',
    trait2: 'weak',
    classNameForTrait: 'Fanged Deserter',
  };

  it('renders label and name', () => {
    render(
      <UnitTestProvider>
        <CharacterNameSummary {...defaultProps} />
      </UnitTestProvider>
    );

    expect(screen.getByText('NAME')).toBeVisible();
    expect(screen.getByText('Scum')).toBeVisible();

  });

  it('renders traits description via Trans', () => {
    render(
      <UnitTestProvider>
        <CharacterNameSummary {...defaultProps} />
      </UnitTestProvider>
    );

    // In en.json, character.traitDescription might be something like 
    // "A {{trait1}} and {{trait2}} {{className}}"
    // Let's check for the fragments
    expect(screen.getByText('cowardly', { exact: false })).toBeVisible();
    expect(screen.getByText('weak', { exact: false })).toBeVisible();
    expect(screen.getByText('Fanged Deserter', { exact: false })).toBeVisible();

  });
});
