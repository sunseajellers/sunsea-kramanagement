// src/lib/analyticsService.ts
import { DashboardStats } from '@/types';
import { getUserTasks } from './taskService';
import { getUserKRAs } from './kraService';
import { handleError } from './utils';

/**
 * Simple aggregation for a user's dashboard.
 */
export async function getDashboardStats(uid: string): Promise<DashboardStats> {
    try {
        // Fetch tasks for the user
        const tasks = await getUserTasks(uid);
        // Fetch KRAs for the user
        const kras = await getUserKRAs(uid);

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === 'completed').length;
        const pendingTasks = tasks.filter((t) => t.status === 'assigned' || t.status === 'in_progress').length;
        const overdueTasks = tasks.filter((t) => {
            const now = new Date();
            return t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed';
        }).length;

        const activeKRAs = kras.filter((k) => k.status === 'in_progress').length;
        const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const weeklyScore = Math.min(100, completionRate + activeKRAs * 2); // dummy calculation

        return {
            totalTasks,
            completedTasks,
            pendingTasks,
            overdueTasks,
            activeKRAs,
            completionRate,
            weeklyScore,
        };
    } catch (error) {
        handleError(error, 'Failed to fetch dashboard stats');
        throw error;
    }
}

export async function getTaskAnalytics(uid: string) {
    try {
        const tasks = await getUserTasks(uid);

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === 'completed').length;
        const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
        const pendingTasks = tasks.filter((t) => t.status === 'assigned').length; // 'assigned' maps to pending in UI often
        const overdueTasks = tasks.filter((t) => {
            const now = new Date();
            return t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed';
        }).length;

        const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Calculate Status Distribution
        const tasksByStatus = {
            pending: tasks.filter(t => t.status === 'assigned').length,
            'in-progress': tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            blocked: tasks.filter(t => t.status === 'blocked').length
        };

        // Calculate Priority Distribution
        const tasksByPriority = {
            low: tasks.filter(t => t.priority === 'low').length,
            medium: tasks.filter(t => t.priority === 'medium').length,
            high: tasks.filter(t => t.priority === 'high').length,
            critical: tasks.filter(t => t.priority === 'critical').length
        };

        // Mock Trend Data (Last 7 days) - In a real app, you'd aggregate this from createdAt/completedAt
        const tasksOverTime = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return {
                date: d.toLocaleDateString('en-US', { weekday: 'short' }),
                created: Math.floor(Math.random() * 5), // Mock
                completed: Math.floor(Math.random() * 5) // Mock
            };
        });

        return {
            totalTasks,
            completedTasks,
            inProgressTasks,
            pendingTasks,
            overdueTasks,
            completionRate,
            tasksByStatus,
            tasksByPriority,
            tasksOverTime
        };
    } catch (error) {
        handleError(error, 'Failed to fetch task analytics');
        throw error;
    }
}

export async function getKRAAnalytics(uid: string) {
    try {
        const kras = await getUserKRAs(uid);

        const totalKRAs = kras.length;
        const activeKRAs = kras.filter(k => k.status === 'in_progress').length;

        // Mock Progress Data - In a real app, this would come from linked tasks
        const kraProgress = kras.slice(0, 5).map(kra => ({
            name: kra.title,
            tasksTotal: 10, // Mock
            tasksCompleted: Math.floor(Math.random() * 10), // Mock
            percentage: Math.floor(Math.random() * 100) // Mock
        }));

        return {
            totalKRAs,
            activeKRAs,
            kraProgress
        };
    } catch (error) {
        handleError(error, 'Failed to fetch KRA analytics');
        throw error;
    }
}

export async function exportAnalyticsData(uid: string) {
    // Placeholder for export functionality
    console.log('Exporting analytics for', uid);
    return true;
}
