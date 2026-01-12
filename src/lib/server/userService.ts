// src/lib/server/userService.ts
import 'server-only';
import { adminDb } from '../firebase-admin';
import { User } from '@/types';

/**
 * Fetch all users from Firestore (Server-side)
 */
export async function getAllUsers(): Promise<User[]> {
    try {
        const snapshot = await adminDb.collection('users').get();
        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                lastLogin: data.lastLogin?.toDate() || undefined
            } as User;
        });
    } catch (error) {
        console.error('Failed to fetch users (Server):', error);
        throw error;
    }
}

/**
 * Fetch user by ID (Server-side)
 */
export async function getUserById(uid: string): Promise<User | null> {
    try {
        const doc = await adminDb.collection('users').doc(uid).get();
        if (doc.exists) {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data?.createdAt?.toDate() || new Date(),
                updatedAt: data?.updatedAt?.toDate() || new Date(),
                lastLogin: data?.lastLogin?.toDate() || undefined
            } as User;
        }
        return null;
    } catch (error) {
        console.error('Failed to fetch user (Server):', error);
        throw error;
    }
}

/**
 * Update user data (Server-side)
 */
export async function updateUser(uid: string, updates: Partial<User>): Promise<void> {
    try {
        await adminDb.collection('users').doc(uid).update({
            ...updates,
            updatedAt: new Date()
        });
    } catch (error) {
        console.error('Failed to update user (Server):', error);
        throw error;
    }
}
