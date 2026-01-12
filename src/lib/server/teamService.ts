// src/lib/server/teamService.ts
import 'server-only';
import { adminDb } from '../firebase-admin';
import { Team } from '@/types';

/**
 * Fetch all teams from Firestore (Server-side)
 */
export async function getAllTeams(): Promise<Team[]> {
    try {
        const snapshot = await adminDb.collection('teams').get();
        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date()
            } as Team;
        });
    } catch (error) {
        console.error('Failed to fetch teams (Server):', error);
        throw error;
    }
}
