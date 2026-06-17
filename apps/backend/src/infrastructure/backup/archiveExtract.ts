import { execFile } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function extractZstdTarArchive(archivePath: string, targetDir: string): Promise<void> {
  await mkdir(targetDir, { recursive: true });
  const escapedArchive = archivePath.replace(/'/g, "'\\''");
  const escapedTarget = targetDir.replace(/'/g, "'\\''");
  await execFileAsync(
    'sh',
    ['-c', `zstd -d -c '${escapedArchive}' | tar -xf - -C '${escapedTarget}'`],
    {
      timeout: 1_800_000,
      maxBuffer: 4 * 1024 * 1024,
    }
  );
}
