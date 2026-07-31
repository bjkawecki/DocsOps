import { ATTACHMENT_HREF_PREFIX, parseAttachmentHrefToken } from './figureCaption.js';

const ATTACHMENT_MD_RE = /!\[([^\]]*)\]\(docsops-attachment:([^)\s]+)\)/g;

/** Collect unique attachment ids referenced by `docsops-attachment:` markdown tokens. */
export function collectAttachmentIdsFromMarkdown(markdown: string): string[] {
  const ids = new Set<string>();
  for (const match of markdown.matchAll(ATTACHMENT_MD_RE)) {
    const id = match[2]?.trim();
    if (id) ids.add(id);
  }
  return [...ids];
}

/**
 * Rewrite `docsops-attachment:ID` hrefs to relative filesystem paths for Typst.
 * Throws if any token lacks a path mapping (no silent drop).
 */
export function rewriteAttachmentTokensForPdf(
  markdown: string,
  relativePathByAttachmentId: ReadonlyMap<string, string>
): string {
  return markdown.replace(ATTACHMENT_MD_RE, (_full, alt: string, rawId: string) => {
    const id = rawId.trim();
    const rel = relativePathByAttachmentId.get(id);
    if (rel == null || rel.length === 0) {
      throw new Error(`Missing attachment file for PDF export: ${id}`);
    }
    return `![${alt}](${rel})`;
  });
}

export function extensionFromFilename(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0 || dot === filename.length - 1) return '';
  const ext = filename.slice(dot).toLowerCase();
  if (!/^\.[a-z0-9]{1,8}$/.test(ext)) return '';
  return ext;
}

export { ATTACHMENT_HREF_PREFIX, parseAttachmentHrefToken };
