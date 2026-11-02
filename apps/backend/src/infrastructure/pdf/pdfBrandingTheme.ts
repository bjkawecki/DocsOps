/** Platform defaults when Company has no PDF branding (ADR 007). */
export const PDF_BRANDING_DEFAULT_PRIMARY_COLOR = '#1c7ed6';
export const PDF_BRANDING_DEFAULT_MARGIN_MM = 20;
export const PDF_BRANDING_MARGIN_MM_MIN = 12;
export const PDF_BRANDING_MARGIN_MM_MAX = 40;
export const PDF_LOGO_MAX_BYTES = 2 * 1024 * 1024;
export const PDF_LOGO_ALLOWED_CONTENT_TYPES = ['image/png', 'image/jpeg'] as const;
export const PDF_LOGO_POSITIONS = ['left', 'right'] as const;
export const PDF_BRANDING_DEFAULT_LOGO_POSITION = 'left' as const;
export const PDF_FONT_FAMILIES = ['sans', 'serif'] as const;
export const PDF_BRANDING_DEFAULT_FONT_FAMILY = 'sans' as const;
/** Typst font names (Liberation; installed on worker / node-dev images). */
export const PDF_TYPST_FONT_SANS = 'Liberation Sans';
export const PDF_TYPST_FONT_SERIF = 'Liberation Serif';
/** Extra top margin when a header logo is present (logo height + gap). */
export const PDF_LOGO_HEADER_EXTRA_TOP_MM = 16;
export const PDF_LOGO_HEADER_HEIGHT_MM = 12;
/** Accepted width:height range for PDF logos (recommended 3:1–5:1). */
export const PDF_LOGO_ASPECT_RATIO_MIN = 2;
export const PDF_LOGO_ASPECT_RATIO_MAX = 6;

export type PdfLogoContentType = (typeof PDF_LOGO_ALLOWED_CONTENT_TYPES)[number];
export type PdfLogoPosition = (typeof PDF_LOGO_POSITIONS)[number];
export type PdfFontFamily = (typeof PDF_FONT_FAMILIES)[number];

export type CompanyPdfBrandingRow = {
  pdfPrimaryColor: string | null;
  pdfMarginMm: number | null;
  pdfLogoObjectKey: string | null;
  pdfLogoContentType: string | null;
  pdfLogoPosition: string | null;
  pdfFontFamily: string | null;
};

export type ResolvedPdfBrandingTheme = {
  primaryColor: string;
  marginMm: number;
  logoPosition: PdfLogoPosition;
  fontFamily: PdfFontFamily;
  /** Relative path under Typst workdir, e.g. `branding/logo.png`. */
  logoRelativePath: string | null;
  logoObjectKey: string | null;
  logoContentType: PdfLogoContentType | null;
};

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;

export function isValidPdfPrimaryColor(value: string): boolean {
  return HEX_COLOR_RE.test(value);
}

export function isValidPdfMarginMm(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= PDF_BRANDING_MARGIN_MM_MIN &&
    value <= PDF_BRANDING_MARGIN_MM_MAX
  );
}

export function isValidPdfLogoPosition(value: string): value is PdfLogoPosition {
  return (PDF_LOGO_POSITIONS as readonly string[]).includes(value);
}

export function isValidPdfFontFamily(value: string): value is PdfFontFamily {
  return (PDF_FONT_FAMILIES as readonly string[]).includes(value);
}

export function typstFontNameForFamily(family: PdfFontFamily): string {
  return family === 'serif' ? PDF_TYPST_FONT_SERIF : PDF_TYPST_FONT_SANS;
}

export function isAllowedPdfLogoContentType(value: string): value is PdfLogoContentType {
  return (PDF_LOGO_ALLOWED_CONTENT_TYPES as readonly string[]).includes(value);
}

/** True when width/height is within the accepted landscape range (inclusive). */
export function isValidPdfLogoAspectRatio(width: number, height: number): boolean {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return false;
  }
  const ratio = width / height;
  return ratio >= PDF_LOGO_ASPECT_RATIO_MIN && ratio <= PDF_LOGO_ASPECT_RATIO_MAX;
}

export function logoExtensionForContentType(contentType: PdfLogoContentType): '.png' | '.jpg' {
  return contentType === 'image/png' ? '.png' : '.jpg';
}

/**
 * Resolve export theme from optional Company row.
 * Null fields fall back to platform defaults; missing company → full defaults.
 */
