// src/lib/userService.ts
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
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
                updatedAt: timestampToDate(data.updatedAt)
            } as User;
        });
    } catch (error) {
        handleError(error, 'Failed to fetch users');
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

