import 'i18next';

/**
 * Keep v26-style `t()` call sites (optional options / loose Record params).
 * Typed JSON resources are not wired yet; enable strict checks when they are.
 * @see https://www.i18next.com/misc/migration-guide
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    strictInterpolationChecks: false;
    returnNull: false;
  }
}
