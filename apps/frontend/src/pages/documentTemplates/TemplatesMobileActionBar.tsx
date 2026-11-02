import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PageMobileActionBar,
  type PageMobileAction,
} from '../../components/ui/PageMobileActionBar.js';
import { buildPageMobileNavAction } from '../../components/ui/pageMobileNav.js';

export type TemplatesMobileActionBarProps = {
  navTitle: string;
  onOpenNav: () => void;
  onCreate: () => void;
  showDelete: boolean;
  deleteLoading: boolean;
  onDelete: () => void;
};

/** Compact templates chrome via shared PageMobileActionBar. */
export function TemplatesMobileActionBar({
  navTitle,
  onOpenNav,
  onCreate,
  showDelete,
  deleteLoading,
  onDelete,
}: TemplatesMobileActionBarProps) {
  const { t } = useTranslation(['templates', 'shell']);

  const actions = useMemo((): PageMobileAction[] => {
    const items: PageMobileAction[] = [
      buildPageMobileNavAction(
        navTitle,
        onOpenNav,
        t('shell:nav.contentNavOpenAria', { title: navTitle })
      ),
    ];
    if (showDelete) {
      items.push({
        key: 'delete',
        label: t('templates:detail.delete'),
        icon: <IconTrash size={16} stroke={1.5} />,
        tone: 'danger',
        loading: deleteLoading,
        onClick: onDelete,
      });
    }
    items.push({
      key: 'create',
      label: t('templates:newType.action'),
      icon: <IconPlus size={16} stroke={1.5} />,
      tone: 'create',
      onClick: onCreate,
    });
    return items;
  }, [deleteLoading, navTitle, onCreate, onDelete, onOpenNav, showDelete, t]);

  return (
    <PageMobileActionBar ariaLabel={t('templates:mobileActions.toolbarAria')} actions={actions} />
  );
}
