import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import adminDe from './locales/de/admin.json';
import approvalsDe from './locales/de/approvals.json';
import authDe from './locales/de/auth.json';
import commonDe from './locales/de/common.json';
import contextsDe from './locales/de/contexts.json';
import documentsDe from './locales/de/documents.json';
import notificationsDe from './locales/de/notifications.json';
import settingsDe from './locales/de/settings.json';
import shellDe from './locales/de/shell.json';
import templatesDe from './locales/de/templates.json';
import adminEn from './locales/en/admin.json';
import approvalsEn from './locales/en/approvals.json';
import authEn from './locales/en/auth.json';
import commonEn from './locales/en/common.json';
import contextsEn from './locales/en/contexts.json';
import documentsEn from './locales/en/documents.json';
import notificationsEn from './locales/en/notifications.json';
import settingsEn from './locales/en/settings.json';
import shellEn from './locales/en/shell.json';
import templatesEn from './locales/en/templates.json';

export const I18N_NAMESPACES = [
  'common',
  'shell',
  'auth',
  'settings',
  'admin',
  'documents',
  'approvals',
  'notifications',
  'contexts',
  'templates',
] as const;

void i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: commonEn,
      shell: shellEn,
      auth: authEn,
      settings: settingsEn,
      admin: adminEn,
      documents: documentsEn,
      approvals: approvalsEn,
      notifications: notificationsEn,
      contexts: contextsEn,
      templates: templatesEn,
    },
    de: {
      common: commonDe,
      shell: shellDe,
      auth: authDe,
      settings: settingsDe,
      admin: adminDe,
      documents: documentsDe,
      approvals: approvalsDe,
      notifications: notificationsDe,
      contexts: contextsDe,
      templates: templatesDe,
    },
  },
  lng: 'en',
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: [...I18N_NAMESPACES],
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
