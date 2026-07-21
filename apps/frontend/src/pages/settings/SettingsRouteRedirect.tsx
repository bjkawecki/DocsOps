import { Navigate, useSearchParams } from 'react-router-dom';
import { SETTINGS_QUERY_KEY, settingsSectionFromLegacySearch } from './settingsLayout.js';

/** Legacy `/settings` bookmarks → home with settings modal query. */
export function SettingsRouteRedirect() {
  const [searchParams] = useSearchParams();
  const section = settingsSectionFromLegacySearch(searchParams);
  return <Navigate to={`/?${SETTINGS_QUERY_KEY}=${section}`} replace />;
}
