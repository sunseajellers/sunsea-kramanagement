// src/lib/intelligenceService.ts
// BACKGROUND INTELLIGENCE SERVICE - Pattern detection and predictive analytics
// Runs as background jobs to detect issues before they become critical

import { Task } from '@/types';
import { adminDb } from './firebase-admin';
import { PerformanceServiceServer } from './server/performanceService';

/**
 * Chronic overdue pattern detected for an employee
 */
export interface ChronicOverduePattern {
    userId: string;
    userName: string;
    totalTasks: number;
    overdueTasks: number;
    overduePercentage: number;
    avgDaysOverdue: number;
    consecutiveOverdue: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    detectedAt: Date;
    recommendations: string[];
}

/**
 * Department performance trend
 */
export interface DepartmentTrend {
    departmentId: string;
    departmentName: string;
    currentScore: number;
    previousScore: number;
    trend: 'improving' | 'stable' | 'declining';
    changePercentage: number;
    detectedAt: Date;
    riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Task risk assessment
 */
export interface TaskRiskAssessment {
    taskId: string;
    taskTitle: string;
    assignedTo: string[];
    riskScore: number; // 0-100
    riskFactors: string[];
    predictedOutcome: 'on_time' | 'late' | 'very_late';
    daysUntilDue: number;
    recommendations: string[];
    assessedAt: Date;
}

/**
 * Weekly performance snapshot
 */
export interface PerformanceSnapshot {
    userId: string;
    userName: string;
    weekStart: Date;
    weekEnd: Date;
    overallScore: number;
    taskMetrics: {
        total: number;
        completed: number;
        overdue: number;
        inProgress: number;
    };
    trend: 'up' | 'down' | 'stable';
    alerts: string[];
    snapshotAt: Date;
}

/**
 * Intelligence Service for pattern detection and analytics
 */
export class IntelligenceService {

    /**
     * Detect chronic overdue patterns for all employees
     * Identifies employees who consistently miss deadlines
     */
    static async detectChronicOverduePatterns(
        lookbackDays: number = 30,
        threshold: number = 30 // % of tasks overdue
    ): Promise<ChronicOverduePattern[]> {
        try {
            const patterns: ChronicOverduePattern[] = [];
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);

            // Fetch all users
            const usersSnapshot = await adminDb.collection('users').get();

            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
                const userData = userDoc.data();
                const userName = userData.fullName || userData.displayName || userData.email;

                // Fetch user's tasks in lookback period
                const tasksSnapshot = await adminDb.collection('tasks')
                    .where('assignedTo', 'array-contains', userId)
                    .where('createdAt', '>=', cutoffDate)
                    .where('deleted', '==', false)
                    .get();

                const tasks = tasksSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Task[];

                if (tasks.length === 0) continue;

                // Calculate overdue metrics
                const overdueTasks = tasks.filter(t =>
                    t.status === 'overdue' ||
                    (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed')
                );

                const overduePercentage = (overdueTasks.length / tasks.length) * 100;

                // Skip if below threshold
                if (overduePercentage < threshold) continue;

                // Calculate average days overdue
                let totalDaysOverdue = 0;
                let overdueCount = 0;

                overdueTasks.forEach(task => {
                    if (task.dueDate) {
                        const effectiveDueDate = task.finalTargetDate || task.dueDate;
                        const daysOverdue = Math.floor(
                            (new Date().getTime() - new Date(effectiveDueDate).getTime()) / (1000 * 60 * 60 * 24)
                        );
                        if (daysOverdue > 0) {
                            totalDaysOverdue += daysOverdue;
                            overdueCount++;
                        }
                    }
                });

                const avgDaysOverdue = overdueCount > 0 ? Math.round(totalDaysOverdue / overdueCount) : 0;

                // Detect consecutive overdue tasks
                const sortedTasks = tasks.sort((a, b) =>
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                );

                let consecutiveOverdue = 0;
                let maxConsecutive = 0;

                sortedTasks.forEach(task => {
                    if (task.status === 'overdue' ||
                        (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed')) {
                        consecutiveOverdue++;
                        maxConsecutive = Math.max(maxConsecutive, consecutiveOverdue);
                    } else {
                        consecutiveOverdue = 0;
                    }
                });

                // Determine severity
                let severity: ChronicOverduePattern['severity'] = 'low';
                if (overduePercentage >= 70 || maxConsecutive >= 5) {
                    severity = 'critical';
                } else if (overduePercentage >= 50 || maxConsecutive >= 3) {
                    severity = 'high';
                } else if (overduePercentage >= 40 || maxConsecutive >= 2) {
                    severity = 'medium';
                }

                // Generate recommendations
                const recommendations: string[] = [];
                if (avgDaysOverdue > 7) {
                    recommendations.push('Consider workload rebalancing - tasks delayed by over a week on average');
                }
                if (maxConsecutive >= 3) {
                    recommendations.push('Immediate manager intervention needed - multiple consecutive delays');
                }
                if (overduePercentage >= 60) {
                    recommendations.push('Training may be needed - over 60% of tasks are overdue');
                }

                patterns.push({
                    userId,
                    userName,
                    totalTasks: tasks.length,
                    overdueTasks: overdueTasks.length,
                    overduePercentage: Math.round(overduePercentage),
                    avgDaysOverdue,
                    consecutiveOverdue: maxConsecutive,
                    severity,
                    detectedAt: new Date(),
                    recommendations
                });
            }

            // Store patterns in database
            for (const pattern of patterns) {
                await adminDb.collection('chronicOverduePatterns').add(pattern);
            }

            return patterns;
        } catch (error) {
            console.error('Error detecting chronic overdue patterns:', error);
            return [];
        }
    }

