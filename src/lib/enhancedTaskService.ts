// src/lib/enhancedTaskService.ts
// ENHANCED TASK SERVICE - Implements all business rules and safety checks
// This service wraps the basic taskService with enterprise-grade logic

import { Task, TaskStatus, Priority } from '@/types';
import { TaskBusinessRules, TaskExtension } from './taskBusinessRules';
import { adminDb } from './firebase-admin';


/**
 * Enhanced Task Service with full business rule enforcement
 */
export class EnhancedTaskService {

    /**
     * Update task status with full validation
     */
    static async updateTaskStatus(
        taskId: string,
        newStatus: TaskStatus,
        userId: string,
        options: {
            reason?: string;
            extension?: TaskExtension;
            completedAt?: Date;
        } = {}
    ): Promise<{ success: boolean; error?: string; warnings?: string[] }> {
        try {
            // Fetch task
            const taskDoc = await adminDb.collection('tasks').doc(taskId).get();
            if (!taskDoc.exists) {
                return { success: false, error: 'Task not found' };
            }

            const task = { id: taskDoc.id, ...taskDoc.data() } as Task;
            const currentStatus = task.status;

            // Validate status transition
            const transitionValidation = TaskBusinessRules.validateStatusTransition(
                currentStatus,
                newStatus,
                task
            );

            if (!transitionValidation.valid) {
                return { success: false, error: transitionValidation.error };
            }

            // Special validations for specific statuses
            if (newStatus === 'completed') {
                const completionValidation = TaskBusinessRules.validateCompletion(task);
                if (!completionValidation.valid) {
                    return { success: false, error: completionValidation.error };
                }

                // Validate backdating if completedAt is provided
                if (options.completedAt) {
                    const backdateValidation = TaskBusinessRules.validateBackdating(
                        task,
                        options.completedAt
                    );
                    if (!backdateValidation.valid) {
                        return { success: false, error: backdateValidation.error };
                    }
                }
            }

            // Validate overdue resumption
            if (currentStatus === 'overdue' && newStatus === 'in_progress') {
                const resumptionValidation = TaskBusinessRules.validateOverdueResumption(
                    task,
                    options.extension,
                    options.reason
                );
                if (!resumptionValidation.valid) {
                    return { success: false, error: resumptionValidation.error };
                }
            }

            // Prepare update data
            const updateData: any = {
                status: newStatus,
                updatedAt: new Date()
            };

            if (newStatus === 'completed') {
                updateData.completedAt = options.completedAt || new Date();
                updateData.completedBy = userId;
            }

            if (newStatus === 'in_progress' && currentStatus === 'overdue') {
                // Log overdue resumption
                updateData.overdueResumptionReason = options.reason;
                updateData.overdueResumedAt = new Date();
                updateData.overdueResumedBy = userId;
            }

            // Use Firestore batch for transactional update
            const batch = adminDb.batch();
            const taskRef = adminDb.collection('tasks').doc(taskId);

            batch.update(taskRef, updateData);

            // Add audit log
            const auditRef = adminDb.collection('auditLogs').doc();
            const auditData = TaskBusinessRules.generateAuditData(
                'status_change',
                task,
                userId,
                { from: currentStatus, to: newStatus, ...options }
            );
            batch.set(auditRef, auditData);

            // Add activity log to task subcollection
            const activityRef = adminDb.collection('tasks').doc(taskId).collection('activityLog').doc();
            batch.set(activityRef, {
                userId,
                action: 'status_changed',
                details: `Status changed from ${currentStatus} to ${newStatus}`,
                metadata: options,
                timestamp: new Date()
            });

            await batch.commit();

            return {
                success: true,
                warnings: transitionValidation.warnings
            };
        } catch (error) {
            console.error('Error updating task status:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update task status'
            };
        }
    }

