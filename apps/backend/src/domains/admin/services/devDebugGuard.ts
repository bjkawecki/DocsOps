import { isDemoMode, isPlatformResetEnabled } from '../../../config/runtimeMode.js';
import { assertDestructiveDevDatabaseAllowed } from '../../../config/devDatabaseGuard.js';

export function assertDevDestructiveDebugOperationAllowed(): void {
  if (!isPlatformResetEnabled() && !isDemoMode()) {
    throw new Error('This operation is only available in development or demo mode');
  }
  assertDestructiveDevDatabaseAllowed();
}
