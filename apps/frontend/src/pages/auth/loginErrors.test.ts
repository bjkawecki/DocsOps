import { describe, it, expect } from 'vitest';
import { getLoginErrorKeys, getLoginRedirectErrorKeys } from './loginErrors';

describe('loginErrors', () => {
  it('maps session-not-established to keys', () => {
    const display = getLoginErrorKeys(new Error('Session not established'));
    expect(display.titleKey).toBe('errors.loginFailedTitle');
    expect(display.messageKey).toBe('errors.sessionNotEstablishedMessage');
    expect(display.hintKey).toBe('errors.sessionNotEstablishedHint');
  });

  it('maps redirect reasons', () => {
    expect(getLoginRedirectErrorKeys('auth_required').titleKey).toBe('errors.signInRequiredTitle');
    expect(getLoginRedirectErrorKeys('session_expired').titleKey).toBe(
      'errors.sessionExpiredTitle'
    );
  });
});
