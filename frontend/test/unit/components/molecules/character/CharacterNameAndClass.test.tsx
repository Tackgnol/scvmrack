import { render, screen } from '@testing-library/react';
import { expect, describe, it, vi, beforeEach } from 'vitest';
import { CharacterNameAndClass } from '@/components/molecules/character/CharacterNameAndClass';
import UnitTestProvider from '../../../UnitTestProvider';
import * as characterNameAndClassHook from '@/hooks/useCharacterNameAndClass';

vi.mock('@/hooks/useCharacterNameAndClass', () => ({
  useCharacterNameAndClass: vi.fn(),
}));

const baseReturn = {
  character: null,
  isLoading: false,
  hasCharacter: false,
  noCharacterLoadedText: 'No Character loaded, refresh the page',
  nameLabel: 'Name',
  classLabel: 'Class',
  fallbackName: 'Unnamed Wretch',
  fallbackTrait1: 'mysterious',
  fallbackTrait2: 'unknown',
  fallbackTraitClass: 'wretch',
  fallbackClassName: 'Classless',
};

describe('CharacterNameAndClass Unit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading spinner while character data is loading', async () => {
    vi.mocked(characterNameAndClassHook.useCharacterNameAndClass).mockReturnValue({
      ...baseReturn,
      isLoading: true,
    } as any);

    render(
      <UnitTestProvider>
        <CharacterNameAndClass />
      </UnitTestProvider>
    );

    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('shows empty state text when no character is loaded', async () => {
    vi.mocked(characterNameAndClassHook.useCharacterNameAndClass).mockReturnValue({
      ...baseReturn,
      hasCharacter: false,
      character: null,
    } as any);

    render(
      <UnitTestProvider>
        <CharacterNameAndClass />
      </UnitTestProvider>
    );

    expect(screen.getByText('No Character loaded, refresh the page')).toBeVisible();
  });

  it('renders character name and class when a character is loaded', async () => {
    vi.mocked(characterNameAndClassHook.useCharacterNameAndClass).mockReturnValue({
      ...baseReturn,
      character: {
        id: 'char-1',
        name: 'Grim Harald',
        className: 'Fanged Deserter',
        classDescription: 'Gnaws on bones at the edge of doom.',
        trait1: null,
        trait2: null,
      },
      isLoading: false,
      hasCharacter: true,
    } as any);

    render(
      <UnitTestProvider>
        <CharacterNameAndClass />
      </UnitTestProvider>
    );

    expect(screen.getByText('Grim Harald')).toBeVisible();
    expect(screen.getByText('Fanged Deserter', { exact: true })).toBeVisible();
  });

  it('shows class description when present', async () => {
    vi.mocked(characterNameAndClassHook.useCharacterNameAndClass).mockReturnValue({
      ...baseReturn,
      character: {
        id: 'char-2',
        name: 'Bertha',
        className: 'Gutterborn Scvm',
        classDescription: 'Born in a gutter, dies in a gutter.',
        trait1: null,
        trait2: null,
      },
      isLoading: false,
      hasCharacter: true,
    } as any);

    render(
      <UnitTestProvider>
        <CharacterNameAndClass />
      </UnitTestProvider>
    );

    expect(screen.getByText('Born in a gutter, dies in a gutter.')).toBeVisible();
  });

  it('falls back to i18n strings when name and class are missing', async () => {
    vi.mocked(characterNameAndClassHook.useCharacterNameAndClass).mockReturnValue({
      ...baseReturn,
      character: {
        id: 'char-3',
        name: null,
        className: null,
        classDescription: undefined,
        trait1: null,
        trait2: null,
      },
      isLoading: false,
      hasCharacter: true,
    } as any);

    render(
      <UnitTestProvider>
        <CharacterNameAndClass />
      </UnitTestProvider>
    );

    expect(screen.getByText('Unnamed Wretch')).toBeVisible();
    expect(screen.getByText('Classless')).toBeVisible();
  });
});
