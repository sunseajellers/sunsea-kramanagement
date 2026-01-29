// src/lib/enhancedScoringService.ts
// ENHANCED SCORING SERVICE - Enterprise-grade performance scoring
// Prevents double-counting, ensures employee-wise calculations, handles recalculations

import { Task, ScoringConfig } from '@/types';
import { adminDb } from './firebase-admin';

/**
 * Score calculation result with metadata
 */
export interface ScoreResult {
    userId: string;
    overallScore: number;
    completionScore: number;
    timelinessScore: number;
    qualityScore: number;
    kraAlignmentScore: number;
    taskCount: number;
    completedCount: number;
    onTimeCount: number;
    calculatedAt: Date;
    periodStart: Date;
    periodEnd: Date;
}

/**
 * Score recalculation request
 */
export interface ScoreRecalcRequest {
    userId: string;
    reason: 'task_update' | 'task_deletion' | 'task_reassignment' | 'priority_change' | 'backdated_completion' | 'manual';
    taskId?: string;
    triggeredBy: string;
    createdAt: Date;
}

/**
 * Enhanced Scoring Service with strict employee-wise calculations
 */
export class EnhancedScoringService {

    /**
     * Calculate completion score (0-100)
     * Only counts tasks where user is in assignedTo array
     */
    static calculateCompletionScore(tasks: Task[], userId: string): number {
        // Filter to only this employee's tasks
        const userTasks = tasks.filter(t => t.assignedTo?.includes(userId));
        
        if (userTasks.length === 0) return 0;

        const completedTasks = userTasks.filter(t => t.status === 'completed').length;
        return Math.round((completedTasks / userTasks.length) * 100);
    }

    /**
     * Calculate timeliness score (0-100)
     * FIXED: Uses completedAt instead of updatedAt
     */
    static calculateTimelinessScore(tasks: Task[], userId: string): number {
        const userTasks = tasks.filter(t => t.assignedTo?.includes(userId));
        const completedTasks = userTasks.filter(t => t.status === 'completed');

        if (completedTasks.length === 0) return 0;

        const onTimeTasks = completedTasks.filter(task => {
            if (!task.dueDate) return true; // No due date = not late

            // Use completedAt if available, fallback to updatedAt
            const completionDate = task.completedAt || task.updatedAt;
            if (!completionDate) return true;

            // Use finalTargetDate if extension was approved
            const effectiveDueDate = task.finalTargetDate || task.dueDate;
            
            return new Date(completionDate) <= new Date(effectiveDueDate);
        });

        return Math.round((onTimeTasks.length / completedTasks.length) * 100);
    }

    /**
     * Calculate quality score (0-100)
     * FIXED: Returns 0 for no completed tasks instead of 80
     */
    static calculateQualityScore(tasks: Task[], userId: string): number {
        const userTasks = tasks.filter(t => t.assignedTo?.includes(userId));
        const completedTasks = userTasks.filter(t => t.status === 'completed');
        
        if (completedTasks.length === 0) return 0; // FIXED: was returning 80

        let totalQuality = 0;
        completedTasks.forEach(task => {
            if (task.verificationStatus === 'verified') {
                totalQuality += 100;
            } else if (task.verificationStatus === 'rejected' || task.status === 'revision_requested') {
                totalQuality += 40;
            } else {
                totalQuality += 80; // Pending verification
            }
        });

        return Math.round(totalQuality / completedTasks.length);
    }

    /**
     * Calculate KRA alignment score (0-100)
     */
    static calculateKraAlignmentScore(tasks: Task[], userId: string): number {
        const userTasks = tasks.filter(t => t.assignedTo?.includes(userId));
        
        if (userTasks.length === 0) return 0;

        const alignedTasks = userTasks.filter(t => t.kraId).length;
        return Math.round((alignedTasks / userTasks.length) * 100);
    }

