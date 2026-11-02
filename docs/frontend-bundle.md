# Frontend bundle notes

The production nginx image stays small; bundle size mainly affects first load and browser cache.

## Measure locally

```bash
cd apps/frontend
pnpm run build
# Inspect dist/index.html modulepreload list and large `dist/assets/*` chunks.
# Optional: add rollup-plugin-visualizer to vite.config.ts for stats.html
```

## Applied optimizations

- **Route-level code splitting:** Almost all authenticated routes load via `React.lazy()` in `src/App.tsx` (catalog, scopes, health check, help, templates, admin tabs, documents, …). Eager: shell, home, login, not-found.
- **Document view vs edit:** TipTap/ProseMirror load only with `DocumentPageEditPanels` (lazy when entering edit mode). Reader path stays without the editor vendor graph.
- **Search:** `DocumentSearchModal` loads on first open; `react-markdown` / remark stack via lazy `searchSnippetMarkdown`.
- **Highlight.js:** Adapter + CSS load after mount (`AppMantineProvider` dynamic import), not in the entry graph.
- **Mermaid:** Already `import('mermaid')` in the preview; ELK/cytoscape/katex stay async diagram chunks. Entry `modulePreload` filters heavy diagram/editor deps (`vite.config.ts`).
- **manualChunks:** Mantine, React, icons, query, i18n, markdown. TipTap is **not** forced into a shared vendor chunk (avoids i18n → TipTap via `use-sync-external-store`). Shared React shims go to `vendor-react`.
- **Icons:** Prefer named imports from `@tabler/icons-react`; avoid barrel re-exports.

## Further options (if entry grows again)

- Lazy `SettingsModal` until opened.
- Narrow Mantine imports / drop unused `@mantine/*` packages from the shell graph.
- Copy only shared API types into the frontend Docker build stage instead of the full backend package (stable shared-types export).
