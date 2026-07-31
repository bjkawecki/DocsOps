/** Canonical languages offered in the editor language Select. */
export const CODE_LANGUAGE_OPTIONS: readonly { value: string; label: string }[] = [
  { value: '', label: 'Plain text' },
  { value: 'bash', label: 'Bash' },
  { value: 'shell', label: 'Shell' },
  { value: 'yaml', label: 'YAML' },
  { value: 'json', label: 'JSON' },
  { value: 'sql', label: 'SQL' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'markdown', label: 'Markdown' },
] as const;

const ALIASES: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  yml: 'yaml',
  md: 'markdown',
  sh: 'bash',
  zsh: 'bash',
};

const ALLOWED = new Set([
  'bash',
  'shell',
  'yaml',
  'json',
  'sql',
  'typescript',
  'javascript',
  'python',
  'go',
  'markdown',
  'plaintext',
]);

/**
 * Map stored/TipTap language to a highlight.js language id.
 * Empty or unknown → `plaintext`.
 */
export function normalizeCodeLanguage(lang: string | undefined | null): string {
  const raw = typeof lang === 'string' ? lang.trim().toLowerCase() : '';
  if (!raw) return 'plaintext';
  const mapped = ALIASES[raw] ?? raw;
  if (ALLOWED.has(mapped)) return mapped;
  return 'plaintext';
}
