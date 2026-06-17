import type { DestinationFormState } from './AdminBackupDestinationModal';

export function buildDestinationBody(form: DestinationFormState, isEdit: boolean) {
  if (form.type === 'S3_COMPATIBLE') {
    const credentials: Record<string, string> = {};
    if (form.s3AccessKey) credentials.accessKeyId = form.s3AccessKey;
    if (form.s3SecretKey) credentials.secretAccessKey = form.s3SecretKey;
    if (!isEdit && (!credentials.accessKeyId || !credentials.secretAccessKey)) {
      throw new Error('Access key and secret key are required');
    }
    return {
      name: form.name,
      ...(!isEdit ? { type: 'S3_COMPATIBLE' as const } : {}),
      enabled: form.enabled,
      config: { endpoint: form.s3Endpoint, bucket: form.s3Bucket },
      ...(Object.keys(credentials).length > 0 ? { credentials } : {}),
    };
  }
  const credentials: Record<string, string> = {};
  if (form.sshUser) credentials.username = form.sshUser;
  if (form.sshPassword) credentials.password = form.sshPassword;
  if (form.sshPrivateKey) credentials.privateKey = form.sshPrivateKey;
  if (!isEdit && !credentials.username) throw new Error('Username is required');
  if (!isEdit && !credentials.password && !credentials.privateKey) {
    throw new Error('Password or private key is required');
  }
  return {
    name: form.name,
    ...(!isEdit ? { type: 'SSH' as const } : {}),
    enabled: form.enabled,
    config: {
      host: form.sshHost,
      port: Number(form.sshPort) || 22,
      remotePath: form.sshPath,
    },
    ...(Object.keys(credentials).length > 0 ? { credentials } : {}),
  };
}
