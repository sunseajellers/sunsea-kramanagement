// src/lib/reportService.ts
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    doc,
    getDoc,
    setDoc,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from './firebase';
import { WeeklyReport, ScoringConfig, TeamWeeklyReport, Task } from '@/types';
import { timestampToDate, handleError } from './utils';
import { getUserTasks } from './taskService';
import { getUserKRAs } from './kraService';

/**
 * Get the default scoring configuration
 */
export function getDefaultScoringConfig(): ScoringConfig {
    return {
        id: 'default',
        completionWeight: 40,
        timelinessWeight: 30,
        qualityWeight: 20,
        kraAlignmentWeight: 10,
        updatedAt: new Date(),
        updatedBy: 'system'
    };
}

/**
 * Fetch the current scoring configuration
 */
export async function getScoringConfig(): Promise<ScoringConfig> {
    try {
        const docRef = doc(db, 'config', 'scoring');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                ...data,
                updatedAt: timestampToDate(data.updatedAt)
            } as ScoringConfig;
        }

        return getDefaultScoringConfig();
    } catch (error) {
        handleError(error, 'Failed to fetch scoring config');
        return getDefaultScoringConfig();
    }
}

/**
 * Update scoring configuration (Admin only)
 */
export async function updateScoringConfig(
    config: Omit<ScoringConfig, 'id'>,
    adminId: string
): Promise<void> {
    try {
        const docRef = doc(db, 'config', 'scoring');
        await setDoc(docRef, {
            ...config,
            updatedBy: adminId,
            updatedAt: new Date()
        });
    } catch (error) {
        handleError(error, 'Failed to update scoring config');
        throw error;
    }
}

/**
 * Calculate score for a user based on their tasks
 */
export async function calculateUserScore(
    userId: string,
    weekStart: Date,
    weekEnd: Date
): Promise<number> {
    try {
        const config = await getScoringConfig();
        const tasks = await getUserTasks(userId, 1000);

        // Filter tasks for the week
        const weekTasks = tasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= weekStart && taskDate <= weekEnd;
        });

        if (weekTasks.length === 0) return 0;

        // Calculate completion score
        const completedTasks = weekTasks.filter(t => t.status === 'completed').length;
        const completionScore = (completedTasks / weekTasks.length) * 100;

        // Calculate timeliness score
        const onTimeTasks = weekTasks.filter(t => {
            if (t.status !== 'completed') return false;
            const dueDate = new Date(t.dueDate);
            const completedDate = t.activityLog.find(log =>
                log.action.includes('completed')
            )?.timestamp;
            return completedDate && new Date(completedDate) <= dueDate;
        }).length;
        const timelinessScore = completedTasks > 0
            ? (onTimeTasks / completedTasks) * 100
            : 0;

        // Calculate quality score (based on checklist completion)
        let qualityScore = 0;
        const tasksWithChecklists = weekTasks.filter(t => t.checklist.length > 0);
        if (tasksWithChecklists.length > 0) {
            const avgChecklistCompletion = tasksWithChecklists.reduce((acc, task) => {
                const completed = task.checklist.filter(item => item.completed).length;
                return acc + (completed / task.checklist.length);
            }, 0) / tasksWithChecklists.length;
            qualityScore = avgChecklistCompletion * 100;
        } else {
            qualityScore = completionScore; // Default to completion score
        }

        // Calculate KRA alignment score
        const tasksWithKRA = weekTasks.filter(t => t.kraId).length;
        const kraAlignmentScore = (tasksWithKRA / weekTasks.length) * 100;

        // Calculate weighted total
        const totalScore = (
            (completionScore * config.completionWeight / 100) +
            (timelinessScore * config.timelinessWeight / 100) +
            (qualityScore * config.qualityWeight / 100) +
            (kraAlignmentScore * config.kraAlignmentWeight / 100)
        );

        return Math.round(totalScore);
    } catch (error) {
        handleError(error, 'Failed to calculate user score');
        return 0;
    }
}

/**
 * Generate weekly report for a user
 */
