// src/lib/teamService.ts
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, writeBatch } from 'firebase/firestore';
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

/** Create a new team */
export async function createTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'teams'), {
            ...teamData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        handleError(error, 'Failed to create team');
        throw error;
    }
}

/** Update a team with partial data */
export async function updateTeam(teamId: string, data: Partial<Team>): Promise<void> {
    try {
        await setDoc(doc(db, 'teams', teamId), {
            ...data,
            updatedAt: new Date()
        }, { merge: true });
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

/** Bulk update multiple teams */
export async function bulkUpdateTeams(teamIds: string[], data: Partial<Team>): Promise<void> {
    try {
        const batch = writeBatch(db);

        teamIds.forEach(teamId => {
            const teamRef = doc(db, 'teams', teamId);
            batch.set(teamRef, {
                ...data,
                updatedAt: new Date()
            }, { merge: true });
        });

        await batch.commit();
    } catch (error) {
        handleError(error, 'Failed to bulk update teams');
        throw error;
    }
}

/** Get team hierarchy */
export async function getTeamHierarchy(): Promise<Team[]> {
    try {
        const teams = await getAllTeams();

        // Build hierarchy map
        const hierarchyMap = new Map<string, Team & { children?: Team[] }>();
        const rootTeams: (Team & { children?: Team[] })[] = [];

        // First pass: create all team objects
        teams.forEach(team => {
            hierarchyMap.set(team.id, { ...team, children: [] });
        });

        // Second pass: build hierarchy
        teams.forEach(team => {
            const teamWithChildren = hierarchyMap.get(team.id)!;
            if (team.parentId && hierarchyMap.has(team.parentId)) {
                const parent = hierarchyMap.get(team.parentId)!;
                parent.children!.push(teamWithChildren);
            } else {
                rootTeams.push(teamWithChildren);
            }
        });

        return rootTeams;
    } catch (error) {
        handleError(error, 'Failed to get team hierarchy');
        throw error;
    }
}

/** Get teams by manager */
export async function getTeamsByManager(managerId: string): Promise<Team[]> {
    try {
        const allTeams = await getAllTeams();
        return allTeams.filter(team => team.managerId === managerId);
    } catch (error) {
        handleError(error, 'Failed to fetch teams by manager');
        throw error;
    }
}

/** Get sub-teams of a parent team */
export async function getSubTeams(parentId: string): Promise<Team[]> {
    try {
        const allTeams = await getAllTeams();
        return allTeams.filter(team => team.parentId === parentId);
    } catch (error) {
        handleError(error, 'Failed to fetch sub-teams');
        throw error;
    }
}

/** Get team by ID */
export async function getTeamById(teamId: string): Promise<Team | null> {
    try {
        const teams = await getAllTeams();
        return teams.find(team => team.id === teamId) || null;
    } catch (error) {
        handleError(error, 'Failed to fetch team');
        throw error;
    }
}

/** Get weekly report for a team */
export async function getTeamWeeklyReport(teamId: string, weekStart: string): Promise<{
    teamId: string;
    teamName: string;
    weekStart: Date;
    weekEnd: Date;
    totalTasks: number;
    completedTasks: number;
    totalKRAs: number;
    completedKRAs: number;
    teamMembers: number;
    averageScore: number;
    topPerformers: string[];
    issues: string[];
}> {
    try {
        // In a real implementation, this would aggregate data from tasks, kras, and user performance
        // For now, return mock data
        const weekStartDate = new Date(weekStart);
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);

        // Get team data
        const teams = await getAllTeams();
        const team = teams.find(t => t.id === teamId);

        if (!team) {
            throw new Error('Team not found');
        }

        // Mock report data - in real app, this would be calculated from actual data
        return {
            teamId,
            teamName: team.name,
            weekStart: weekStartDate,
            weekEnd: weekEndDate,
            totalTasks: 25,
            completedTasks: 20,
            totalKRAs: 15,
            completedKRAs: 12,
            teamMembers: team.memberIds?.length || 5,
            averageScore: 85.5,
            topPerformers: ['John Doe', 'Jane Smith', 'Bob Johnson'],
            issues: [
                '2 tasks overdue',
                '3 KRAs need review',
                'Performance metrics below target for 1 member'
            ]
        };
    } catch (error) {
        handleError(error, 'Failed to generate team weekly report');
        throw error;
    }
}
