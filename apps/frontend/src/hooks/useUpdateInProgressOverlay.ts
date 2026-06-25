import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import type { SystemVersionResponse } from 'backend/api-types';
import { apiFetch } from '../api/client.js';
import { useAdminUpdateStatus } from './useAdminUpdateStatus.js';
import { useMaintenanceStatus } from './useMaintenanceStatus.js';

const STORAGE_KEY = 'docsops-update-in-progress';

function readStickyFlag(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function setStickyFlag(active: boolean): void {
  try {
    if (active) sessionStorage.setItem(STORAGE_KEY, '1');
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore private mode / blocked storage
  }
}

async function fetchSystemVersion(): Promise<SystemVersionResponse> {
  const res = await apiFetch('/api/v1/system/version');
  if (!res.ok) throw new Error('Failed to load app version');
  return res.json() as Promise<SystemVersionResponse>;
}

export type UpdateOverlayPhase = 'in-progress' | 'reload';

export function useUpdateInProgressOverlay(isAdmin: boolean) {
  const maintenanceQuery = useMaintenanceStatus();
  const updateStatusQuery = useAdminUpdateStatus({ enabled: isAdmin });
  const [sticky, setSticky] = useState(readStickyFlag);

  const maintenance = maintenanceQuery.data;
  const activeRun = updateStatusQuery.data?.activeUpdateRun;
  const maintenanceUpdate = maintenance?.active === true && maintenance.reason === 'update';
  const runApplying = activeRun?.status === 'applying';
  const liveInProgress = maintenanceUpdate || runApplying;

  useEffect(() => {
    if (liveInProgress) {
      setStickyFlag(true);
      setSticky(true);
    }
  }, [liveInProgress]);

  useEffect(() => {
    if (activeRun?.status === 'succeeded' || activeRun?.status === 'failed') {
      setStickyFlag(false);
      setSticky(false);
    }
  }, [activeRun?.status]);

  const shouldPollRecovery = sticky && !liveInProgress;

  const recoveryQuery = useQuery({
    queryKey: ['system', 'version', 'update-recovery'] as const,
    queryFn: fetchSystemVersion,
    enabled: shouldPollRecovery,
    refetchInterval: shouldPollRecovery ? 3000 : false,
    retry: true,
  });

  const phase: UpdateOverlayPhase =
    shouldPollRecovery && recoveryQuery.isSuccess ? 'reload' : 'in-progress';

  const visible = liveInProgress || sticky;

  const dismiss = () => {
    setStickyFlag(false);
    setSticky(false);
  };

  return { visible, phase, dismiss };
}
