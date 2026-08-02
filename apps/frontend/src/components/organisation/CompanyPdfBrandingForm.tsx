import { useEffect, useRef, useState } from 'react';
import {
  Button,
  ColorInput,
  Group,
  Image,
  NumberInput,
  SegmentedControl,
  Stack,
  Text,
  FileButton,
} from '@mantine/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client.js';

export type CompanyPdfBrandingDto = {
  pdfPrimaryColor: string | null;
  pdfMarginMm: number | null;
  pdfLogoPosition: 'left' | 'right' | null;
  hasPdfLogo: boolean;
};

type Props = {
  companyId: string;
};

export function CompanyPdfBrandingForm({ companyId }: Props) {
  const { t } = useTranslation('admin');
  const queryClient = useQueryClient();
  const resetRef = useRef<() => void>(null);
  const [primaryColor, setPrimaryColor] = useState('#1c7ed6');
  const [marginMm, setMarginMm] = useState<number | string>(20);
  const [logoPosition, setLogoPosition] = useState<'left' | 'right'>('left');
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: ['companies', companyId, 'pdf-branding'],
    queryFn: async (): Promise<CompanyPdfBrandingDto> => {
      const res = await apiFetch(`/api/v1/companies/${companyId}/pdf-branding`);
      if (!res.ok) throw new Error(t('common:errors.loadFailed'));
      return (await res.json()) as CompanyPdfBrandingDto;
    },
  });

  useEffect(() => {
    if (!data) return;
    setPrimaryColor(data.pdfPrimaryColor ?? '#1c7ed6');
    setMarginMm(data.pdfMarginMm ?? 20);
    setLogoPosition(data.pdfLogoPosition ?? 'left');
  }, [data]);

  useEffect(() => {
    if (!data?.hasPdfLogo) {
      setLogoPreviewUrl(null);
      return;
    }
    let revoked = false;
    let objectUrl: string | null = null;
    void (async () => {
      const res = await apiFetch(`/api/v1/companies/${companyId}/pdf-logo`);
      if (!res.ok || revoked) return;
      const blob = await res.blob();
      if (revoked) return;
      objectUrl = URL.createObjectURL(blob);
      setLogoPreviewUrl(objectUrl);
    })();
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [companyId, data?.hasPdfLogo]);

  const saveBranding = useMutation({
    mutationFn: async () => {
      const margin =
        typeof marginMm === 'number' ? marginMm : Number.parseInt(String(marginMm), 10);
      const res = await apiFetch(`/api/v1/companies/${companyId}/pdf-branding`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfPrimaryColor: primaryColor.trim() || null,
          pdfMarginMm: Number.isFinite(margin) ? margin : null,
          pdfLogoPosition: logoPosition,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
      return (await res.json()) as CompanyPdfBrandingDto;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies', companyId, 'pdf-branding'] });
      notifications.show({
        title: t('company.pdfBranding.toasts.savedTitle'),
        message: t('company.pdfBranding.toasts.savedMessage'),
        color: 'green',
      });
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const res = await apiFetch(`/api/v1/companies/${companyId}/pdf-logo`, {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
      return (await res.json()) as CompanyPdfBrandingDto;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies', companyId, 'pdf-branding'] });
      resetRef.current?.();
      notifications.show({
        title: t('company.pdfBranding.toasts.logoUploadedTitle'),
        message: t('company.pdfBranding.toasts.logoUploadedMessage'),
        color: 'green',
      });
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  const removeLogo = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(`/api/v1/companies/${companyId}/pdf-logo`, { method: 'DELETE' });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? res.statusText);
      }
      return (await res.json()) as CompanyPdfBrandingDto;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['companies', companyId, 'pdf-branding'] });
      notifications.show({
        title: t('company.pdfBranding.toasts.logoRemovedTitle'),
        message: t('company.pdfBranding.toasts.logoRemovedMessage'),
        color: 'green',
      });
    },
    onError: (e: Error) =>
      notifications.show({ title: t('shared.errorTitle'), message: e.message, color: 'red' }),
  });

  if (isPending) {
    return (
      <Text size="sm" c="dimmed">
        {t('company.pdfBranding.loading')}
      </Text>
    );
  }

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        {t('company.pdfBranding.intro')}
      </Text>
      <ColorInput
        label={t('company.pdfBranding.primaryColorLabel')}
        format="hex"
        value={primaryColor}
        onChange={setPrimaryColor}
        swatches={['#1c7ed6', '#2f9e44', '#e03131', '#7048e8', '#212529']}
      />
      <NumberInput
        label={t('company.pdfBranding.marginLabel')}
        description={t('company.pdfBranding.marginDescription')}
        min={12}
        max={40}
        value={marginMm}
        onChange={setMarginMm}
      />
      <Stack gap={6}>
        <Text size="sm" fw={500}>
          {t('company.pdfBranding.logoLabel')}
        </Text>
        {logoPreviewUrl ? (
          <Image src={logoPreviewUrl} alt="PDF logo" maw={180} fit="contain" />
        ) : (
          <Text size="xs" c="dimmed">
            {t('company.pdfBranding.noLogo')}
          </Text>
        )}
        <SegmentedControl
          value={logoPosition}
          onChange={(value) => setLogoPosition(value as 'left' | 'right')}
          data={[
            { label: t('company.pdfBranding.positionLeft'), value: 'left' },
            { label: t('company.pdfBranding.positionRight'), value: 'right' },
          ]}
        />
        <Group gap="xs">
          <FileButton
            resetRef={resetRef}
            accept="image/png,image/jpeg"
            onChange={(file) => {
              if (file) uploadLogo.mutate(file);
            }}
          >
            {(props) => (
              <Button {...props} size="xs" variant="light" loading={uploadLogo.isPending}>
                {t('company.pdfBranding.uploadButton')}
              </Button>
            )}
          </FileButton>
          <Button
            size="xs"
            variant="subtle"
            color="red"
            disabled={!data?.hasPdfLogo}
            loading={removeLogo.isPending}
            onClick={() => removeLogo.mutate()}
          >
            {t('company.pdfBranding.removeButton')}
          </Button>
        </Group>
      </Stack>
      <Group justify="flex-end">
        <Button onClick={() => saveBranding.mutate()} loading={saveBranding.isPending}>
          {t('company.pdfBranding.saveButton')}
        </Button>
      </Group>
    </Stack>
  );
}
