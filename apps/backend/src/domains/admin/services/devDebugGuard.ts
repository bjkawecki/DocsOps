import { isPlatformResetEnabled } from '../../../config/runtimeMode.js';
import { assertDestructiveDevDatabaseAllowed } from '../../../config/devDatabaseGuard.js';

export function assertDevDestructiveDebugOperationAllowed(): void {
  if (!isPlatformResetEnabled()) {
    throw new Error('This operation is only available in development');
  }
  assertDestructiveDevDatabaseAllowed();
}
