const DEFAULT_DEMO_URL = 'http://localhost:5000';
const DEFAULT_GITHUB_REPO_URL = 'https://github.com/bjkawecki/docs-ops';

export function getDemoUrl(): string {
  return import.meta.env.VITE_DEMO_URL?.trim() || DEFAULT_DEMO_URL;
}

export function getGithubRepoUrl(): string {
  return import.meta.env.VITE_GITHUB_REPO_URL?.trim() || DEFAULT_GITHUB_REPO_URL;
}

export function getInstallDocsUrl(): string {
  return `${getGithubRepoUrl()}/blob/main/docs/install.md`;
}