    /**
     * Analyze department performance trends
     * Compares current vs previous period
     */
    static async analyzeDepartmentTrends(
        periodDays: number = 7
    ): Promise<DepartmentTrend[]> {
        try {
            const trends: DepartmentTrend[] = [];
            const now = new Date();

            // Current period
            const currentStart = new Date(now);
            currentStart.setDate(now.getDate() - periodDays);

            // Previous period
            const previousStart = new Date(currentStart);
            previousStart.setDate(currentStart.getDate() - periodDays);
            const previousEnd = new Date(currentStart);
            previousEnd.setDate(currentStart.getDate() - 1);

            // Fetch all departments
            const deptsSnapshot = await adminDb.collection('departments').get();

            for (const deptDoc of deptsSnapshot.docs) {
                const departmentId = deptDoc.id;
                const departmentName = deptDoc.data().name;

                // Get department users
                const usersSnapshot = await adminDb.collection('users')
                    .where('departmentId', '==', departmentId)
                    .get();

                if (usersSnapshot.empty) continue;

                const userIds = usersSnapshot.docs.map(doc => doc.id);

                // Calculate average scores for current period
                let currentScoreTotal = 0;
                let currentScoreCount = 0;

                for (const userId of userIds) {
                    const scoreResult = await PerformanceServiceServer.calculateUserScore(
                        userId,
                        currentStart,
                        now
                    );
                    currentScoreTotal += scoreResult.overallScore;
                    currentScoreCount++;
                }

                const currentScore = currentScoreCount > 0 ? Math.round(currentScoreTotal / currentScoreCount) : 0;

                // Calculate average scores for previous period
                let previousScoreTotal = 0;
                let previousScoreCount = 0;

                for (const userId of userIds) {
                    const scoreResult = await PerformanceServiceServer.calculateUserScore(
                        userId,
                        previousStart,
                        previousEnd
                    );
                    previousScoreTotal += scoreResult.overallScore;
                    previousScoreCount++;
                }

                const previousScore = previousScoreCount > 0 ? Math.round(previousScoreTotal / previousScoreCount) : 0;

                // Calculate trend
                const changePercentage = previousScore > 0
                    ? Math.round(((currentScore - previousScore) / previousScore) * 100)
                    : 0;

                let trend: DepartmentTrend['trend'] = 'stable';
                if (changePercentage > 5) {
                    trend = 'improving';
                } else if (changePercentage < -5) {
                    trend = 'declining';
                }

                // Determine risk level
                let riskLevel: DepartmentTrend['riskLevel'] = 'low';
                if (trend === 'declining' && changePercentage < -15) {
                    riskLevel = 'high';
                } else if (trend === 'declining' && changePercentage < -10) {
                    riskLevel = 'medium';
                }

                trends.push({
                    departmentId,
                    departmentName,
                    currentScore,
                    previousScore,
                    trend,
                    changePercentage,
                    detectedAt: now,
                    riskLevel
                });
            }

            // Store trends
            for (const trend of trends) {
                await adminDb.collection('departmentTrends').add(trend);
            }

            return trends;
        } catch (error) {
            console.error('Error analyzing department trends:', error);
            return [];
        }
    }

