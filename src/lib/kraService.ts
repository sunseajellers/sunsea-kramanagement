// src/lib/kraService.ts
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, limit } from 'firebase/firestore';
import { db } from './firebase';
import { KRA } from '@/types';
import { timestampToDate, handleError } from './utils';

/**
 * Fetch KRAs assigned to a specific user.
 * Returns an array of KRA objects.
 */
export async function getUserKRAs(uid: string, maxResults: number = 50): Promise<KRA[]> {
    try {
        const q = query(
            collection(db, 'kras'),
            where('assignedTo', 'array-contains', uid),
            limit(maxResults)
        );
        const snap = await getDocs(q);
        return snap.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startDate: timestampToDate(data.startDate),
                endDate: timestampToDate(data.endDate),
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt)
            } as KRA;
        });
    } catch (error) {
        handleError(error, 'Failed to fetch KRAs');
        throw error;
    }
}

// Alias for compatibility
export const fetchKRAs = getUserKRAs;

export async function createKRA(kraData: Omit<KRA, 'id'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'kras'), kraData);
        return docRef.id;
    } catch (error) {
        handleError(error, 'Failed to create KRA');
        throw error;
    }
}

export async function updateKRA(kraId: string, updates: Partial<KRA>): Promise<void> {
    try {
        const docRef = doc(db, 'kras', kraId);
        await updateDoc(docRef, updates);
    } catch (error) {
        handleError(error, 'Failed to update KRA');
        throw error;
    }
}

export async function deleteKRA(kraId: string): Promise<void> {
    try {
        const docRef = doc(db, 'kras', kraId);
        await deleteDoc(docRef);
    } catch (error) {
        handleError(error, 'Failed to delete KRA');
        throw error;
    }
}
