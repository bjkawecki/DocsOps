import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import { releaseMarkdownComponents } from './releaseMarkdownComponents';

describe('releaseMarkdownComponents', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });
  it('renders ### Features with a section icon', () => {
    const { container } = render(
      <MantineProvider>
        <ReactMarkdown components={releaseMarkdownComponents}>### Features</ReactMarkdown>
      </MantineProvider>
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Features' })).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('renders unknown ### sections without an icon', () => {
    const { container } = render(
      <MantineProvider>
        <ReactMarkdown components={releaseMarkdownComponents}>### Other</ReactMarkdown>
      </MantineProvider>
    );

    expect(screen.getByRole('heading', { level: 3, name: 'Other' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeNull();
  });

  it('renders # release title as h1 above body text', () => {
    render(
      <MantineProvider>
        <ReactMarkdown components={releaseMarkdownComponents}>
          {`# Editor & admin polish\n\nIntro paragraph.`}
        </ReactMarkdown>
      </MantineProvider>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Editor & admin polish' })
    ).toBeInTheDocument();
    expect(screen.getByText('Intro paragraph.')).toBeInTheDocument();
  });
});
