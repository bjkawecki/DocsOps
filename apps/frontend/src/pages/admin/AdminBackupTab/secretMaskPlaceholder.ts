/** Max bullets so long private keys do not flood the field. */
const SECRET_MASK_MAX_LEN = 32;

/** Asterisk mask matching stored secret length (capped). */
export function secretMaskPlaceholder(length: number | undefined): string | undefined {
  if (length == null || length <= 0) return undefined;
  return '*'.repeat(Math.min(length, SECRET_MASK_MAX_LEN));
}
