// src/lib/server/kraService.ts
import { adminDb } from '../firebase-admin';
import { KRA } from '@/types';
import { timestampToDate, handleError } from '../utils';
import { getUserById } from './userService';

/**
 * Fetch KRAs assigned to a specific user or their team (Server-side).
 */
export async function getUserKRAs(uid: string, maxResults: number = 50): Promise<KRA[]> {
    try {
        // Get user data to check team membership
        const user = await getUserById(uid);
        const teamId = user?.teamId;

        // Fetch KRAs assigned directly to user
        const userTasksPromise = adminDb.collection('kras')
            .where('assignedTo', 'array-contains', uid)
            .limit(maxResults)
            .get();

        // Fetch KRAs assigned to user's team (if they have one)
        const teamTasksPromise = teamId
            ? adminDb.collection('kras')
                .where('teamIds', 'array-contains', teamId)
                .limit(maxResults)
                .get()
            : Promise.resolve(null);

        // Execute queries
        const [userSnap, teamSnap] = await Promise.all([
            userTasksPromise,
            teamTasksPromise
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
        handleError(error, 'Failed to fetch KRAs (Server)');
        throw error;
    }
}

/**
 * Create a new KRA with atomic ID generation
 */
export async function createKRA(kraData: Partial<KRA>): Promise<string> {
    try {
        return await adminDb.runTransaction(async (transaction) => {
            // 1. Get the counter ref
            const counterRef = adminDb.collection('config').doc('counters');
            const counterDoc = await transaction.get(counterRef);

            // 2. Define current ID
            let currentId = 0;
            if (counterDoc.exists) {
                currentId = counterDoc.data()?.kraId || 0;
            } else {
                // Initialize if doesn't exist
                transaction.set(counterRef, { taskId: 0, kraId: 0 });
            }

            // 3. Increment
            const newId = currentId + 1;
            const paddedId = newId.toString().padStart(4, '0');
            const kraNumber = `KRA-${paddedId}`;

            // 4. Update counter
            transaction.update(counterRef, { kraId: newId });

            // 5. Create KRA
            const newKRARef = adminDb.collection('kras').doc();
            const timestamp = new Date();

            transaction.set(newKRARef, {
                ...kraData,
                kraNumber,
                id: newKRARef.id,
                createdAt: timestamp,
                updatedAt: timestamp,
                status: kraData.status || 'in_progress',
                progress: 0
            });

            return newKRARef.id;
        });
    } catch (error) {
        handleError(error, 'Failed to create KRA with atomic ID');
        throw error;
    }
}

/**
 * Update an existing KRA
 */
export async function updateKRA(kraId: string, updates: Partial<KRA>): Promise<void> {
    try {
        await adminDb.collection('kras').doc(kraId).update({
            ...updates,
            updatedAt: new Date()
        });
    } catch (error) {
        handleError(error, 'Failed to update KRA');
        throw error;
    }
}

/**
 * Delete a KRA
 */
export async function deleteKRA(kraId: string): Promise<void> {
    try {
        await adminDb.collection('kras').doc(kraId).delete();
    } catch (error) {
        handleError(error, 'Failed to delete KRA');
        throw error;
    }
}
