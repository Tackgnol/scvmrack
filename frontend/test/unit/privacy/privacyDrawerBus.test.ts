import { describe, it, expect, vi } from 'vitest';
import { subscribeOpenPrivacyDrawer, requestOpenPrivacyDrawer } from '../../../src/privacy/privacyDrawerBus';

describe('privacyDrawerBus', () => {
  it('should call listeners when requestOpenPrivacyDrawer is called', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeOpenPrivacyDrawer(listener);

    requestOpenPrivacyDrawer();
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    requestOpenPrivacyDrawer();
    expect(listener).toHaveBeenCalledTimes(1); // Still 1 because it was unsubscribed
  });

  it('should handle multiple listeners', () => {
    const l1 = vi.fn();
    const l2 = vi.fn();
    subscribeOpenPrivacyDrawer(l1);
    subscribeOpenPrivacyDrawer(l2);

    requestOpenPrivacyDrawer();
    expect(l1).toHaveBeenCalled();
    expect(l2).toHaveBeenCalled();
  });
});
