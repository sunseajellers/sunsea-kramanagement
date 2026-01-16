/**
 * Activity Logging Utility
 * Simplifies logging activities across the application
 */

export interface ActivityLogData {
    action: string; // e.g., 'task_created', 'status_updated', 'kra_completed'
    module: string; // e.g., 'tasks', 'kras', 'users', 'teams', 'settings'
    resourceId: string; // ID of the affected resource
    resourceName: string; // Name/title of the resource
    changes?: Record<string, { old: any; new: any }>; // Before/after values
    details?: string; // Additional description
}

/**
 * Log an activity to the activity log
 * @param data Activity log data
 * @returns Promise with log ID
 */
export async function logActivity(data: ActivityLogData): Promise<string | null> {
    try {
        const response = await fetch('/api/activity-log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            console.error('Failed to log activity:', response.statusText);
            return null;
        }

        const result = await response.json();
        return result.id;
    } catch (error) {
        console.error('Error logging activity:', error);
        return null;
    }
}

/**
 * Log task creation
 */
export async function logTaskCreated(
    taskId: string,
    taskTitle: string,
    assignedTo: string[],
    details?: string
) {
    return logActivity({
        action: 'task_created',
        module: 'tasks',
        resourceId: taskId,
        resourceName: taskTitle,
        changes: {
            assignedTo: { old: [], new: assignedTo }
        },
        details: details || `Task created and assigned to ${assignedTo.length} user(s)`
    });
}

/**
 * Log task status update
 */
export async function logTaskStatusUpdate(
    taskId: string,
    taskTitle: string,
    oldStatus: string,
    newStatus: string,
    details?: string
) {
    return logActivity({
        action: 'task_status_updated',
        module: 'tasks',
        resourceId: taskId,
        resourceName: taskTitle,
        changes: {
            status: { old: oldStatus, new: newStatus }
        },
        details: details || `Status changed from "${oldStatus}" to "${newStatus}"`
    });
}

/**
 * Log task completion
 */
export async function logTaskCompleted(taskId: string, taskTitle: string) {
    return logActivity({
        action: 'task_completed',
        module: 'tasks',
        resourceId: taskId,
        resourceName: taskTitle,
        details: 'Task marked as completed'
    });
}

/**
 * Log task update/progress note
 */
export async function logTaskUpdate(
    taskId: string,
    taskTitle: string,
    remarks: string,
    progressPercentage?: number
) {
    return logActivity({
        action: 'task_updated',
        module: 'tasks',
        resourceId: taskId,
        resourceName: taskTitle,
        changes: progressPercentage ? {
            progress: { old: null, new: progressPercentage }
        } : undefined,
        details: remarks
    });
}

/**
 * Log task revision requested
 */
export async function logTaskRevisionRequested(
    taskId: string,
    taskTitle: string,
    reason: string
) {
    return logActivity({
        action: 'task_revision_requested',
        module: 'tasks',
        resourceId: taskId,
        resourceName: taskTitle,
        details: `Revision requested: ${reason}`
    });
}

/**
 * Log task deletion
 */
export async function logTaskDeleted(taskId: string, taskTitle: string) {
    return logActivity({
        action: 'task_deleted',
        module: 'tasks',
        resourceId: taskId,
        resourceName: taskTitle,
        details: 'Task deleted from system'
    });
}

/**
 * Log KRA creation
 */
export async function logKRACreated(kraId: string, kraTitle: string, assignedTo: string[]) {
    return logActivity({
        action: 'kra_created',
        module: 'kras',
        resourceId: kraId,
        resourceName: kraTitle,
        changes: {
            assignedTo: { old: [], new: assignedTo }
        },
        details: `KRA created and assigned to ${assignedTo.length} user(s)`
    });
}

/**
 * Log KRA status update
 */
export async function logKRAStatusUpdate(
    kraId: string,
    kraTitle: string,
    oldStatus: string,
    newStatus: string
) {
    return logActivity({
        action: 'kra_status_updated',
        module: 'kras',
        resourceId: kraId,
        resourceName: kraTitle,
        changes: {
            status: { old: oldStatus, new: newStatus }
        },
        details: `Status changed from "${oldStatus}" to "${newStatus}"`
    });
}

/**
 * Log KRA progress update
 */
export async function logKRAProgressUpdate(
    kraId: string,
    kraTitle: string,
    oldProgress: number,
    newProgress: number
) {
    return logActivity({
        action: 'kra_progress_updated',
        module: 'kras',
        resourceId: kraId,
        resourceName: kraTitle,
        changes: {
            progress: { old: oldProgress, new: newProgress }
        },
        details: `Progress updated from ${oldProgress}% to ${newProgress}%`
    });
}

/**
 * Log user login
 */
export async function logUserLogin(userId: string, userEmail: string) {
    return logActivity({
        action: 'user_login',
        module: 'users',
        resourceId: userId,
        resourceName: userEmail,
        details: 'User logged in'
    });
}

/**
 * Log user logout
 */
export async function logUserLogout(userId: string, userEmail: string) {
    return logActivity({
        action: 'user_logout',
        module: 'users',
        resourceId: userId,
        resourceName: userEmail,
        details: 'User logged out'
    });
}

/**
 * Log user role change
 */
export async function logUserRoleChanged(
    userId: string,
    userName: string,
    oldRole: string,
    newRole: string
) {
    return logActivity({
        action: 'user_role_changed',
        module: 'users',
        resourceId: userId,
        resourceName: userName,
        changes: {
            role: { old: oldRole, new: newRole }
        },
        details: `Role changed from "${oldRole}" to "${newRole}"`
    });
}

/**
 * Log team member added
 */
export async function logTeamMemberAdded(
    teamId: string,
    teamName: string,
    _memberId: string,
    memberName: string
) {
    return logActivity({
        action: 'team_member_added',
        module: 'teams',
        resourceId: teamId,
        resourceName: teamName,
        details: `${memberName} added to team`
    });
}

/**
 * Log team member removed
 */
export async function logTeamMemberRemoved(
    teamId: string,
    teamName: string,
    _memberId: string,
    memberName: string
) {
    return logActivity({
        action: 'team_member_removed',
        module: 'teams',
        resourceId: teamId,
        resourceName: teamName,
        details: `${memberName} removed from team`
    });
}

/**
 * Log bulk operation
 */
export async function logBulkOperation(
    action: string,
    module: string,
    count: number,
    details: string
) {
    return logActivity({
        action: `bulk_${action}`,
        module,
        resourceId: 'bulk',
        resourceName: `Bulk ${action}`,
        details: `${details} (${count} items affected)`
    });
}

/**
 * Log custom activity
 */
export async function logCustomActivity(
    action: string,
    module: string,
    resourceId: string,
    resourceName: string,
    details?: string,
    changes?: Record<string, { old: any; new: any }>
) {
    return logActivity({
        action,
        module,
        resourceId,
        resourceName,
        details,
        changes
    });
}
