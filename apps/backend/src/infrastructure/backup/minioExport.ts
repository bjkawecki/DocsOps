import { createWriteStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import type { StorageService } from '../storage/index.js';
import { createS3Client, getObject, getS3ConfigFromEnv } from '../storage/s3.js';

export type MinioExportResult = {
  objectCount: number;
  totalSizeBytes: number;
  objectsDir: string;
};

export async function exportMinioBucketToDirectory(
  storage: StorageService,
  targetDir: string
): Promise<MinioExportResult> {
  const config = getS3ConfigFromEnv();
  if (!config) throw new Error('MinIO is not configured');

  const client = createS3Client(config);
  const keys = await storage.listObjectKeys();
  const objectsDir = join(targetDir, 'minio', 'objects');
  await mkdir(objectsDir, { recursive: true });

  let totalSizeBytes = 0;
  let objectCount = 0;

  for (const key of keys) {
    if (key.startsWith('backups/')) continue;
    const result = await getObject(client, config.bucket, key);
    if (!result?.Body) continue;
    const outPath = join(objectsDir, key);
    await mkdir(dirname(outPath), { recursive: true });
    const body = result.Body as NodeJS.ReadableStream;
    await pipeline(body, createWriteStream(outPath));
    const fileStat = await stat(outPath);
    totalSizeBytes += fileStat.size;
    objectCount += 1;
  }

  return { objectCount, totalSizeBytes, objectsDir };
}
