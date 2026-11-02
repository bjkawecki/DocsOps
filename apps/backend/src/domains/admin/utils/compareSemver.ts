const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;

function parseSemver(version: string): [number, number, number] | null {
  const match = SEMVER_RE.exec(version.trim());
  if (!match) return null;
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** Normalizes GitHub release tag `v0.1.0` to `0.1.0`. */
export function normalizeReleaseVersion(tagOrVersion: string): string | null {
  const trimmed = tagOrVersion.trim();
  const withoutPrefix = trimmed.startsWith('v') ? trimmed.slice(1) : trimmed;
  return parseSemver(withoutPrefix) != null ? withoutPrefix : null;
}

/** Returns -1 if a < b, 0 if equal, 1 if a > b; null if either is invalid. */
export function compareSemver(a: string, b: string): -1 | 0 | 1 | null {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (pa == null || pb == null) return null;
  for (let i = 0; i < 3; i += 1) {
    const av = pa[i];
    const bv = pb[i];
    if (av < bv) return -1;
    if (av > bv) return 1;
  }
  return 0;
}
