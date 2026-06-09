import { render } from 'vitest-browser-react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import BrowserTestProvider from '../BrowserTestProvider';
import { CharactersListPage } from '@/pages/CharactersListPage';
import { $api } from '@/api';
import { useAuth } from '@/hooks/useAuth';
import { useCharacter } from '@/CharacterContext/CharacterContext';
import { appHistory } from '@/router/history';
import { useQueryClient } from '@tanstack/react-query';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

type MockLinkProps = {
  children: ReactNode;
  to: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

const removeQueries = vi.fn();
const refetch = vi.fn();
const mutateAsync = vi.fn();
const generateNew = vi.fn();
const setCharacterId = vi.fn();

vi.mock('@/seo/Seo', () => ({
  Seo: () => null,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: MockLinkProps) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(),
}));

vi.mock('@components/index', () => ({
  AnimatedNumber: ({ value }: { value: number }) => <span>{value}</span>,
}));

vi.mock('@/api', () => ({
  $api: {
    useQuery: vi.fn(),
    useMutation: vi.fn(),
  },
  getCsrfToken: vi.fn().mockResolvedValue('test-csrf-token'),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/CharacterContext/CharacterContext', () => ({
  useCharacter: vi.fn(),
}));

vi.mock('@/router/history', () => ({
  appHistory: {
    push: vi.fn().mockResolvedValue({ type: 'PUSHED' }),
    flush: vi.fn(),
  },
}));

vi.mock('@/router/navigation', () => ({
  buildHomeCallbackUrl: vi.fn((characterId: string | null) =>
    characterId ? `/character/${characterId}` : '/character/new'
  ),
  navigateToSessionExpired: vi.fn(),
}));

