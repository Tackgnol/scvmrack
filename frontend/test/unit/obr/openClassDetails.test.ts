import { afterEach, expect, it, vi } from 'vitest';
import { openClassDetails } from '@/obr/openClassDetails';

afterEach(() => vi.restoreAllMocks());

it('does not issue an identity token when the browser blocks the new tab', async () => {
  vi.spyOn(window, 'open').mockReturnValue(null);
  const issue = vi.fn(async () => 'unused-token');
  await expect(openClassDetails(17, issue)).rejects.toThrow('popup-blocked');
  expect(issue).not.toHaveBeenCalled();
});

it('closes the reserved tab when the identity handoff cannot be issued', async () => {
  const popup = { opener: window, close: vi.fn(), location: { replace: vi.fn() } };
  vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
  const issue = vi.fn(async (): Promise<string> => { throw new Error('session-expired'); });
  await expect(openClassDetails(17, issue)).rejects.toThrow('session-expired');
  expect(popup.close).toHaveBeenCalledOnce();
  expect(popup.location.replace).not.toHaveBeenCalled();
});
