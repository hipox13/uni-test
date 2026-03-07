import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { DonationsPage } from './features/donations/DonationsPage';
import { ArticleEditorPage } from './features/donations/ArticleEditorPage';
import { TransactionsPage } from './features/transactions/TransactionsPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { UsersPage } from './features/users/UsersPage';
import { RolesPage } from './features/roles/RolesPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { PagesPage } from './features/pages/PagesPage';
import { PageEditorPage } from './features/pages/PageEditorPage';
import { MediaPage } from './features/media/MediaPage';
import { MenusPage } from './features/menus/MenusPage';
import { TagsPage } from './features/tags/TagsPage';
import { LogosPage } from './features/logos/LogosPage';
import { LoginPage } from './features/auth/LoginPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ProfilePage } from './features/auth/ProfilePage';
import { LogActivityPage } from './features/log-activity/LogActivityPage';
import { BulkStopPage } from './features/transactions/BulkStopPage';
import { RefundsPage } from './features/transactions/RefundsPage';
import { Separator } from './components/ui/separator';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { cn } from './lib/utils';
import { useAuthStore } from './lib/stores/authStore';
import { apiClient } from './lib/api/client';
import {
  LayoutDashboard, FileText, Image, Menu, Newspaper, Palette, Tags, Activity,
  ArrowLeftRight, BarChart3, Shield, Users, Settings, LogOut, User, Loader2, StopCircle, RefreshCcw,
} from 'lucide-react';
import { usePermission } from './lib/auth/permissions';

const NAV_GROUPS = [
  {
    title: null,
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
    ]
  },
  {
    title: 'Pages',
    items: [
      { path: '/pages', label: 'All Pages', icon: FileText, module: 'pages' },
    ]
  },
  {
    title: 'Articles',
    items: [
      { path: '/articles', label: 'All Articles', icon: Newspaper, module: 'articles' },
    ]
  },
  {
    title: 'Donation Reports',
    items: [
      { path: '/reports', label: 'All Reports', icon: BarChart3, module: 'settings' },
    ]
  },
  {
    title: 'Transaction Tools',
    items: [
      { path: '/transactions', label: 'All Transactions', icon: ArrowLeftRight, module: 'settings' },
      { path: '/bulk-stop', label: 'Bulk Stop', icon: StopCircle, module: 'settings' },
      { path: '/refunds', label: 'Refunds', icon: RefreshCcw, module: 'settings' },
    ]
  },
  {
    title: 'Media',
    items: [
      { path: '/media', label: 'Library', icon: Image, module: 'media' },
    ]
  },
  {
    title: 'Users',
    items: [
      { path: '/users', label: 'Users', icon: Users, module: 'users' },
      { path: '/roles', label: 'Roles', icon: Shield, module: 'roles' },
    ]
  },
  {
    title: 'Tools & Monitoring',
    items: [
      { path: '/log-activity', label: 'Log Activity', icon: Activity, module: 'settings' },
      { path: '/settings', label: 'Settings', icon: Settings, module: 'settings' },
    ]
  },
  {
    title: 'Appearances',
    items: [
      { path: '/menus', label: 'Menus', icon: Menu, module: 'menus' },
      { path: '/tags', label: 'Tags', icon: Tags, module: 'tags' },
      { path: '/logos', label: 'Logos', icon: Palette, module: 'logos' },
    ]
  }
];

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token, setAuth, clearAuth } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      return;
    }

    apiClient
      .get('/auth/profile')
      .then((res) => {
        setAuth(res.data, token);
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => {
        setChecking(false);
      });
  }, [token, setAuth, clearAuth]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  const isEditorPage =
    (location.pathname.startsWith('/pages/') && location.pathname !== '/pages') ||
    (location.pathname.startsWith('/articles/') && location.pathname !== '/articles');

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestGuard>
            <LoginPage />
          </GuestGuard>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestGuard>
            <ForgotPasswordPage />
          </GuestGuard>
        }
      />

      <Route
        path="/*"
        element={
          <AuthGuard>
            <div className="flex h-screen bg-muted/40">
              {!isEditorPage && <Sidebar />}
              <main className={cn('flex-1 overflow-auto', !isEditorPage && 'bg-muted/40')}>
                <Routes>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="pages" element={<PagesPage />} />
                  <Route path="pages/:id" element={<PageEditorPage />} />
                  <Route path="media" element={<MediaPage />} />
                  <Route path="menus" element={<MenusPage />} />
                  <Route path="tags" element={<TagsPage />} />
                  <Route path="logos" element={<LogosPage />} />
                  <Route path="articles" element={<DonationsPage />} />
                  <Route path="articles/:id" element={<ArticleEditorPage />} />
                  <Route path="transactions" element={<TransactionsPage />} />
                  <Route path="bulk-stop" element={<BulkStopPage />} />
                  <Route path="refunds" element={<RefundsPage />} />
                  <Route path="reports" element={<ReportsPage />} />
                  <Route path="log-activity" element={<LogActivityPage />} />
                  <Route path="roles" element={<RolesPage />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                </Routes>
              </main>
            </div>
          </AuthGuard>
        }
      />
    </Routes>
  );
}

function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { hasAnyPermission } = usePermission();
  const [loggingOut, setLoggingOut] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // proceed regardless
    }
    clearAuth();
    navigate('/login', { replace: true });
  }, [clearAuth, navigate]);

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="px-6 py-5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">U</span>
        </div>
        <div>
          <h1 className="text-sm font-bold text-sidebar-foreground tracking-tight">UNICEF CMS</h1>
          <p className="text-[11px] text-muted-foreground">Content Management</p>
        </div>
      </div>
      <Separator />
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {NAV_GROUPS.map((group, idx) => (
          <NavGroup key={idx} group={group} pathname={location.pathname} hasPermission={hasAnyPermission} />
        ))}
      </nav>
      <Separator />
      <div className="p-4 flex items-center gap-3">
        <Link to="/profile" className="flex items-center gap-3 flex-1 min-w-0 group">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
              {user?.name ?? 'User'}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {user?.email ?? ''}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <Link
            to="/profile"
            className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Profile"
          >
            <User className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
            title="Logout"
          >
            {loggingOut ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogOut className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavGroup({ group, pathname, hasPermission }: any) {
  const filtered = group.items.filter((item: any) => !item.module || hasPermission(item.module));
  if (filtered.length === 0) return null;

  if (group.title === null) {
    return (
      <div className="px-3">
        {filtered.map((item: any) => <NavLink key={item.path} item={item} pathname={pathname} />)}
      </div>
    );
  }

  const isActive = filtered.some((item: any) => pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path)));

  return (
    <details className="group px-3" open={isActive}>
      <summary className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span className="flex-1 uppercase tracking-widest text-[11px]">{group.title}</span>
        <svg
          className="w-4 h-4 transition-transform group-open:rotate-180"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="pl-4 mt-1 space-y-1 border-l-2 border-border ml-5 pb-1">
        {filtered.map((item: any) => (
          <NavLink key={item.path} item={item} pathname={pathname} isSub />
        ))}
      </div>
    </details>
  );
}

function NavLink({ item, pathname, isSub }: { item: any; pathname: string; isSub?: boolean }) {
  const Icon = item.icon;
  const isActive =
    pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path));
  return (
    <Link
      to={item.path}
      className={cn(
        'flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all',
        isSub ? 'px-3 text-xs' : 'px-3',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
      )}
    >
      <Icon className={cn("shrink-0", isSub ? "h-3.5 w-3.5" : "h-4 w-4")} />
      <span>{item.label}</span>
    </Link>
  );
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
    </BrowserRouter>
  );
}
