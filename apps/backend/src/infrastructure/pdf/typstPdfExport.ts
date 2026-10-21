import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import {
  buildTypstMainSource,
  resolvePdfBrandingTheme,
  type CompanyPdfBrandingRow,
  type ResolvedPdfBrandingTheme,
} from './pdfBrandingTheme.js';

const execFileAsync = promisify(execFile);

const DEFAULT_COMPILE_TIMEOUT_MS = 120_000;
const DEFAULT_MAX_BUFFER = 4 * 1024 * 1024;

/** Default cache path baked into docsops-node-dev / worker images (cmarker). */
export const DEFAULT_TYPST_PACKAGE_CACHE_PATH = '/var/cache/typst';

export type TypstPdfAssetFile = {
  /** Path relative to the Typst work directory (e.g. `attachments/id.png`). */
  relativePath: string;
  data: Buffer;
};

export type TypstPdfExportOptions = {
  markdown: string;
  title?: string | null;
  /** Short line under the title (responsible / version / date). */
  metaLine?: string | null;
  typstBin?: string;
  typstArgs?: string[];
  /** Binary assets written under the compile workdir before `typst compile`. */
  assetFiles?: TypstPdfAssetFile[];
  /** Resolved branding theme (ADR 007); defaults applied when omitted. */
  theme?: ResolvedPdfBrandingTheme;
  execFileFn?: typeof execFileAsync;
  readOutputFn?: (path: string) => Promise<Buffer>;
  timeoutMs?: number;
};

function parseTypstArgsFromEnv(): string[] {
  return (process.env.TYPST_ARGS ?? '')
    .split(/\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

/**
 * Ensure package cache path is set so `@preview/cmarker` resolves offline when
 * the image prefetched packages into DEFAULT_TYPST_PACKAGE_CACHE_PATH.
 */
export function withTypstPackageCacheArgs(extraArgs: string[]): string[] {
  if (extraArgs.includes('--package-cache-path')) return extraArgs;
  const fromEnv = process.env.TYPST_PACKAGE_CACHE_PATH?.trim();
  const cachePath = fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_TYPST_PACKAGE_CACHE_PATH;
  return ['--package-cache-path', cachePath, ...extraArgs];
}

/**
 * Append `--font-path` entries from `TYPST_FONT_PATH` (colon-separated).
 * Needed so Typst finds Liberation fonts for PDF branding (sans/serif).
 */
export function withTypstFontPathArgs(extraArgs: string[]): string[] {
  const raw = process.env.TYPST_FONT_PATH?.trim();
  if (!raw) return extraArgs;
  const paths = raw
    .split(':')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  if (paths.length === 0) return extraArgs;
  const args = [...extraArgs];
  for (const fontPath of paths) {
    args.push('--font-path', fontPath);
  }
  return args;
}

/**
 * Prepends document title as H1 when missing, and an optional meta line
 * (responsible / version / date) directly under the title.
 */
export function buildMarkdownForPdfExport(
  markdown: string,
  title?: string | null,
  metaLine?: string | null
): string {
  const body = markdown.trim();
  const trimmedTitle = title?.trim();
  const meta = metaLine?.trim() || null;

  let withTitle = body;
  if (trimmedTitle && !body.startsWith('# ')) {
    withTitle = `# ${trimmedTitle}\n\n${body}`;
  }
  if (!meta) return withTitle;

  const lines = withTitle.split('\n');
  if (lines[0]?.startsWith('# ')) {
    return [lines[0], '', meta, '', ...lines.slice(1)].join('\n').replace(/\n{3,}/g, '\n\n');
  }
  return `${meta}\n\n${withTitle}`;
}

export function themeFromCompanyRow(
  company: CompanyPdfBrandingRow | null
): ResolvedPdfBrandingTheme {
  return resolvePdfBrandingTheme(company);
}

/**
 * Renders Markdown to PDF via Typst (`main.typ` + cmarker + `content.md`).
 * Requires the typst binary (docsops-job-worker image or local dev install).
 */
export async function renderMarkdownToPdfBuffer(options: TypstPdfExportOptions): Promise<Buffer> {
  const typstCommand = options.typstBin?.trim() || process.env.TYPST_BIN?.trim() || 'typst';
  const typstExtraArgs = withTypstFontPathArgs(
    withTypstPackageCacheArgs(options.typstArgs ?? parseTypstArgsFromEnv())
  );
  const execFn = options.execFileFn ?? execFileAsync;
  const readOutput = options.readOutputFn ?? ((path: string) => readFile(path));
  const timeoutMs = options.timeoutMs ?? DEFAULT_COMPILE_TIMEOUT_MS;
  const theme = options.theme ?? resolvePdfBrandingTheme(null);

  const workDir = await mkdtemp(join(tmpdir(), 'docsops-typst-export-'));
  const contentPath = join(workDir, 'content.md');
  const mainPath = join(workDir, 'main.typ');
  const outputPath = join(workDir, 'output.pdf');

  try {
    for (const asset of options.assetFiles ?? []) {
      const abs = join(workDir, asset.relativePath);
      await mkdir(dirname(abs), { recursive: true });
      await writeFile(abs, asset.data);
    }

    const markdown = buildMarkdownForPdfExport(options.markdown, options.title, options.metaLine);
    await writeFile(contentPath, markdown, 'utf8');
    await writeFile(mainPath, buildTypstMainSource(theme), 'utf8');

    try {
      await execFn(typstCommand, ['compile', ...typstExtraArgs, mainPath, outputPath], {
        cwd: workDir,
        timeout: timeoutMs,
        maxBuffer: DEFAULT_MAX_BUFFER,
      });
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? (error as { code?: string }).code
          : undefined;
      if (code === 'ENOENT') {
        throw new Error(
          `Typst binary not found ("${typstCommand}"). Rebuild the docsops-job-worker image (typst) or set TYPST_BIN.`,
          { cause: error }
        );
      }
      throw error;
    }

    return await readOutput(outputPath);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
