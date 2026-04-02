import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTurnstileWidget } from '../../../src/hooks/useTurnstileWidget';

describe('useTurnstileWidget', () => {
    const siteKey = 'test-site-key';
    const onTokenChange = vi.fn();
    
    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.turnstile
        (window as any).turnstile = {
            render: vi.fn().mockReturnValue('widget-id-123'),
            reset: vi.fn(),
            remove: vi.fn(),
        };
        // Clean up head
        document.head.innerHTML = '';
    });

    afterEach(() => {
        delete (window as any).turnstile;
    });

    it('should render turnstile widget on mount', async () => {
        const { result } = renderHook(() => 
            useTurnstileWidget({ siteKey, onTokenChange, resetSignal: 0 })
        );

        const container = document.createElement('div');
        result.current.containerRef.current = container;

        await waitFor(() => {
            expect(window.turnstile?.render).toHaveBeenCalledWith(container, expect.objectContaining({
                sitekey: siteKey,
                theme: 'dark',
                size: 'normal'
            }));
        });
    });

    it('should handle token callbacks', async () => {
        let capturedOptions: any;
        (window.turnstile!.render as any).mockImplementation((container: any, options: any) => {
            capturedOptions = options;
            return 'widget-id-123';
        });

        const { result } = renderHook(() => 
            useTurnstileWidget({ siteKey, onTokenChange, resetSignal: 0 })
        );
        result.current.containerRef.current = document.createElement('div');

        await waitFor(() => expect(capturedOptions).toBeDefined());

        act(() => {
            capturedOptions.callback('new-token');
        });
        expect(onTokenChange).toHaveBeenCalledWith('new-token');

        act(() => {
            capturedOptions['expired-callback']();
        });
        expect(onTokenChange).toHaveBeenLastCalledWith(null);

        act(() => {
            capturedOptions['error-callback']();
        });
        expect(onTokenChange).toHaveBeenLastCalledWith(null);
    });

    it('should reset when resetSignal changes', async () => {
        const { result, rerender } = renderHook(
            ({ resetSignal }) => useTurnstileWidget({ siteKey, onTokenChange, resetSignal }),
            { initialProps: { resetSignal: 0 } }
        );
        result.current.containerRef.current = document.createElement('div');

        await waitFor(() => expect(window.turnstile?.render).toHaveBeenCalled());

        rerender({ resetSignal: 1 });

        expect(window.turnstile?.reset).toHaveBeenCalledWith('widget-id-123');
        expect(onTokenChange).toHaveBeenCalledWith(null);
    });

    it('should remove widget on unmount', async () => {
        const { result, unmount } = renderHook(() => 
            useTurnstileWidget({ siteKey, onTokenChange, resetSignal: 0 })
        );
        result.current.containerRef.current = document.createElement('div');

        await waitFor(() => expect(window.turnstile?.render).toHaveBeenCalled());

        unmount();

        expect(window.turnstile?.remove).toHaveBeenCalledWith('widget-id-123');
    });
});
