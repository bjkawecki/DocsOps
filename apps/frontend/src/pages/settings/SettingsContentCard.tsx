import type { ReactNode } from 'react';
import { ContentCardWrapper } from '../../components/contexts/cardShared.js';
import { SETTINGS_CARD_PADDING } from './settingsLayout.js';

/** Settings card shell: content-height + roomier padding than default content cards. */
export function SettingsContentCard({
  children,
  id,
  'data-settings-card': dataSettingsCard,
}: {
  children: ReactNode;
  id: string;
  'data-settings-card': string;
}) {
  return (
    <ContentCardWrapper
      fullHeight={false}
      padding={SETTINGS_CARD_PADDING}
      id={id}
      data-settings-card={dataSettingsCard}
    >
      {children}
    </ContentCardWrapper>
  );
}
