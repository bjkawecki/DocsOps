export function scopeTypeLabel(scopeType: string): string {
  return scopeType.charAt(0).toUpperCase() + scopeType.slice(1);
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}
