/** Matches `@[cuid]` mention tokens embedded in comment text. */
const MENTION_TOKEN_REGEX = /@\[([a-z0-9]+)\]/gi;

export function parseMentionUserIds(text: string): string[] {
  const ids = new Set<string>();
  for (const match of text.matchAll(MENTION_TOKEN_REGEX)) {
    const id = match[1];
    if (id != null && id !== '') ids.add(id);
  }
  return [...ids];
}

export function stripMentionTokens(text: string): string {
  return text.replace(MENTION_TOKEN_REGEX, '').replace(/\s+/g, ' ').trim();
}

export function findInvalidMentionUserIds(
  mentionedIds: string[],
  readerIds: Set<string>
): string[] {
  return mentionedIds.filter((id) => !readerIds.has(id));
}
