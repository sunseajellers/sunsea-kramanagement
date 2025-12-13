// src/lib/teamService.ts
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Team } from '@/types';
import { timestampToDate, handleError } from './utils';

/** Fetch all teams */
export async function getAllTeams(): Promise<Team[]> {
    try {
        const snap = await getDocs(collection(db, 'teams'));
        return snap.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt)
            } as Team;
        });
    } catch (error) {
        handleError(error, 'Failed to fetch teams');
        throw error;
    }
}

/** Update a team with partial data */
export async function updateTeam(teamId: string, data: Partial<Team>): Promise<void> {
    try {
        await setDoc(doc(db, 'teams', teamId), data, { merge: true });
    } catch (error) {
        handleError(error, 'Failed to update team');
        throw error;
    }
}

/** Delete a team */
export async function deleteTeam(teamId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'teams', teamId));
    } catch (error) {
        handleError(error, 'Failed to delete team');
        throw error;
    }
}
