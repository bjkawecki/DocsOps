import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { StorageService } from '../storage/index.js';

export type MinioImportResult = {
  objectCount: number;
  totalSizeBytes: number;
};

async function walkFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

export async function importMinioDirectoryToBucket(
  storage: StorageService,
  objectsDir: string
): Promise<MinioImportResult> {
  const files = await walkFiles(objectsDir);
  let objectCount = 0;
  let totalSizeBytes = 0;

  for (const filePath of files) {
    const key = relative(objectsDir, filePath).replace(/\\/g, '/');
    if (!key || key.startsWith('backups/')) continue;
    const fileStat = await stat(filePath);
    await storage.uploadStream(key, createReadStream(filePath), 'application/octet-stream');
    objectCount += 1;
    totalSizeBytes += fileStat.size;
  }

  return { objectCount, totalSizeBytes };
}
