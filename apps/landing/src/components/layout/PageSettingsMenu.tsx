import {
  Menu,
  UnstyledButton,
  useMantineColorScheme,
  type MantineColorScheme,
} from '@mantine/core';
import {
  IconCheck,
  IconChevronLeft,
  IconDeviceDesktop,
  IconMoon,
  IconSettings,
  IconSun,
} from '@tabler/icons-react';
import type { ReactNode } from 'react';
import { useLocale } from '../../i18n/LocaleProvider';
import type { LandingLocale } from '../../i18n/locale';

const LOCALE_OPTIONS: { locale: LandingLocale; labelDe: string; labelEn: string }[] = [
  { locale: 'de', labelDe: 'Deutsch', labelEn: 'German' },
  { locale: 'en', labelDe: 'Englisch', labelEn: 'English' },
];

const SCHEME_OPTIONS: {
  value: MantineColorScheme;
  icon: typeof IconSun;
  labelDe: string;
  labelEn: string;
}[] = [
  { value: 'light', icon: IconSun, labelDe: 'Hell', labelEn: 'Light' },
  { value: 'dark', icon: IconMoon, labelDe: 'Dunkel', labelEn: 'Dark' },
  { value: 'auto', icon: IconDeviceDesktop, labelDe: 'Auto', labelEn: 'Auto' },
];

function LeadingSlot({ children }: { children: ReactNode }) {
  return <span className="landing-settings-leading">{children}</span>;
}

type PageSettingsMenuProps = {
  onNavigate?: () => void;
};

export function PageSettingsMenu({ onNavigate }: PageSettingsMenuProps) {
  const { locale, setLocale } = useLocale();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const ariaLabel = locale === 'de' ? 'Seiteneinstellungen' : 'Page settings';
  const languageLabel = locale === 'de' ? 'Sprache' : 'Language';
  const appearanceLabel = locale === 'de' ? 'Darstellung' : 'Appearance';

  const menuClassNames = {
    dropdown: 'landing-nav-menu landing-settings-menu',
    item: 'landing-nav-menu-item',
  } as const;

  return (
    <Menu
      trigger="hover"
      openDelay={80}
      closeDelay={140}
      withinPortal
      offset={8}
      position="bottom-end"
      classNames={menuClassNames}
    >
      <Menu.Target>
        <UnstyledButton
          type="button"
          className="landing-settings-trigger"
          aria-label={ariaLabel}
          aria-haspopup="menu"
        >
          <IconSettings size={18} stroke={1.6} aria-hidden />
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        {/* Open left: settings control sits on the viewport’s right edge. */}
        <Menu.Sub position="left-start" offset={6}>
          <Menu.Sub.Target>
            <Menu.Sub.Item
              leftSection={<IconChevronLeft size={14} stroke={1.75} aria-hidden />}
              rightSection={<span aria-hidden />}
            >
              {languageLabel}
            </Menu.Sub.Item>
          </Menu.Sub.Target>
          <Menu.Sub.Dropdown className="landing-nav-menu landing-settings-menu">
            {LOCALE_OPTIONS.map((option) => {
              const active = option.locale === locale;
              const label = locale === 'de' ? option.labelDe : option.labelEn;
              return (
                <Menu.Item
                  key={option.locale}
                  leftSection={
                    <LeadingSlot>
                      {active ? <IconCheck size={14} stroke={2} aria-hidden /> : null}
                    </LeadingSlot>
                  }
                  onClick={() => {
                    if (!active) setLocale(option.locale);
                    onNavigate?.();
                  }}
                >
                  {label}
                </Menu.Item>
              );
            })}
          </Menu.Sub.Dropdown>
        </Menu.Sub>

        <Menu.Sub position="left-start" offset={6}>
          <Menu.Sub.Target>
            <Menu.Sub.Item
              leftSection={<IconChevronLeft size={14} stroke={1.75} aria-hidden />}
              rightSection={<span aria-hidden />}
            >
              {appearanceLabel}
            </Menu.Sub.Item>
          </Menu.Sub.Target>
          <Menu.Sub.Dropdown className="landing-nav-menu landing-settings-menu">
            {SCHEME_OPTIONS.map((option) => {
              const active = option.value === colorScheme;
              const Icon = option.icon;
              const label = locale === 'de' ? option.labelDe : option.labelEn;
              return (
                <Menu.Item
                  key={option.value}
                  leftSection={
                    <LeadingSlot>
                      {active ? (
                        <IconCheck size={14} stroke={2} aria-hidden />
                      ) : (
                        <Icon size={14} stroke={1.75} aria-hidden />
                      )}
                    </LeadingSlot>
                  }
                  onClick={() => {
                    if (!active) setColorScheme(option.value);
                    onNavigate?.();
                  }}
                >
                  {label}
                </Menu.Item>
              );
            })}
          </Menu.Sub.Dropdown>
        </Menu.Sub>
      </Menu.Dropdown>
    </Menu>
  );
}
