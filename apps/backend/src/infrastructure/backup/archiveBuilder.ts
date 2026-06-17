import { execFile } from 'node:child_process';
import { dirname } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function buildZstdTarArchive(sourceDir: string, archivePath: string): Promise<void> {
  const escapedSource = sourceDir.replace(/'/g, "'\\''");
  const escapedArchive = archivePath.replace(/'/g, "'\\''");
  await execFileAsync(
    'sh',
    ['-c', `tar -cf - -C '${escapedSource}' . | zstd -q -o '${escapedArchive}'`],
    {
      timeout: 1_800_000,
      maxBuffer: 4 * 1024 * 1024,
    }
  );
}

export { dirname };
