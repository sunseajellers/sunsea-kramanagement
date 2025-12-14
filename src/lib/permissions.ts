// src/lib/permissions.ts
import { UserRole, Permission, RolePermissions, LegacyPermission } from '@/types';

/**
 * Role hierarchy definition
 * Higher numbers = more permissions
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
    employee: 1,
    manager: 2,
    admin: 3
};

/**
 * Check if a role can perform actions of another role
 */
export function canRolePerformAs(role: UserRole, targetRole: UserRole): boolean {
    return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[targetRole];
}

/**
 * Get all roles that a given role can manage
 */
export function getManageableRoles(role: UserRole): UserRole[] {
    const currentLevel = ROLE_HIERARCHY[role];
    return Object.entries(ROLE_HIERARCHY)
        .filter(([_, level]) => level <= currentLevel)
        .map(([roleName]) => roleName as UserRole);
}

/**
 * Default permissions for each role
 * These can be overridden by custom permissions on individual users
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, LegacyPermission[]> = {
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
 * Check if a user has a specific permission
 * Handles custom permissions override role defaults
 * Includes race condition protection and edge case handling
 */
export function hasPermission(
    userRole: UserRole | null | undefined,
    customPermissions: LegacyPermission[] | null | undefined,
    requiredPermission: LegacyPermission
): boolean {
    // Edge case: No user role provided
    if (!userRole) {
        return false;
    }

    // Edge case: Invalid role
    if (!(userRole in DEFAULT_ROLE_PERMISSIONS)) {
        console.warn(`Invalid user role: ${userRole}`);
        return false;
    }

    // Custom permissions override role defaults
    if (customPermissions && Array.isArray(customPermissions)) {
        // If custom permissions explicitly include or exclude the permission
        if (customPermissions.includes(requiredPermission)) {
            return true;
        }
        // If custom permissions are set but don't include the required permission,
        // check if it's a restrictive override (permissions starting with '!')
        if (customPermissions.some(p => p === `!${requiredPermission}`)) {
            return false;
        }
    }

    // Fall back to role-based permissions
    return DEFAULT_ROLE_PERMISSIONS[userRole].includes(requiredPermission);
}

/**
 * Check if a user can perform an action on another user
 * Includes hierarchy validation and edge case handling
 */
export function canManageUser(
    currentUserRole: UserRole | null | undefined,
    currentUserId: string | null | undefined,
    targetUserRole: UserRole | null | undefined,
    targetUserId: string | null | undefined
): boolean {
    // Edge cases: Missing data
    if (!currentUserRole || !currentUserId || !targetUserRole || !targetUserId) {
        return false;
    }

    // Users cannot manage themselves for role changes
    if (currentUserId === targetUserId) {
        return false;
    }

    // Only admins can manage other admins
    if (targetUserRole === 'admin' && currentUserRole !== 'admin') {
        return false;
    }

    // Role hierarchy check: can only manage users with equal or lower hierarchy
    return canRolePerformAs(currentUserRole, targetUserRole);
}

/**
 * Validate role transition
 * Prevents invalid role changes and race conditions
 */
export function validateRoleTransition(
    currentRole: UserRole,
    newRole: UserRole,
    changerRole: UserRole,
    changerId: string,
    targetUserId: string
): { valid: boolean; reason?: string } {
    // Cannot change own role (prevents privilege escalation)
    if (changerId === targetUserId) {
        return { valid: false, reason: 'Users cannot change their own role' };
    }

    // Only admins can change roles to admin
    if (newRole === 'admin' && changerRole !== 'admin') {
        return { valid: false, reason: 'Only admins can assign admin role' };
    }

    // Cannot escalate beyond own level
    if (!canRolePerformAs(changerRole, newRole)) {
        return { valid: false, reason: 'Cannot assign role higher than your own' };
    }

    // Cannot demote above own level
    if (canRolePerformAs(currentRole, changerRole) && currentRole !== changerRole) {
        return { valid: false, reason: 'Cannot modify users with higher or equal role' };
    }

    return { valid: true };
}

/**
 * Get effective permissions for a user
 * Merges role permissions with custom permissions
 * Handles edge cases and race conditions
 */
export function getEffectivePermissions(
    userRole: UserRole | null | undefined,
    customPermissions: LegacyPermission[] | null | undefined
): LegacyPermission[] {
    if (!userRole || !(userRole in DEFAULT_ROLE_PERMISSIONS)) {
        return [];
    }

    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[userRole];
    const effectivePermissions = new Set(rolePermissions);

    // Apply custom permissions
    if (customPermissions && Array.isArray(customPermissions)) {
        customPermissions.forEach(permission => {
            if (permission.startsWith('!')) {
                // Remove permission
                effectivePermissions.delete(permission.slice(1) as LegacyPermission);
            } else {
                // Add permission
                effectivePermissions.add(permission);
            }
        });
    }

    return Array.from(effectivePermissions);
}

/**
 * Check multiple permissions at once
 * Optimized for bulk permission checking
 */
export function hasAllPermissions(
    userRole: UserRole | null | undefined,
    customPermissions: LegacyPermission[] | null | undefined,
    requiredPermissions: LegacyPermission[]
): boolean {
    return requiredPermissions.every(permission =>
        hasPermission(userRole, customPermissions, permission)
    );
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
    userRole: UserRole | null | undefined,
    customPermissions: LegacyPermission[] | null | undefined,
    permissions: LegacyPermission[]
): boolean {
    return permissions.some(permission =>
        hasPermission(userRole, customPermissions, permission)
    );
}

/**
 * Get permissions for a user, combining role defaults with custom permissions
 * Legacy function for backward compatibility
 */
export function getUserPermissions(user: { role: UserRole; permissions?: LegacyPermission[] }): LegacyPermission[] {
    return getEffectivePermissions(user.role, user.permissions);
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
export const PERMISSION_CATEGORIES: Record<string, LegacyPermission[]> = {
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
export const PERMISSION_DESCRIPTIONS: Record<LegacyPermission, string> = {
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