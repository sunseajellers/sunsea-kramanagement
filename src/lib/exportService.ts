// src/lib/exportService.ts
// Export/Import service for Google Sheets CSV format compatibility

import { Task, KRA } from '@/types';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { timestampToDate, handleError } from './utils';

/**
 * Export tasks to CSV format (Google Sheets compatible)
 */
export function exportTasksToCSV(tasks: Task[]): string {
    const headers = [
        'ID',
        'Title',
        'Description',
        'Status',
        'Priority',
        'Assigned To',
        'Due Date',
        'Team ID',
        'Created At',
        'Updated At'
    ];

    const rows = tasks.map(task => [
        task.id,
        escapeCSV(task.title),
        escapeCSV(task.description || ''),
        task.status,
        task.priority,
        (task.assignedTo || []).join(';'),
        formatDateForCSV(task.dueDate),
        task.teamId || '',
        formatDateForCSV(task.createdAt),
        formatDateForCSV(task.updatedAt)
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Export KRAs to CSV format
 */
export function exportKRAsToCSV(kras: KRA[]): string {
    const headers = [
        'ID',
        'Title',
        'Description',
        'Type',
        'Status',
        'Priority',
        'Target',
        'Assigned To',
        'Start Date',
        'End Date',
        'Created At'
    ];

    const rows = kras.map(kra => [
        kra.id,
        escapeCSV(kra.title),
        escapeCSV(kra.description || ''),
        kra.type,
        kra.status,
        kra.priority,
        escapeCSV(kra.target || ''),
        (kra.assignedTo || []).join(';'),
        formatDateForCSV(kra.startDate),
        formatDateForCSV(kra.endDate),
        formatDateForCSV(kra.createdAt)
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

/**
 * Escape CSV values
 */
function escapeCSV(value: string): string {
    if (!value) return '';
    // If contains comma, newline, or quote, wrap in quotes and escape quotes
    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Format date for CSV export
 */
function formatDateForCSV(date: Date | undefined | null): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD format
}

/**
 * Download CSV as file
 */
export function downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export all user tasks to CSV
 */
export async function exportUserTasksToCSV(userId: string): Promise<string> {
    try {
        const q = query(
            collection(db, 'tasks'),
            where('assignedTo', 'array-contains', userId)
        );
        const snapshot = await getDocs(q);

        const tasks: Task[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            dueDate: timestampToDate(doc.data().dueDate),
            createdAt: timestampToDate(doc.data().createdAt),
            updatedAt: timestampToDate(doc.data().updatedAt)
        })) as Task[];

        return exportTasksToCSV(tasks);
    } catch (error) {
        handleError(error, 'Failed to export tasks');
        throw error;
    }
}

/**
 * Export team tasks to CSV
 */
export async function exportTeamTasksToCSV(teamId: string): Promise<string> {
    try {
        const q = query(
            collection(db, 'tasks'),
            where('teamId', '==', teamId)
        );
        const snapshot = await getDocs(q);

        const tasks: Task[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            dueDate: timestampToDate(doc.data().dueDate),
            createdAt: timestampToDate(doc.data().createdAt),
            updatedAt: timestampToDate(doc.data().updatedAt)
        })) as Task[];

        return exportTasksToCSV(tasks);
    } catch (error) {
        handleError(error, 'Failed to export team tasks');
        throw error;
    }
}

/**
 * Generate MIS report CSV
 */
export function generateMISReportCSV(data: {
    userName: string;
    period: string;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    completionRate: number;
    parameterScores: { name: string; score: number; weight: number }[];
    weightedScore: number;
}): string {
    const lines = [
        'MIS Performance Report',
        '',
        `User,${data.userName}`,
        `Period,${data.period}`,
        `Generated At,${new Date().toISOString().split('T')[0]}`,
        '',
        'Task Summary',
        `Total Tasks,${data.totalTasks}`,
        `Completed Tasks,${data.completedTasks}`,
        `Pending Tasks,${data.pendingTasks}`,
        `Overdue Tasks,${data.overdueTasks}`,
        `Completion Rate,${data.completionRate}%`,
        '',
        'Performance Scores',
        'Parameter,Score,Weight'
    ];

    for (const param of data.parameterScores) {
        lines.push(`${param.name},${param.score},${param.weight}%`);
    }

    lines.push('');
    lines.push(`Weighted Score,${data.weightedScore}`);

    return lines.join('\n');
}
