// src/lib/taskBusinessRules.ts
// BUSINESS RULES ENGINE - Task State Validation and Transition Logic
// This service enforces all business rules for task operations

import { Task, TaskStatus } from '@/types';

/**
 * Represents the result of a business rule validation
 */
export interface ValidationResult {
    valid: boolean;
    error?: string;
    warnings?: string[];
}

/**
 * Extension request data structure
 */
export interface TaskExtension {
    taskId: string;
    requestedBy: string;
    requestedByName: string;
    reason: string;
    currentDueDate: Date;
    requestedDueDate: Date;
    approvedBy?: string;
    approvedByName?: string;
    approvedAt?: Date;
    status: 'pending' | 'approved' | 'rejected';
    createdAt: Date;
}

/**
 * Task Business Rules Service
 * All state transitions and validations must go through this service
 */
export class TaskBusinessRules {

    /**
     * Validate if a task status transition is allowed
     */
    static validateStatusTransition(
        currentStatus: TaskStatus,
        newStatus: TaskStatus,
        _task: Task
    ): ValidationResult {
        // Define valid state transitions
        const validTransitions: Record<TaskStatus, TaskStatus[]> = {
            'not_started': ['assigned', 'cancelled'],
            'assigned': ['in_progress', 'cancelled', 'on_hold'],
            'in_progress': ['completed', 'blocked', 'on_hold', 'pending_review', 'overdue'],
            'blocked': ['in_progress', 'cancelled'],
            'completed': ['revision_requested'], // Can only go to revision if rejected
            'cancelled': [], // Terminal state
            'on_hold': ['in_progress', 'assigned', 'cancelled'],
            'pending_review': ['completed', 'revision_requested'],
            'revision_requested': ['in_progress'],
            'overdue': ['in_progress', 'cancelled'] // Must provide extension/reason
        };

        const allowedNextStates = validTransitions[currentStatus] || [];

        if (!allowedNextStates.includes(newStatus)) {
            return {
                valid: false,
                error: `Invalid status transition from '${currentStatus}' to '${newStatus}'`
            };
        }

        return { valid: true };
    }

    /**
     * Validate if a task can be marked as completed
     */
    static validateCompletion(task: Task): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Must have at least one assignee
        if (!task.assignedTo || task.assignedTo.length === 0) {
            errors.push('Cannot complete task without assignees');
        }

        // Cannot complete if status is cancelled
        if (task.status === 'cancelled') {
            errors.push('Cannot complete a cancelled task');
        }

        // Warning if completed while overdue (should have extension)
        if (task.status === 'overdue' && !task.finalTargetDate) {
            warnings.push('Completing overdue task without approved extension');
        }

