import type { AdminUpdateRun } from 'backend/api-types';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export type UpdateProgressStep = {
  key: string;
  label: string;
  detail: string;
};

/** Fixed number of steps rendered by {@link getUpdateProgressSteps}. */
export const UPDATE_PROGRESS_STEP_COUNT = 4;

export function getUpdateProgressSteps(t: TranslateFn): UpdateProgressStep[] {
  return [
    {
      key: 'backup',
      label: t('system.updateSteps.backup.label'),
      detail: t('system.updateSteps.backup.detail'),
    },
    {
      key: 'apply',
      label: t('system.updateSteps.apply.label'),
      detail: t('system.updateSteps.apply.detail'),
    },
    {
      key: 'health',
      label: t('system.updateSteps.health.label'),
      detail: t('system.updateSteps.health.detail'),
    },
    {
      key: 'reload',
      label: t('system.updateSteps.reload.label'),
      detail: t('system.updateSteps.reload.detail'),
    },
  ];
}

const AGENT_PHASE_KEYS: Record<string, string> = {
  preflight: 'system.agentPhase.preflight',
  download_bundle: 'system.agentPhase.downloadBundle',
  extract_bundle: 'system.agentPhase.extractBundle',
  patch_env: 'system.agentPhase.patchEnv',
  pull_images: 'system.agentPhase.pullImages',
  compose_up: 'system.agentPhase.composeUp',
  wait_health: 'system.agentPhase.waitHealth',
  verify_version: 'system.agentPhase.verifyVersion',
  cleanup: 'system.agentPhase.cleanup',
  succeeded: 'system.agentPhase.succeeded',
  failed: 'system.agentPhase.failed',
};

const RESTART_AGENT_PHASES = new Set(['compose_up', 'wait_health', 'verify_version']);

export function formatAgentPhaseLabel(
  phase: string | null | undefined,
  t: TranslateFn
): string | null {
  if (phase == null || phase.trim() === '') return null;
  const key = AGENT_PHASE_KEYS[phase];
  return key ? t(key) : phase.replace(/_/g, ' ');
}

export function isRestartPhase(phase: string | null | undefined): boolean {
  if (phase == null || phase.trim() === '') return false;
  return RESTART_AGENT_PHASES.has(phase);
}

export function updateProgressStepIndex(status: AdminUpdateRun['status']): number {
  switch (status) {
    case 'queued':
    case 'backing_up':
      return 0;
    case 'applying':
      return 1;
    case 'succeeded':
      return UPDATE_PROGRESS_STEP_COUNT;
    case 'failed':
      return -1;
    default:
      return 0;
  }
}

const AGENT_PHASE_STEP: Record<string, number> = {
  preflight: 1,
  download_bundle: 1,
  extract_bundle: 1,
  patch_env: 1,
  pull_images: 1,
  compose_up: 2,
  wait_health: 2,
  verify_version: 2,
  cleanup: 2,
  succeeded: 3,
  failed: -1,
};

export function agentPhaseStepIndex(phase: string): number {
  return AGENT_PHASE_STEP[phase] ?? 1;
}

/**
 * Human-readable elapsed time. Kept untranslated (hardcoded EN) because it also backs
 * {@link ../../../hooks/useElapsedSince.js}, which is shared by not-yet-migrated surfaces
 * (e.g. `AppShellMaintenanceBanner`). Use {@link formatUpdateElapsedSince} on migrated screens.
 */
export function formatElapsedSince(iso: string | null | undefined, nowMs: number): string | null {
  if (iso == null) return null;
  const started = Date.parse(iso);
  if (Number.isNaN(started)) return null;
  const totalSec = Math.max(0, Math.floor((nowMs - started) / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min} min ${sec}s`;
}

/** Translated elapsed-time label for the Admin System update UI. */
export function formatUpdateElapsedSince(
  iso: string | null | undefined,
  nowMs: number,
  t: TranslateFn
): string | null {
  if (iso == null) return null;
  const started = Date.parse(iso);
  if (Number.isNaN(started)) return null;
  const totalSec = Math.max(0, Math.floor((nowMs - started) / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return t('system.elapsed.secondsOnly', { sec });
  return t('system.elapsed.withMinutes', { min, sec });
}
