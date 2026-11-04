import { Group, Menu, UnstyledButton } from '@mantine/core';
import { IconCheck, IconChevronDown, IconLanguage } from '@tabler/icons-react';
import { useLocale } from '../../i18n/LocaleProvider';
import type { LandingLocale } from '../../i18n/locale';

const OPTIONS: { locale: LandingLocale; label: string; short: string }[] = [
  { locale: 'de', label: 'Deutsch', short: 'DE' },
  { locale: 'en', label: 'English', short: 'EN' },
];

type LanguageSwitcherProps = {
  onNavigate?: () => void;
};

export function LanguageSwitcher({ onNavigate }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const current = OPTIONS.find((option) => option.locale === locale) ?? OPTIONS[0];

  return (
    <Menu
      trigger="hover"
      openDelay={80}
      closeDelay={120}
      withinPortal
      offset={6}
      classNames={{ dropdown: 'landing-nav-menu', item: 'landing-nav-menu-item' }}
    >
      <Menu.Target>
        <UnstyledButton
          type="button"
          className="landing-nav-link landing-nav-link--menu landing-lang-switcher"
          aria-label={`Language: ${current.label}`}
          aria-haspopup="menu"
        >
          <Group gap={4} wrap="nowrap" align="center">
            <IconLanguage size={18} stroke={1.75} aria-hidden />
            <span className="landing-lang-switcher-code">{current.short}</span>
            <IconChevronDown className="landing-nav-chevron" size={14} stroke={2} aria-hidden />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {OPTIONS.map((option) => {
          const active = option.locale === locale;
          return (
            <Menu.Item
              key={option.locale}
              leftSection={
                active ? (
                  <IconCheck size={14} stroke={2} aria-hidden />
                ) : (
                  <span className="landing-lang-switcher-check-spacer" aria-hidden />
                )
              }
              onClick={() => {
                if (!active) setLocale(option.locale);
                onNavigate?.();
              }}
            >
              {option.label}
            </Menu.Item>
          );
        })}
      </Menu.Dropdown>
    </Menu>
  );
}
