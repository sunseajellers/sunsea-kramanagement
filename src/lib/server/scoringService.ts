// src/lib/server/scoringService.ts
import { adminDb } from '../firebase-admin';
import { Task, ScoringConfig, WeeklyReport } from '@/types';
import { differenceInDays, isBefore } from 'date-fns';

/**
 * Scoring Service
 * Handles calculation of task-based performance scores
 */

export interface ScoreResult {
    score: number;
    completedOnTime: boolean;
    delayDays: number;
}

/**
 * Calculate score for a single task
 */
export function calculateTaskScore(task: Task): ScoreResult {
    const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate);
    const now = new Date();

    // If completed
    if (task.status === 'completed') {
        const completedAt = task.verifiedAt || task.updatedAt;
        const compDate = completedAt instanceof Date ? completedAt : new Date(completedAt);

        const isLate = isBefore(dueDate, compDate);
        if (!isLate) {
            return { score: 100, completedOnTime: true, delayDays: 0 };
        } else {
            const delay = Math.max(1, differenceInDays(compDate, dueDate));
            const score = Math.max(40, 100 - (delay * 10)); // Deduct 10 points per day late, max penalty 60
            return { score, completedOnTime: false, delayDays: delay };
        }
    }

    // If not completed and overdue
    if (isBefore(dueDate, now)) {
        return { score: 0, completedOnTime: false, delayDays: differenceInDays(now, dueDate) };
    }

    // In progress - partial score (up to 70)
    const progressScore = Math.floor((task.progress || 0) * 0.7);
    return { score: progressScore, completedOnTime: false, delayDays: 0 };
}

export class ScoringService {
    /**
     * Calculate overall score for a set of tasks based on configuration
     */
    static calculateOverallScore(tasks: Task[], _config: ScoringConfig): number {
        if (tasks.length === 0) return 0;

        let totalScore = 0;
        let totalWeight = 0;

        tasks.forEach(task => {
            const result = calculateTaskScore(task);
            // In a real scenario, you might apply different weights to different task types based on config
            // For now, we just average the scores
            totalScore += result.score;
            totalWeight += 1;
        });

        return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    }

    /**
     * Generate a full weekly report object
     */
    static async generateWeeklyReport(
        userId: string,
        weekStart: Date,
        weekEnd: Date,
        config: ScoringConfig
    ): Promise<WeeklyReport> {
        // Fetch tasks for the week
        const tasksQuery = await adminDb.collection('tasks')
            .where('assignedTo', 'array-contains', userId)
            .where('dueDate', '>=', weekStart)
            .where('dueDate', '<=', weekEnd)
            .get();

        const tasks = tasksQuery.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

        const score = this.calculateOverallScore(tasks, config);
        const tasksAssigned = tasks.length;
        const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
        const onTimeTasks = tasks.filter(t => {
            const result = calculateTaskScore(t);
            return t.status === 'completed' && result.completedOnTime;
        }).length;

        const onTimePercentage = tasksCompleted > 0 ? Math.round((onTimeTasks / tasksCompleted) * 100) : 0;

        return {
            id: `report_${userId}_${weekStart.getTime()}`,
            userId,
            userName: '', // To be filled by caller
            weekStartDate: weekStart,
            weekEndDate: weekEnd,
            score,
            tasksAssigned,
            tasksCompleted,
            onTimePercentage,
            onTimeCompletion: onTimeTasks,
            taskDelays: tasksCompleted - onTimeTasks,
            krasCovered: [],
            workNotDoneRate: 0,
            delayRate: 0,
            breakdown: {
                completionScore: 0,
                timelinessScore: 0,
                qualityScore: 0,
                kraAlignmentScore: 0,
                kpiAchievementScore: 0,
                totalScore: score
            },
            generatedAt: new Date()
        };
    }
}

/**
 * Legacy function for backward compatibility if needed, 
 * or can be removed if not used elsewhere.
 */
export async function calculateWeeklyPerformance(userId: string, weekStart: Date, weekEnd: Date) {
    const report = await ScoringService.generateWeeklyReport(
        userId,
        weekStart,
        weekEnd,
        {
            id: 'legacy',
            completionWeight: 0,
            timelinessWeight: 0,
            qualityWeight: 0,
            kraAlignmentWeight: 0,
            kpiAchievementWeight: 0,
            updatedAt: new Date(),
            updatedBy: 'system'
        }
    );

    // Save legacy format
    await adminDb.collection('performanceScores').add({
        userId,
        weekStart,
        weekEnd,
        score: report.score,
        taskCount: report.tasksAssigned,
        calculatedAt: new Date()
    });

    return { score: report.score, taskCount: report.tasksAssigned };
}
