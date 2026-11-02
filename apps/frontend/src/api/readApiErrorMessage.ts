const GENERIC_SERVER_ERROR = 'Interner Serverfehler';

type ApiErrorBody = {
  error?: string;
  message?: string;
  code?: string;
};

/**
 * Extract a user-visible error message from a failed API response.
 */
export async function readApiErrorMessage(
  res: Response,
  fallback = 'Request failed'
): Promise<string> {
  const status = res.status;
  let body: ApiErrorBody = {};

  try {
    body = (await res.json()) as ApiErrorBody;
  } catch {
    // non-JSON body
  }

  const detail = (body.error ?? body.message)?.trim();
  const codeSuffix = body.code ? ` (${body.code})` : '';

  if (detail && detail !== GENERIC_SERVER_ERROR) {
    return status >= 500 ? `${detail} (HTTP ${status})` : detail;
  }

  if (status === 413) {
    return 'Upload is too large for the server limit.';
  }

  if (status >= 500) {
    if (detail) {
      return `${detail} (HTTP ${status})`;
    }
    return `Server error (HTTP ${status}). Check backend logs for details.`;
  }

  if (detail) {
    return `${detail} (HTTP ${status})`;
  }

  return `${fallback} (HTTP ${status})${codeSuffix}`;
}