    /**
     * Assess risk for all active tasks
     * Predicts which tasks are likely to be delayed
     */
    static async assessTaskRisks(): Promise<TaskRiskAssessment[]> {
        try {
            const assessments: TaskRiskAssessment[] = [];
            const now = new Date();

            // Fetch active tasks (not completed or cancelled)
            const tasksSnapshot = await adminDb.collection('tasks')
                .where('status', 'not-in', ['completed', 'cancelled'])
                .where('deleted', '==', false)
                .get();

            for (const taskDoc of tasksSnapshot.docs) {
                const task = { id: taskDoc.id, ...taskDoc.data() } as Task;

                if (!task.dueDate) continue;

                const effectiveDueDate = task.finalTargetDate || task.dueDate;
                const daysUntilDue = Math.ceil(
                    (new Date(effectiveDueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                );

                // Skip tasks that are already overdue or due far in the future
                if (daysUntilDue < 0 || daysUntilDue > 30) continue;

                const riskFactors: string[] = [];
                let riskScore = 0;

                // Factor 1: Time pressure (max 30 points)
                if (daysUntilDue <= 1) {
                    riskScore += 30;
                    riskFactors.push('Due within 24 hours');
                } else if (daysUntilDue <= 3) {
                    riskScore += 20;
                    riskFactors.push('Due within 3 days');
                } else if (daysUntilDue <= 7) {
                    riskScore += 10;
                    riskFactors.push('Due within 1 week');
                }

                // Factor 2: Task status (max 25 points)
                if (task.status === 'not_started' || task.status === 'assigned') {
                    riskScore += 25;
                    riskFactors.push('Not yet started');
                } else if (task.status === 'blocked') {
                    riskScore += 20;
                    riskFactors.push('Currently blocked');
                } else if (task.status === 'on_hold') {
                    riskScore += 15;
                    riskFactors.push('On hold');
                }

                // Factor 3: Priority (max 20 points)
                if (task.priority === 'critical') {
                    riskScore += 20;
                    riskFactors.push('Critical priority');
                } else if (task.priority === 'high') {
                    riskScore += 15;
                }

                // Factor 4: Multiple assignees (max 15 points)
                if (task.assignedTo && task.assignedTo.length > 2) {
                    riskScore += 15;
                    riskFactors.push(`Multiple assignees (${task.assignedTo.length})`);
                }

                // Factor 5: Historical performance (max 10 points)
                if (task.assignedTo && task.assignedTo.length > 0) {
                    for (const userId of task.assignedTo) {
                        // Check user's overdue history
                        const userOverdueSnapshot = await adminDb.collection('chronicOverduePatterns')
                            .where('userId', '==', userId)
                            .where('severity', 'in', ['high', 'critical'])
                            .limit(1)
                            .get();

                        if (!userOverdueSnapshot.empty) {
                            riskScore += 10;
                            riskFactors.push('Assignee has chronic overdue pattern');
                            break;
                        }
                    }
                }

                // Predict outcome
                let predictedOutcome: TaskRiskAssessment['predictedOutcome'] = 'on_time';
                if (riskScore >= 70) {
                    predictedOutcome = 'very_late';
                } else if (riskScore >= 40) {
                    predictedOutcome = 'late';
                }

                // Generate recommendations
                const recommendations: string[] = [];
                if (riskScore >= 60) {
                    recommendations.push('Immediate manager attention required');
                }
                if (task.status === 'blocked') {
                    recommendations.push('Resolve blocking issues urgently');
                }
                if (daysUntilDue <= 2 && task.status === 'not_started') {
                    recommendations.push('Escalate task - not started with imminent deadline');
                }

                if (riskScore >= 30) { // Only store medium+ risk tasks
                    assessments.push({
                        taskId: task.id!,
                        taskTitle: task.title || 'Untitled Task',
                        assignedTo: task.assignedTo || [],
                        riskScore: Math.min(100, riskScore),
                        riskFactors,
                        predictedOutcome,
                        daysUntilDue,
                        recommendations,
                        assessedAt: now
                    });
                }
            }

            // Store assessments
            const batch = adminDb.batch();
            assessments.forEach(assessment => {
                const ref = adminDb.collection('taskRiskAssessments').doc();
                batch.set(ref, assessment);
            });
            await batch.commit();

            return assessments;
        } catch (error) {
            console.error('Error assessing task risks:', error);
            return [];
        }
    }

    /**
     * Create weekly performance snapshots for all users
     * Provides trend analysis
     */
    static async createWeeklySnapshots(): Promise<PerformanceSnapshot[]> {
        try {
            const snapshots: PerformanceSnapshot[] = [];
            const now = new Date();

            // Current week
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);

            // Fetch all active users
            const usersSnapshot = await adminDb.collection('users')
                .where('isActive', '==', true)
                .get();

            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
                const userData = userDoc.data();
                const userName = userData.fullName || userData.displayName || userData.email;

                // Calculate current week score
                const scoreResult = await PerformanceServiceServer.calculateUserScore(
                    userId,
                    weekStart,
                    weekEnd
                );

                // Get previous week score for trend
                const prevWeekStart = new Date(weekStart);
                prevWeekStart.setDate(weekStart.getDate() - 7);
                const prevWeekEnd = new Date(weekStart);
                prevWeekEnd.setDate(weekStart.getDate() - 1);

                const prevScoreResult = await PerformanceServiceServer.calculateUserScore(
                    userId,
                    prevWeekStart,
                    prevWeekEnd
                );

                // Determine trend
                let trend: PerformanceSnapshot['trend'] = 'stable';
                const scoreDiff = scoreResult.overallScore - prevScoreResult.overallScore;
                if (scoreDiff > 5) {
                    trend = 'up';
                } else if (scoreDiff < -5) {
                    trend = 'down';
                }

                // Generate alerts
                const alerts: string[] = [];
                if (scoreResult.overallScore < 50) {
                    alerts.push('Low overall performance score');
                }
                if (scoreResult.timelinessScore < 40) {
                    alerts.push('Poor timeliness - many tasks completed late');
                }
                if (trend === 'down' && scoreDiff < -15) {
                    alerts.push('Significant performance decline');
                }

                snapshots.push({
                    userId,
                    userName,
                    weekStart,
                    weekEnd,
                    overallScore: scoreResult.overallScore,
                    taskMetrics: {
                        total: scoreResult.taskCount,
                        completed: scoreResult.completedCount,
                        overdue: scoreResult.taskCount - scoreResult.completedCount, // Approximation
                        inProgress: 0 // Would need additional query
                    },
                    trend,
                    alerts,
                    snapshotAt: now
                });
            }

            // Store snapshots
            const batch = adminDb.batch();
            snapshots.forEach(snapshot => {
                const ref = adminDb.collection('performanceSnapshots').doc();
                batch.set(ref, snapshot);
            });
            await batch.commit();

            return snapshots;
        } catch (error) {
            console.error('Error creating weekly snapshots:', error);
            return [];
        }
    }

