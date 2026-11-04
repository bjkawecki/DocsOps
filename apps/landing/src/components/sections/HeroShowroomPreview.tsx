import { Box, useComputedColorScheme } from '@mantine/core';
import { useEffect, useState } from 'react';
import {
  loadShowroomSources,
  SHOWROOM_HEIGHT,
  SHOWROOM_WIDTH,
  type ShowroomSources,
} from '../../assets/showroomImages';
import { useLocale } from '../../i18n/LocaleProvider';

type HeroShowroomPreviewProps = {
  alt: string;
};

export function HeroShowroomPreview({ alt }: HeroShowroomPreviewProps) {
  const { locale } = useLocale();
  const scheme = useComputedColorScheme('dark');
  const [sources, setSources] = useState<ShowroomSources | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadShowroomSources(locale, scheme).then((next) => {
      if (!cancelled) setSources(next);
    });
    return () => {
      cancelled = true;
    };
  }, [locale, scheme]);

  return (
    <Box className="landing-hero-preview landing-surface-card" w="100%">
      {sources ? (
        <picture>
          <source type="image/avif" srcSet={sources.avif} />
          <source type="image/webp" srcSet={sources.webp} />
          <img
            src={sources.webp}
            alt={alt}
            className="landing-hero-preview-image"
            width={SHOWROOM_WIDTH}
            height={SHOWROOM_HEIGHT}
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      ) : null}
    </Box>
  );
}
