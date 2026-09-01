import { render } from 'vitest-browser-react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BrowserTestProvider from '../BrowserTestProvider';
import { CharacterPage } from '@/pages/CharacterPage';
import { useCharacter } from '@/CharacterContext/CharacterContext';
import type { ReactNode } from 'react';

const generateNew = vi.fn();
const killAndReplace = vi.fn();
const recoverInvalidCharacter = vi.fn();
const errorFeedbackMocks = vi.hoisted(() => ({
  showUnexpectedError: vi.fn(() => true),
  canReportUnexpectedError: true,
}));

function hookError(error: {
  statusCode: number;
  code?: string;
  message: string;
}): ReturnType<typeof useCharacter>['error'] {
  return error as unknown as ReturnType<typeof useCharacter>['error'];
}

vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mui/material')>();
  return {
    ...actual,
    useMediaQuery: vi.fn((query: string) =>
      query.includes('prefers-reduced-motion')
    ),
  };
});

vi.mock('@/seo/Seo', () => ({
  Seo: () => null,
}));

vi.mock('@/CharacterContext/CharacterContext', () => ({
  useCharacter: vi.fn(),
}));

vi.mock('@/components/molecules/feedback/ErrorFeedbackProvider', () => ({
  useErrorFeedback: () => errorFeedbackMocks,
}));

vi.mock('@/hooks/useEquipmentSections', () => ({
  isScrollItem: (item: { kind?: string }) => item.kind === 'scroll',
  isPetItem: (item: { kind?: string }) => item.kind === 'pet',
  isConsumableUseItem: (item: { kind?: string }) => item.kind === 'consumable',
}));

vi.mock('@/components/organisms/Abilities', () => ({
  Abilities: () => <section>Abilities Section</section>,
}));

vi.mock('@/components/organisms/StorageSection', () => ({
  BackpackSection: () => <section>Backpack Section</section>,
}));

vi.mock('@/components/molecules/character-descriptors/CharacterDescriptors', () => ({
  CharacterDescriptors: () => <section>Character Descriptors</section>,
}));

vi.mock('@/components/molecules/character/CharacterNameAndClass', () => ({
  CharacterNameAndClass: () => <section>Character Name And Class</section>,
}));

vi.mock('@/components/organisms/OnHandSection', () => ({
  OnHandSection: () => <section>On Hand Section</section>,
}));

