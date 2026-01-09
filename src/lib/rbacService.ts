// src/lib/rbacService.ts
// SIMPLIFIED RBAC - Uses embedded roleIds in user documents
// and embedded permissions in role documents

import { db } from './firebase';
import {
    collection,
    getDocs,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    writeBatch,
    getDoc,
    documentId
} from 'firebase/firestore';
import { Role, Permission, SystemRole } from '@/types';
import { timestampToDate, handleError } from './utils';

// System role names that are always available
export const SYSTEM_ROLES: SystemRole[] = ['admin', 'manager', 'employee'];

// Check if a role name is a system role
export function isSystemRole(roleName: string): roleName is SystemRole {
    return SYSTEM_ROLES.includes(roleName as SystemRole);
}

/**
 * ROLES MANAGEMENT
 */

/**
 * Get all roles
 */
export async function getAllRoles(): Promise<Role[]> {
    try {
        const q = query(collection(db, 'roles'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: timestampToDate(doc.data().createdAt),
            updatedAt: timestampToDate(doc.data().updatedAt)
        })) as Role[];
    } catch (error) {
        handleError(error, 'Failed to fetch roles');
        throw error;
    }
}

/**
 * Get role by ID
 */
export async function getRoleById(roleId: string): Promise<Role | null> {
    try {
        const docRef = doc(db, 'roles', roleId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt)
            } as Role;
        }
        return null;
    } catch (error) {
        handleError(error, 'Failed to fetch role');
        throw error;
    }
}

/**
 * Create a new role
 */
export async function createRole(roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
        const docRef = doc(collection(db, 'roles'));
        const now = new Date();
        const role: Role = {
            id: docRef.id,
            ...roleData,
            createdAt: now,
            updatedAt: now
        };

        await setDoc(docRef, {
            ...role,
            createdAt: now,
            updatedAt: now
        });

        return docRef.id;
    } catch (error) {
        handleError(error, 'Failed to create role');
        throw error;
    }
}

/**
 * Update a role
 */
export async function updateRole(roleId: string, updates: Partial<Omit<Role, 'id' | 'createdAt'>>): Promise<void> {
    try {
        const docRef = doc(db, 'roles', roleId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date()
        });
    } catch (error) {
        handleError(error, 'Failed to update role');
        throw error;
    }
}

/**
 * Delete a role
 */
export async function deleteRole(roleId: string): Promise<void> {
    try {
        // Check if role is system role
        const role = await getRoleById(roleId);
        if (role?.isSystem) {
            throw new Error('Cannot delete system roles');
        }

        // Remove all role permissions
        await removeAllPermissionsFromRole(roleId);

        // Remove role from all users
        await removeRoleFromAllUsers(roleId);

        // Delete the role
        await deleteDoc(doc(db, 'roles', roleId));
    } catch (error) {
        handleError(error, 'Failed to delete role');
        throw error;
    }
}

/**
 * PERMISSIONS MANAGEMENT
 */

/**
 * Get all permissions
 */
export async function getAllPermissions(): Promise<Permission[]> {
    try {
        const q = query(collection(db, 'permissions'), orderBy('module'), orderBy('action'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: timestampToDate(doc.data().createdAt),
            updatedAt: timestampToDate(doc.data().updatedAt)
        })) as Permission[];
    } catch (error) {
        handleError(error, 'Failed to fetch permissions');
        throw error;
    }
}

/**
 * Get permissions grouped by module
 */
export async function getPermissionsByModule(): Promise<Record<string, Permission[]>> {
    try {
        const permissions = await getAllPermissions();
        return permissions.reduce((acc, permission) => {
            if (!acc[permission.module]) {
                acc[permission.module] = [];
            }
            acc[permission.module].push(permission);
            return acc;
        }, {} as Record<string, Permission[]>);
    } catch (error) {
        handleError(error, 'Failed to fetch permissions by module');
        throw error;
    }
}

/**
 * Create a new permission
 */
export async function createPermission(permissionData: Omit<Permission, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
        const docRef = doc(collection(db, 'permissions'));
        const now = new Date();
        const permission: Permission = {
            id: docRef.id,
            ...permissionData,
            createdAt: now,
            updatedAt: now
        };

        await setDoc(docRef, {
            ...permission,
            createdAt: now,
            updatedAt: now
        });

        return docRef.id;
    } catch (error) {
        handleError(error, 'Failed to create permission');
        throw error;
    }
}

/**
 * ROLE-PERMISSION RELATIONSHIPS
 */

/**
 * Get permissions for a role
 */
