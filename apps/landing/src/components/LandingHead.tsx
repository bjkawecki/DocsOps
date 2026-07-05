import { useEffect } from 'react';

type LandingHeadProps = {
  title: string;
  description?: string;
};

function upsertMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

export function LandingHead({ title, description }: LandingHeadProps) {
  useEffect(() => {
    document.title = title;
    if (description) {
      upsertMeta('description', description);
      upsertMeta('og:title', title, 'property');
      upsertMeta('og:description', description, 'property');
    }
  }, [title, description]);

  return null;
}
