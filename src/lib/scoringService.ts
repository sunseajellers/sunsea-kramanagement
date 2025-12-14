// src/lib/scoringService.ts
// BUSINESS LOGIC SERVICE - Scoring calculations
// This is the SINGLE SOURCE OF TRUTH for all scoring logic

import { Task, KRA, WeeklyReport, ScoringConfig } from '@/types';
import { getUserTasks } from './taskService';
import { getUserKRAs } from './kraService';

export class ScoringService {

    /**
     * Calculate completion score (0-100)
     * Formula: (completed tasks / total tasks) * 100
     */
    static calculateCompletionScore(tasks: Task[]): number {
        if (tasks.length === 0) return 0;

        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        return Math.round((completedTasks / tasks.length) * 100);
    }

    /**
     * Calculate timeliness score (0-100)
     * Formula: (on-time completed tasks / total completed tasks) * 100
     */
    static calculateTimelinessScore(tasks: Task[]): number {
        const completedTasks = tasks.filter(t => t.status === 'completed');

        if (completedTasks.length === 0) return 0;

        const onTimeTasks = completedTasks.filter(task => {
            // Assume task was completed on time if no due date or completed before due date
            return !task.dueDate || task.updatedAt <= task.dueDate;
        });

        return Math.round((onTimeTasks.length / completedTasks.length) * 100);
    }

    /**
     * Calculate quality score (0-100)
     * This is a placeholder - would need checklist completion data
     * For now, returns 80 as baseline
     */
    static calculateQualityScore(tasks: Task[]): number {
        // TODO: Implement based on checklist completion rates
        // For now, return a reasonable baseline
        return 80;
    }

    /**
     * Calculate KRA alignment score (0-100)
     * Formula: (tasks linked to KRAs / total tasks) * 100
     */
    static calculateKraAlignmentScore(tasks: Task[]): number {
        if (tasks.length === 0) return 0;

        const alignedTasks = tasks.filter(t => t.kraId).length;
        return Math.round((alignedTasks / tasks.length) * 100);
    }

    /**
     * Calculate overall score using weighted formula
     */
    static calculateOverallScore(
        tasks: Task[],
        config: ScoringConfig
    ): number {
        const completionScore = this.calculateCompletionScore(tasks);
        const timelinessScore = this.calculateTimelinessScore(tasks);
        const qualityScore = this.calculateQualityScore(tasks);
        const kraAlignmentScore = this.calculateKraAlignmentScore(tasks);

        const weightedScore =
            (completionScore * config.completionWeight / 100) +
            (timelinessScore * config.timelinessWeight / 100) +
            (qualityScore * config.qualityWeight / 100) +
            (kraAlignmentScore * config.kraAlignmentWeight / 100);

        return Math.round(Math.min(100, Math.max(0, weightedScore)));
    }

    /**
     * Generate weekly report for a user
     */
    static async generateWeeklyReport(
        userId: string,
        weekStart: Date,
        weekEnd: Date,
        config: ScoringConfig
    ): Promise<WeeklyReport> {
        // Get tasks for the week
        const allTasks = await getUserTasks(userId);
        const weekTasks = allTasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= weekStart && taskDate <= weekEnd;
        });

        // Calculate individual scores
        const completionScore = this.calculateCompletionScore(weekTasks);
        const timelinessScore = this.calculateTimelinessScore(weekTasks);
        const qualityScore = this.calculateQualityScore(weekTasks);
        const kraAlignmentScore = this.calculateKraAlignmentScore(weekTasks);
        const overallScore = this.calculateOverallScore(weekTasks, config);

        // Get KRAs covered
        const kras = await getUserKRAs(userId);
        const activeKras = kras.filter(kra => kra.status === 'in_progress');
        const kraTitles = activeKras.map(kra => kra.title);

        // Calculate task delays (placeholder)
        const delayedTasks = weekTasks.filter(task => {
            return task.dueDate && task.updatedAt > task.dueDate && task.status !== 'completed';
        }).length;

        return {
            id: `report_${userId}_${weekStart.toISOString().split('T')[0]}`,
            weekStartDate: weekStart,
            weekEndDate: weekEnd,
            userId,
            userName: '', // Would be populated from user data
            tasksAssigned: weekTasks.length,
            tasksCompleted: weekTasks.filter(t => t.status === 'completed').length,
            onTimeCompletion: timelinessScore,
            onTimePercentage: timelinessScore,
            krasCovered: kraTitles,
            taskDelays: delayedTasks,
            score: overallScore,
            breakdown: {
                completionScore,
                timelinessScore,
                qualityScore,
                kraAlignmentScore,
                totalScore: overallScore
            },
            generatedAt: new Date()
        };
    }
}