import { useEffect, type ReactNode } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Box, Loader } from '@mantine/core';
import { useMe } from '../../hooks/useMe';

type Props = {
  children?: ReactNode;
  /** Where platform admins are sent (default: company landing). */
  redirectTo?: string;
};

/**
 * Blocks platform admins from member/lead product areas (personal, shared,
 * approvals, department/team scopes). Use as a route layout (`<Outlet />`) or wrapper.
 * Must sit inside AuthGuard.
 */
export function DenyPlatformAdminGuard({ children, redirectTo = '/company' }: Props) {
  const navigate = useNavigate();
  const { data: me, isPending } = useMe();
  const isAdmin = me?.user?.isAdmin === true;

  useEffect(() => {
    if (isPending || !me) return;
    if (isAdmin) {
      void navigate(redirectTo, { replace: true });
    }
  }, [isPending, me, isAdmin, navigate, redirectTo]);

  if (isPending || !me) {
    return (
      <Box
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}
      >
        <Loader size="sm" />
      </Box>
    );
  }

  if (isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  return children != null ? <>{children}</> : <Outlet />;
}