vi.mock('@/components', () => ({
  ConsumableSection: () => <section>Consumable Section</section>,
  DeadStamp: ({ mainText, date }: { mainText: string; date: string }) => (
    <div>
      {mainText} {date}
    </div>
  ),
  EquippedBar: () => <section>Equipped Bar</section>,
  Footer: ({
    onGenerateNew,
    generateNewLabel,
    onKillScvm,
  }: {
    onGenerateNew: () => void;
    generateNewLabel?: string;
    onKillScvm?: () => void;
  }) => (
    <footer>
      <button onClick={onGenerateNew}>{generateNewLabel ?? 'Generate New'}</button>
      {onKillScvm && <button onClick={onKillScvm}>Kill Scvm</button>}
    </footer>
  ),
  ModalButton: ({
    children,
    onClick,
    ...props
  }: {
    children: ReactNode;
    onClick?: () => void;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  ModifiersPanel: () => <section>Modifiers Panel</section>,
  MorkBorgModal: ({
    open,
    title,
    children,
    actions,
  }: {
    open: boolean;
    title: string;
    children: ReactNode;
    actions?: ReactNode;
  }) =>
    open ? (
      <section role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {children}
        {actions}
      </section>
    ) : null,
  NoteSection: () => <section>Note Section</section>,
  PetSection: () => <section>Pet Section</section>,
  PowersSection: () => <section>Powers Section</section>,
  ResourceRow: () => <section>Resource Row</section>,
  SummaryBar: () => <section>Summary Bar</section>,
}));

describe('CharacterPage', () => {
  const renderCharacterPage = async (
    overrides: Partial<ReturnType<typeof useCharacter>> = {}
  ) => {
    vi.mocked(useCharacter).mockReturnValue({
      generateNew,
      killAndReplace,
      recoverInvalidCharacter,
      isAuthenticated: false,
      error: null,
      character: {
        id: 'char-1',
        name: 'Rot-Prone Sigrid',
        equipment: [],
        storage: [],
      },
      characterId: 'char-1',
      isLoading: false,
      isSessionExpired: false,
      ...overrides,
    } as ReturnType<typeof useCharacter>);

    return render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <BrowserTestProvider>
          <CharacterPage />
        </BrowserTestProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    errorFeedbackMocks.showUnexpectedError.mockReturnValue(true);
    errorFeedbackMocks.canReportUnexpectedError = true;
    localStorage.removeItem('scvmrack-skip-kill-confirm-v1');
  });

  it('offers a replacement when a requested character is not found', async () => {
    await renderCharacterPage({
      isAuthenticated: true,
      error: hookError({ statusCode: 404, message: 'Character not found' }),
      character: undefined,
      characterId: 'missing-char',
    });

    await expect
      .element(page.getByRole('dialog', { name: /scvm not found/i }))
      .toBeVisible();
    await userEvent.click(page.getByRole('button', { name: /generate new scvm/i }));

    expect(recoverInvalidCharacter).toHaveBeenCalled();
    expect(generateNew).not.toHaveBeenCalled();
    expect(killAndReplace).not.toHaveBeenCalled();
  });

  it('shows access denied separately from missing characters', async () => {
    await renderCharacterPage({
      isAuthenticated: true,
      error: hookError({
        statusCode: 403,
        code: 'CHARACTER_ACCESS_DENIED',
        message: "You don't have access to this scvm",
      }),
      character: undefined,
      characterId: 'forbidden-char',
    });

    await expect
      .element(page.getByRole('dialog', { name: /you don't have access to this scvm/i }))
      .toBeVisible();
    await expect.element(page.getByText(/belongs to another session or account/i)).toBeVisible();

    expect(document.body.textContent).not.toMatch(/scvm not found/i);
    expect(errorFeedbackMocks.showUnexpectedError).not.toHaveBeenCalled();
  });

  it('reports unexpected load errors without showing the not-found dialog', async () => {
    await renderCharacterPage({
      isAuthenticated: true,
      error: hookError({ statusCode: 500, code: 'INTERNAL_ERROR', message: 'Unexpected error occurred.' }),
      character: undefined,
      characterId: 'char-500',
    });

    await expect.poll(() => errorFeedbackMocks.showUnexpectedError).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500 }),
      expect.objectContaining({
        source: 'character_page',
        operation: 'load_character',
        characterId: 'char-500',
      })
    );
    expect(document.body.textContent).not.toMatch(/scvm not found/i);
  });

  it('renders a visible sheet skeleton while bootstrapping', async () => {
    await renderCharacterPage({
      character: undefined,
      characterId: null,
      isLoading: true,
    });

    const skeleton = page.getByTestId('character-sheet-skeleton');
    await expect.element(skeleton).toBeVisible();

    const skeletonElement = document.querySelector(
      '[data-testid="character-sheet-skeleton"]'
    );
    expect(skeletonElement).not.toBeNull();
    expect(getComputedStyle(skeletonElement!).backgroundColor).toBe(
      'rgb(10, 10, 10)'
    );
  });

  it('keeps unexpected load errors visible when the feedback provider is unavailable', async () => {
    errorFeedbackMocks.canReportUnexpectedError = false;

    await renderCharacterPage({
      isAuthenticated: true,
      error: hookError({ statusCode: 500, code: 'INTERNAL_ERROR', message: 'Unexpected error occurred.' }),
      character: undefined,
      characterId: 'char-500',
    });

    await expect
      .element(page.getByRole('dialog', { name: /failed to load character/i }))
      .toBeVisible();
    await expect.element(page.getByText(/unexpected error occurred/i)).toBeVisible();
    expect(document.body.textContent).not.toMatch(/scvm not found/i);
  });

  it('renders sheet composition and conditional inventory sections', async () => {
    await renderCharacterPage({
      character: {
        id: 'char-1',
        name: 'Rot-Prone Sigrid',
        equipment: [
          { kind: 'scroll', name: 'Psalm' },
          { kind: 'pet', name: 'Mule' },
          { kind: 'consumable', name: 'Torch' },
        ],
        storage: [{ name: 'Rope' }],
      } as unknown as ReturnType<typeof useCharacter>['character'],
    });

    await expect.element(page.getByText('Summary Bar')).toBeVisible();
    await expect.element(page.getByText('Resource Row')).toBeVisible();
    await expect.element(page.getByText('Equipped Bar')).toBeVisible();
    await expect.element(page.getByText('Character Name And Class')).toBeVisible();
    await expect.element(page.getByText('Abilities Section')).toBeVisible();
    await expect.element(page.getByText('Character Descriptors')).toBeVisible();
    await expect.element(page.getByText('Modifiers Panel')).toBeVisible();
    await expect.element(page.getByText('On Hand Section')).toBeVisible();
    await expect.element(page.getByText('Backpack Section')).toBeVisible();
    await expect.element(page.getByText('Powers Section')).toBeVisible();
    await expect.element(page.getByText('Pet Section')).toBeVisible();
    await expect.element(page.getByText('Consumable Section')).toBeVisible();
    await expect.element(page.getByText('Note Section')).toBeVisible();
  });

  it('kills and replaces directly for guest generate action', async () => {
    await renderCharacterPage({ isAuthenticated: false });

    await userEvent.click(page.getByRole('button', { name: /kill scvm/i }));

    expect(killAndReplace).toHaveBeenCalled();
    expect(generateNew).not.toHaveBeenCalled();
  });

  it('asks authenticated users to confirm before killing a character', async () => {
    await renderCharacterPage({ isAuthenticated: true });

    await userEvent.click(page.getByRole('button', { name: /kill scvm/i }));
    await expect
      .element(page.getByRole('dialog', { name: /kill this scvm/i }))
      .toBeVisible();

    await userEvent.click(page.getByTestId('kill-confirm-button'));

    expect(killAndReplace).toHaveBeenCalled();
  });

  it('skips the confirmation after opting out via "Don\'t show this again"', async () => {
    await renderCharacterPage({ isAuthenticated: true });

    // First kill: tick "Don't show this again", then confirm.
    await userEvent.click(page.getByRole('button', { name: /kill scvm/i }));
    await expect
      .element(page.getByRole('dialog', { name: /kill this scvm/i }))
      .toBeVisible();
    await userEvent.click(page.getByTestId('kill-confirm-dont-ask'));
    await userEvent.click(page.getByTestId('kill-confirm-button'));

    expect(killAndReplace).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('scvmrack-skip-kill-confirm-v1')).toBe('true');

    // Second kill: the dialog is skipped and the kill happens directly.
    await userEvent.click(page.getByRole('button', { name: /kill scvm/i }));

    expect(killAndReplace).toHaveBeenCalledTimes(2);
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });
});
