import type { PrismaClient } from '../../../../generated/prisma/client.js';
import { Readable } from 'node:stream';
import { assertDemoMutationsAllowed } from '../../../config/demoModeGuard.js';
import { initStorage } from '../../../infrastructure/storage/index.js';
import { PLATFORM_IMPORT_RECEIVE_PATH_PREFIX } from './platformImportReceiveService.js';

export class PlatformExportPushError extends Error {
  constructor(
    message: string,
    readonly statusCode: number = 400
  ) {
    super(message);
    this.name = 'PlatformExportPushError';
  }
}

/**
 * Receive URLs must be https, or http only for localhost / *.local (dev).
 */
export function assertAllowedPlatformPushReceiveUrl(urlString: string): URL {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new PlatformExportPushError('Invalid receive URL');
  }

  if (!url.pathname.startsWith(PLATFORM_IMPORT_RECEIVE_PATH_PREFIX)) {
    throw new PlatformExportPushError(
      `Receive URL path must start with ${PLATFORM_IMPORT_RECEIVE_PATH_PREFIX}`
    );
  }

  if (url.protocol === 'https:') {
    return url;
  }

  if (url.protocol === 'http:') {
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')) {
      return url;
    }
    throw new PlatformExportPushError(
      'HTTP receive URLs are only allowed for localhost or *.local hosts'
    );
  }

  throw new PlatformExportPushError('Receive URL must use https (or http for localhost)');
}

/**
 * Stream a succeeded export archive from MinIO to the target receive URL.
 */
export async function pushPlatformExportToReceiveUrl(
  prisma: PrismaClient,
  args: { platformExportRunId: string; receiveUrl: string }
): Promise<{ ok: true; bytesPushed: number | null }> {
  assertDemoMutationsAllowed();

  const receiveUrl = assertAllowedPlatformPushReceiveUrl(args.receiveUrl);
  const run = await prisma.platformExportRun.findUnique({
    where: { id: args.platformExportRunId },
  });
  if (!run) {
    throw new PlatformExportPushError('Platform export not found', 404);
  }
  if (run.status !== 'succeeded' || !run.localObjectKey) {
    throw new PlatformExportPushError('Export archive is not available for push');
  }

  const storage = await initStorage();
  if (!storage) {
    throw new PlatformExportPushError('MinIO is not configured or unreachable', 503);
  }
  const object = await storage.getObject(run.localObjectKey);
  if (!object) {
    throw new PlatformExportPushError('Export archive object not found in storage', 404);
  }

  const body = Readable.toWeb(object.Body) as unknown as BodyInit;
  const headers: Record<string, string> = {
    'Content-Type': object.ContentType ?? 'application/octet-stream',
  };

  let response: Response;
  try {
    response = await fetch(receiveUrl.toString(), {
      method: 'PUT',
      headers,
      body,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new PlatformExportPushError(`Failed to reach target receive URL: ${message}`, 502);
  }

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const json = (await response.json()) as { error?: string };
      if (json.error) detail = json.error;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new PlatformExportPushError(`Target rejected push (${response.status}): ${detail}`, 502);
  }

  return {
    ok: true as const,
    bytesPushed: run.sizeBytes != null ? Number(run.sizeBytes) : null,
  };
}
