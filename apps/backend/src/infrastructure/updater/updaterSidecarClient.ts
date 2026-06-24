export function isUpdaterConfigured(): boolean {
  const url = process.env.DOCSOPS_UPDATER_URL?.trim();
  const token = process.env.DOCSOPS_UPDATER_TOKEN?.trim();
  return Boolean(url && token);
}

export function getUpdateApplyTimeoutSeconds(): number {
  const raw = process.env.DOCSOPS_UPDATE_APPLY_TIMEOUT_SECONDS;
  if (raw == null || raw.trim() === '') return 600;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 60) return 600;
  return n;
}

export async function applyUpdateViaSidecar(releaseTag: string): Promise<void> {
  const baseUrl = process.env.DOCSOPS_UPDATER_URL?.trim();
  const token = process.env.DOCSOPS_UPDATER_TOKEN?.trim();
  if (!baseUrl || !token) {
    throw new Error('Updater sidecar is not configured');
  }

  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/internal/apply`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'docsops',
    },
    body: JSON.stringify({ version: releaseTag }),
    signal: AbortSignal.timeout(15_000),
  });

  if (res.status !== 202) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `Updater sidecar returned ${res.status}${body ? `: ${body.slice(0, 500)}` : ''}`
    );
  }
}