export function resolvePdfBrandingTheme(
  company: CompanyPdfBrandingRow | null
): ResolvedPdfBrandingTheme {
  if (!company) {
    return {
      primaryColor: PDF_BRANDING_DEFAULT_PRIMARY_COLOR,
      marginMm: PDF_BRANDING_DEFAULT_MARGIN_MM,
      logoPosition: PDF_BRANDING_DEFAULT_LOGO_POSITION,
      fontFamily: PDF_BRANDING_DEFAULT_FONT_FAMILY,
      logoRelativePath: null,
      logoObjectKey: null,
      logoContentType: null,
    };
  }

  const primaryColor =
    company.pdfPrimaryColor != null && isValidPdfPrimaryColor(company.pdfPrimaryColor)
      ? company.pdfPrimaryColor.toLowerCase()
      : PDF_BRANDING_DEFAULT_PRIMARY_COLOR;

  const marginMm =
    company.pdfMarginMm != null && isValidPdfMarginMm(company.pdfMarginMm)
      ? company.pdfMarginMm
      : PDF_BRANDING_DEFAULT_MARGIN_MM;

  const logoPosition =
    company.pdfLogoPosition != null && isValidPdfLogoPosition(company.pdfLogoPosition)
      ? company.pdfLogoPosition
      : PDF_BRANDING_DEFAULT_LOGO_POSITION;

  const fontFamily =
    company.pdfFontFamily != null && isValidPdfFontFamily(company.pdfFontFamily)
      ? company.pdfFontFamily
      : PDF_BRANDING_DEFAULT_FONT_FAMILY;

  const contentType = company.pdfLogoContentType;
  const objectKey = company.pdfLogoObjectKey;
  if (
    objectKey != null &&
    objectKey.length > 0 &&
    contentType != null &&
    isAllowedPdfLogoContentType(contentType)
  ) {
    const ext = logoExtensionForContentType(contentType);
    return {
      primaryColor,
      marginMm,
      logoPosition,
      fontFamily,
      logoRelativePath: `branding/logo${ext}`,
      logoObjectKey: objectKey,
      logoContentType: contentType,
    };
  }

  return {
    primaryColor,
    marginMm,
    logoPosition,
    fontFamily,
    logoRelativePath: null,
    logoObjectKey: null,
    logoContentType: null,
  };
}

/**
 * Typst entry document (ADR 007): page/link/logo rules + CommonMark via cmarker.
 * Body must be written as `content.md` next to this file.
 *
 * Logo sits in the page header (left or right corner). Heading sizes are set
 * explicitly because Typst’s default level scale is too subtle for Markdown H1/H2.
 */
export function buildTypstMainSource(theme: ResolvedPdfBrandingTheme): string {
  const fontName = typstFontNameForFamily(theme.fontFamily);
  const lines = [
    '#import "@preview/cmarker:0.1.6": render',
    '#set text(font: "' + fontName + '", size: 11pt)',
    '#show heading.where(level: 1): set text(size: 22pt, weight: "bold")',
    '#show heading.where(level: 2): set text(size: 16pt, weight: "bold")',
    '#show heading.where(level: 3): set text(size: 13pt, weight: "semibold")',
    '#show heading.where(level: 4): set text(size: 11pt, weight: "bold")',
    '#show heading: set block(above: 1.25em, below: 0.55em)',
    '#show link: set text(fill: rgb("' + theme.primaryColor + '"))',
  ];

  if (theme.logoRelativePath != null) {
    const topMm = theme.marginMm + PDF_LOGO_HEADER_EXTRA_TOP_MM;
    const align = theme.logoPosition === 'right' ? 'right' : 'left';
    // box(width: 100%) is required: bare align(right) shrink-wraps to the image
    // and stays on the left edge of the page header.
    lines.push(
      '#set page(',
      '  margin: (top: ' +
        String(topMm) +
        'mm, bottom: ' +
        String(theme.marginMm) +
        'mm, left: ' +
        String(theme.marginMm) +
        'mm, right: ' +
        String(theme.marginMm) +
        'mm),',
      '  header: box(width: 100%, align(' +
        align +
        ' + horizon)[#image("' +
        theme.logoRelativePath +
        '", height: ' +
        String(PDF_LOGO_HEADER_HEIGHT_MM) +
        'mm)]),',
      '  header-ascent: 8mm,',
      ')'
    );
  } else {
    lines.push('#set page(margin: ' + String(theme.marginMm) + 'mm)');
  }

  lines.push('#render(read("content.md"))');
  return lines.join('\n') + '\n';
}