export async function getRolePermissions(roleId: string): Promise<Permission[]> {
    try {
        const q = query(collection(db, 'role_permissions'), where('roleId', '==', roleId));
        const snapshot = await getDocs(q);

        const permissionIds = snapshot.docs.map(doc => doc.data().permissionId);

        if (permissionIds.length === 0) {
            return [];
        }

        // Get permission details
        const permissions: Permission[] = [];
        for (const permissionId of permissionIds) {
            const permissionDoc = await getDoc(doc(db, 'permissions', permissionId));
            if (permissionDoc.exists()) {
                const data = permissionDoc.data();
                permissions.push({
                    id: permissionDoc.id,
                    ...data,
                    createdAt: timestampToDate(data.createdAt),
                    updatedAt: timestampToDate(data.updatedAt)
                } as Permission);
            }
        }

        return permissions;
    } catch (error) {
        handleError(error, 'Failed to fetch role permissions');
        throw error;
    }
}

/**
 * Assign permissions to a role
 */
export async function assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    try {
        const batch = writeBatch(db);

        // Remove existing permissions
        const existingQuery = query(collection(db, 'role_permissions'), where('roleId', '==', roleId));
        const existingSnapshot = await getDocs(existingQuery);
        existingSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Add new permissions
        permissionIds.forEach(permissionId => {
            const docRef = doc(collection(db, 'role_permissions'));
            batch.set(docRef, {
                roleId,
                permissionId,
                createdAt: new Date()
            });
        });

        await batch.commit();
    } catch (error) {
        handleError(error, 'Failed to assign permissions to role');
        throw error;
    }
}

/**
 * Remove all permissions from a role
 */
export async function removeAllPermissionsFromRole(roleId: string): Promise<void> {
    try {
        const q = query(collection(db, 'role_permissions'), where('roleId', '==', roleId));
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
    } catch (error) {
        handleError(error, 'Failed to remove permissions from role');
        throw error;
    }
}

/**
 * USER-ROLE RELATIONSHIPS
 */

/**
 * Get roles for a user - SIMPLIFIED: reads role names from user document and queries by name
 */
export async function getUserRoles(userId: string): Promise<Role[]> {
    try {
        // Read role names directly from user document
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (!userDoc.exists()) {
            return [];
        }

        const userData = userDoc.data();
        const roleNames: string[] = userData.roleIds || [];

        if (roleNames.length === 0) {
            return [];
        }

        // Query roles by name
        const roles: Role[] = [];
        for (const roleName of roleNames) {
            const q = query(collection(db, 'roles'), where('name', '==', roleName));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const data = doc.data();
                roles.push({
                    id: doc.id,
                    ...data,
                    createdAt: timestampToDate(data.createdAt),
                    updatedAt: timestampToDate(data.updatedAt)
                } as Role);
            }
        }

        return roles;
    } catch (error) {
        handleError(error, 'Failed to fetch user roles');
        throw error;
    }
}

/**
 * Assign roles to a user - SIMPLIFIED: updates user document with role names
 */
export async function assignRolesToUser(userId: string, roleNames: string[], _assignedBy: string): Promise<void> {
    try {
        // Simply update the roleIds array on the user document with role names
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            roleIds: roleNames,
            updatedAt: new Date()
        });
    } catch (error) {
        handleError(error, 'Failed to assign roles to user');
        throw error;
    }
}

/**
 * Remove role from all users
 */
export async function removeRoleFromAllUsers(roleId: string): Promise<void> {
    try {
        const q = query(collection(db, 'user_roles'), where('roleId', '==', roleId));
        const snapshot = await getDocs(q);

        const batch = writeBatch(db);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
    } catch (error) {
        handleError(error, 'Failed to remove role from users');
        throw error;
    }
}

/**
 * PERMISSION CHECKING
 */

/**
 * Check if a user has a specific permission
 */
export async function userHasPermission(userId: string, module: string, action: string): Promise<boolean> {
    try {
        // Get user's roles
        const userRoles = await getUserRoles(userId);

        if (userRoles.length === 0) {
            return false;
        }

        // Check if any role has the required permission
        for (const role of userRoles) {
            const permissions = await getRolePermissions(role.id);
            const hasPermission = permissions.some(p =>
                p.module === module && p.action === action
            );

            if (hasPermission) {
                return true;
            }
        }

        return false;
    } catch (error) {
        handleError(error, 'Failed to check user permission');
        return false;
    }
}

/**
 * Get all permissions for a user - OPTIMIZED: uses embedded permissions
 */
export async function getUserPermissions(userId: string): Promise<Permission[]> {
    try {
        const userRoles = await getUserRoles(userId);
        const allPermissionIds: string[] = [];

        // Collect all permission IDs from roles (now embedded)
        for (const role of userRoles) {
            if (role.permissions && Array.isArray(role.permissions)) {
                allPermissionIds.push(...role.permissions);
            } else {
                // Fallback to old method if permissions not embedded
                const permissions = await getRolePermissions(role.id);
                allPermissionIds.push(...permissions.map(p => p.id));
            }
        }

        // Remove duplicate IDs
        const uniqueIds = [...new Set(allPermissionIds)];

        if (uniqueIds.length === 0) {
            return [];
        }

        // Batch fetch all permissions
        const permissions: Permission[] = [];
        for (const permId of uniqueIds) {
            const permDoc = await getDoc(doc(db, 'permissions', permId));
            if (permDoc.exists()) {
                const data = permDoc.data();
                permissions.push({
                    id: permDoc.id,
                    ...data,
                    createdAt: timestampToDate(data.createdAt),
                    updatedAt: timestampToDate(data.updatedAt)
                } as Permission);
            }
        }

        return permissions;
    } catch (error) {
        handleError(error, 'Failed to get user permissions');
        return [];
    }
}

