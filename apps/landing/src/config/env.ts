const DEFAULT_DEMO_URL = 'http://localhost:5000';
const DEFAULT_GITHUB_REPO_URL = 'https://github.com/bjkawecki/docs-ops';

export class LandingConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LandingConfigError';
  }
}

export function getDemoUrl(): string {
  return import.meta.env.VITE_DEMO_URL?.trim() || DEFAULT_DEMO_URL;
}

export function getGithubRepoUrl(): string {
  return import.meta.env.VITE_GITHUB_REPO_URL?.trim() || DEFAULT_GITHUB_REPO_URL;
}

export function getInstallDocsUrl(): string {
  return `${getGithubRepoUrl()}/blob/main/docs/install.md`;
}

export function getInstallScriptUrl(): string {
  return `${getGithubRepoUrl()}/releases/latest/download/install.sh`;
}

export function getAppVersion(): string {
  const version = import.meta.env.VITE_APP_VERSION?.trim();
  if (!version) {
    throw new LandingConfigError(
      'VITE_APP_VERSION is not configured. Run landing via Vite (make landing-dev / landing-build).'
    );
  }
  return version;
}

export function getSiteUrl(): string {
  const siteUrl = import.meta.env.VITE_SITE_URL?.trim();
  if (!siteUrl) {
    throw new LandingConfigError(
      'VITE_SITE_URL is not configured. Set it in apps/landing/.env (see .env.example).'
    );
  }
  return siteUrl.replace(/\/$/, '');
}

export function getSponsorGithubUrl(): string | undefined {
  const url = import.meta.env.VITE_SPONSOR_GITHUB_URL?.trim();
  return url || undefined;
}

export function resolveProjectNavHref(href: string): { url: string; external: boolean } {
  switch (href) {
    case 'github':
      return { url: getGithubRepoUrl(), external: true };
    case 'install-docs':
      return { url: getInstallDocsUrl(), external: true };
    default:
      return { url: href, external: false };
  }
}
