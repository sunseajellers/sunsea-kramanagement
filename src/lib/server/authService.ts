// src/lib/server/authService.ts
import 'server-only';
import { adminDb } from '../firebase-admin';

/**
 * Check if a user has a specific permission (Server-side)
 */
export async function hasPermissionServer(
    userId: string,
    module: string,
    action: string
): Promise<boolean> {
    try {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (!userDoc.exists) return false;

        const userData = userDoc.data();
        if (userData?.isAdmin) return true;

        if (!userData?.roleId) return false;

        const roleDoc = await adminDb.collection('roles').doc(userData.roleId).get();
        if (!roleDoc.exists) return false;

        const roleData = roleDoc.data();
        const permissions = roleData?.permissions || [];

        return permissions.some((p: any) => p.module === module && p.action === action);
    } catch (error) {
        console.error('Failed to check permission (Server):', error);
        return false;
    }
}

/**
 * Check if a user is an admin using Admin SDK
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
    try {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (!userDoc.exists) return false;

        const userData = userDoc.data();
        return userData?.isAdmin === true;
    } catch (error) {
        console.error('Failed to check admin status (Server):', error);
        return false;
    }
}
