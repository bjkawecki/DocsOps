/** Callout variants (§28a) – mirror of backend `CALLOUT_VARIANTS`. */
export const CALLOUT_VARIANTS = ['info', 'warning', 'tip'] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

export const CALLOUT_VARIANT_LABELS: Record<CalloutVariant, string> = {
  info: 'Info',
  warning: 'Warning',
  tip: 'Tip',
};

export const CALLOUT_VARIANT_OPTIONS: readonly { value: CalloutVariant; label: string }[] =
  CALLOUT_VARIANTS.map((value) => ({ value, label: CALLOUT_VARIANT_LABELS[value] }));

export function isCalloutVariant(value: unknown): value is CalloutVariant {
  return typeof value === 'string' && (CALLOUT_VARIANTS as readonly string[]).includes(value);
}

export function readCalloutVariant(
  attrs: Record<string, unknown> | undefined
): CalloutVariant | null {
  return isCalloutVariant(attrs?.variant) ? attrs.variant : null;
}
