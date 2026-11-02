import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Reset window scroll on route changes (keeps in-page hash anchors working). */
export function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace(/^#/, '');
      const target = id ? document.getElementById(id) : null;
      if (target) {
        target.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
