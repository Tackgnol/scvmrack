import '@/utils/googleTranslateGuard';
import { describe, expect, it } from 'vitest';

describe('googleTranslateGuard', () => {
    it('does not throw when the reference node was moved out of its parent', () => {
        const parent = document.createElement('div');
        const stray = document.createElement('font');
        expect(() => parent.insertBefore(document.createElement('span'), stray)).not.toThrow();
    });

    it('does not throw when removing a node that is no longer a child', () => {
        const parent = document.createElement('div');
        expect(() => parent.removeChild(document.createElement('span'))).not.toThrow();
    });

    it('still inserts normally', () => {
        const parent = document.createElement('div');
        const first = document.createElement('i');
        parent.appendChild(first);
        const added = document.createElement('b');
        parent.insertBefore(added, first);
        expect(parent.firstChild).toBe(added);
    });
});
