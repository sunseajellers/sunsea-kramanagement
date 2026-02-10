// src/lib/performanceService.ts
import { Task, ScoringConfig, WeeklyReport } from '@/types';
import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

/**
 * Performance Service
 * Unified service for KPI achievement and task-based performance scoring.
 */
export class PerformanceService {
    /**
     * Calculate completion score (0-100)
     */
    static calculateCompletionScore(tasks: Task[], userId: string): number {
        const userTasks = tasks.filter(t => t.assignedTo?.includes(userId) || t.assignedBy === userId);
        if (userTasks.length === 0) return 0;
        const completedTasks = userTasks.filter(t => t.status === 'completed').length;
        return Math.round((completedTasks / userTasks.length) * 100);
    }

    /**
     * Calculate timeliness score (0-100)
     */
    static calculateTimelinessScore(tasks: Task[], userId: string): number {
        const userTasks = tasks.filter(t => t.assignedTo?.includes(userId) || t.assignedBy === userId);
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

    /**
     * Calculate quality score (0-100)
     */
    static calculateQualityScore(tasks: Task[], userId: string): number {
        const userTasks = tasks.filter(t => t.assignedTo?.includes(userId) || t.assignedBy === userId);
        const completedTasks = userTasks.filter(t => t.status === 'completed');
        if (completedTasks.length === 0) return 0;

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
     * Calculate overall score using weighted formula
     */
    static calculateOverallPerformance(
        tasks: Task[],
        userId: string,
        config: ScoringConfig
    ): number {
        const completionScore = this.calculateCompletionScore(tasks, userId);
        const timelinessScore = this.calculateTimelinessScore(tasks, userId);
        const qualityScore = this.calculateQualityScore(tasks, userId);

        // KRA Alignment (Strategy pillar connection)
        const userTasks = tasks.filter(t => t.assignedTo?.includes(userId) || t.assignedBy === userId);
        const alignedTasks = userTasks.filter(t => t.kraId || t.objectiveId).length;
        const kraAlignmentScore = userTasks.length > 0 ? Math.round((alignedTasks / userTasks.length) * 100) : 0;

        const weightedScore =
            (completionScore * config.completionWeight / 100) +
            (timelinessScore * config.timelinessWeight / 100) +
            (qualityScore * config.qualityWeight / 100) +
            (kraAlignmentScore * config.kraAlignmentWeight / 100);

        return Math.round(Math.min(100, Math.max(0, weightedScore)));
    }

    /**
     * Fetch all relevant data for a performance report
     */
    static async getPerformanceData(userId: string): Promise<{
        score: number,
        taskCount: number,
        completedCount: number,
        kpiAchievement: number
    }> {
        // This would call the API or direct Firestore in a real implementation
        // For now, we'll keep the signature consistent with what the UI expects
        const tasksQuery = query(
            collection(db, 'tasks'),
            where('assignedTo', 'array-contains', userId)
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasks = tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));

        // Get default config
        const config: ScoringConfig = {
            id: 'default',
            completionWeight: 40,
            timelinessWeight: 30,
            qualityWeight: 20,
            kraAlignmentWeight: 10,
            kpiAchievementWeight: 0,
            updatedAt: new Date(),
            updatedBy: 'system'
        };

        const score = this.calculateOverallPerformance(tasks, userId, config);
        const completedCount = tasks.filter(t => t.status === 'completed').length;

        return {
            score,
            taskCount: tasks.length,
            completedCount,
            kpiAchievement: 0 // TODO: Add KPI linkage
        };
    }
}