    /**
     * Generate intelligence summary (for admin dashboard)
     * Aggregates all intelligence data
     */
    static async generateIntelligenceSummary(): Promise<{
        chronicOverdueCount: number;
        criticalRiskTasks: number;
        decliningDepartments: number;
        totalAlerts: number;
        generatedAt: Date;
    }> {
        try {
            const now = new Date();
            const cutoffDate = new Date();
            cutoffDate.setDate(now.getDate() - 7); // Last 7 days

            // Count chronic overdue patterns
            const overdueSnapshot = await adminDb.collection('chronicOverduePatterns')
                .where('detectedAt', '>=', cutoffDate)
                .get();

            // Count critical risk tasks
            const riskSnapshot = await adminDb.collection('taskRiskAssessments')
                .where('riskScore', '>=', 70)
                .where('assessedAt', '>=', cutoffDate)
                .get();

            // Count declining departments
            const trendSnapshot = await adminDb.collection('departmentTrends')
                .where('trend', '==', 'declining')
                .where('detectedAt', '>=', cutoffDate)
                .get();

            // Count total alerts
            const alertSnapshot = await adminDb.collection('performanceSnapshots')
                .where('snapshotAt', '>=', cutoffDate)
                .get();

            let totalAlerts = 0;
            alertSnapshot.docs.forEach(doc => {
                const snapshot = doc.data() as PerformanceSnapshot;
                totalAlerts += snapshot.alerts.length;
            });

            return {
                chronicOverdueCount: overdueSnapshot.size,
                criticalRiskTasks: riskSnapshot.size,
                decliningDepartments: trendSnapshot.size,
                totalAlerts,
                generatedAt: now
            };
        } catch (error) {
            console.error('Error generating intelligence summary:', error);
            return {
                chronicOverdueCount: 0,
                criticalRiskTasks: 0,
                decliningDepartments: 0,
                totalAlerts: 0,
                generatedAt: new Date()
            };
        }
    }
}
