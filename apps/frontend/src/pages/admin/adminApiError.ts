import type { TFunction } from 'i18next';

type ApiErrorBody = { error?: string; code?: string };

export class AdminApiError extends Error {
  readonly code: string | undefined;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AdminApiError';
    this.code = code;
  }
}

/** Parse a failed admin API response into AdminApiError (with optional stable code). */
export async function throwAdminApiError(res: Response): Promise<never> {
  const body = (await res.json().catch(() => ({}))) as ApiErrorBody;
  throw new AdminApiError(body.error ?? res.statusText, body.code);
}

/** Prefer i18n for known codes; fall back to server message. */
export function adminApiErrorMessage(t: TFunction<'admin'>, error: Error): string {
  const code = error instanceof AdminApiError ? error.code : undefined;
  if (code) {
    const key = `shared.errors.${code}`;
    const translated = t(key, { defaultValue: '' });
    if (translated) return translated;
  }
  return error.message;
}