describe('CharactersListPage', () => {
  const renderCharactersList = async ({
    isAuthenticated = true,
    isGuest = false,
    query = {},
    character = {},
  }: {
    isAuthenticated?: boolean;
    isGuest?: boolean;
    query?: Record<string, unknown>;
    character?: Record<string, unknown>;
  } = {}) => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated,
      isGuest,
    } as ReturnType<typeof useAuth>);
    vi.mocked(useCharacter).mockReturnValue({
      characterId: 'char-1',
      lastCharacterId: 'last-char',
      setCharacterId,
      generateNew,
      ...character,
    } as unknown as ReturnType<typeof useCharacter>);
    vi.mocked(useQueryClient).mockReturnValue({
      removeQueries,
    } as unknown as ReturnType<typeof useQueryClient>);
    vi.mocked($api.useQuery).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch,
      ...query,
    } as unknown as ReturnType<typeof $api.useQuery>);
    vi.mocked($api.useMutation).mockReturnValue({
      mutateAsync,
    } as unknown as ReturnType<typeof $api.useMutation>);

    return render(
      <BrowserTestProvider>
        <CharactersListPage />
      </BrowserTestProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    refetch.mockResolvedValue(undefined);
    mutateAsync.mockResolvedValue(undefined);
    setCharacterId.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a login warning for guest users', async () => {
    await renderCharactersList({ isAuthenticated: false, isGuest: true });

    await expect
      .element(page.getByTestId('characters-guest-warning'))
      .toBeVisible();
    await expect
      .element(page.getByRole('link', { name: /back to home/i }))
      .toHaveAttribute('href', '/');
  });

  it('shows loading, query error, and empty states', async () => {
    await renderCharactersList({
      query: {
        isLoading: true,
        error: { statusCode: 400, message: 'Failed to load characters' },
        data: [],
      },
    });

    await expect.element(page.getByRole('progressbar')).toBeVisible();
    await expect.element(page.getByText(/failed to load characters/i)).toBeVisible();
    await expect.element(page.getByText(/no characters yet/i)).toBeVisible();
    await expect
      .element(page.getByRole('link', { name: /create character/i }))
      .toHaveAttribute('href', '/character/new');
  });

  it('renders saved characters and opens one through app history', async () => {
    const dateFormatter = vi
      .spyOn(Date.prototype, 'toLocaleDateString')
      .mockImplementation((locale) =>
        locale === 'en' ? 'Jun 7, 2026, 4:51 PM' : '7 cze 2026, 16:51'
      );

    await renderCharactersList({
      query: {
        data: [
          {
            id: 'char-2',
            name: 'Rot-Prone Sigrid',
            className: 'Gutterborn Scvm',
            currentHp: 3,
            maxHp: 7,
            updatedAt: '2026-01-20T12:00:00.000Z',
          },
        ],
      },
    });

    await expect.element(page.getByText('Rot-Prone Sigrid')).toBeVisible();
    await expect.element(page.getByText('Gutterborn Scvm')).toBeVisible();
    await expect.element(page.getByText('Jun 7, 2026, 4:51 PM')).toBeVisible();
    expect(dateFormatter).toHaveBeenCalledWith(
      'en',
      expect.objectContaining({
        month: 'short',
      })
    );
    expect($api.useQuery).toHaveBeenCalledWith(
      'get',
      '/api/characters',
      { params: { query: { locale: 'en' } } },
      expect.objectContaining({ enabled: true })
    );

    await userEvent.click(page.getByRole('button', { name: /open/i }));

    await expect.poll(() => appHistory.push).toHaveBeenCalledWith(
      '/character/char-2'
    );
    expect(appHistory.flush).toHaveBeenCalled();
  });

  it('navigates after create-new succeeds', async () => {
    generateNew.mockImplementation((_classId, options) => {
      options.onSuccess('created-char');
    });

    await renderCharactersList();
    await userEvent.click(page.getByRole('button', { name: /generate new/i }));

    expect(generateNew).toHaveBeenCalled();
    await expect.poll(() => appHistory.push).toHaveBeenCalledWith(
      '/character/created-char'
    );
  });

  it('shows a create error when create-new fails', async () => {
    generateNew.mockImplementation((_classId, options) => {
      options.onError({ statusCode: 400, message: 'Pick another class' });
    });

    await renderCharactersList();
    await userEvent.click(page.getByRole('button', { name: /generate new/i }));

    await expect.element(page.getByText(/pick another class/i)).toBeVisible();
  });

  it('shows a fallback create error when unexpected reporting is unavailable', async () => {
    generateNew.mockImplementation((_classId, options) => {
      options.onError({
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Unexpected error occurred.',
      });
    });

    await renderCharactersList();
    await userEvent.click(page.getByRole('button', { name: /generate new/i }));

    await expect.element(page.getByText(/unexpected error occurred/i)).toBeVisible();
  });

  it('does not delete when confirmation is cancelled', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    await renderCharactersList({
      query: {
        data: [{ id: 'char-2', name: 'Doomed', className: 'Fanged Deserter' }],
      },
    });
    await userEvent.click(page.getByRole('button', { name: /delete/i }));

    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('deletes the active character, clears it, and refetches the list', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    await renderCharactersList({
      query: {
        data: [{ id: 'char-1', name: 'Doomed', className: 'Fanged Deserter' }],
      },
    });
    await userEvent.click(page.getByRole('button', { name: /delete/i }));

    await expect.poll(() => mutateAsync).toHaveBeenCalledWith({
      params: { path: { id: 'char-1' } },
    });
    expect(removeQueries).toHaveBeenCalled();
    await expect.poll(() => setCharacterId).toHaveBeenCalledWith(null);
    expect(refetch).toHaveBeenCalled();
  });

  it('shows a delete error when deletion fails', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mutateAsync.mockRejectedValueOnce({
      statusCode: 403,
      message: 'You do not own this character',
    });

    await renderCharactersList({
      query: {
        data: [{ id: 'char-2', name: 'Doomed', className: 'Fanged Deserter' }],
      },
    });
    await userEvent.click(page.getByRole('button', { name: /delete/i }));

    await expect.element(page.getByText(/you do not own this character/i)).toBeVisible();
  });

  it('shows a fallback delete error when unexpected reporting is unavailable', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    mutateAsync.mockRejectedValueOnce({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Unexpected error occurred.',
    });

    await renderCharactersList({
      query: {
        data: [{ id: 'char-2', name: 'Doomed', className: 'Fanged Deserter' }],
      },
    });
    await userEvent.click(page.getByRole('button', { name: /delete/i }));

    await expect.element(page.getByText(/failed to delete character/i)).toBeVisible();
  });
});
