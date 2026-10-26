import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { AppShell } from './components/appShell/AppShell';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { TeamRedirectPage } from './pages/team/TeamRedirectPage';
import { CompanyPage } from './pages/company/CompanyPage';
import { CatalogPage } from './pages/catalog/CatalogPage';
import { DepartmentRedirectPage } from './pages/department/DepartmentRedirectPage';
import { DepartmentContextPage } from './pages/department/DepartmentContextPage';
import { PersonalPage } from './pages/account/PersonalPage';
import { SharedPage } from './pages/account/SharedPage';
import { ApprovalsPage } from './pages/catalog/ApprovalsPage';
import { TeamContextPage } from './pages/TeamContextPage';
import { ContextWorkspacePage } from './pages/contextWorkspace/ContextWorkspacePage';
import {
  CompanyTrashArchivePage,
  DepartmentTrashArchivePage,
  PersonalTrashArchivePage,
  TeamTrashArchivePage,
} from './pages/contextWorkspace/ScopeTrashArchiveRoutePages';
import {
  CompanyMostReadPage,
  DepartmentMostReadPage,
  PersonalMostReadPage,
  TeamMostReadPage,
} from './pages/contextWorkspace/ScopeMostReadRoutePages';
import { SettingsRouteRedirect } from './pages/settings/SettingsRouteRedirect';
import { NotificationsPage } from './pages/account/NotificationsPage';
import { NotFoundPage } from './pages/misc/NotFoundPage';
import { AuthGuard } from './components/guards/AuthGuard';
import { AdminGuard } from './components/guards/AdminGuard';
import { DenyPlatformAdminGuard } from './components/guards/DenyPlatformAdminGuard';
import { ThemeFromPreferences } from './components/system/ThemeFromPreferences';
import { ErrorBoundary } from './components/system/ErrorBoundary';
import { ADMIN_DEFAULT_PATH, adminLegacyRedirects } from './pages/admin/adminNavConfig.js';
import { flattenHelpTopics, HELP_DEFAULT_PATH } from './pages/help/helpTopics.js';

