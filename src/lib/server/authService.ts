// src/lib/server/authService.ts
import 'server-only';
import { adminDb } from '../firebase-admin';

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
