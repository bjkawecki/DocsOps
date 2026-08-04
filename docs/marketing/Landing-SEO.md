# Landing SEO

**Domain:** `https://docsops.de` · Demo bleibt bewusst `noindex` (`demo.docsops.de`).

## Technik (Build)

| Artefakt                 | Quelle                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `robots.txt`             | Vite-Plugin [`apps/landing/seo/seoEmitPlugin.ts`](../../apps/landing/seo/seoEmitPlugin.ts) beim Build |
| `sitemap.xml`            | Nur Public-Build (Host ohne `.local`)                                                                 |
| Canonical / OG / Twitter | [`LandingHead`](../../apps/landing/src/components/LandingHead.tsx) + Defaults in `index.html`         |
| JSON-LD                  | Home: Organization, SoftwareApplication, FAQPage                                                      |
| Prerender                | `pnpm --filter landing run prerender -- --outDir dist-public` (Playwright) nach `build:public`        |
| Caddy                    | `try_files {path} {path}/index.html /index.html` in `Caddyfile.demo` / `Caddyfile.lab`                |

**Lab vs Public:** Lab (`VITE_SITE_URL=*.local`) schreibt `Disallow: /` und **keine** Sitemap. Public erlaubt Indexierung und setzt `Sitemap: {origin}/sitemap.xml`.

`VITE_SITE_URL` ist Pflicht (kein stiller Fallback) – siehe [`apps/landing/.env.example`](../../apps/landing/.env.example).

Indexierbare Routen: `/`, `/philosophie`, `/install`, `/changelog`, `/vergleich`, `/sponsor`, `/impressum`, `/datenschutz` (SSoT: [`apps/landing/seo/routes.ts`](../../apps/landing/seo/routes.ts)).

## Google Search Console – Checkliste

1. Property `https://docsops.de` anlegen (Domain oder URL-Präfix).
2. Sitemap einreichen: `https://docsops.de/sitemap.xml`.
3. URL-Prüfung: Startseite und `/install` (Live-URL testen).
4. Nach Retag/Deploy von `v0.1.0` (oder neuer Version): Indexierung erneut prüfen; bei Bundle-Update Landing-Dist inkl. robots/sitemap/Prerender mit ausrollen.
5. `demo.docsops.de` **nicht** als Marketing-Property führen; App setzt `noindex`.

## Was wir bewusst nicht tun

- Keyword-Stuffing oder gekaufte Backlinks
- Demo-Inhalte indexieren lassen
- Lab-/`.local`-Hosts in der öffentlichen Sitemap
