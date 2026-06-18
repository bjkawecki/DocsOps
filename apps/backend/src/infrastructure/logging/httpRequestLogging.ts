import type { FastifyRequest } from 'fastify';

/** Probe and high-frequency read routes — not logged unless LOG_HTTP_REQUESTS=true. */
const QUIET_HTTP_PATHS = new Set(['/ready', '/health', '/api/v1/maintenance/status']);

function requestPath(req: FastifyRequest): string {
  return (req.url ?? '').split('?')[0] ?? '';
}

/**
 * Fastify `disableRequestLogging` callback.
 * - unset: skip quiet paths only
 * - LOG_HTTP_REQUESTS=false: skip all request logs
 * - LOG_HTTP_REQUESTS=true: log every request (debug)
 */
export function shouldDisableHttpRequestLogging(req: FastifyRequest): boolean {
  const mode = process.env.LOG_HTTP_REQUESTS?.trim().toLowerCase();
  if (mode === 'false' || mode === '0' || mode === 'no') return true;
  if (mode === 'true' || mode === '1' || mode === 'yes') return false;
  return QUIET_HTTP_PATHS.has(requestPath(req));
}
