// src/lib/reportService.ts
import { adminDb } from './firebase-admin';
import { WeeklyReport, ScoringConfig, TeamWeeklyReport } from '@/types';
import { timestampToDate, handleError } from './utils';
import { getUserTasks } from './server/taskService';
import { ScoringService } from './server/scoringService';

/**
 * Get the default scoring configuration
 */
export function getDefaultScoringConfig(): ScoringConfig {
    return {
        id: 'default',
        completionWeight: 35,
        timelinessWeight: 25,
        qualityWeight: 20,
        kraAlignmentWeight: 10,
        kpiAchievementWeight: 10,
        updatedAt: new Date(),
        updatedBy: 'system'
    };
}

/**
 * Fetch the current scoring configuration
 */
export async function getScoringConfig(): Promise<ScoringConfig> {
    try {
        const docSnap = await adminDb.collection('config').doc('scoring').get();

        if (docSnap.exists) {
            const data = docSnap.data()!;
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
        await adminDb.collection('config').doc('scoring').set({
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

        // Use ScoringService for all calculations
        return ScoringService.calculateOverallScore(weekTasks, config);
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
        const config = await getScoringConfig();

        // Use ScoringService to generate the report
        const report = await ScoringService.generateWeeklyReport(
            userId,
            weekStart,
            weekEnd,
            config
        );

        // Add user name and save to Firestore
        report.userName = userName;
        await adminDb.collection('weeklyReports').add(report);

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
        const snap = await adminDb.collection('weeklyReports')
            .where('userId', '==', userId)
            .orderBy('weekStartDate', 'desc')
            .limit(limitCount)
            .get();

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
            const snap = await adminDb.collection('weeklyReports')
                .where('userId', '==', memberId)
                .where('weekStartDate', '==', weekStart)
                .limit(1)
                .get();

            if (snap.empty) {
                // Generate new report
                const userDoc = await adminDb.collection('users').doc(memberId).get();
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
        await adminDb.collection('teamWeeklyReports').add(teamReport);

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

