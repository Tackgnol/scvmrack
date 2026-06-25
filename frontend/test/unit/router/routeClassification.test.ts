import { describe, expect, it } from 'vitest';
import {
  isPartyCharacterRoutePath,
  isSheetRoutePath,
} from '@/router/routeClassification';

describe('route classification', () => {
  it('keeps the character create route out of the sheet fallback', () => {
    expect(isSheetRoutePath('/character/create')).toBe(false);
    expect(isSheetRoutePath('/character/create/')).toBe(false);
  });

  it('treats real sheet routes as sheet routes', () => {
    expect(isSheetRoutePath('/character')).toBe(true);
    expect(isSheetRoutePath('/character/new')).toBe(true);
    expect(isSheetRoutePath('/character/azor')).toBe(true);
    expect(isSheetRoutePath('/party/p1/character/azor')).toBe(true);
  });

  it('detects party character routes exactly', () => {
    expect(isPartyCharacterRoutePath('/party/p1/character/azor')).toBe(true);
    expect(isPartyCharacterRoutePath('/party/p1/character/azor/edit')).toBe(
      false,
    );
  });
});
