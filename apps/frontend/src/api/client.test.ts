import { describe, expect, it, vi } from 'vitest';
import { apiFetch } from './client';

describe('apiFetch', () => {
  it('does not set JSON Content-Type for FormData uploads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    const form = new FormData();
    form.append('file', new Blob(['x']), 'archive.tar.zst');

    await apiFetch('/api/v1/admin/restores/upload', { method: 'POST', body: form });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).not.toMatchObject({ 'Content-Type': 'application/json' });

    vi.unstubAllGlobals();
  });

  it('sets JSON Content-Type for string bodies', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await apiFetch('/api/v1/test', {
      method: 'POST',
      body: JSON.stringify({ ok: true }),
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });

    vi.unstubAllGlobals();
  });
});
