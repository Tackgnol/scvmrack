import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isBrowserRuntime, getRuntimeOrigin, getRuntimeDocumentTitle } from '../../../src/platform/runtime';

describe('runtime platform utils', () => {
  const originalDocument = global.document;

  afterEach(() => {
    global.document = originalDocument;
  });

  describe('isBrowserRuntime', () => {
    it('should return true if document is defined', () => {
      global.document = {} as any;
      expect(isBrowserRuntime()).toBe(true);
    });

    it('should return false if document is undefined', () => {
      // @ts-ignore
      global.document = undefined;
      expect(isBrowserRuntime()).toBe(false);
    });
  });

  describe('getRuntimeOrigin', () => {
    it('should return origin if in browser', () => {
      global.document = {
        location: {
          origin: 'http://localhost:3000'
        }
      } as any;
      expect(getRuntimeOrigin()).toBe('http://localhost:3000');
    });

    it('should return undefined if not in browser', () => {
      // @ts-ignore
      global.document = undefined;
      expect(getRuntimeOrigin()).toBeUndefined();
    });
  });

  describe('getRuntimeDocumentTitle', () => {
    it('should return title if in browser', () => {
      global.document = {
        title: 'Mork Borg'
      } as any;
      expect(getRuntimeDocumentTitle()).toBe('Mork Borg');
    });

    it('should return empty string if not in browser', () => {
      // @ts-ignore
      global.document = undefined;
      expect(getRuntimeDocumentTitle()).toBe('');
    });
  });
});
