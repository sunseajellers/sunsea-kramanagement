// src/lib/kraService.ts
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, limit } from 'firebase/firestore';
import { db } from './firebase';
import { KRA } from '@/types';
import { timestampToDate, handleError } from './utils';
import { getUserById } from './userService';

/**
 * Fetch KRAs assigned to a specific user or their team.
 * Returns an array of KRA objects.
 */
export async function getUserKRAs(uid: string, maxResults: number = 50): Promise<KRA[]> {
    try {
        // Get user data to check team membership
        const user = await getUserById(uid);
        const teamId = user?.teamId;

        // Fetch KRAs assigned directly to user
        const userQuery = query(
            collection(db, 'kras'),
            where('assignedTo', 'array-contains', uid),
            limit(maxResults)
        );

        // Fetch KRAs assigned to user's team (if they have one)
        let teamQuery = null;
        if (teamId) {
            teamQuery = query(
                collection(db, 'kras'),
                where('teamIds', 'array-contains', teamId),
                limit(maxResults)
            );
        }

        // Execute queries
        const [userSnap, teamSnap] = await Promise.all([
            getDocs(userQuery),
            teamQuery ? getDocs(teamQuery) : Promise.resolve(null)
        ]);

        // Combine and deduplicate results
        const kraMap = new Map<string, any>();

        // Add user-assigned KRAs
        userSnap.docs.forEach((doc) => {
            const data = doc.data();
            kraMap.set(doc.id, {
                id: doc.id,
                ...data,
                startDate: timestampToDate(data.startDate),
                endDate: timestampToDate(data.endDate),
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt)
            });
        });

        // Add team-assigned KRAs (if any)
        if (teamSnap) {
            teamSnap.docs.forEach((doc) => {
                if (!kraMap.has(doc.id)) { // Avoid duplicates
                    const data = doc.data();
                    kraMap.set(doc.id, {
                        id: doc.id,
                        ...data,
                        startDate: timestampToDate(data.startDate),
                        endDate: timestampToDate(data.endDate),
                        createdAt: timestampToDate(data.createdAt),
                        updatedAt: timestampToDate(data.updatedAt)
                    });
                }
            });
        }

        return Array.from(kraMap.values()) as KRA[];
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
