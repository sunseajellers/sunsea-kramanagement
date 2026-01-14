// src/lib/server/scoringService.ts
import { Task, WeeklyReport, ScoringConfig } from '@/types';
import { getUserTasks } from './taskService';
import { getUserKRAs } from './kraService';

export class ScoringService {

    static calculateCompletionScore(tasks: Task[]): number {
        if (tasks.length === 0) return 0;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        return Math.round((completedTasks / tasks.length) * 100);
    }

    static calculateTimelinessScore(tasks: Task[]): number {
        const completedTasks = tasks.filter(t => t.status === 'completed');
        if (completedTasks.length === 0) return 0;
        const onTimeTasks = completedTasks.filter(task => {
            return !task.dueDate || task.updatedAt <= task.dueDate;
        });
        return Math.round((onTimeTasks.length / completedTasks.length) * 100);
    }

    static calculateQualityScore(): number {
        return 80;
    }

    static calculateKraAlignmentScore(tasks: Task[]): number {
        if (tasks.length === 0) return 0;
        const alignedTasks = tasks.filter(t => t.kraId).length;
        return Math.round((alignedTasks / tasks.length) * 100);
    }

    static calculateOverallScore(
        tasks: Task[],
        config: ScoringConfig
    ): number {
        const completionScore = this.calculateCompletionScore(tasks);
        const timelinessScore = this.calculateTimelinessScore(tasks);
        const qualityScore = this.calculateQualityScore();
        const kraAlignmentScore = this.calculateKraAlignmentScore(tasks);

        const weightedScore =
            (completionScore * config.completionWeight / 100) +
            (timelinessScore * config.timelinessWeight / 100) +
            (qualityScore * config.qualityWeight / 100) +
            (kraAlignmentScore * config.kraAlignmentWeight / 100);

        return Math.round(Math.min(100, Math.max(0, weightedScore)));
    }

    static calculateWorkNotDoneRate(tasks: Task[]): number {
        if (tasks.length === 0) return 0;
        const notCompleted = tasks.filter(t => t.status !== 'completed').length;
        return Math.round((notCompleted / tasks.length) * 100);
    }

    static calculateDelayRate(tasks: Task[]): number {
        if (tasks.length === 0) return 0;
        const delayed = tasks.filter(t => {
            const dueDate = t.finalTargetDate || t.dueDate;
            if (!dueDate) return false;
            const now = new Date();
            // Delayed if not completed and past due date, OR if completed but after due date
            if (t.status !== 'completed') {
                return now > new Date(dueDate);
            } else {
                return t.updatedAt > new Date(dueDate);
            }
        }).length;
        return Math.round((delayed / tasks.length) * 100);
    }

    static async generateWeeklyReport(
        userId: string,
        weekStart: Date,
        weekEnd: Date,
        config: ScoringConfig
    ): Promise<WeeklyReport> {
        const allTasks = await getUserTasks(userId);
        const weekTasks = allTasks.filter(task => {
            const taskDate = new Date(task.createdAt);
            return taskDate >= weekStart && taskDate <= weekEnd;
        });

        const completionScore = this.calculateCompletionScore(weekTasks);
        const timelinessScore = this.calculateTimelinessScore(weekTasks);
        const workNotDoneRate = this.calculateWorkNotDoneRate(weekTasks);
        const delayRate = this.calculateDelayRate(weekTasks);
        const qualityScore = this.calculateQualityScore();
        const kraAlignmentScore = this.calculateKraAlignmentScore(weekTasks);
        const overallScore = this.calculateOverallScore(weekTasks, config);

        const kras = await getUserKRAs(userId);
        const activeKras = kras.filter(kra => kra.status === 'in_progress');
        const kraTitles = activeKras.map(kra => kra.title);

        return {
            id: `report_${userId}_${weekStart.toISOString().split('T')[0]}`,
            weekStartDate: weekStart,
            weekEndDate: weekEnd,
            userId,
            userName: '',
            tasksAssigned: weekTasks.length,
            tasksCompleted: weekTasks.filter(t => t.status === 'completed').length,
            onTimeCompletion: timelinessScore,
            onTimePercentage: timelinessScore,
            krasCovered: kraTitles,
            taskDelays: weekTasks.filter(t => this.calculateDelayRate([t]) > 0).length,
            score: overallScore,
            workNotDoneRate,
            delayRate,
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
