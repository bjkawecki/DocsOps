import { useComputedColorScheme } from '@mantine/core';
import { useEffect, useId, useState } from 'react';
import classes from './DocumentMermaid.module.css';

type Props = {
  source: string;
};

type RenderState =
  | { status: 'empty' }
  | { status: 'loading' }
  | { status: 'ok'; svg: string }
  | { status: 'error'; message: string };

/**
 * Reader Mermaid diagram (§28a). Renders client-side with securityLevel: 'strict'.
 */
export function DocumentPreviewMermaid({ source }: Props) {
  const colorScheme = useComputedColorScheme('light');
  const reactId = useId().replace(/:/g, '');
  const [state, setState] = useState<RenderState>(() =>
    source.trim().length === 0 ? { status: 'empty' } : { status: 'loading' }
  );

  useEffect(() => {
    const trimmed = source.trim();
    if (trimmed.length === 0) {
      setState({ status: 'empty' });
      return;
    }

    let cancelled = false;
    setState({ status: 'loading' });

    void (async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: colorScheme === 'dark' ? 'dark' : 'default',
        });
        const renderId = `mermaid-${reactId}-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, trimmed);
        if (!cancelled) setState({ status: 'ok', svg });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to render diagram';
        if (!cancelled) setState({ status: 'error', message });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source, colorScheme, reactId]);

  return (
    <div className={classes.previewRoot} data-mermaid-preview="">
      <div className={classes.previewHeader}>Mermaid</div>
      <div className={classes.previewBody}>
        {state.status === 'empty' ? <p className={classes.previewEmpty}>Empty diagram</p> : null}
        {state.status === 'loading' ? (
          <p className={classes.previewEmpty}>Rendering diagram…</p>
        ) : null}
        {state.status === 'ok' ? <div dangerouslySetInnerHTML={{ __html: state.svg }} /> : null}
        {state.status === 'error' ? (
          <>
            <p className={classes.previewError}>{state.message}</p>
            <pre className={classes.previewSource}>{source}</pre>
          </>
        ) : null}
      </div>
    </div>
  );
}
