import { useAuthStore } from '../stores/authStore';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'publish' | 'manage';
export type PermissionModule = 'articles' | 'pages' | 'users' | 'roles' | 'media' | 'settings' | 'menus' | 'tags' | 'logos' | 'transactions' | 'reports';

/**
 * Hook to check if the current user has a specific permission.
 * Super Admins (role name 'admin' or 'super-admin') bypass all checks.
 */
export function usePermission() {
    const user = useAuthStore((s) => s.user);

    const hasPermission = (module: PermissionModule | string, action: PermissionAction | string): boolean => {
        if (!user) return false;

        // Super Admin bypass
        const roleSlug = user.role?.name || '';
        if (roleSlug === 'admin' || roleSlug === 'super-admin') {
            return true;
        }

        if (!user.permissions) return false;

        return user.permissions.some(
            (p) => p.module === module && (p.action === action || p.action === 'manage')
        );
    };

    const hasAnyPermission = (module: PermissionModule | string): boolean => {
        if (!user) return false;

        // Super Admin bypass
        const roleSlug = user.role?.name || '';
        if (roleSlug === 'admin' || roleSlug === 'super-admin') {
            return true;
        }

        if (!user.permissions) return false;
        return user.permissions.some((p) => p.module === module);
    };

    return { hasPermission, hasAnyPermission, user, role: user?.role };
}