/** Preserve query/hash when renaming legacy paths (e.g. /approvals?tab=moves). */
function RedirectWithSearch({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate to={`${to}${location.search}${location.hash}`} replace />;
}

const DocumentPage = lazy(() =>
  import('./pages/document/DocumentPage').then((m) => ({ default: m.DocumentPage }))
);
const DocumentVersionsPage = lazy(() =>
  import('./pages/document/DocumentVersionsPage').then((m) => ({
    default: m.DocumentVersionsPage,
  }))
);
const HelpLayout = lazy(() =>
  import('./pages/help/HelpLayout').then((m) => ({ default: m.HelpLayout }))
);
const HelpArticlePage = lazy(() =>
  import('./pages/help/HelpArticlePage').then((m) => ({ default: m.HelpArticlePage }))
);
const DocumentTemplatesPage = lazy(() =>
  import('./pages/documentTemplates/DocumentTemplatesPage').then((m) => ({
    default: m.DocumentTemplatesPage,
  }))
);
const WhatsNewPage = lazy(() =>
  import('./pages/whatsNew/WhatsNewPage').then((m) => ({ default: m.WhatsNewPage }))
);
const AdminPage = lazy(() =>
  import('./pages/admin/AdminPage').then((m) => ({ default: m.AdminPage }))
);
const AdminUsersTab = lazy(() =>
  import('./pages/admin/AdminUsersTab').then((m) => ({ default: m.AdminUsersTab }))
);
const AdminTeamsTab = lazy(() =>
  import('./pages/admin/AdminTeamsTab').then((m) => ({ default: m.AdminTeamsTab }))
);
const AdminDepartmentsTab = lazy(() =>
  import('./pages/admin/AdminDepartmentsTab').then((m) => ({ default: m.AdminDepartmentsTab }))
);
const AdminCompanyTab = lazy(() =>
  import('./pages/admin/AdminCompanyTab').then((m) => ({ default: m.AdminCompanyTab }))
);
const AdminJobsTab = lazy(() =>
  import('./pages/admin/AdminJobsTab').then((m) => ({ default: m.AdminJobsTab }))
);
const AdminSchedulerTab = lazy(() =>
  import('./pages/admin/AdminSchedulerTab').then((m) => ({ default: m.AdminSchedulerTab }))
);
const AdminBackupTab = lazy(() =>
  import('./pages/admin/AdminBackupTab/AdminBackupTab').then((m) => ({ default: m.AdminBackupTab }))
);
const AdminMigrationTab = lazy(() =>
  import('./pages/admin/AdminMigrationTab/AdminMigrationTab').then((m) => ({
    default: m.AdminMigrationTab,
  }))
);
const AdminBroadcastTab = lazy(() =>
  import('./pages/admin/AdminBroadcastTab/index.js').then((m) => ({ default: m.AdminBroadcastTab }))
);
const AdminSystemTab = lazy(() =>
  import('./pages/admin/AdminSystemTab/AdminSystemTab.js').then((m) => ({
    default: m.AdminSystemTab,
  }))
);
const AdminMailTab = lazy(() =>
  import('./pages/admin/AdminMailTab.js').then((m) => ({ default: m.AdminMailTab }))
);
const AdminRolesTab = lazy(() =>
  import('./pages/admin/AdminRolesTab.js').then((m) => ({ default: m.AdminRolesTab }))
);

function RouteFallback() {
  return (
    <Center py="xl">
      <Loader size="sm" />
    </Center>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <AuthGuard>
                <ThemeFromPreferences>
                  <AppShell />
                </ThemeFromPreferences>
              </AuthGuard>
            }
          >
            <Route index element={<HomePage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="templates" element={<DocumentTemplatesPage />} />
            <Route path="document-templates" element={<Navigate to="/templates" replace />} />
            <Route path="company" element={<CompanyPage />} />
            <Route path="company/most-read" element={<CompanyMostReadPage />} />
            {/* Member/lead product surfaces – platform admin redirected to /company */}
            <Route element={<DenyPlatformAdminGuard />}>
              <Route path="team" element={<TeamRedirectPage />} />
              <Route path="team/:teamId" element={<TeamContextPage />} />
              <Route path="team/:teamId/trash" element={<TeamTrashArchivePage kind="trash" />} />
              <Route
                path="team/:teamId/archive"
                element={<TeamTrashArchivePage kind="archive" />}
              />
              <Route path="team/:teamId/most-read" element={<TeamMostReadPage />} />
              <Route path="department" element={<DepartmentRedirectPage />} />
              <Route path="department/:departmentId" element={<DepartmentContextPage />} />
              <Route
                path="department/:departmentId/trash"
                element={<DepartmentTrashArchivePage kind="trash" />}
              />
              <Route
                path="department/:departmentId/archive"
                element={<DepartmentTrashArchivePage kind="archive" />}
              />
              <Route
                path="department/:departmentId/most-read"
                element={<DepartmentMostReadPage />}
              />
              <Route path="company/trash" element={<CompanyTrashArchivePage kind="trash" />} />
              <Route path="company/archive" element={<CompanyTrashArchivePage kind="archive" />} />
              <Route path="personal" element={<PersonalPage />} />
              <Route path="personal/trash" element={<PersonalTrashArchivePage kind="trash" />} />
              <Route
                path="personal/archive"
                element={<PersonalTrashArchivePage kind="archive" />}
              />
              <Route path="personal/most-read" element={<PersonalMostReadPage />} />
              <Route path="personal/approvals" element={<ApprovalsPage />} />
              <Route path="personal/shared" element={<SharedPage />} />
              <Route path="shared" element={<RedirectWithSearch to="/personal/shared" />} />
              <Route path="approvals" element={<RedirectWithSearch to="/personal/approvals" />} />
              <Route path="reviews" element={<RedirectWithSearch to="/personal/approvals" />} />
            </Route>
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsRouteRedirect />} />
            <Route path="whats-new" element={<WhatsNewPage />} />
            <Route path="help" element={<HelpLayout />}>
              <Route
                index
                element={<Navigate to={HELP_DEFAULT_PATH.replace(/^\/help\//, '')} replace />}
              />
              {flattenHelpTopics().map((topic) => (
                <Route
                  key={topic.to}
                  path={topic.to.replace(/^\/help\//, '')}
                  element={<HelpArticlePage />}
                />
              ))}
              <Route path="overview" element={<Navigate to="/help/what-is-docsops" replace />} />
              <Route path="out-of-scope" element={<Navigate to="/help/using-docsops" replace />} />
              <Route
                path="organisation"
                element={<Navigate to="/help/organisation/introduction" replace />}
              />
              <Route
                path="why-hierarchy"
                element={<Navigate to="/help/organisation/introduction" replace />}
              />
              <Route
                path="permissions"
                element={<Navigate to="/help/roles/introduction" replace />}
              />
              <Route
                path="why-roles"
                element={<Navigate to="/help/roles/introduction" replace />}
              />
              <Route
                path="what-is-a-document"
                element={<Navigate to="/help/documents/introduction" replace />}
              />
              <Route path="workflow" element={<Navigate to="/help/lifecycle" replace />} />
              <Route
                path="why-collaborate"
                element={<Navigate to="/help/collaboration" replace />}
              />
              <Route
                path="collaboration/introduction"
                element={<Navigate to="/help/collaboration" replace />}
              />
              <Route path="comments" element={<Navigate to="/help/collaboration" replace />} />
              <Route path="suggestions" element={<Navigate to="/help/collaboration" replace />} />
              <Route path="sharing" element={<Navigate to="/help/collaboration" replace />} />
              <Route
                path="moving-documents"
                element={<Navigate to="/help/documents/introduction" replace />}
              />
              <Route path="entry-documents" element={<Navigate to="/help/user-roles" replace />} />
              <Route path="subcontexts" element={<Navigate to="/help/contexts" replace />} />
              <Route path="personal-area" element={<Navigate to="/help/areas" replace />} />
              <Route
                path="managing-templates"
                element={<Navigate to="/help/templates" replace />}
              />
              <Route path="document-types" element={<Navigate to="/help/templates" replace />} />
              <Route
                path="working-in-documents"
                element={<Navigate to="/help/documents/introduction" replace />}
              />
              <Route path="lead" element={<Navigate to="/help/user-roles" replace />} />
              <Route path="author" element={<Navigate to="/help/user-roles" replace />} />
              <Route path="member" element={<Navigate to="/help/user-roles" replace />} />
              <Route path="admin" element={<Navigate to="/help/special-roles" replace />} />
              <Route
                path="knowledge-manager"
                element={<Navigate to="/help/special-roles" replace />}
              />
            </Route>
            <Route path="teams" element={<Navigate to="/team" replace />} />
            <Route path="repositories" element={<Navigate to="/catalog" replace />} />
            <Route path="contexts/:contextId" element={<ContextWorkspacePage />} />
            <Route path="documents/:documentId" element={<DocumentPage />} />
            <Route path="documents/:documentId/versions" element={<DocumentVersionsPage />} />
            <Route
              path="admin"
              element={
                <AdminGuard>
                  <AdminPage />
                </AdminGuard>
              }
            >
              <Route index element={<Navigate to={ADMIN_DEFAULT_PATH} replace />} />
              <Route path="organisation">
                <Route index element={<Navigate to="users" replace />} />
                <Route path="users" element={<AdminUsersTab />} />
                <Route path="teams" element={<AdminTeamsTab />} />
                <Route path="departments" element={<AdminDepartmentsTab />} />
                <Route path="company" element={<AdminCompanyTab />} />
              </Route>
              <Route path="operations">
                <Route index element={<Navigate to="jobs" replace />} />
                <Route path="jobs" element={<AdminJobsTab />} />
                <Route path="scheduler" element={<AdminSchedulerTab />} />
              </Route>
              <Route path="data">
                <Route index element={<Navigate to="backup" replace />} />
                <Route path="backup" element={<AdminBackupTab />} />
                <Route path="migration" element={<AdminMigrationTab />} />
              </Route>
              <Route path="platform">
                <Route index element={<Navigate to="system" replace />} />
                <Route path="system" element={<AdminSystemTab />} />
                <Route path="mail" element={<AdminMailTab />} />
                <Route path="roles" element={<AdminRolesTab />} />
                <Route path="broadcast" element={<AdminBroadcastTab />} />
              </Route>
              {adminLegacyRedirects.map((r) => (
                <Route key={r.from} path={r.from} element={<Navigate to={r.to} replace />} />
              ))}
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
