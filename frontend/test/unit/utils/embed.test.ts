import { afterEach, describe, expect, it } from 'vitest';
import {
  EMBEDDED_SESSION_HEADER,
  embeddedSessionHeaders,
  isEmbedded,
} from '@/utils/embed';

describe('embed detection', () => {
  const originalTop = window.top;

  afterEach(() => {
    Object.defineProperty(window, 'top', {
      value: originalTop,
      configurable: true,
    });
  });

  it('reports not embedded and sends no marker at top level', () => {
    expect(isEmbedded()).toBe(false);
    expect(embeddedSessionHeaders()).toEqual({});
  });

  it('reports embedded and sends the marker when framed', () => {
    Object.defineProperty(window, 'top', {
      value: {} as Window,
      configurable: true,
    });

    expect(isEmbedded()).toBe(true);
    expect(embeddedSessionHeaders()).toEqual({
      [EMBEDDED_SESSION_HEADER]: '1',
    });
  });
});