    /**
     * Reassign task with full validation and scoring recalculation
     */
    static async reassignTask(
        taskId: string,
        newAssignees: string[],
        reassignedBy: string,
        reason?: string
    ): Promise<{ success: boolean; error?: string; warnings?: string[] }> {
        try {
            // Fetch task
            const taskDoc = await adminDb.collection('tasks').doc(taskId).get();
            if (!taskDoc.exists) {
                return { success: false, error: 'Task not found' };
            }

            const task = { id: taskDoc.id, ...taskDoc.data() } as Task;

            // Validate reassignment
            const validation = TaskBusinessRules.validateReassignment(
                task,
                newAssignees,
                reassignedBy
            );

            if (!validation.valid) {
                return { success: false, error: validation.error };
            }

            // Verify new assignees exist
            const newAssigneeChecks = await Promise.all(
                newAssignees.map(id => adminDb.collection('users').doc(id).get())
            );

            const invalidAssignees = newAssigneeChecks
                .map((doc, idx) => ({ doc, id: newAssignees[idx] }))
                .filter(({ doc }) => !doc.exists)
                .map(({ id }) => id);

            if (invalidAssignees.length > 0) {
                return {
                    success: false,
                    error: `Invalid assignee IDs: ${invalidAssignees.join(', ')}`
                };
            }

            const oldAssignees = task.assignedTo || [];

            // Use Firestore batch for transactional update
            const batch = adminDb.batch();
            const taskRef = adminDb.collection('tasks').doc(taskId);

            // Update task
            batch.update(taskRef, {
                assignedTo: newAssignees,
                reassignedAt: new Date(),
                reassignedBy,
                reassignmentReason: reason,
                updatedAt: new Date()
            });

            // Add audit log
            const auditRef = adminDb.collection('auditLogs').doc();
            batch.set(auditRef, TaskBusinessRules.generateAuditData(
                'reassignment',
                task,
                reassignedBy,
                { oldAssignees, newAssignees, reason }
            ));

            // Add activity log
            const activityRef = adminDb.collection('tasks').doc(taskId).collection('activityLog').doc();
            batch.set(activityRef, {
                userId: reassignedBy,
                action: 'reassigned',
                details: `Reassigned from ${oldAssignees.join(', ')} to ${newAssignees.join(', ')}`,
                metadata: { reason },
                timestamp: new Date()
            });

            // Mark for score recalculation (we'll implement this trigger later)
            const scoreRecalcRef = adminDb.collection('scoreRecalcQueue').doc();
            batch.set(scoreRecalcRef, {
                taskId,
                affectedUsers: [...oldAssignees, ...newAssignees],
                reason: 'task_reassignment',
                createdAt: new Date()
            });

            await batch.commit();

            return {
                success: true,
                warnings: validation.warnings
            };
        } catch (error) {
            console.error('Error reassigning task:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to reassign task'
            };
        }
    }

    /**
     * Delete task with safety checks
     */
    static async deleteTask(
        taskId: string,
        deletedBy: string,
        force: boolean = false
    ): Promise<{ success: boolean; error?: string; warnings?: string[] }> {
        try {
            // Fetch task
            const taskDoc = await adminDb.collection('tasks').doc(taskId).get();
            if (!taskDoc.exists) {
                return { success: false, error: 'Task not found' };
            }

            const task = { id: taskDoc.id, ...taskDoc.data() } as Task;

            // Validate deletion
            const validation = TaskBusinessRules.validateDeletion(task);

            // If not forced and there are warnings, return them for confirmation
            if (!force && validation.warnings && validation.warnings.length > 0) {
                return {
                    success: false,
                    error: 'Deletion requires force=true due to warnings',
                    warnings: validation.warnings
                };
            }

            // Use Firestore batch for safe deletion
            const batch = adminDb.batch();

            // Archive task before deletion
            const archiveRef = adminDb.collection('deletedTasks').doc(taskId);
            batch.set(archiveRef, {
                ...task,
                deletedBy,
                deletedAt: new Date(),
                deletionReason: 'user_requested'
            });

            // Add audit log
            const auditRef = adminDb.collection('auditLogs').doc();
            batch.set(auditRef, TaskBusinessRules.generateAuditData(
                'deletion',
                task,
                deletedBy,
                { archived: true }
            ));

            // Mark for score recalculation if task was completed
            if (task.status === 'completed' && task.assignedTo) {
                const scoreRecalcRef = adminDb.collection('scoreRecalcQueue').doc();
                batch.set(scoreRecalcRef, {
                    taskId,
                    affectedUsers: task.assignedTo,
                    reason: 'task_deletion',
                    createdAt: new Date()
                });
            }

            // Delete task (soft delete - mark as deleted instead of actual deletion)
            const taskRef = adminDb.collection('tasks').doc(taskId);
            batch.update(taskRef, {
                deleted: true,
                deletedBy,
                deletedAt: new Date()
            });

            await batch.commit();

            return {
                success: true,
                warnings: validation.warnings
            };
        } catch (error) {
            console.error('Error deleting task:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to delete task'
            };
        }
    }

