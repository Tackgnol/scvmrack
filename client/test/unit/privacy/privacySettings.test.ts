import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getDefaultPrivacySettings,
  getPrivacySettings,
  savePrivacySettings,
  isAnalyticsAllowed,
} from '../../../src/privacy/privacySettings';
import * as runtime from '../../../src/platform/runtime';

vi.mock('../../../src/platform/runtime', () => ({
  isBrowserRuntime: vi.fn(),
}));

describe('privacySettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('getDefaultPrivacySettings', () => {
    it('should return default settings', () => {
      expect(getDefaultPrivacySettings()).toEqual({
        acknowledged: false,
        analyticsEnabled: true,
      });
    });
  });

  describe('getPrivacySettings', () => {
    it('should return default settings if not in browser', () => {
      vi.mocked(runtime.isBrowserRuntime).mockReturnValue(false);
      expect(getPrivacySettings()).toEqual(getDefaultPrivacySettings());
    });

    it('should return default settings if localStorage is empty', () => {
      vi.mocked(runtime.isBrowserRuntime).mockReturnValue(true);
      expect(getPrivacySettings()).toEqual(getDefaultPrivacySettings());
    });

    it('should return saved settings from localStorage', () => {
      vi.mocked(runtime.isBrowserRuntime).mockReturnValue(true);
      const settings = { acknowledged: true, analyticsEnabled: false };
      localStorage.setItem('scvmgrinder-privacy-settings-v1', JSON.stringify(settings));
      expect(getPrivacySettings()).toEqual(settings);
    });

    it('should return default settings if localStorage content is invalid', () => {
      vi.mocked(runtime.isBrowserRuntime).mockReturnValue(true);
      localStorage.setItem('scvmgrinder-privacy-settings-v1', 'invalid-json');
      expect(getPrivacySettings()).toEqual(getDefaultPrivacySettings());
    });
  });

  describe('savePrivacySettings', () => {
    it('should save settings to localStorage if in browser', () => {
      vi.mocked(runtime.isBrowserRuntime).mockReturnValue(true);
      const settings = { acknowledged: true, analyticsEnabled: false };
      savePrivacySettings(settings);
      expect(localStorage.getItem('scvmgrinder-privacy-settings-v1')).toBe(JSON.stringify(settings));
    });

    it('should not save settings if not in browser', () => {
      vi.mocked(runtime.isBrowserRuntime).mockReturnValue(false);
      const settings = { acknowledged: true, analyticsEnabled: false };
      savePrivacySettings(settings);
      expect(localStorage.getItem('scvmgrinder-privacy-settings-v1')).toBeNull();
    });
  });

  describe('isAnalyticsAllowed', () => {
    it('should return true only if acknowledged and analyticsEnabled', () => {
      expect(isAnalyticsAllowed({ acknowledged: true, analyticsEnabled: true })).toBe(true);
      expect(isAnalyticsAllowed({ acknowledged: false, analyticsEnabled: true })).toBe(false);
      expect(isAnalyticsAllowed({ acknowledged: true, analyticsEnabled: false })).toBe(false);
      expect(isAnalyticsAllowed({ acknowledged: false, analyticsEnabled: false })).toBe(false);
    });
  });
});
