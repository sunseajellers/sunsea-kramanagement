// src/lib/server/performanceService.ts
import 'server-only';
import { Task, ScoringConfig } from '@/types';
import { adminDb } from '../firebase-admin';

export interface ScoreResult {
    userId: string;
    overallScore: number;
    completionScore: number;
    timelinessScore: number;
    qualityScore: number;
    kraAlignmentScore: number;
    kpiAchievementScore: number;
    taskCount: number;
    completedCount: number;
    onTimeCount: number;
    calculatedAt: Date;
    periodStart: Date;
    periodEnd: Date;
}

export class PerformanceServiceServer {
    static calculateCompletionScore(tasks: Task[], userId: string): number {
        const userTasks = tasks.filter(t => t.assignedTo?.includes(userId));
        if (userTasks.length === 0) return 0;
        const completedTasks = userTasks.filter(t => t.status === 'completed').length;
        return Math.round((completedTasks / userTasks.length) * 100);
    }

    static calculateTimelinessScore(tasks: Task[], userId: string): number {
        const userTasks = tasks.filter(t => t.assignedTo?.includes(userId));
        const completedTasks = userTasks.filter(t => t.status === 'completed');
        if (completedTasks.length === 0) return 0;

        const onTimeTasks = completedTasks.filter(task => {
            if (!task.dueDate) return true;
            const completionDate = task.completedAt || task.updatedAt;
            const effectiveDueDate = task.finalTargetDate || task.dueDate;
            return new Date(completionDate) <= new Date(effectiveDueDate);
        });

        return Math.round((onTimeTasks.length / completedTasks.length) * 100);
    }

    static calculateQualityScore(tasks: Task[], userId: string): number {
        const userTasks = tasks.filter(t => t.assignedTo?.includes(userId));
        const completedTasks = userTasks.filter(t => t.status === 'completed');
        if (completedTasks.length === 0) return 0;

        let totalQuality = 0;
        completedTasks.forEach(task => {
            if (task.verificationStatus === 'verified') {
                totalQuality += 100;
            } else if (task.verificationStatus === 'rejected' || task.status === 'revision_requested') {
                totalQuality += 40;
            } else {
                totalQuality += 80;
            }
        });

        return Math.round(totalQuality / completedTasks.length);
    }

    static async calculateUserScore(
        userId: string,
        startDate: Date,
        endDate: Date,
        config?: ScoringConfig
    ): Promise<ScoreResult> {
        if (!config) {
            const configDoc = await adminDb.collection('config').doc('scoring').get();
            config = configDoc.exists ? configDoc.data() as ScoringConfig : {
                id: 'default',
                completionWeight: 30,
                timelinessWeight: 20,
                qualityWeight: 20,
                kraAlignmentWeight: 10,
                kpiAchievementWeight: 20,
                updatedAt: new Date(),
                updatedBy: 'system'
            };
        }

        const tasksSnapshot = await adminDb.collection('tasks')
            .where('assignedTo', 'array-contains', userId)
            .where('deleted', '==', false)
            .get();

        const allTasks = tasksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Task[];

        const tasks = allTasks.filter(task => {
            const relevantDate = task.completedAt || task.updatedAt || task.createdAt;
            if (!relevantDate) return false;
            const date = new Date(relevantDate);
            return date >= startDate && date <= endDate;
        });

        // Simplified weights for overall calculation
        const completionScore = this.calculateCompletionScore(tasks, userId);
        const timelinessScore = this.calculateTimelinessScore(tasks, userId);
        const qualityScore = this.calculateQualityScore(tasks, userId);
        const kraAlignmentScore = tasks.length > 0 ? Math.round((tasks.filter(t => t.kraId).length / tasks.length) * 100) : 0;

        const overallScore = Math.round(
            (completionScore * config.completionWeight / 100) +
            (timelinessScore * config.timelinessWeight / 100) +
            (qualityScore * config.qualityWeight / 100) +
            (kraAlignmentScore * config.kraAlignmentWeight / 100)
        );

        return {
            userId,
            overallScore,
            completionScore,
            timelinessScore,
            qualityScore,
            kraAlignmentScore,
            kpiAchievementScore: 0,
            taskCount: tasks.length,
            completedCount: tasks.filter(t => t.status === 'completed').length,
            onTimeCount: timelinessScore, // approximation
            calculatedAt: new Date(),
            periodStart: startDate,
            periodEnd: endDate
        };
    }

    static async processRecalculationQueue(batchSize: number = 50) {
        // Logic moved from EnhancedScoringService
        const queueSnapshot = await adminDb.collection('scoreRecalcQueue')
            .orderBy('createdAt', 'asc')
            .limit(batchSize)
            .get();

        let processed = 0;
        const errors: string[] = [];

        for (const doc of queueSnapshot.docs) {
            try {
                const request = doc.data();
                const now = new Date();
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());

                const scoreResult = await this.calculateUserScore(request.userId, weekStart, now);

                // Store historical snapshot
                const snapshotId = `${request.userId}_${weekStart.toISOString().split('T')[0]}`;
                await adminDb.collection('performanceSnapshots').doc(snapshotId).set({
                    ...scoreResult,
                    version: 1
                });

                await adminDb.collection('scoreRecalcQueue').doc(doc.id).delete();
                processed++;
            } catch (error) {
                errors.push(`Doc ${doc.id}: ${error instanceof Error ? error.message : 'Unknown'}`);
            }
        }

        return { success: true, processed, errors };
    }
}
