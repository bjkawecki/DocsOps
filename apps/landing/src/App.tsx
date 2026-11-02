import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingShell } from './components/layout/LandingShell';
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

export default function App() {
  return (
    <Routes>
      <Route element={<LandingShell />}>
        <Route index element={<HomePage />} />
        <Route path="philosophie" element={<PhilosophiePage />} />
        <Route path="warum" element={<Navigate to="/philosophie" replace />} />
        <Route path="ansatz" element={<Navigate to="/philosophie" replace />} />
        <Route path="install" element={<InstallPage />} />
        <Route path="changelog" element={<ChangelogPage />} />
        <Route path="sponsor" element={<SponsorPage />} />
        <Route path="vergleich" element={<VergleichHubPage />} />
        <Route path="impressum" element={<LegalPage kind="impressum" />} />
        <Route path="datenschutz" element={<LegalPage kind="datenschutz" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
