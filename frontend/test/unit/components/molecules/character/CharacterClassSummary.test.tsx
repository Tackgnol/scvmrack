import { render, screen } from '@testing-library/react';
import { expect, describe, it } from 'vitest';
import CharacterClassSummary from '@/components/molecules/character/CharacterClassSummary';
import UnitTestProvider from '../../../UnitTestProvider';

describe('CharacterClassSummary Unit', () => {
  it('renders label and class name', () => {
    render(
      <UnitTestProvider>
        <CharacterClassSummary label="CLASS" className="Fanged Deserter" />
      </UnitTestProvider>
    );

    expect(screen.getByText('CLASS')).toBeVisible();
    expect(screen.getByText('Fanged Deserter')).toBeVisible();

  });

  it('renders description when provided', () => {
    render(
      <UnitTestProvider>
        <CharacterClassSummary 
          label="CLASS" 
          className="Fanged Deserter" 
          classDescription="A coward who has seen too much."
        />
      </UnitTestProvider>
    );

    expect(screen.getByText('A coward who has seen too much.')).toBeVisible();

  });
});
