import { describe, expect, it } from 'vitest';
import i18n from '../../../i18n/i18n.js';
import {
  agentPhaseStepIndex,
  formatAgentPhaseLabel,
  isRestartPhase,
  updateProgressStepIndex,
  UPDATE_PROGRESS_STEP_COUNT,
} from './updateProgressSteps.js';

const t = i18n.getFixedT('en', 'admin');

describe('formatAgentPhaseLabel', () => {
  it('maps known agent phases to readable labels', () => {
    expect(formatAgentPhaseLabel('compose_up', t)).toBe('Restarting containers');
    expect(formatAgentPhaseLabel('wait_health', t)).toBe('Waiting for health check');
  });

  it('returns null for empty phase', () => {
    expect(formatAgentPhaseLabel(null, t)).toBeNull();
    expect(formatAgentPhaseLabel('', t)).toBeNull();
  });
});

describe('isRestartPhase', () => {
  it('identifies restart-related phases', () => {
    expect(isRestartPhase('compose_up')).toBe(true);
    expect(isRestartPhase('wait_health')).toBe(true);
    expect(isRestartPhase('pull_images')).toBe(false);
  });
});

describe('updateProgressStepIndex', () => {
  it('returns full step count for succeeded', () => {
    expect(updateProgressStepIndex('succeeded')).toBe(UPDATE_PROGRESS_STEP_COUNT);
  });

  it('maps applying to apply step', () => {
    expect(updateProgressStepIndex('applying')).toBe(1);
  });
});

describe('agentPhaseStepIndex', () => {
  it('maps compose_up to wait-for-services step', () => {
    expect(agentPhaseStepIndex('compose_up')).toBe(2);
  });

  it('maps agent succeeded to reload step', () => {
    expect(agentPhaseStepIndex('succeeded')).toBe(3);
  });
});
