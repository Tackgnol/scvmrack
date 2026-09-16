import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, expect, test, vi } from 'vitest';

const navMocks = vi.hoisted(() => ({
  token: null as string | null,
  clearCurrentSearchParam: vi.fn(async (_param: string) => {}),
}));

const authClientMocks = vi.hoisted(() => ({
  redeemObrExchangeToken: vi.fn(async (_token: string) => {}),
}));

vi.mock('@/router/navigation', () => ({
  OBR_EXCHANGE_TOKEN_QUERY_PARAM: 'obrExchangeToken',
  getCurrentSearchParamValue: (param: string) =>
    param === 'obrExchangeToken' ? navMocks.token : null,
  clearCurrentSearchParam: navMocks.clearCurrentSearchParam,
}));

vi.mock('@/auth/obrAuthClient', () => ({
  obrAuthClient: {
    redeemObrExchangeToken: authClientMocks.redeemObrExchangeToken,
  },
}));

vi.mock('@/pages/CharacterPage', () => ({
  CharacterPage: () => <div>Character sheet</div>,
}));

vi.mock('@/components/molecules/character/CharacterSheetSkeleton', () => ({
  CharacterSheetSkeleton: () => <div>Loading sheet</div>,
}));

import { ObrExchangeRedeemGate } from '../../../src/components/obr/ObrExchangeRedeemGate.tsx';

function renderGate() {
  const queryClient = new QueryClient();
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
  render(
    <QueryClientProvider client={queryClient}>
      <ObrExchangeRedeemGate />
    </QueryClientProvider>,
  );
  return { invalidateQueries };
}

beforeEach(() => {
  navMocks.token = null;
  navMocks.clearCurrentSearchParam.mockClear();
  authClientMocks.redeemObrExchangeToken.mockClear();
  authClientMocks.redeemObrExchangeToken.mockResolvedValue(undefined);
});

test('renders the character page immediately when there is no pending token', () => {
  navMocks.token = null;

  renderGate();

  expect(screen.getByText('Character sheet')).toBeTruthy();
  expect(authClientMocks.redeemObrExchangeToken).not.toHaveBeenCalled();
});

test('redeems a pending obr-exchange token, invalidates the session, then loads the character (RPG-57)', async () => {
  navMocks.token = 'exchange-token-1';

  const { invalidateQueries } = renderGate();

  expect(screen.getByText('Loading sheet')).toBeTruthy();
  expect(screen.queryByText('Character sheet')).toBeNull();

  await waitFor(() => {
    expect(authClientMocks.redeemObrExchangeToken).toHaveBeenCalledWith(
      'exchange-token-1',
    );
  });
  expect(invalidateQueries).toHaveBeenCalledWith({
    queryKey: ['auth', 'session'],
  });
  expect(navMocks.clearCurrentSearchParam).toHaveBeenCalledWith(
    'obrExchangeToken',
  );

  await waitFor(() => {
    expect(screen.getByText('Character sheet')).toBeTruthy();
  });
});

test('still proceeds to the character page if redeeming the token fails', async () => {
  navMocks.token = 'expired-token';
  authClientMocks.redeemObrExchangeToken.mockRejectedValue(
    new Error('token expired'),
  );

  renderGate();

  await waitFor(() => {
    expect(navMocks.clearCurrentSearchParam).toHaveBeenCalledWith(
      'obrExchangeToken',
    );
  });
  await waitFor(() => {
    expect(screen.getByText('Character sheet')).toBeTruthy();
  });
});
