// src/lib/userService.ts
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { User } from '@/types';
import { timestampToDate, handleError } from './utils';

/**
 * Fetch all users from Firestore.
 */
export async function getAllUsers(): Promise<User[]> {
    try {
        const snap = await getDocs(collection(db, 'users'));
        return snap.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt),
                lastLogin: data.lastLogin ? timestampToDate(data.lastLogin) : undefined
            } as User;
        });
    } catch (error) {
        handleError(error, 'Failed to fetch users');
        throw error;
    }
}

/**
 * Create a new user (Admin only).
 * Uses Firebase Admin SDK via API route.
 */
export async function createUser(
    email: string,
    password: string,
    fullName: string,
    roleIds: string[] = [],
    idToken: string
): Promise<{ id: string; email: string; fullName: string }> {
    try {
        const response = await fetch('/api/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({ email, password, fullName, roleIds })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create user');
        }

        return data.user;
    } catch (error) {
        handleError(error, 'Failed to create user');
        throw error;
    }
}

/**
 * Fetch a single user by ID.
 */
export async function getUserById(uid: string): Promise<User | null> {
    try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt),
                lastLogin: data.lastLogin ? timestampToDate(data.lastLogin) : undefined
            } as User;
        }
        return null;
    } catch (error) {
        handleError(error, 'Failed to fetch user');
        throw error;
    }
}

/**
 * Update a user document with partial data.
 * Use merge:true to only change provided fields.
 */
export async function updateUser(uid: string, data: Partial<User>): Promise<void> {
    try {
        await setDoc(doc(db, 'users', uid), data, { merge: true });
    } catch (error) {
        handleError(error, 'Failed to update user');
        throw error;
    }
}

/**
 * Delete a user document.
 */
export async function deleteUser(uid: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'users', uid));
    } catch (error) {
        handleError(error, 'Failed to delete user');
        throw error;
    }
}

/**
 * Bulk update multiple users with the same data.
 */
export async function bulkUpdateUsers(userIds: string[], data: Partial<User>): Promise<void> {
    try {
        const batch = writeBatch(db);

        userIds.forEach(userId => {
            const userRef = doc(db, 'users', userId);
            batch.set(userRef, data, { merge: true });
        });

        await batch.commit();
    } catch (error) {
        handleError(error, 'Failed to bulk update users');
        throw error;
    }
}

/**
 * Bulk delete multiple users.
 */
export async function bulkDeleteUsers(userIds: string[]): Promise<void> {
    try {
        const batch = writeBatch(db);

        userIds.forEach(userId => {
            const userRef = doc(db, 'users', userId);
            batch.delete(userRef);
        });

        await batch.commit();
    } catch (error) {
        handleError(error, 'Failed to bulk delete users');
        throw error;
    }
}

/**
 * Search users by name or email.
 */
export async function searchUsers(query: string): Promise<User[]> {
    try {
        const allUsers = await getAllUsers();
        const lowerQuery = query.toLowerCase();

        return allUsers.filter(user =>
            user.fullName.toLowerCase().includes(lowerQuery) ||
            user.email.toLowerCase().includes(lowerQuery)
        );
    } catch (error) {
        handleError(error, 'Failed to search users');
        throw error;
    }
}

/**
 * Get active users (not deactivated).
 */
export async function getActiveUsers(): Promise<User[]> {
    try {
        const allUsers = await getAllUsers();
        return allUsers.filter(user => user.isActive !== false);
    } catch (error) {
        handleError(error, 'Failed to fetch active users');
        throw error;
    }
}

