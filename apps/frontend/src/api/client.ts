/**
 * API-Basis-URL: Szenario B (eine Origin) = leer oder window.location.origin.
 * Caddy routet /api → Backend, gleiche Domain → Cookie wird mitgeschickt.
 */
const getBase = (): string => {
  const env = import.meta.env.VITE_API_URL;
  if (env !== undefined && env !== '') return env;
  return '';
};

export const apiBase = getBase();

function shouldSetJsonContentType(body: RequestInit['body']): boolean {
  if (body == null || body === '') return false;
  if (typeof FormData !== 'undefined' && body instanceof FormData) return false;
  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) return false;
  if (typeof Blob !== 'undefined' && body instanceof Blob) return false;
  if (body instanceof ArrayBuffer) return false;
  if (ArrayBuffer.isView(body)) return false;
  return typeof body === 'string';
}

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const url = path.startsWith('http') ? path : `${apiBase}${path}`;
  return fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      ...(shouldSetJsonContentType(init?.body) && { 'Content-Type': 'application/json' }),
      ...init?.headers,
    },
  });
}
