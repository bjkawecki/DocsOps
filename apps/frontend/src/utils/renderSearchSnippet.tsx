import { lazy, Suspense, type ReactNode } from 'react';

const SearchSnippetMarkdown = lazy(() => import('./searchSnippetMarkdown.js'));

function SnippetMarkdown({ source }: { source: string }): ReactNode {
  return (
    <Suspense fallback={<span>{source}</span>}>
      <SearchSnippetMarkdown source={source} />
    </Suspense>
  );
}

/** Renders FTS `ts_headline` snippet with `[[...]]` markers as `<mark>` (same convention as Catalog). */
export function renderSearchSnippet(snippet: string): ReactNode {
  const parts = snippet.split(/(\[\[.*?\]\])/g).filter((part) => part.length > 0);
  return parts.map((part, index) => {
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const inner = part.slice(2, -2);
      return (
        <mark key={index}>
          <SnippetMarkdown source={inner} />
        </mark>
      );
    }
    return (
      <span key={index}>
        <SnippetMarkdown source={part} />
      </span>
    );
  });
}
