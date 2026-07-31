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

/** Prepends document title as H1 when the body does not already start with one. */
export function buildMarkdownForPdfExport(markdown: string, title?: string | null): string {
  const body = markdown.trim();
  const trimmedTitle = title?.trim();
  if (!trimmedTitle) return body;
  if (body.startsWith('# ')) return body;
  return `# ${trimmedTitle}\n\n${body}`;
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
  const typstExtraArgs = withTypstPackageCacheArgs(options.typstArgs ?? parseTypstArgsFromEnv());
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

    const markdown = buildMarkdownForPdfExport(options.markdown, options.title);
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
          `Typst binary not found ("${typstCommand}"). Rebuild the docsops-job-worker image (typst) or set TYPST_BIN.`
        );
      }
      throw error;
    }

    return await readOutput(outputPath);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
