/** True when env is 1, true, yes (case-insensitive). */
export function isTruthyEnv(value: string | undefined): boolean {
  if (value == null || value === '') return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

/** Public demo instance (production stack + seed, no debug tools). */
export function isDemoMode(): boolean {
  return isTruthyEnv(process.env.DEMO_MODE);
}

/** Load CSV seed on startup: local dev or explicit demo mode – never default intranet production. */
export function shouldRunStartupSeed(): boolean {
  if (isDemoMode()) return true;
  return process.env.NODE_ENV === 'development';
}

/**
 * Admin "view as user" / impersonation – development (and tests via ALLOW_ADMIN_IMPERSONATION=1) only.
 */
export function isAdminImpersonationEnabled(): boolean {
  if (process.env.ALLOW_ADMIN_IMPERSONATION === '1') return true;
  if (process.env.ALLOW_ADMIN_IMPERSONATION === '0') return false;
  return process.env.NODE_ENV === 'development';
}

/**
 * Dev-only reset of platform domain data (admin users kept).
 */
export function isPlatformResetEnabled(): boolean {
  if (process.env.ALLOW_PLATFORM_RESET === '1') return true;
  if (process.env.ALLOW_PLATFORM_RESET === '0') return false;
  return process.env.NODE_ENV === 'development';
}
