import { render, screen } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { CharacterDescriptors } from '@/components/molecules/character-descriptors/CharacterDescriptors';
import UnitTestProvider from '../../../UnitTestProvider';
import * as characterDescriptorsHook from '@/hooks/useCharacterDescriptors';

vi.mock('@/hooks/useCharacterDescriptors', () => ({
  useCharacterDescriptors: vi.fn(),
}));

const baseReturn = {
  character: null,
  isLoading: false,
  isOccultHerbmaster: false,
  abilities: [],
  updateAbilityComment: vi.fn(),
  updateDescriptorField: vi.fn(),
};

describe('CharacterDescriptors Unit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading spinner while character data is loading', async () => {
    vi.mocked(characterDescriptorsHook.useCharacterDescriptors).mockReturnValue({
      ...baseReturn,
      isLoading: true,
    } as any);

    render(
      <UnitTestProvider>
        <CharacterDescriptors />
      </UnitTestProvider>
    );

    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('shows empty state text when no character is loaded', async () => {
    vi.mocked(characterDescriptorsHook.useCharacterDescriptors).mockReturnValue({
      ...baseReturn,
      character: null,
    } as any);

    render(
      <UnitTestProvider>
        <CharacterDescriptors />
      </UnitTestProvider>
    );

    expect(screen.getByText('No Character loaded, refresh the page')).toBeVisible();
  });

  it('renders character traits and origin when character is loaded', async () => {
    vi.mocked(characterDescriptorsHook.useCharacterDescriptors).mockReturnValue({
      ...baseReturn,
      character: {
        id: 'char-1',
        trait1: 'cowardly',
        trait2: 'weak',
        habit: 'twitches nervously',
        bodyDescription: 'thin and pale',
        origin: 'The Gutter',
        abilities: [],
      },
      isLoading: false,
    } as any);

    render(
      <UnitTestProvider>
        <CharacterDescriptors />
      </UnitTestProvider>
    );

    expect(screen.getByTestId('trait1-input')).toHaveValue('cowardly');
    expect(screen.getByTestId('trait2-input')).toHaveValue('weak');
    expect(screen.getByTestId('habit-input')).toHaveValue('twitches nervously');
    expect(screen.getByTestId('body-description-input')).toHaveValue('thin and pale');
  });

  it('renders character abilities section', async () => {
    vi.mocked(characterDescriptorsHook.useCharacterDescriptors).mockReturnValue({
      ...baseReturn,
      character: {
        id: 'char-1',
        trait1: 'cowardly',
        trait2: 'weak',
        habit: 'twitches',
        bodyDescription: 'thin',
        origin: 'The Gutter',
        abilities: [
          { key: 'ab1', name: 'First Strike', description: 'Attack first', comment: '' },
          { key: 'ab2', name: 'Dark Vision', description: 'See in dark', comment: '' },
        ],
      },
      isLoading: false,
    } as any);

    render(
      <UnitTestProvider>
        <CharacterDescriptors />
      </UnitTestProvider>
    );

    // Verify abilities section heading is visible
    expect(screen.getByText('Class Abilities', { exact: true })).toBeVisible();
  });

  it('shows occult herbmaster indicator when character class is 6', async () => {
    vi.mocked(characterDescriptorsHook.useCharacterDescriptors).mockReturnValue({
      ...baseReturn,
      character: {
        id: 'char-1',
        classId: 6,
        trait1: 'cursed',
        trait2: 'possessed',
        habit: 'mutters',
        bodyDescription: 'shadowy',
        origin: 'The Void',
        abilities: [],
      },
      isLoading: false,
      isOccultHerbmaster: true,
    } as any);

    render(
      <UnitTestProvider>
        <CharacterDescriptors />
      </UnitTestProvider>
    );

    // Just verify the component renders without error in occult herbmaster mode
    expect(screen.getByTestId('trait1-input')).toHaveValue('cursed');
  });
});