export async function generateWeeklyReport(
    userId: string,
    userName: string,
    weekStart: Date,
    weekEnd: Date
): Promise<WeeklyReport> {
    try {
        const tasks = await getUserTasks(userId, 1000);
        const kras = await getUserKRAs(userId, 1000);

        // Filter tasks for the week
        const weekTasks = tasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= weekStart && taskDate <= weekEnd;
        });

        const tasksAssigned = weekTasks.length;
        const tasksCompleted = weekTasks.filter(t => t.status === 'completed').length;

        // Calculate on-time completion
        const onTimeCompletion = weekTasks.filter(t => {
            if (t.status !== 'completed') return false;
            const dueDate = new Date(t.dueDate);
            const completedDate = t.activityLog.find(log =>
                log.action.includes('completed')
            )?.timestamp;
            return completedDate && new Date(completedDate) <= dueDate;
        }).length;

        const onTimePercentage = tasksCompleted > 0
            ? Math.round((onTimeCompletion / tasksCompleted) * 100)
            : 0;

        // Get KRAs covered
        const krasCovered = [...new Set(weekTasks
            .filter(t => t.kraId)
            .map(t => t.kraId!)
        )];

        // Calculate delays
        const taskDelays = weekTasks.filter(t => {
            if (t.status !== 'completed') return false;
            const dueDate = new Date(t.dueDate);
            const completedDate = t.activityLog.find(log =>
                log.action.includes('completed')
            )?.timestamp;
            return completedDate && new Date(completedDate) > dueDate;
        }).length;

        // Calculate score
        const score = await calculateUserScore(userId, weekStart, weekEnd);
        const config = await getScoringConfig();

        // Calculate breakdown
        const completionScore = tasksAssigned > 0
            ? Math.round((tasksCompleted / tasksAssigned) * 100 * config.completionWeight / 100)
            : 0;
        const timelinessScore = Math.round(onTimePercentage * config.timelinessWeight / 100);
        const qualityScore = Math.round(score * config.qualityWeight / 100);
        const kraAlignmentScore = Math.round((krasCovered.length / Math.max(kras.length, 1)) * 100 * config.kraAlignmentWeight / 100);

        const report: WeeklyReport = {
            id: `${userId}_${weekStart.getTime()}`,
            weekStartDate: weekStart,
            weekEndDate: weekEnd,
            userId,
            userName,
            tasksAssigned,
            tasksCompleted,
            onTimeCompletion,
            onTimePercentage,
            krasCovered,
            taskDelays,
            score,
            breakdown: {
                completionScore,
                timelinessScore,
                qualityScore,
                kraAlignmentScore,
                totalScore: score
            },
            generatedAt: new Date()
        };

        // Save to Firestore
        await addDoc(collection(db, 'weeklyReports'), report);

        return report;
    } catch (error) {
        handleError(error, 'Failed to generate weekly report');
        throw error;
    }
}

/**
 * Fetch weekly reports for a user
 */
export async function getUserWeeklyReports(
    userId: string,
    limitCount: number = 10
): Promise<WeeklyReport[]> {
    try {
        const q = query(
            collection(db, 'weeklyReports'),
            where('userId', '==', userId),
            orderBy('weekStartDate', 'desc'),
            limit(limitCount)
        );

        const snap = await getDocs(q);
        return snap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                weekStartDate: timestampToDate(data.weekStartDate),
                weekEndDate: timestampToDate(data.weekEndDate),
                generatedAt: timestampToDate(data.generatedAt)
            } as WeeklyReport;
        });
    } catch (error) {
        handleError(error, 'Failed to fetch weekly reports');
        throw error;
    }
}

/**
 * Generate team weekly report
 */
export async function generateTeamWeeklyReport(
    teamId: string,
    teamName: string,
    memberIds: string[],
    weekStart: Date,
    weekEnd: Date
): Promise<TeamWeeklyReport> {
    try {
        const memberReports: WeeklyReport[] = [];

        for (const memberId of memberIds) {
            // Try to fetch existing report or generate new one
            const q = query(
                collection(db, 'weeklyReports'),
                where('userId', '==', memberId),
                where('weekStartDate', '==', weekStart),
                limit(1)
            );

            const snap = await getDocs(q);
            if (snap.empty) {
                // Generate new report
                const userDoc = await getDoc(doc(db, 'users', memberId));
                const userName = userDoc.data()?.fullName || 'Unknown';
                const report = await generateWeeklyReport(memberId, userName, weekStart, weekEnd);
                memberReports.push(report);
            } else {
                const data = snap.docs[0].data();
                memberReports.push({
                    id: snap.docs[0].id,
                    ...data,
                    weekStartDate: timestampToDate(data.weekStartDate),
                    weekEndDate: timestampToDate(data.weekEndDate),
                    generatedAt: timestampToDate(data.generatedAt)
                } as WeeklyReport);
            }
        }

        // Calculate team stats
        const totalTasksAssigned = memberReports.reduce((sum, r) => sum + r.tasksAssigned, 0);
        const totalTasksCompleted = memberReports.reduce((sum, r) => sum + r.tasksCompleted, 0);
        const averageScore = memberReports.length > 0
            ? Math.round(memberReports.reduce((sum, r) => sum + r.score, 0) / memberReports.length)
            : 0;
        const onTimePercentage = memberReports.length > 0
            ? Math.round(memberReports.reduce((sum, r) => sum + r.onTimePercentage, 0) / memberReports.length)
            : 0;

        const teamReport: TeamWeeklyReport = {
            id: `${teamId}_${weekStart.getTime()}`,
            teamId,
            teamName,
            weekStartDate: weekStart,
            weekEndDate: weekEnd,
            memberReports,
            teamStats: {
                totalTasksAssigned,
                totalTasksCompleted,
                averageScore,
                onTimePercentage
            },
            generatedAt: new Date()
        };

        // Save to Firestore
        await addDoc(collection(db, 'teamWeeklyReports'), teamReport);

        return teamReport;
    } catch (error) {
        handleError(error, 'Failed to generate team weekly report');
        throw error;
    }
}

/**
 * Export weekly report as JSON
 */
export function exportReportAsJSON(report: WeeklyReport | TeamWeeklyReport): void {
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report_${report.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Send weekly report via email (placeholder - requires backend)
 */
export async function sendWeeklyReportEmail(
    reportId: string,
    recipientEmail: string
): Promise<void> {
    // This would typically call a Cloud Function or API endpoint
    // For now, we'll just log it
    console.log(`Sending report ${reportId} to ${recipientEmail}`);
    // TODO: Implement email sending via Cloud Functions
}
