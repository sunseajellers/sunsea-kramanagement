// src/lib/permissions.ts
import { UserRole, Permission, RolePermissions } from '@/types';

/**
 * Default permissions for each role
 * These can be overridden by custom permissions on individual users
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    admin: [
        'view_dashboard',
        'view_tasks',
        'create_tasks',
        'update_tasks',
        'delete_tasks',
        'assign_tasks',
        'view_kras',
        'create_kras',
        'update_kras',
        'delete_kras',
        'assign_kras',
        'view_teams',
        'manage_teams',
        'view_reports',
        'generate_reports',
        'view_analytics',
        'manage_analytics',
        'view_notifications',
        'manage_notifications',
        'manage_users',
        'manage_roles',
        'manage_scoring',
        'system_admin'
    ],
    manager: [
        'view_dashboard',
        'view_tasks',
        'create_tasks',
        'update_tasks',
        'assign_tasks',
        'view_kras',
        'create_kras',
        'update_kras',
        'assign_kras',
        'view_teams',
        'manage_teams',
        'view_reports',
        'generate_reports',
        'view_analytics',
        'view_notifications',
        'manage_notifications'
    ],
    employee: [
        'view_dashboard',
        'view_tasks',
        'update_tasks', // Can update status/comments on assigned tasks
        'assign_tasks', // Can assign tasks to others (within team)
        'view_kras',
        'view_reports'
    ]
};

/**
 * Get permissions for a user, combining role defaults with custom permissions
 */
export function getUserPermissions(user: { role: UserRole; permissions?: Permission[] }): Permission[] {
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[user.role] || [];
    const customPermissions = user.permissions || [];

    // Custom permissions override role defaults
    return [...new Set([...rolePermissions, ...customPermissions])];
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: { role: UserRole; permissions?: Permission[] }, permission: Permission): boolean {
    const userPermissions = getUserPermissions(user);
    return userPermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: { role: UserRole; permissions?: Permission[] }, permissions: Permission[]): boolean {
    const userPermissions = getUserPermissions(user);
    return permissions.some(permission => userPermissions.includes(permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: { role: UserRole; permissions?: Permission[] }, permissions: Permission[]): boolean {
    const userPermissions = getUserPermissions(user);
    return permissions.every(permission => userPermissions.includes(permission));
}

/**
 * Get role configuration with descriptions
 */
export const ROLE_CONFIGURATIONS: RolePermissions[] = [
    {
        role: 'admin',
        permissions: DEFAULT_ROLE_PERMISSIONS.admin,
        description: 'Full system access with all permissions'
    },
    {
        role: 'manager',
        permissions: DEFAULT_ROLE_PERMISSIONS.manager,
        description: 'Team management and analytics access'
    },
    {
        role: 'employee',
        permissions: DEFAULT_ROLE_PERMISSIONS.employee,
        description: 'Basic task and KRA viewing with limited updates'
    }
];

/**
 * Permission categories for UI organization
 */
export const PERMISSION_CATEGORIES: Record<string, Permission[]> = {
    'Dashboard': ['view_dashboard'],
    'Tasks': ['view_tasks', 'create_tasks', 'update_tasks', 'delete_tasks', 'assign_tasks'],
    'KRAs': ['view_kras', 'create_kras', 'update_kras', 'delete_kras', 'assign_kras'],
    'Teams': ['view_teams', 'manage_teams'],
    'Reports': ['view_reports', 'generate_reports'],
    'Analytics': ['view_analytics', 'manage_analytics'],
    'Notifications': ['view_notifications', 'manage_notifications'],
    'User Management': ['manage_users', 'manage_roles'],
    'System': ['manage_scoring', 'system_admin']
};

/**
 * Permission descriptions for UI
 */
export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
    view_dashboard: 'View personal dashboard',
    view_tasks: 'View assigned tasks',
    create_tasks: 'Create new tasks',
    update_tasks: 'Update task status and details',
    delete_tasks: 'Delete tasks',
    assign_tasks: 'Assign tasks to team members',
    view_kras: 'View assigned KRAs',
    create_kras: 'Create new KRAs',
    update_kras: 'Update KRA details',
    delete_kras: 'Delete KRAs',
    assign_kras: 'Assign KRAs to users/teams',
    view_teams: 'View team information',
    manage_teams: 'Create and manage teams',
    view_reports: 'View personal reports',
    generate_reports: 'Generate team/system reports',
    view_analytics: 'View basic analytics',
    manage_analytics: 'Access advanced analytics',
    view_notifications: 'View notifications',
    manage_notifications: 'Configure notification rules',
    manage_users: 'Manage user accounts',
    manage_roles: 'Assign roles and permissions',
    manage_scoring: 'Configure scoring system',
    system_admin: 'Full system administration'
};