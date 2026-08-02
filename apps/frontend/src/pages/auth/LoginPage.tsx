import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Paper,
  Alert,
  Collapse,
  UnstyledButton,
} from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { fetchMe, meQueryKey } from '../../hooks/useMe';
import { usePublicConfig } from '../../hooks/usePublicConfig';
import { DocopsLogo } from '../../components/appShell/DocopsLogo';
import { AppVersionLabel } from '../../components/AppVersionLabel';
import { AppShellMaintenanceBanner } from '../../components/appShell/AppShellMaintenanceBanner';
import { useMaintenanceStatus } from '../../hooks/useMaintenanceStatus';
import {
  getLoginErrorKeys,
  getLoginRedirectErrorKeys,
  type LoginRedirectReason,
} from './loginErrors';
import { randomLoginTaglineIndex } from './loginTaglines';

const LOGIN_ERROR_ID = 'login-error';

const DEMO_ROLES = ['admin', 'companyLead', 'departmentLead', 'teamLead', 'member'] as const;

type DemoRole = (typeof DEMO_ROLES)[number];

type LoginLocationState = {
  from?: string;
  loginError?: LoginRedirectReason;
};

export function LoginPage() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [taglineIndex] = useState(randomLoginTaglineIndex);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const locationState = (location.state ?? {}) as LoginLocationState;
  const from = locationState.from ?? '/';
  const { data: publicConfig } = usePublicConfig();
  const demoMode = publicConfig?.demoMode === true;

  const onLoginSuccess = (me: Awaited<ReturnType<typeof fetchMe>>) => {
    queryClient.setQueryData(meQueryKey, me);
    void navigate(from, { replace: true });
  };

  const login = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.status === 401) throw new Error('Invalid credentials');
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      return fetchMe();
    },
    onSuccess: onLoginSuccess,
  });

  const demoLogin = useMutation({
    mutationFn: async (role: DemoRole) => {
      const res = await apiFetch('/api/v1/auth/demo-login', {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      if (res.status === 401) throw new Error('Invalid credentials');
      if (res.status === 403) throw new Error('HTTP_403');
      if (!res.ok) throw new Error(`HTTP_${res.status}`);
      return fetchMe();
    },
    onSuccess: onLoginSuccess,
  });

  const activeError = demoLogin.isError ? demoLogin.error : login.isError ? login.error : null;
  const redirectErrorKeys =
    locationState.loginError === 'session_expired'
      ? getLoginRedirectErrorKeys(locationState.loginError)
      : null;
  const errorKeys = activeError ? getLoginErrorKeys(activeError) : redirectErrorKeys;
  const maintenanceQuery = useMaintenanceStatus();
  const tagline = t(`taglines.${taglineIndex}`, {
    defaultValue: t('taglines.0'),
  });
  const pending = login.isPending || demoLogin.isPending;

  return (
    <Box
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
      }}
    >
      <AppShellMaintenanceBanner status={maintenanceQuery.data} />
      <Box
        component="main"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        bg="var(--mantine-color-default-hover)"
      >
        <Paper
          p="xl"
          maw={400}
          miw={320}
          radius="md"
          withBorder
          shadow="sm"
          style={{ flexShrink: 0 }}
        >
          <Stack gap="md" mb="lg">
            <Box
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}
            >
              <DocopsLogo width={56} height={56} />
              <Text size="xl" fw={700}>
                DocsOps
              </Text>
            </Box>
            <Text size="sm" c="dimmed" ta="center">
              {tagline}
            </Text>
          </Stack>

          {demoMode ? (
            <Stack gap="md" mb="md" aria-describedby={errorKeys ? LOGIN_ERROR_ID : undefined}>
              <Alert color="blue" variant="light" title={t('demo.disclaimerTitle')}>
                {t('demo.disclaimerBody')}
              </Alert>
              <Text size="sm" fw={500}>
                {t('demo.pickRole')}
              </Text>
              <Stack gap="xs">
                {DEMO_ROLES.map((role) => (
                  <Button
                    key={role}
                    variant="light"
                    fullWidth
                    disabled={pending}
                    loading={demoLogin.isPending && demoLogin.variables === role}
                    onClick={() => demoLogin.mutate(role)}
                  >
                    {t(`demo.roles.${role}`)}
                  </Button>
                ))}
              </Stack>
              {errorKeys && demoLogin.isError ? (
                <Alert
                  id={LOGIN_ERROR_ID}
                  role="alert"
                  color="red"
                  variant="filled"
                  title={t(errorKeys.titleKey)}
                >
                  {t(errorKeys.messageKey, errorKeys.messageParams)}
                </Alert>
              ) : null}
              <UnstyledButton
                onClick={() => setPasswordOpen((v) => !v)}
                style={{ fontSize: 'var(--mantine-font-size-sm)' }}
              >
                <Text size="sm" c="dimmed" td="underline">
                  {passwordOpen ? t('demo.hidePasswordLogin') : t('demo.showPasswordLogin')}
                </Text>
              </UnstyledButton>
            </Stack>
          ) : null}

          <Collapse in={!demoMode || passwordOpen}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                login.mutate();
              }}
              aria-describedby={errorKeys && login.isError ? LOGIN_ERROR_ID : undefined}
            >
              <Stack gap="md">
                <TextInput
                  id="login-email"
                  label={t('email')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus={!demoMode}
                  autoComplete="email"
                  disabled={pending}
                />
                <PasswordInput
                  id="login-password"
                  label={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={pending}
                />
                {errorKeys && login.isError ? (
                  <Alert
                    id={LOGIN_ERROR_ID}
                    role="alert"
                    color="red"
                    variant="filled"
                    title={t(errorKeys.titleKey)}
                  >
                    {t(errorKeys.messageKey, errorKeys.messageParams)}
                    {errorKeys.hintKey ? (
                      <Text size="sm" c="dimmed" mt="xs">
                        {t(errorKeys.hintKey)}
                      </Text>
                    ) : null}
                  </Alert>
                ) : null}
                <Button
                  type="submit"
                  variant="filled"
                  size="md"
                  loading={login.isPending}
                  fullWidth
                >
                  {login.isPending ? t('submitting') : t('submit')}
                </Button>
              </Stack>
            </form>
          </Collapse>

          {!demoMode ? (
            <Text size="xs" c="dimmed" ta="center" mt="lg">
              {t('accessHint')}
            </Text>
          ) : null}
        </Paper>
      </Box>
      <Box
        component="footer"
        style={{
          position: 'absolute',
          bottom: 'var(--mantine-spacing-xs)',
          left: 'var(--mantine-spacing-md)',
        }}
      >
        <AppVersionLabel variant="brand" />
      </Box>
    </Box>
  );
}