    /**
     * Request task extension
     */
    static async requestExtension(
        taskId: string,
        requestedBy: string,
        requestedByName: string,
        requestedDueDate: Date,
        reason: string
    ): Promise<{ success: boolean; error?: string; extensionId?: string }> {
        try {
            // Fetch task
            const taskDoc = await adminDb.collection('tasks').doc(taskId).get();
            if (!taskDoc.exists) {
                return { success: false, error: 'Task not found' };
            }

            const task = { id: taskDoc.id, ...taskDoc.data() } as Task;

            // Validate extension request
            const validation = TaskBusinessRules.validateExtensionRequest(
                task,
                requestedDueDate,
                reason
            );

            if (!validation.valid) {
                return { success: false, error: validation.error };
            }

            // Create extension request
            const extension: TaskExtension = {
                taskId,
                requestedBy,
                requestedByName,
                reason,
                currentDueDate: new Date(task.dueDate!),
                requestedDueDate,
                status: 'pending',
                createdAt: new Date()
            };

            const extensionRef = await adminDb.collection('taskExtensions').add(extension);

            // Add activity log
            await adminDb.collection('tasks').doc(taskId).collection('activityLog').add({
                userId: requestedBy,
                action: 'extension_requested',
                details: `Extension requested: ${new Date(task.dueDate!).toDateString()} → ${requestedDueDate.toDateString()}`,
                metadata: { extensionId: extensionRef.id, reason },
                timestamp: new Date()
            });

            return {
                success: true,
                extensionId: extensionRef.id
            };
        } catch (error) {
            console.error('Error requesting extension:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to request extension'
            };
        }
    }