    /**
     * Calculate overall score for a user in a date range
     * Strictly employee-wise, no cross-contamination
     */
    static async calculateUserScore(
        userId: string,
        startDate: Date,
        endDate: Date,
        config?: ScoringConfig
    ): Promise<ScoreResult> {
        try {
            // Fetch scoring config if not provided
            if (!config) {
                const configDoc = await adminDb.collection('config').doc('scoring').get();
                if (configDoc.exists) {
                    config = configDoc.data() as ScoringConfig;
                } else {
                    // Default config
                    config = {
                        id: 'default',
                        completionWeight: 40,
                        timelinessWeight: 30,
                        qualityWeight: 20,
                        kraAlignmentWeight: 10,
                        updatedAt: new Date(),
                        updatedBy: 'system'
                    };
                }
            }

            // Fetch tasks for this user in date range
            // Use completedAt for completed tasks, createdAt for others
            const tasksSnapshot = await adminDb.collection('tasks')
                .where('assignedTo', 'array-contains', userId)
                .where('deleted', '==', false)
                .get();

            const allTasks = tasksSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Task[];

            // Filter by date range
            // Include tasks that were completed OR updated in this period
            const tasks = allTasks.filter(task => {
                const relevantDate = task.completedAt || task.updatedAt || task.createdAt;
                if (!relevantDate) return false;
                
                const date = new Date(relevantDate);
                return date >= startDate && date <= endDate;
            });

            // Calculate individual scores (all strictly for this user)
            const completionScore = this.calculateCompletionScore(tasks, userId);
            const timelinessScore = this.calculateTimelinessScore(tasks, userId);
            const qualityScore = this.calculateQualityScore(tasks, userId);
            const kraAlignmentScore = this.calculateKraAlignmentScore(tasks, userId);

            // Calculate weighted overall score
            const overallScore = Math.round(
                (completionScore * config.completionWeight / 100) +
                (timelinessScore * config.timelinessWeight / 100) +
                (qualityScore * config.qualityWeight / 100) +
                (kraAlignmentScore * config.kraAlignmentWeight / 100)
            );

            // Calculate metadata
            const userTasks = tasks.filter(t => t.assignedTo?.includes(userId));
            const completedTasks = userTasks.filter(t => t.status === 'completed');
            const onTimeTasks = completedTasks.filter(task => {
                if (!task.dueDate) return true;
                const completionDate = task.completedAt || task.updatedAt;
                if (!completionDate) return true;
                const effectiveDueDate = task.finalTargetDate || task.dueDate;
                return new Date(completionDate) <= new Date(effectiveDueDate);
            });

            return {
                userId,
                overallScore,
                completionScore,
                timelinessScore,
                qualityScore,
                kraAlignmentScore,
                taskCount: userTasks.length,
                completedCount: completedTasks.length,
                onTimeCount: onTimeTasks.length,
                calculatedAt: new Date(),
                periodStart: startDate,
                periodEnd: endDate
            };
        } catch (error) {
            console.error('Error calculating user score:', error);
            throw error;
        }
    }

    /**
     * Store score snapshot to prevent recalculation issues
     * Creates immutable historical record
     */
    static async storeScoreSnapshot(
        scoreResult: ScoreResult
    ): Promise<string> {
        try {
            // Create unique ID based on user + period
            const periodKey = `${scoreResult.periodStart.toISOString().split('T')[0]}_${scoreResult.periodEnd.toISOString().split('T')[0]}`;
            const snapshotId = `${scoreResult.userId}_${periodKey}`;

            // Check if snapshot already exists (prevent double-counting)
            const existingDoc = await adminDb.collection('scoreSnapshots').doc(snapshotId).get();
            
            if (existingDoc.exists) {
                // Update existing snapshot
                await adminDb.collection('scoreSnapshots').doc(snapshotId).update({
                    ...scoreResult,
                    updatedAt: new Date(),
                    version: (existingDoc.data()?.version || 0) + 1
                });
            } else {
                // Create new snapshot
                await adminDb.collection('scoreSnapshots').doc(snapshotId).set({
                    ...scoreResult,
                    version: 1
                });
            }

            return snapshotId;
        } catch (error) {
            console.error('Error storing score snapshot:', error);
            throw error;
        }
    }

    /**
     * Queue score recalculation request
     * Used when task updates affect scoring
     */
    static async queueScoreRecalculation(
        userId: string,
        reason: ScoreRecalcRequest['reason'],
        taskId: string | undefined,
        triggeredBy: string
    ): Promise<void> {
        try {
            const request: ScoreRecalcRequest = {
                userId,
                reason,
                taskId,
                triggeredBy,
                createdAt: new Date()
            };

            await adminDb.collection('scoreRecalcQueue').add(request);
        } catch (error) {
            console.error('Error queuing score recalculation:', error);
            // Don't throw - recalc queue failures shouldn't break main operations
        }
    }

