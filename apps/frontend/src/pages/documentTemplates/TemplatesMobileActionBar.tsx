import { ActionIcon, Stack } from '@mantine/core';
import { IconLayoutSidebar, IconPlus, IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import './TemplatesMobileActionBar.css';

export type TemplatesMobileActionBarProps = {
  navTitle: string;
  onOpenNav: () => void;
  onCreate: () => void;
  showDelete: boolean;
  deleteLoading: boolean;
  onDelete: () => void;
};

/**
 * Compact templates chrome: types drawer / delete / create as a small vertical
 * stack at the bottom-right, floating over the preview.
 */
export function TemplatesMobileActionBar({
  navTitle,
  onOpenNav,
  onCreate,
  showDelete,
  deleteLoading,
  onDelete,
}: TemplatesMobileActionBarProps) {
  const { t } = useTranslation(['templates', 'shell']);

  return (
    <div
      className="templates-mobile-actions"
      role="toolbar"
      aria-label={t('templates:mobileActions.toolbarAria')}
    >
      <Stack gap={6} align="center">
        <ActionIcon
          variant="filled"
          color="gray"
          size={32}
          radius="xl"
          aria-label={t('shell:nav.contentNavOpenAria', { title: navTitle })}
          title={navTitle}
          onClick={onOpenNav}
        >
          <IconLayoutSidebar size={16} stroke={1.5} />
        </ActionIcon>
        {showDelete ? (
          <ActionIcon
            variant="filled"
            color="red"
            size={32}
            radius="xl"
            loading={deleteLoading}
            aria-label={t('templates:detail.delete')}
            onClick={onDelete}
          >
            <IconTrash size={16} stroke={1.5} />
          </ActionIcon>
        ) : null}
        <ActionIcon
          variant="filled"
          color="blue"
          size={32}
          radius="xl"
          aria-label={t('templates:newType.action')}
          onClick={onCreate}
        >
          <IconPlus size={16} stroke={1.5} />
        </ActionIcon>
      </Stack>
    </div>
  );
}
