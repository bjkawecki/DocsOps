import { useEffect, useRef, useState } from 'react';
import { heroCopy } from '../../content/siteCopy';

const ROTATE_MS = 3_400;
const REDUCED_MOTION_INDEX = 2;

function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  return prefersReducedMotion;
}

export function HeroHeadline() {
  const { headlineLead, headlineQualities, headlineTail, headlineAccessible } = heroCopy;
  const prefersReducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [outgoingIndex, setOutgoingIndex] = useState<number | null>(null);
  const [slideActive, setSlideActive] = useState(false);
  const [settledKey, setSettledKey] = useState(0);

  const activeIndexRef = useRef(activeIndex);
  const isSlidingRef = useRef(false);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (isSlidingRef.current) {
        return;
      }

      const fromIndex = activeIndexRef.current;
      const toIndex = (fromIndex + 1) % headlineQualities.length;
      isSlidingRef.current = true;

      setOutgoingIndex(fromIndex);
      setActiveIndex(toIndex);
      setSlideActive(false);
    }, ROTATE_MS);

    return () => window.clearInterval(intervalId);
  }, [prefersReducedMotion, headlineQualities.length]);

  useEffect(() => {
    if (outgoingIndex === null) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setSlideActive(true));
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [outgoingIndex, activeIndex]);

  const finishSlide = () => {
    if (outgoingIndex === null) {
      return;
    }

    isSlidingRef.current = false;
    setOutgoingIndex(null);
    setSlideActive(false);
    setSettledKey((key) => key + 1);
  };

  const displayIndex = prefersReducedMotion ? REDUCED_MOTION_INDEX : activeIndex;
  const activeWord = headlineQualities[displayIndex];
  const outgoingWord = outgoingIndex !== null ? headlineQualities[outgoingIndex] : null;

  return (
    <h1 className="landing-hero-headline" aria-label={headlineAccessible}>
      <span className="landing-hero-headline-lead">{headlineLead}</span>
      <span className="landing-hero-headline-second" aria-hidden="true">
        <span className="landing-hero-qualifier">
          <span className="landing-hero-qualifier-sizer" aria-hidden="true">
            {headlineQualities.map((word) => (
              <span key={word} className="landing-hero-qualifier-sizer-word">
                {word}
              </span>
            ))}
          </span>
          <span className="landing-hero-qualifier-viewport">
            {outgoingWord === null ? (
              <span
                key={`settled-${displayIndex}-${settledKey}`}
                className="landing-hero-qualifier-word landing-hero-qualifier-word--settled"
              >
                {activeWord}
              </span>
            ) : (
              <>
                <span
                  key={`out-${outgoingIndex}`}
                  className={`landing-hero-qualifier-word landing-hero-qualifier-word--layer${slideActive ? ' landing-hero-qualifier-word--out-active' : ''}`}
                >
                  {outgoingWord}
                </span>
                <span
                  key={`in-${displayIndex}`}
                  className={`landing-hero-qualifier-word landing-hero-qualifier-word--layer landing-hero-qualifier-word--in${slideActive ? ' landing-hero-qualifier-word--in-active' : ''}`}
                  onTransitionEnd={(event) => {
                    if (event.propertyName !== 'transform') {
                      return;
                    }
                    finishSlide();
                  }}
                >
                  {activeWord}
                </span>
              </>
            )}
          </span>
        </span>
        <span className="landing-hero-headline-tail">{headlineTail}</span>
        <span className="landing-hero-dot">.</span>
      </span>
    </h1>
  );
}