        return {
            valid: errors.length === 0,
            error: errors.join('; '),
            warnings
        };
    }

    /**
     * Validate if a task can be marked as overdue
     */
    static validateOverdueStatus(task: Task): ValidationResult {
        // Cannot be overdue without a due date
        if (!task.dueDate) {
            return {
                valid: false,
                error: 'Cannot mark task as overdue without a due date'
            };
        }

        // Cannot mark completed tasks as overdue
        if (task.status === 'completed' || task.status === 'cancelled') {
            return {
                valid: false,
                error: 'Cannot mark completed or cancelled tasks as overdue'
            };
        }

        // Check if actually overdue
        const now = new Date();
        const dueDate = new Date(task.dueDate);

        if (now <= dueDate) {
            return {
                valid: false,
                error: 'Cannot mark task as overdue before due date'
            };
        }

        return { valid: true };
    }

    /**
     * Check if a task is actually overdue (time-based check)
     * Uses UTC for timezone safety
     */
    static isTaskOverdue(task: Task): boolean {
        if (!task.dueDate) return false;
        if (task.status === 'completed' || task.status === 'cancelled') return false;

        // Use finalTargetDate if extension was approved
        const effectiveDueDate = task.finalTargetDate || task.dueDate;

        const now = new Date();
        const dueDate = new Date(effectiveDueDate);

        // Normalize to UTC midnight for fair comparison
        const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const dueUTC = Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate());

        return nowUTC > dueUTC;
    }

    /**
     * Validate if a task can resume from overdue status
     * Requires either an extension or a valid reason
     */
    static validateOverdueResumption(
        task: Task,
        extension?: TaskExtension,
        reason?: string
    ): ValidationResult {
        if (task.status !== 'overdue') {
            return { valid: true }; // Not overdue, no validation needed
        }

        // Must have either an approved extension OR a reason
        const hasApprovedExtension = extension && extension.status === 'approved';
        const hasReason = reason && reason.trim().length > 10;

        if (!hasApprovedExtension && !hasReason) {
            return {
                valid: false,
                error: 'Cannot resume overdue task without an approved extension or valid reason (min 10 characters)'
            };
        }

        return { valid: true };
    }

    /**
     * Validate task reassignment
     */
    static validateReassignment(
        task: Task,
        newAssignees: string[],
        _reassignedBy: string
    ): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Must have at least one new assignee
        if (!newAssignees || newAssignees.length === 0) {
            errors.push('Must assign task to at least one user');
        }

        // Cannot reassign completed or cancelled tasks
        if (task.status === 'completed') {
            errors.push('Cannot reassign completed tasks. Create a new task instead.');
        }

        if (task.status === 'cancelled') {
            errors.push('Cannot reassign cancelled tasks');
        }

        // Warning if task is in progress with partial work
        if (task.status === 'in_progress' || task.status === 'pending_review') {
            warnings.push('Reassigning task with in-progress work. Ensure proper handoff.');
        }

        // Warning if assigning to same users
        const isSameAssignees =
            newAssignees.length === task.assignedTo?.length &&
            newAssignees.every(a => task.assignedTo?.includes(a));

        if (isSameAssignees) {
            warnings.push('Assignees are the same as current assignees');
        }

        return {
            valid: errors.length === 0,
            error: errors.join('; '),
            warnings
        };
    }

    /**
     * Validate task deletion
     */
    static validateDeletion(task: Task): ValidationResult {
        const warnings: string[] = [];

        // Warn if deleting completed tasks (may affect historical data)
        if (task.status === 'completed') {
            warnings.push('Deleting completed task will affect historical performance metrics');
        }

        // Warn if task is linked to KRA/OKR
        if (task.kraId) {
            warnings.push(`Task is linked to KRA ${task.kraId}. This may affect KRA progress.`);
        }

        // Warn if task has subtasks or checklist items
        // (This would require checking subcollections, handled at service layer)

        return {
            valid: true, // Deletion is always allowed but with warnings
            warnings
        };
    }

    /**
     * Validate backdating of completion
     * Prevents score manipulation
     */
    static validateBackdating(
        task: Task,
        proposedCompletionDate: Date
    ): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        const now = new Date();
        const proposedDate = new Date(proposedCompletionDate);

        // Cannot backdate to before task creation
        if (task.createdAt && proposedDate < new Date(task.createdAt)) {
            errors.push('Cannot complete task before it was created');
        }

        // Cannot backdate to future
        if (proposedDate > now) {
            errors.push('Cannot set completion date in the future');
        }

        // Warn if backdating by more than 7 days
        const daysDiff = Math.floor((now.getTime() - proposedDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 7) {
            warnings.push(`Backdating completion by ${daysDiff} days. This may affect performance reports.`);
        }

        // Warn if backdating to before due date when task is overdue
        if (task.dueDate && proposedDate < new Date(task.dueDate) && task.status === 'overdue') {
            warnings.push('Backdating to before due date will show task as completed on time');
        }

        return {
            valid: errors.length === 0,
            error: errors.join('; '),
            warnings
        };
    }

    /**
     * Validate extension request
     */
    static validateExtensionRequest(
        task: Task,
        requestedDueDate: Date,
        reason: string
    ): ValidationResult {
        const errors: string[] = [];

        // Must have a current due date
        if (!task.dueDate) {
            errors.push('Cannot request extension for task without due date');
        }

        // New date must be after current due date
        const currentDue = task.finalTargetDate || task.dueDate;
        if (currentDue && requestedDueDate <= new Date(currentDue)) {
            errors.push('Requested due date must be after current due date');
        }

        // Reason must be meaningful
        if (!reason || reason.trim().length < 20) {
            errors.push('Extension reason must be at least 20 characters');
        }

        // Cannot extend completed or cancelled tasks
        if (task.status === 'completed' || task.status === 'cancelled') {
            errors.push('Cannot extend completed or cancelled tasks');
        }

        return {
            valid: errors.length === 0,
            error: errors.join('; ')
        };
    }

    /**
     * Validate priority change
     * High priority tasks may require justification
     */
    static validatePriorityChange(
        task: Task,
        newPriority: 'low' | 'medium' | 'high' | 'critical',
        reason?: string
    ): ValidationResult {
        const warnings: string[] = [];

        // Warn if escalating to critical without reason
        if (newPriority === 'critical' && task.priority !== 'critical') {
            if (!reason || reason.trim().length < 10) {
                warnings.push('Escalating to critical priority should include a reason');
            }
        }

        // Warn if downgrading overdue task
        if (task.status === 'overdue' &&
            ['high', 'critical'].includes(task.priority || '') &&
            ['low', 'medium'].includes(newPriority)) {
            warnings.push('Downgrading priority of overdue task may delay resolution');
        }

        return {
            valid: true,
            warnings
        };
    }

    /**
     * Generate required audit trail data for task operations
     */
    static generateAuditData(
        operation: string,
        task: Task,
        userId: string,
        changes: Record<string, any>
    ): Record<string, any> {
        return {
            entityType: 'task',
            entityId: task.id,
            operation,
            userId,
            timestamp: new Date(),
            changes,
            previousState: {
                status: task.status,
                assignedTo: task.assignedTo,
                priority: task.priority,
                dueDate: task.dueDate
            }
        };
    }
}
