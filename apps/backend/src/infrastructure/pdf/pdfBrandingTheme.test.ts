import { describe, expect, it } from 'vitest';
import {
  PDF_BRANDING_DEFAULT_LOGO_POSITION,
  PDF_BRANDING_DEFAULT_MARGIN_MM,
  PDF_BRANDING_DEFAULT_PRIMARY_COLOR,
  buildTypstMainSource,
  isValidPdfLogoPosition,
  isValidPdfMarginMm,
  isValidPdfPrimaryColor,
  resolvePdfBrandingTheme,
} from './pdfBrandingTheme.js';
import { buildMarkdownForPdfExport } from './typstPdfExport.js';

describe('pdfBrandingTheme', () => {
  it('validates hex colors, margins and logo position', () => {
    expect(isValidPdfPrimaryColor('#1c7ed6')).toBe(true);
    expect(isValidPdfPrimaryColor('#GG0000')).toBe(false);
    expect(isValidPdfPrimaryColor('1c7ed6')).toBe(false);
    expect(isValidPdfMarginMm(20)).toBe(true);
    expect(isValidPdfMarginMm(11)).toBe(false);
    expect(isValidPdfMarginMm(41)).toBe(false);
    expect(isValidPdfLogoPosition('left')).toBe(true);
    expect(isValidPdfLogoPosition('right')).toBe(true);
    expect(isValidPdfLogoPosition('center')).toBe(false);
  });

  it('uses platform defaults when company is null', () => {
    const theme = resolvePdfBrandingTheme(null);
    expect(theme.primaryColor).toBe(PDF_BRANDING_DEFAULT_PRIMARY_COLOR);
    expect(theme.marginMm).toBe(PDF_BRANDING_DEFAULT_MARGIN_MM);
    expect(theme.logoPosition).toBe(PDF_BRANDING_DEFAULT_LOGO_POSITION);
    expect(theme.logoRelativePath).toBeNull();
  });

  it('applies company color, margin, logo and position', () => {
    const theme = resolvePdfBrandingTheme({
      pdfPrimaryColor: '#2F9E44',
      pdfMarginMm: 24,
      pdfLogoObjectKey: 'companies/c1/pdf-logo.png',
      pdfLogoContentType: 'image/png',
      pdfLogoPosition: 'right',
    });
    expect(theme.primaryColor).toBe('#2f9e44');
    expect(theme.marginMm).toBe(24);
    expect(theme.logoRelativePath).toBe('branding/logo.png');
    expect(theme.logoObjectKey).toBe('companies/c1/pdf-logo.png');
    expect(theme.logoPosition).toBe('right');
  });

  it('falls back when company fields are invalid or incomplete', () => {
    const theme = resolvePdfBrandingTheme({
      pdfPrimaryColor: 'not-a-color',
      pdfMarginMm: 99,
      pdfLogoObjectKey: 'companies/c1/pdf-logo.png',
      pdfLogoContentType: null,
      pdfLogoPosition: 'center',
    });
    expect(theme.primaryColor).toBe(PDF_BRANDING_DEFAULT_PRIMARY_COLOR);
    expect(theme.marginMm).toBe(PDF_BRANDING_DEFAULT_MARGIN_MM);
    expect(theme.logoRelativePath).toBeNull();
    expect(theme.logoPosition).toBe(PDF_BRANDING_DEFAULT_LOGO_POSITION);
  });

  it('builds main.typ with page header logo, heading scale and link color', () => {
    const withLogo = buildTypstMainSource({
      primaryColor: '#1c7ed6',
      marginMm: 20,
      logoPosition: 'right',
      logoRelativePath: 'branding/logo.png',
      logoObjectKey: 'k',
      logoContentType: 'image/png',
    });
    expect(withLogo).toContain('#import "@preview/cmarker:0.1.6": render');
    expect(withLogo).toContain('#show heading.where(level: 1): set text(size: 22pt');
    expect(withLogo).toContain('#show heading.where(level: 2): set text(size: 16pt');
    expect(withLogo).toContain('#show link: set text(fill: rgb("#1c7ed6"))');
    expect(withLogo).toContain(
      'header: box(width: 100%, align(right + horizon)[#image("branding/logo.png"'
    );
    expect(withLogo).toContain('margin: (top: 36mm');
    expect(withLogo).toContain('#render(read("content.md"))');

    const withoutLogo = buildTypstMainSource({
      primaryColor: '#1c7ed6',
      marginMm: 16,
      logoPosition: 'left',
      logoRelativePath: null,
      logoObjectKey: null,
      logoContentType: null,
    });
    expect(withoutLogo).not.toContain('#image');
    expect(withoutLogo).toContain('#set page(margin: 16mm)');
  });
});

describe('buildMarkdownForPdfExport', () => {
  it('prepends title without typst fence', () => {
    const md = buildMarkdownForPdfExport('Hello', 'Doc');
    expect(md.startsWith('# Doc')).toBe(true);
    expect(md).not.toContain('```typst');
  });
});
