import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useTurnstileChallenge } from '../../../src/hooks/useTurnstileChallenge';

describe('useTurnstileChallenge', () => {
    it('should manage token and reset signal when enabled', () => {
        const onMissingToken = vi.fn();
        const { result } = renderHook(() => useTurnstileChallenge({ enabled: true, onMissingToken }));

        expect(result.current.token).toBeNull();
        expect(result.current.resetSignal).toBe(0);

        // Ensure token fails when token is null and enabled is true
        expect(result.current.ensureToken()).toBe(false);
        expect(onMissingToken).toHaveBeenCalledTimes(1);

        // Update token
        act(() => {
            result.current.onTokenChange('test-token');
        });
        expect(result.current.token).toBe('test-token');
        expect(result.current.ensureToken()).toBe(true);

        // Reset
        act(() => {
            result.current.reset();
        });
        expect(result.current.token).toBeNull();
        expect(result.current.resetSignal).toBe(1);
    });

    it('should always allow ensureToken when disabled', () => {
        const onMissingToken = vi.fn();
        const { result } = renderHook(() => useTurnstileChallenge({ enabled: false, onMissingToken }));

        expect(result.current.token).toBeNull();
        expect(result.current.ensureToken()).toBe(true);
        expect(onMissingToken).not.toHaveBeenCalled();

        // Still should be able to set token
        act(() => {
            result.current.onTokenChange('another-token');
        });
        expect(result.current.token).toBe('another-token');
        expect(result.current.ensureToken()).toBe(true);
    });
});
