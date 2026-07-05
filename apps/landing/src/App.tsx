import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingShell } from './components/layout/LandingShell';
import { ChangelogPage } from './pages/ChangelogPage';
import { HomePage } from './pages/HomePage';
import { InstallPage } from './pages/InstallPage';
import { LegalPage } from './pages/LegalPage';
import { PhilosophiePage } from './pages/PhilosophiePage';
import { SponsorPage } from './pages/SponsorPage';
import { VergleichHubPage } from './pages/VergleichHubPage';

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