    /**
     * Approve/reject extension request
     */
    static async processExtensionRequest(
        extensionId: string,
        approvedBy: string,
        approvedByName: string,
        approved: boolean,
        rejectionReason?: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const extensionDoc = await adminDb.collection('taskExtensions').doc(extensionId).get();
            if (!extensionDoc.exists) {
                return { success: false, error: 'Extension request not found' };
            }

            const extension = extensionDoc.data() as TaskExtension;

            const batch = adminDb.batch();
            const extensionRef = adminDb.collection('taskExtensions').doc(extensionId);

            // Update extension status
            batch.update(extensionRef, {
                status: approved ? 'approved' : 'rejected',
                approvedBy,
                approvedByName,
                approvedAt: new Date(),
                rejectionReason: rejectionReason || null
            });

            // If approved, update task
            if (approved) {
                const taskRef = adminDb.collection('tasks').doc(extension.taskId);
                batch.update(taskRef, {
                    finalTargetDate: extension.requestedDueDate,
                    extensionApprovedAt: new Date(),
                    extensionApprovedBy: approvedBy,
                    updatedAt: new Date()
                });

                // If task is overdue, change status back to in_progress
                const taskDoc = await adminDb.collection('tasks').doc(extension.taskId).get();
                if (taskDoc.exists && taskDoc.data()?.status === 'overdue') {
                    batch.update(taskRef, {
                        status: 'in_progress'
                    });
                }
            }

            // Add activity log
            const activityRef = adminDb.collection('tasks').doc(extension.taskId).collection('activityLog').doc();
            batch.set(activityRef, {
                userId: approvedBy,
                action: approved ? 'extension_approved' : 'extension_rejected',
                details: approved
                    ? `Extension approved: new due date ${extension.requestedDueDate.toDateString()}`
                    : `Extension rejected: ${rejectionReason || 'No reason provided'}`,
                timestamp: new Date()
            });

            await batch.commit();

            return { success: true };
        } catch (error) {
            console.error('Error processing extension:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process extension'
            };
        }
    }

    /**
     * Auto-mark tasks as overdue (for cron job)
     * Timezone-safe implementation
     */
    static async autoMarkOverdueTasks(): Promise<{
        success: boolean;
        markedCount: number;
        errors: string[];
    }> {
        try {
            const now = new Date();
            const errors: string[] = [];
            let markedCount = 0;

            // Fetch all non-completed, non-cancelled tasks
            const tasksSnapshot = await adminDb.collection('tasks')
                .where('status', 'not-in', ['completed', 'cancelled'])
                .where('deleted', '==', false)
                .get();

            const batch = adminDb.batch();
            let batchCount = 0;

            for (const taskDoc of tasksSnapshot.docs) {
                const task = { id: taskDoc.id, ...taskDoc.data() } as Task;

                // Check if task is overdue
                if (TaskBusinessRules.isTaskOverdue(task) && task.status !== 'overdue') {
                    try {
                        const taskRef = adminDb.collection('tasks').doc(task.id);

                        batch.update(taskRef, {
                            status: 'overdue',
                            markedOverdueAt: now,
                            updatedAt: now
                        });

                        // Add activity log
                        const activityRef = taskRef.collection('activityLog').doc();
                        batch.set(activityRef, {
                            userId: 'system',
                            action: 'auto_marked_overdue',
                            details: 'Task automatically marked as overdue by system',
                            timestamp: now
                        });

                        markedCount++;
                        batchCount += 2; // 2 operations per task

                        // Commit batch every 400 operations (Firestore limit is 500)
                        if (batchCount >= 400) {
                            await batch.commit();
                            batchCount = 0;
                        }
                    } catch (error) {
                        errors.push(`Task ${task.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
            }

            // Commit remaining operations
            if (batchCount > 0) {
                await batch.commit();
            }

            return {
                success: true,
                markedCount,
                errors
            };
        } catch (error) {
            console.error('Error in auto-mark overdue tasks:', error);
            return {
                success: false,
                markedCount: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }

    /**
     * Change task priority with validation
     */
    static async changePriority(
        taskId: string,
        newPriority: Priority,
        userId: string,
        reason?: string
    ): Promise<{ success: boolean; error?: string; warnings?: string[] }> {
        try {
            const taskDoc = await adminDb.collection('tasks').doc(taskId).get();
            if (!taskDoc.exists) {
                return { success: false, error: 'Task not found' };
            }

            const task = { id: taskDoc.id, ...taskDoc.data() } as Task;

            // Validate priority change
            const validation = TaskBusinessRules.validatePriorityChange(
                task,
                newPriority,
                reason
            );

            const batch = adminDb.batch();
            const taskRef = adminDb.collection('tasks').doc(taskId);

            // Update task
            batch.update(taskRef, {
                priority: newPriority,
                priorityChangedBy: userId,
                priorityChangedAt: new Date(),
                priorityChangeReason: reason || null,
                updatedAt: new Date()
            });

            // Mark for score recalculation (priority affects scoring)
            if (task.assignedTo && task.assignedTo.length > 0) {
                const scoreRecalcRef = adminDb.collection('scoreRecalcQueue').doc();
                batch.set(scoreRecalcRef, {
                    taskId,
                    affectedUsers: task.assignedTo,
                    reason: 'priority_change',
                    createdAt: new Date()
                });
            }

            // Add activity log
            const activityRef = taskRef.collection('activityLog').doc();
            batch.set(activityRef, {
                userId,
                action: 'priority_changed',
                details: `Priority changed from ${task.priority || 'none'} to ${newPriority}`,
                metadata: { reason },
                timestamp: new Date()
            });

            await batch.commit();

            return {
                success: true,
                warnings: validation.warnings
            };
        } catch (error) {
            console.error('Error changing priority:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to change priority'
            };
        }
    }
}
