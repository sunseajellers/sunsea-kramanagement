// src/lib/bulkTaskService.ts
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { BulkTaskOperation, Task, Priority, TaskStatus } from '@/types';
import { handleError } from './utils';
import { createTask } from './taskService';

/**
 * CSV Task Data Interface
 */
export interface CSVTaskData {
    title: string
    description: string
    priority: string
    assignedTo: string // Email or user ID
    teamId?: string
    dueDate: string // Date string
    progress?: string // Optional percentage string
}

/**
 * Parse CSV content to task data
 * @param csvContent - CSV file content as string
 * @returns Array of parsed task data
 */
export function parseCSV(csvContent: string): CSVTaskData[] {
    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('CSV must have at least a header row and one data row');
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

    // Validate required columns
    const requiredColumns = ['title', 'description', 'priority', 'assignedto', 'duedate'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
        throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Parse data rows
    const tasks: CSVTaskData[] = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length === 0 || values.every(v => !v)) continue; // Skip empty lines

        const task: any = {};
        headers.forEach((header, index) => {
            task[header] = values[index] || '';
        });

        tasks.push({
            title: task.title,
            description: task.description,
            priority: task.priority,
            assignedTo: task.assignedto,
            teamId: task.teamid,
            dueDate: task.duedate,
            progress: task.progress
        });
    }

    return tasks;
}

/**
 * Validate priority value
 */
function validatePriority(priority: string): Priority {
    const normalized = priority.toLowerCase();
    if (['low', 'medium', 'high', 'critical'].includes(normalized)) {
        return normalized as Priority;
    }
    return 'medium'; // Default
}

/**
 * Parse date string to Date object
 */
function parseDate(dateString: string): Date {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        // If invalid, default to 7 days from now
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        return defaultDate;
    }
    return date;
}

/**
 * Create tasks in bulk from CSV data
 * @param csvData - Array of CSV task data
 * @param createdBy - User ID creating the tasks
 * @param createdByName - Name of user creating the tasks
 * @param operationName - Name for this bulk operation
 * @returns BulkTaskOperation ID
 */
export async function createBulkTasksFromCSV(
    csvData: CSVTaskData[],
    createdBy: string,
    createdByName: string,
    operationName: string
): Promise<string> {
    // Create bulk operation record
    const operationData: Omit<BulkTaskOperation, 'id'> = {
        name: operationName,
        createdBy,
        createdByName,
        taskIds: [],
        totalTasks: csvData.length,
        successfulTasks: 0,
        failedTasks: 0,
        status: 'processing',
        errors: [],
        source: 'csv',
        createdAt: new Date()
    };

    try {
        const operationRef = await addDoc(collection(db, 'bulkTaskOperations'), operationData);
        const operationId = operationRef.id;

        // Process tasks
        const taskIds: string[] = [];
        const errors: string[] = [];

        for (let i = 0; i < csvData.length; i++) {
            const csvTask = csvData[i];
            try {
                // Create task
                const taskData: Omit<Task, 'id'> = {
                    title: csvTask.title,
                    description: csvTask.description,
                    priority: validatePriority(csvTask.priority),
                    status: 'assigned' as TaskStatus,
                    assignedTo: [csvTask.assignedTo], // Assuming single assignee for now
                    assignedBy: createdBy,
                    teamId: csvTask.teamId,
                    dueDate: parseDate(csvTask.dueDate),
                    progress: csvTask.progress ? parseInt(csvTask.progress) : 0,
                    attachments: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const taskId = await createTask(taskData);
                taskIds.push(taskId);

            } catch (error: any) {
                errors.push(`Row ${i + 2}: ${error.message}`);
            }
        }

        // Update operation record
        await updateDoc(doc(db, 'bulkTaskOperations', operationId), {
            taskIds,
            successfulTasks: taskIds.length,
            failedTasks: errors.length,
            status: errors.length === csvData.length ? 'failed' : 'completed',
            errors: errors.length > 0 ? errors : undefined,
            completedAt: new Date()
        });

        return operationId;
    } catch (error) {
        handleError(error, 'Failed to create bulk tasks');
        throw error;
    }
}

/**
 * Create multiple tasks from a template
 * @param templateId - Template ID
 * @param assignees - Array of user IDs to assign tasks to
 * @param createdBy - User creating the tasks
 * @param createdByName - Name of user
 * @param operationName - Name for this operation
 * @returns BulkTaskOperation ID
 */
export async function createBulkTasksFromTemplate(
    templateId: string,
    assignees: string[],
    createdBy: string,
    createdByName: string,
    operationName: string
): Promise<string> {
    const operationData: Omit<BulkTaskOperation, 'id'> = {
        name: operationName,
        createdBy,
        createdByName,
        taskIds: [],
        totalTasks: assignees.length,
        successfulTasks: 0,
        failedTasks: 0,
        status: 'processing',
        errors: [],
        source: 'template',
        createdAt: new Date()
    };

    try {
        const operationRef = await addDoc(collection(db, 'bulkTaskOperations'), operationData);
        const operationId = operationRef.id;

        const taskIds: string[] = [];
        const errors: string[] = [];

        // Import template service
        const { createTaskFromTemplate } = await import('./templateService');

        for (const assigneeId of assignees) {
            try {
                const taskId = await createTaskFromTemplate(templateId, createdBy, {
                    assignedTo: [assigneeId]
                });
                taskIds.push(taskId);
            } catch (error: any) {
                errors.push(`Failed to create task for ${assigneeId}: ${error.message}`);
            }
        }

        // Update operation
        await updateDoc(doc(db, 'bulkTaskOperations', operationId), {
            taskIds,
            successfulTasks: taskIds.length,
            failedTasks: errors.length,
            status: errors.length === assignees.length ? 'failed' : 'completed',
            errors: errors.length > 0 ? errors : undefined,
            completedAt: new Date()
        });

        return operationId;
    } catch (error) {
        handleError(error, 'Failed to create bulk tasks from template');
        throw error;
    }
}

/**
 * Get bulk operation status
 * @param operationId - Operation ID
 * @returns BulkTaskOperation object
 */
export async function getBulkOperationStatus(operationId: string): Promise<BulkTaskOperation | null> {
    try {
        const { getDocs, query, where } = await import('firebase/firestore');
        const snapshot = await getDocs(
            query(collection(db, 'bulkTaskOperations'), where('__name__', '==', operationId))
        );

        if (snapshot.empty) return null;

        const data = snapshot.docs[0].data();
        return {
            id: snapshot.docs[0].id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            completedAt: data.completedAt?.toDate()
        } as BulkTaskOperation;
    } catch (error) {
        handleError(error, 'Failed to get bulk operation status');
        return null;
    }
}
