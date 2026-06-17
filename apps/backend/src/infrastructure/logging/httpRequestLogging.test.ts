import { describe, it, expect, afterEach } from 'vitest';
import { shouldDisableHttpRequestLogging } from './httpRequestLogging.js';

describe('shouldDisableHttpRequestLogging', () => {
  afterEach(() => {
    delete process.env.LOG_HTTP_REQUESTS;
  });

  it('disables logging for health and maintenance status by default', () => {
    expect(shouldDisableHttpRequestLogging({ url: '/ready' } as never)).toBe(true);
    expect(shouldDisableHttpRequestLogging({ url: '/health' } as never)).toBe(true);
    expect(shouldDisableHttpRequestLogging({ url: '/api/v1/maintenance/status' } as never)).toBe(
      true
    );
  });

  it('logs normal API routes by default', () => {
    expect(shouldDisableHttpRequestLogging({ url: '/api/v1/me' } as never)).toBe(false);
  });

  it('disables all request logs when LOG_HTTP_REQUESTS=false', () => {
    process.env.LOG_HTTP_REQUESTS = 'false';
    expect(shouldDisableHttpRequestLogging({ url: '/api/v1/me' } as never)).toBe(true);
  });

  it('logs quiet paths when LOG_HTTP_REQUESTS=true', () => {
    process.env.LOG_HTTP_REQUESTS = 'true';
    expect(shouldDisableHttpRequestLogging({ url: '/ready' } as never)).toBe(false);
  });
});
