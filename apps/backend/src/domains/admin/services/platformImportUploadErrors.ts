/**
 * Maps platform-import upload/preflight failures to client-safe messages (HTTP 400).
 */
export function formatPlatformImportUploadError(error: unknown): {
  clientError: boolean;
  message: string;
} {
  const raw = error instanceof Error ? error.message : String(error);

  if (isMultipartFileTooLargeError(raw)) {
    return {
      clientError: true,
      message:
        'Upload is too large. Reduce the export size or increase PLATFORM_IMPORT_UPLOAD_MAX_BYTES on the server.',
    };
  }

  if (isArchiveExtractError(raw)) {
    return {
      clientError: true,
      message:
        'Could not unpack the platform export archive. Use a valid docsops-platform-export-*.tar.zst file. The server needs zstd and tar available to extract archives.',
    };
  }

  if (isClientPlatformImportUploadError(raw)) {
    return { clientError: true, message: raw };
  }

  return { clientError: false, message: raw };
}

function isMultipartFileTooLargeError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('file size limit') ||
    lower.includes('file too large') ||
    lower.includes('maxfilesize') ||
    lower.includes('fst_req_file_too_large') ||
    lower.includes('payload too large') ||
    lower.includes('request entity too large')
  );
}

function isArchiveExtractError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('command failed') ||
    lower.includes('zstd') ||
    lower.includes('tar -xf') ||
    lower.includes('unexpected end of file') ||
    lower.includes('truncated input') ||
    lower.includes('not in gzip format') ||
    lower.includes('x-amz-decoded-content-length')
  );
}

function isClientPlatformImportUploadError(message: string): boolean {
  const markers = [
    '.tar.zst',
    'MinIO',
    'already in progress',
    'Missing file upload',
    'manifest.json',
    'Checksum mismatch',
    'Unsupported exportFormatVersion',
    'Target instance is not empty',
    'Missing expected file',
    'Failed to read uploaded archive',
    'Upload archive not found',
    'No seed CSV',
    'Preflight',
    'not ready for confirmation',
    'Password hash',
    'Unique constraint',
    'P2002',
  ];
  return markers.some((marker) => message.includes(marker));
}
