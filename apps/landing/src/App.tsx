import { lazy, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingShell } from './components/layout/LandingShell';
import { FirstVisitLocaleRedirect, LocaleProvider } from './i18n/LocaleProvider';
import { HomePage } from './pages/HomePage';

const PhilosophiePage = lazy(() =>
  import('./pages/PhilosophiePage').then((m) => ({ default: m.PhilosophiePage }))
);
const InstallPage = lazy(() =>
  import('./pages/InstallPage').then((m) => ({ default: m.InstallPage }))
);
const ChangelogPage = lazy(() =>
  import('./pages/ChangelogPage').then((m) => ({ default: m.ChangelogPage }))
);
const SponsorPage = lazy(() =>
  import('./pages/SponsorPage').then((m) => ({ default: m.SponsorPage }))
);
const VergleichHubPage = lazy(() =>
  import('./pages/VergleichHubPage').then((m) => ({ default: m.VergleichHubPage }))
);
const LegalPage = lazy(() => import('./pages/LegalPage').then((m) => ({ default: m.LegalPage })));

/** Must return a Fragment (or Route[]), not a custom component – RR only accepts Route/Fragment. */
function landingPageRoutes(homeTo: string): ReactNode {
  return (
    <>
      <Route index element={<HomePage />} />
      <Route path="philosophy" element={<PhilosophiePage />} />
      <Route path="install" element={<InstallPage />} />
      <Route path="changelog" element={<ChangelogPage />} />
      <Route path="sponsor" element={<SponsorPage />} />
      <Route path="compare" element={<VergleichHubPage />} />
      <Route path="legal/imprint" element={<LegalPage kind="impressum" />} />
      <Route path="legal/privacy" element={<LegalPage kind="datenschutz" />} />
      <Route path="*" element={<Navigate to={homeTo} replace />} />
    </>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <FirstVisitLocaleRedirect />
      <Routes>
        {/* Legacy German slugs → English segments (DE unprefixed) */}
        <Route path="philosophie" element={<Navigate to="/philosophy" replace />} />
        <Route path="warum" element={<Navigate to="/philosophy" replace />} />
        <Route path="ansatz" element={<Navigate to="/philosophy" replace />} />
        <Route path="vergleich" element={<Navigate to="/compare" replace />} />
        <Route path="impressum" element={<Navigate to="/legal/imprint" replace />} />
        <Route path="datenschutz" element={<Navigate to="/legal/privacy" replace />} />

        <Route element={<LandingShell />}>{landingPageRoutes('/')}</Route>

        <Route path="en" element={<LandingShell />}>
          {landingPageRoutes('/en')}
        </Route>
      </Routes>
    </LocaleProvider>
  );
}
