import { compareSemVer } from '../lib/compareSemVer';
import { useAppVersion } from './useAppVersion';
import { useMe } from './useMe';

/** True when installed app version is newer than last seen release notes version. */
export function useWhatsNewBadge(): boolean {
  const { data: me } = useMe();
  const { data: versionData } = useAppVersion();
  const installed = versionData?.version;
  if (!installed) return false;
  const lastSeen = me?.preferences?.lastSeenReleaseVersion ?? '0.0.0';
  return compareSemVer(installed, lastSeen) > 0;
}