    /**
     * Process score recalculation queue (for cron job)
     * Recalculates scores for affected users
     */
    static async processRecalculationQueue(
        batchSize: number = 50
    ): Promise<{
        success: boolean;
        processed: number;
        errors: string[];
    }> {
        try {
            const errors: string[] = [];
            let processed = 0;

            // Fetch pending recalculation requests
            const queueSnapshot = await adminDb.collection('scoreRecalcQueue')
                .orderBy('createdAt', 'asc')
                .limit(batchSize)
                .get();

            for (const doc of queueSnapshot.docs) {
                try {
                    const request = doc.data() as ScoreRecalcRequest;

                    // Calculate current week score
                    const now = new Date();
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay()); // Start of week
                    weekStart.setHours(0, 0, 0, 0);
                    
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6); // End of week
                    weekEnd.setHours(23, 59, 59, 999);

                    // Recalculate score
                    const scoreResult = await this.calculateUserScore(
                        request.userId,
                        weekStart,
                        weekEnd
                    );

                    // Store snapshot
                    await this.storeScoreSnapshot(scoreResult);

                    // Delete processed request
                    await adminDb.collection('scoreRecalcQueue').doc(doc.id).delete();

                    processed++;
                } catch (error) {
                    errors.push(`Request ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            return {
                success: true,
                processed,
                errors
            };
        } catch (error) {
            console.error('Error processing recalculation queue:', error);
            return {
                success: false,
                processed: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }

    /**
     * Get score history for a user
     * Shows trend over time
     */
    static async getScoreHistory(
        userId: string,
        limitCount: number = 12
    ): Promise<ScoreResult[]> {
        try {
            const snapshot = await adminDb.collection('scoreSnapshots')
                .where('userId', '==', userId)
                .orderBy('periodStart', 'desc')
                .limit(limitCount)
                .get();

            return snapshot.docs.map(doc => doc.data() as ScoreResult);
        } catch (error) {
            console.error('Error fetching score history:', error);
            return [];
        }
    }

    /**
     * Validate that no task is counted twice
     * Returns tasks that appear in multiple employees' scores
     */
    static async auditDoubleCountingRisk(
        startDate: Date,
        endDate: Date
    ): Promise<{
        riskyTasks: { taskId: string; assigneeCount: number; assignees: string[] }[];
        totalRisk: number;
    }> {
        try {
            // Fetch all tasks in period
            const tasksSnapshot = await adminDb.collection('tasks')
                .where('deleted', '==', false)
                .get();

            const allTasks = tasksSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Task[];

            // Filter by date
            const tasks = allTasks.filter(task => {
                const relevantDate = task.completedAt || task.updatedAt || task.createdAt;
                if (!relevantDate) return false;
                const date = new Date(relevantDate);
                return date >= startDate && date <= endDate;
            });

            // Find tasks with multiple assignees (potential double-counting)
            const riskyTasks = tasks
                .filter(t => t.assignedTo && t.assignedTo.length > 1)
                .map(t => ({
                    taskId: t.id!,
                    assigneeCount: t.assignedTo!.length,
                    assignees: t.assignedTo!
                }));

            return {
                riskyTasks,
                totalRisk: riskyTasks.length
            };
        } catch (error) {
            console.error('Error auditing double-counting risk:', error);
            return { riskyTasks: [], totalRisk: 0 };
        }
    }

    /**
     * Calculate rolling performance averages
     * 7-day, 30-day, 90-day averages
     */
    static async calculateRollingAverages(
        userId: string
    ): Promise<{
        avg7Day: number;
        avg30Day: number;
        avg90Day: number;
    }> {
        try {
            const now = new Date();

            // Helper to calculate average for period
            const calculatePeriodAvg = async (days: number): Promise<number> => {
                const start = new Date(now);
                start.setDate(now.getDate() - days);

                const scoreResult = await this.calculateUserScore(userId, start, now);
                return scoreResult.overallScore;
            };

            const [avg7Day, avg30Day, avg90Day] = await Promise.all([
                calculatePeriodAvg(7),
                calculatePeriodAvg(30),
                calculatePeriodAvg(90)
            ]);

            return { avg7Day, avg30Day, avg90Day };
        } catch (error) {
            console.error('Error calculating rolling averages:', error);
            return { avg7Day: 0, avg30Day: 0, avg90Day: 0 };
        }
    }
}
