export type LoginRedirectReason = 'auth_required' | 'session_expired';

export type LoginErrorDisplayKeys = {
  titleKey: string;
  messageKey: string;
  hintKey?: string;
  messageParams?: Record<string, string>;
};

function isNetworkError(raw: string): boolean {
  return (
    raw === 'Failed to fetch' ||
    raw.includes('NetworkError') ||
    raw.toLowerCase().includes('load failed')
  );
}

/** Shown when redirecting to /login with an actionable reason (e.g. session expired). */
export function getLoginRedirectErrorKeys(reason: LoginRedirectReason): LoginErrorDisplayKeys {
  if (reason === 'session_expired') {
    return {
      titleKey: 'errors.sessionExpiredTitle',
      messageKey: 'errors.sessionExpiredMessage',
    };
  }
  return {
    titleKey: 'errors.signInRequiredTitle',
    messageKey: 'errors.signInRequiredMessage',
  };
}

/** User-facing i18n keys for login failures. */
export function getLoginErrorKeys(err: unknown): LoginErrorDisplayKeys {
  const raw = err instanceof Error ? err.message : String(err);

  if (isNetworkError(raw)) {
    return {
      titleKey: 'errors.loginFailedTitle',
      messageKey: 'errors.networkMessage',
    };
  }

  if (raw === 'Invalid credentials') {
    return {
      titleKey: 'errors.loginFailedTitle',
      messageKey: 'errors.invalidCredentialsMessage',
    };
  }

  if (raw === 'Session not established') {
    return {
      titleKey: 'errors.loginFailedTitle',
      messageKey: 'errors.sessionNotEstablishedMessage',
      hintKey: 'errors.sessionNotEstablishedHint',
    };
  }

  const httpMatch = /^HTTP_(\d+)$/.exec(raw);
  if (httpMatch) {
    return {
      titleKey: 'errors.loginFailedTitle',
      messageKey: 'errors.httpMessage',
      messageParams: { status: httpMatch[1] ?? '' },
      hintKey: 'errors.httpHint',
    };
  }

  return {
    titleKey: 'errors.loginFailedTitle',
    messageKey: 'errors.genericMessage',
  };
}
