import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { renderSearchSnippet } from './renderSearchSnippet';

describe('renderSearchSnippet', () => {
  it('renders Markdown bold as strong', async () => {
    render(<div data-testid="wrap">{renderSearchSnippet('Kurzer **Markdown**-Inhalt.')}</div>);
    await waitFor(() => {
      const strong = screen.getByTestId('wrap').querySelector('strong');
      expect(strong?.textContent).toBe('Markdown');
    });
  });

  it('renders highlight segment with Markdown inside mark', async () => {
    render(<div data-testid="wrap">{renderSearchSnippet('A [[**hit**]] B')}</div>);
    await waitFor(() => {
      const mark = screen.getByTestId('wrap').querySelector('mark');
      expect(mark?.querySelector('strong')?.textContent).toBe('hit');
    });
  });
});
