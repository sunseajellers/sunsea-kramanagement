// src/lib/server/scoringEngine.ts
// SERVER-SIDE ONLY - Scoring calculation and storage engine

import { adminDb } from '../firebase-admin';
import { Task, PerformanceScore } from '@/types';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { calculateTaskScore } from './scoringService';

export interface EmployeePerformance {
    userId: string;
    userName: string;
    department?: string;
    weeklyScore: number;
    cumulativeScore: number;
    totalTasks: number;
    completedTasks: number;
    onTimeTasks: number;
    overdueTasks: number;
    lastUpdated: Date;
}

/**
 * Recalculates and saves performance metrics for a specific employee.
 * This should be triggered whenever their tasks change.
 */
export async function recalculateEmployeeScores(userId: string) {
    try {
        // 1. Fetch user data to get name and department
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (!userDoc.exists) return null;
        const userData = userDoc.data();

        // 2. Fetch ALL tasks for this user
        const tasksSnap = await adminDb.collection('tasks')
            .where('assignedTo', 'array-contains', userId)
            .get();

        const tasks = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

        let totalScoreAllTime = 0;
        let taskCountAllTime = 0;

        let weeklyScoreSum = 0;
        let weeklyTaskCount = 0;

        let totalTasks = tasks.length;
        let completedTasks = 0;
        let onTimeTasks = 0;
        let overdueTasks = 0;

        tasks.forEach(task => {
            const scoreResult = calculateTaskScore(task);

            // Cumulative stats (all-time)
            totalScoreAllTime += scoreResult.score;
            taskCountAllTime++;

            if (task.status === 'completed') {
                completedTasks++;
                if (scoreResult.completedOnTime) {
                    onTimeTasks++;
                }
            } else if (task.status === 'overdue') {
                overdueTasks++;
            } else {
                // Check if it's actually overdue but status not updated yet
                const dueDate = task.dueDate instanceof Date ? task.dueDate :
                    (task.dueDate && (task.dueDate as any).toDate ? (task.dueDate as any).toDate() : new Date(task.dueDate));
                if (dueDate < now) {
                    overdueTasks++;
                }
            }

            // Weekly stats
            const dueDate = task.dueDate instanceof Date ? task.dueDate :
                (task.dueDate && (task.dueDate as any).toDate ? (task.dueDate as any).toDate() : new Date(task.dueDate));

            if (isWithinInterval(dueDate, { start: weekStart, end: weekEnd })) {
                weeklyScoreSum += scoreResult.score;
                weeklyTaskCount++;
            }
        });

        const cumulativeScore = taskCountAllTime > 0 ? Math.round(totalScoreAllTime / taskCountAllTime) : 0;
        const weeklyScore = weeklyTaskCount > 0 ? Math.round(weeklyScoreSum / weeklyTaskCount) : 0;

        const performanceData: EmployeePerformance = {
            userId,
            userName: userData?.fullName || 'Unknown User',
            department: userData?.department || 'Unassigned',
            weeklyScore,
            cumulativeScore,
            totalTasks,
            completedTasks,
            onTimeTasks,
            overdueTasks,
            lastUpdated: new Date()
        };

        // 3. Store in firestore (Overwrite for current status)
        await adminDb.collection('employeePerformance').doc(userId).set(performanceData);

        // 4. Also store a historical record for this week if it doesn't exist or update it
        const weekId = `${userId}_${weekStart.getFullYear()}_W${getWeekNumber(weekStart)}`;
        await adminDb.collection('performanceHistory').doc(weekId).set({
            ...performanceData,
            weekId,
            weekStart,
            weekEnd,
            calculatedAt: new Date()
        });

        return performanceData;
    } catch (error) {
        console.error(`Error recalculating scores for user ${userId}:`, error);
        throw error;
    }
}

/**
 * Help function to get week number
 */
function getWeekNumber(d: Date) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}
