import { describe, expect, it } from 'vitest';
import {
  getCharacterViewTransitionName,
  getViewTransitionTypes,
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

  it('classifies sheet-specific and general view transitions', () => {
    expect(getViewTransitionTypes('/characters', '/character/azor')).toEqual([
      'to-sheet',
    ]);
    expect(
      getViewTransitionTypes(
        '/party/p1/character/azor',
        '/party/p1/character/bork',
      ),
    ).toEqual(['sheet-swap']);
    expect(getViewTransitionTypes('/character/azor', '/print')).toEqual([
      'sheet-to-print',
    ]);
    expect(getViewTransitionTypes('/print', '/character/azor')).toEqual([
      'print-to-sheet',
    ]);
    expect(getViewTransitionTypes('/character/azor', '/faq')).toEqual([
      'from-sheet',
    ]);
    expect(getViewTransitionTypes('/faq', '/release')).toEqual([
      'page-change',
    ]);
    expect(getViewTransitionTypes(undefined, '/character/azor')).toBe(false);
  });

  it('gives the same character a stable shared-element name', () => {
    expect(getCharacterViewTransitionName('azor')).toBe('scvm-identity-azor');
    expect(getCharacterViewTransitionName(null)).toBe('none');
  });
});
