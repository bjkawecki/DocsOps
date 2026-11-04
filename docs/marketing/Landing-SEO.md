# Landing SEO

**Domain:** `https://docsops.de` · Demo bleibt bewusst `noindex` (`demo.docsops.de`).

## Technik (Build)

| Artefakt                 | Quelle                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `robots.txt`             | Vite-Plugin [`apps/landing/seo/seoEmitPlugin.ts`](../../apps/landing/seo/seoEmitPlugin.ts) beim Build |
| `sitemap.xml`            | Nur Public-Build (Host ohne `.local`); inkl. `xhtml:link` hreflang de/en/x-default                    |
| Canonical / OG / Twitter | [`LandingHead`](../../apps/landing/src/components/LandingHead.tsx) + Defaults in `index.html`         |
| `hreflang`               | `LandingHead`: `link rel="alternate"` de / en / x-default (x-default → DE)                            |
| `html lang`              | aus URL-Locale (`LocaleProvider` / `LandingHead`)                                                     |
| JSON-LD                  | Home: Organization, SoftwareApplication, FAQPage (locale-abhängig)                                    |
| Prerender                | `pnpm --filter landing run prerender -- --outDir dist-public` (Playwright) nach `build:public`        |
| Caddy                    | `try_files {path} {path}/index.html /index.html` in `Caddyfile.demo` / `Caddyfile.lab`                |

**Lab vs Public:** Lab (`VITE_SITE_URL=*.local`) schreibt `Disallow: /` und **keine** Sitemap. Public erlaubt Indexierung und setzt `Sitemap: {origin}/sitemap.xml`.

`VITE_SITE_URL` ist Pflicht (kein stiller Fallback) – siehe [`apps/landing/.env.example`](../../apps/landing/.env.example).

## Locales & Pfade

| Locale | URL-Präfix | Beispiel                               |
| ------ | ---------- | -------------------------------------- |
| `de`   | keiner     | `/`, `/philosophy`, `/compare`         |
| `en`   | `/en`      | `/en`, `/en/philosophy`, `/en/compare` |

Indexierbare Routen (SSoT: [`apps/landing/seo/routes.ts`](../../apps/landing/seo/routes.ts)): jeweils DE + EN für `/`, `/philosophy`, `/install`, `/changelog`, `/compare`, `/sponsor`, `/legal/imprint`, `/legal/privacy`.

Legacy-Slugs (`/philosophie`, `/vergleich`, `/impressum`, `/datenschutz`, …) redirecten clientseitig auf die englischen Segmente (DE unprefixed).

Details: [Landing-Page-Plan §8](./Landing-Page-Plan.md#8-landing-i18n-umgesetzt).

## Google Search Console – Checkliste

1. Property `https://docsops.de` anlegen (Domain oder URL-Präfix).
2. Sitemap einreichen: `https://docsops.de/sitemap.xml`.
3. URL-Prüfung: Startseite, `/en`, `/install`, `/en/install` (Live-URL testen).
4. Nach Retag/Deploy: Indexierung erneut prüfen; bei Bundle-Update Landing-Dist inkl. robots/sitemap/Prerender mit ausrollen.
5. `demo.docsops.de` **nicht** als Marketing-Property führen; App setzt `noindex`.

## Was wir bewusst nicht tun

- Keyword-Stuffing oder gekaufte Backlinks
- Demo-Inhalte indexieren lassen
- Lab-/`.local`-Hosts in der öffentlichen Sitemap
