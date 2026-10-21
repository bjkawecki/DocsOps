import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { DenyPlatformAdminGuard } from './DenyPlatformAdminGuard';
import type { MeResponse } from '../../api/me-types';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const mod = await importOriginal();
  const actual = mod as Record<string, unknown>;
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function createWrapper(me: MeResponse | null, initialPath = '/personal') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  if (me) {
    queryClient.setQueryData(['me'], me);
  }
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MantineProvider>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
        </QueryClientProvider>
      </MantineProvider>
    );
  };
}

const adminMe: MeResponse = {
  user: {
    id: '1',
    name: 'Admin',
    email: 'admin@test.de',
    isAdmin: true,
    hasLocalLogin: true,
  },
  identity: {
    teams: [],
    departments: [],
    departmentLeads: [],
    departmentAuthors: [],
    companyLeads: [],
  },
  preferences: {},
};

const memberMe: MeResponse = {
  ...adminMe,
  user: { ...adminMe.user, isAdmin: false, name: 'Member', email: 'member@test.de' },
};

describe('DenyPlatformAdminGuard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('redirects platform admin away from guarded routes', () => {
    render(
      <Routes>
        <Route element={<DenyPlatformAdminGuard />}>
          <Route path="personal" element={<div>Personal content</div>} />
        </Route>
        <Route path="company" element={<div>Company landing</div>} />
      </Routes>,
      { wrapper: createWrapper(adminMe) }
    );

    expect(screen.queryByText('Personal content')).not.toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/company', { replace: true });
  });

  it('renders children for non-admin users', () => {
    render(
      <Routes>
        <Route element={<DenyPlatformAdminGuard />}>
          <Route path="personal" element={<div>Personal content</div>} />
        </Route>
      </Routes>,
      { wrapper: createWrapper(memberMe) }
    );

    expect(screen.getByText('Personal content')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
