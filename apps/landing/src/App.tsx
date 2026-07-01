import { Navigate, Route, Routes } from 'react-router-dom';
import { LandingShell } from './components/layout/LandingShell';
import { HomePage } from './pages/HomePage';
import { LegalPlaceholderPage } from './pages/LegalPlaceholderPage';
import { VergleichHubPage } from './pages/VergleichHubPage';
import { WarumPage } from './pages/WarumPage';

export default function App() {
  return (
    <Routes>
      <Route element={<LandingShell />}>
        <Route index element={<HomePage />} />
        <Route path="warum" element={<WarumPage />} />
        <Route path="ansatz" element={<Navigate to="/warum" replace />} />
        <Route path="vergleich" element={<VergleichHubPage />} />
        <Route path="impressum" element={<LegalPlaceholderPage kind="impressum" />} />
        <Route path="datenschutz" element={<LegalPlaceholderPage kind="datenschutz" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
