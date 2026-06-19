export class AppVersionNotConfiguredError extends Error {
  constructor() {
    super(
      'APP_VERSION is not set. Production images derive it from root package.json at build time; local dev/test must use backend scripts (run-with-app-version) or vitest env.'
    );
    this.name = 'AppVersionNotConfiguredError';
  }
}

/**
 * Installable app version from APP_VERSION only (no runtime fallbacks).
 * Set at image build from root package.json SSoT, or by dev/test tooling before start.
 */
export function resolveAppVersion(): string {
  const version = process.env.APP_VERSION?.trim();
  if (!version) {
    throw new AppVersionNotConfiguredError();
  }
  return version;
}

export const appVersion = resolveAppVersion();
