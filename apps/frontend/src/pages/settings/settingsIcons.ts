import {
  IconBell,
  IconDatabase,
  IconLock,
  IconMail,
  IconPalette,
  IconShield,
  IconUser,
  IconUserCircle,
  type TablerIcon,
} from '@tabler/icons-react';
import type { SettingsJumpId } from './settingsLayout.js';

/** Icon size for settings jump nav and card titles. */
export const SETTINGS_JUMP_ICON_SIZE = 18;

export const SETTINGS_JUMP_ICON_COMPONENTS: Record<SettingsJumpId, TablerIcon> = {
  profile: IconUser,
  identity: IconShield,
  appearance: IconPalette,
  email: IconMail,
  password: IconLock,
  sessions: IconUserCircle,
  storage: IconDatabase,
  'notifications-in-app': IconBell,
  'notifications-email': IconMail,
};
