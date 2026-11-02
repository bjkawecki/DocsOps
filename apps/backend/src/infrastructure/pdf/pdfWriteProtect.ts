import { execFile } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * Apply PDF permissions: open without user password; modify/annotate disabled.
 * Uses qpdf (worker image). Set PDF_SKIP_WRITE_PROTECT=1 to skip (tests without qpdf).
 */
export async function applyPdfWriteProtection(pdfBuffer: Buffer): Promise<Buffer> {
  if (process.env.PDF_SKIP_WRITE_PROTECT === '1') {
    return pdfBuffer;
  }

  const qpdfBin = process.env.QPDF_BIN?.trim() || 'qpdf';
  const ownerPassword = randomBytes(24).toString('base64url');
  const workDir = tmpdir();
  const inputPath = join(workDir, `docsops-pdf-in-${randomBytes(8).toString('hex')}.pdf`);
  const outputPath = join(workDir, `docsops-pdf-out-${randomBytes(8).toString('hex')}.pdf`);

  await writeFile(inputPath, pdfBuffer);

  try {
    try {
      await execFileAsync(
        qpdfBin,
        [
          '--encrypt',
          '',
          ownerPassword,
          '256',
          '--print=full',
          '--modify=none',
          '--extract=y',
          '--annotate=n',
          '--',
          inputPath,
          outputPath,
        ],
        { timeout: 60_000, maxBuffer: 8 * 1024 * 1024 }
      );
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? (error as { code?: string }).code
          : undefined;
      if (code === 'ENOENT') {
        throw new Error(
          `qpdf binary not found ("${qpdfBin}"). Install qpdf on the worker image or set QPDF_BIN.`,
          { cause: error }
        );
      }
      throw error;
    }
    return await readFile(outputPath);
  } finally {
    await Promise.allSettled([unlink(inputPath), unlink(outputPath)]);
  }
}
