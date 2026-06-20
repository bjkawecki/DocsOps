import type { QueryClient } from '@tanstack/react-query';

/** Refetch org tree, documents, and other cached API data after platform import/reset. */
export function invalidatePlatformMigrationAppCache(queryClient: QueryClient): void {
  void queryClient.invalidateQueries();
}
