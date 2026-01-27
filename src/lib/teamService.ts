// src/lib/teamService.ts
import { collection, getDocs, doc, setDoc, deleteDoc, addDoc, writeBatch, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Team, Task, KRA, PerformanceScore } from '@/types';
import { timestampToDate, handleError } from './utils';

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
        const weekStartDate = new Date(weekStart);
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);

        // Get team data
        const teamSnap = await getDocs(collection(db, 'teams'));
        const teamDoc = teamSnap.docs.find(d => d.id === teamId);
        const team = teamDoc?.data() as Team | undefined;

        if (!team) {
            throw new Error('Team not found');
        }

        const memberIds = team.memberIds || [];
        if (memberIds.length === 0) {
            return {
                teamId,
                teamName: team.name,
                weekStart: weekStartDate,
                weekEnd: weekEndDate,
                totalTasks: 0,
                completedTasks: 0,
                totalKRAs: 0,
                completedKRAs: 0,
                teamMembers: 0,
                averageScore: 0,
                topPerformers: [],
                issues: ['No personnel assigned to this strategic unit']
            };
        }

        // Fetch all tasks for team members (limited to first 10 for basic support)
        const tasksQuery = query(collection(db, 'tasks'), where('assignedTo', 'array-contains-any', memberIds.slice(0, 10)));
        const tasksSnap = await getDocs(tasksQuery);
        const teamTasks = tasksSnap.docs.map(d => d.data() as Task);

        // Fetch all KRAs for team members
        const krasQuery = query(collection(db, 'kras'), where('assignedTo', 'array-contains-any', memberIds.slice(0, 10)));
        const krasSnap = await getDocs(krasQuery);
        const teamKRAs = krasSnap.docs.map(d => d.data() as KRA);

        // Aggregate stats
        const totalTasks = teamTasks.length;
        const completedTasks = teamTasks.filter(t => t.status === 'completed').length;
        const totalKRAs = teamKRAs.length;
        const completedKRAs = teamKRAs.filter(k => k.status === 'completed').length;

        // Fetch user scores
        const scoresQuery = query(collection(db, 'performanceScores'), where('userId', 'in', memberIds.slice(0, 10)));
        const scoresSnap = await getDocs(scoresQuery);
        const scores = scoresSnap.docs.map(d => d.data() as PerformanceScore);

        const averageScore = scores.length > 0
            ? scores.reduce((acc, curr) => acc + (curr.score || 0), 0) / scores.length
            : 0;

        // Find top performers (simple logic: highest score)
        const sortedScores = [...scores].sort((a, b) => (b.score || 0) - (a.score || 0));
        const topPerformerIds = sortedScores.slice(0, 3).map(s => s.userId);

        // Fetch user names for top performers
        const topPerformers: string[] = [];
        if (topPerformerIds.length > 0) {
            const usersQuery = query(collection(db, 'users'), where('id', 'in', topPerformerIds));
            const usersSnap = await getDocs(usersQuery);
            usersSnap.docs.forEach(d => {
                const userData = d.data();
                topPerformers.push(userData.fullName || userData.email);
            });
        }

        const issues: string[] = [];
        const now = new Date();
        const overdueTasks = teamTasks.filter(t => {
            const dueDate = t.dueDate ? (t.dueDate instanceof Date ? t.dueDate : new Date(t.dueDate)) : null;
            return dueDate && dueDate < now && t.status !== 'completed';
        }).length;

        if (overdueTasks > 0) issues.push(`${overdueTasks} tactical objectives overdue`);
        if (completedTasks < totalTasks * 0.5 && totalTasks > 0) issues.push('Throughput velocity below tactical threshold');
        if (averageScore < 60 && scores.length > 0) issues.push('Average unit efficiency indicates performance variance');

        return {
            teamId,
            teamName: team.name,
            weekStart: weekStartDate,
            weekEnd: weekEndDate,
            totalTasks,
            completedTasks,
            totalKRAs,
            completedKRAs,
            teamMembers: memberIds.length,
            averageScore,
            topPerformers: topPerformers.length > 0 ? topPerformers : ['Data synchronization pending'],
            issues: issues.length > 0 ? issues : ['No critical impediments detected']
        };
    } catch (error) {
        handleError(error, 'Failed to generate team weekly report');
        throw error;
    }
}

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

