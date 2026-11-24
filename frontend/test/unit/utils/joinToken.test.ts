import { describe, expect, it } from 'vitest';
import { getJoinToken } from '@/utils/joinToken';

describe('getJoinToken', () => {
  it('reads a normal token from the join and forge paths', () => {
    expect(getJoinToken('/join/V7U1DML0H1FVE5VNJKCWLQ')).toBe('V7U1DML0H1FVE5VNJKCWLQ');
    expect(getJoinToken('/join/qa-placeholder/forge')).toBe('qa-placeholder');
  });

  it('returns null when there is no token', () => {
    expect(getJoinToken('/join/')).toBeNull();
    expect(getJoinToken('/elsewhere')).toBeNull();
  });

  it('refuses tokens that cannot be a real invite so the invalid-invite message shows', () => {
    expect(getJoinToken('/join/%00')).toBeNull();
    expect(getJoinToken('/join/..%2F..%2Fetc%2Fpasswd')).toBeNull();
    expect(getJoinToken('/join/%E0%A4%A')).toBeNull();
    expect(getJoinToken(`/join/${'a'.repeat(5000)}`)).toBeNull();
    expect(getJoinToken('/join/%F0%9F%98%88')).toBeNull();
  });
});