/**
 * Initialize default roles and permissions - Creates all system roles
 */
export async function initializeDefaultRBAC(): Promise<void> {
    try {
        // Create default permissions
        const defaultPermissions = [
            // Dashboard
            { name: 'View Dashboard', module: 'dashboard', action: 'view' },

            // Users
            { name: 'View Users', module: 'users', action: 'view' },
            { name: 'Create Users', module: 'users', action: 'create' },
            { name: 'Edit Users', module: 'users', action: 'edit' },
            { name: 'Delete Users', module: 'users', action: 'delete' },

            // Tasks
            { name: 'View Tasks', module: 'tasks', action: 'view' },
            { name: 'Create Tasks', module: 'tasks', action: 'create' },
            { name: 'Edit Tasks', module: 'tasks', action: 'edit' },
            { name: 'Delete Tasks', module: 'tasks', action: 'delete' },
            { name: 'Assign Tasks', module: 'tasks', action: 'assign' },

            // KRAs
            { name: 'View KRAs', module: 'kras', action: 'view' },
            { name: 'Create KRAs', module: 'kras', action: 'create' },
            { name: 'Edit KRAs', module: 'kras', action: 'edit' },
            { name: 'Delete KRAs', module: 'kras', action: 'delete' },
            { name: 'Assign KRAs', module: 'kras', action: 'assign' },

            // Teams
            { name: 'View Teams', module: 'teams', action: 'view' },
            { name: 'Manage Teams', module: 'teams', action: 'manage' },

            // Reports
            { name: 'View Reports', module: 'reports', action: 'view' },
            { name: 'Generate Reports', module: 'reports', action: 'generate' },

            // Analytics
            { name: 'View Analytics', module: 'analytics', action: 'view' },
            { name: 'Manage Analytics', module: 'analytics', action: 'manage' },

            // Notifications
            { name: 'View Notifications', module: 'notifications', action: 'view' },
            { name: 'Manage Notifications', module: 'notifications', action: 'manage' },

            // Roles & Permissions
            { name: 'Manage Roles', module: 'roles', action: 'manage' },
            { name: 'Manage Permissions', module: 'permissions', action: 'manage' },

            // Scoring
            { name: 'Manage Scoring', module: 'scoring', action: 'manage' },

            // System Admin
            { name: 'System Administration', module: 'system', action: 'admin' }
        ];

        // Create permissions and collect their IDs
        const permissionIds: string[] = [];
        for (const perm of defaultPermissions) {
            const permId = await createPermission({
                ...perm,
                description: `${perm.action} ${perm.module}`,
                isSystem: true
            });
            permissionIds.push(permId);
        }

        // Define permission sets for each role
        const allPermissions = await getAllPermissions();
        const getPermIds = (filters: { module?: string; action?: string }[]) => {
            return allPermissions
                .filter(p => filters.some(f =>
                    (!f.module || p.module === f.module) &&
                    (!f.action || p.action === f.action)
                ))
                .map(p => p.id);
        };

        // Admin: All permissions
        const adminPermIds = allPermissions.map(p => p.id);

        // Manager: Team management, reports, tasks, KRAs (no system admin)
        const managerPermIds = getPermIds([
            { module: 'dashboard' },
            { module: 'tasks' },
            { module: 'kras' },
            { module: 'teams' },
            { module: 'reports' },
            { module: 'analytics', action: 'view' },
            { module: 'notifications', action: 'view' }
        ]);

        // Employee: Basic view and own task management
        const employeePermIds = getPermIds([
            { module: 'dashboard', action: 'view' },
            { module: 'tasks', action: 'view' },
            { module: 'tasks', action: 'edit' },
            { module: 'kras', action: 'view' },
            { module: 'reports', action: 'view' },
            { module: 'notifications', action: 'view' }
        ]);

        // Create all system roles with embedded permissions
        await createRole({
            name: 'admin',
            description: 'Full system access - can manage all settings and users',
            isSystem: true,
            isActive: true,
            permissions: adminPermIds
        });

        await createRole({
            name: 'manager',
            description: 'Team management, task assignment, and reporting',
            isSystem: true,
            isActive: true,
            permissions: managerPermIds
        });

        await createRole({
            name: 'employee',
            description: 'View and update assigned tasks and KRAs',
            isSystem: true,
            isActive: true,
            permissions: employeePermIds
        });

        console.log('✅ RBAC initialized with admin, manager, and employee roles');

    } catch (error) {
        handleError(error, 'Failed to initialize RBAC');
        throw error;
    }
}