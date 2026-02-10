// src/lib/businessRules.ts
// BUSINESS RULES - Separate from RBAC permissions
// These define "who can do what" based on business logic, not system permissions

import { User } from '@/types';

export interface ResourceAccessContext {
    userId: string;
    user: User;
    resourceOwnerId?: string;
    resourceAssigneeIds?: string[];
    resourceTeamId?: string;
    userTeamId?: string;
}

/**
 * BUSINESS RULES - These are NOT RBAC permissions
 * RBAC controls system features (admin panel, user management)
 * Business rules control data access within the business domain
 */

export class BusinessRulesService {

    /**
     * Can user view this task?
     * Business rule: task owner, assignees, team members can view
     */
    static canViewTask(context: ResourceAccessContext): boolean {
        const { userId, resourceOwnerId, resourceAssigneeIds, resourceTeamId, userTeamId } = context;

        return Boolean(
            resourceOwnerId === userId || // Owner
            resourceAssigneeIds?.includes(userId) || // Assignee
            (resourceTeamId && resourceTeamId === userTeamId) // Team member
        );
    }

    /**
     * Can user edit this task?
     * Business rule: task owner, assignees can edit (limited fields)
     */
    static canEditTask(context: ResourceAccessContext): boolean {
        const { userId, resourceOwnerId, resourceAssigneeIds } = context;

        return Boolean(
            resourceOwnerId === userId || // Owner
            resourceAssigneeIds?.includes(userId) // Assignee
        );
    }

    /**
     * Can user delete this task?
     * Business rule: only task owner can delete
     */
    static canDeleteTask(context: ResourceAccessContext): boolean {
        return context.resourceOwnerId === context.userId;
    }

    /**
     * Can user assign tasks?
     * Business rule: managers can assign to team members
     */
    static canAssignTask(assigner: User, assignee: User): boolean {
        // Manager can assign to employees in their team
        return assigner.roleId === 'manager' &&
            assignee.teamId === assigner.teamId;
    }

    /**
     * Can user view team reports?
     * Business rule: team members and managers can view team reports
     */
    static canViewTeamReport(context: ResourceAccessContext): boolean {
        const { user, resourceTeamId } = context;

        return Boolean(
            user.teamId === resourceTeamId || // Team member
            user.roleId === 'manager' // Manager
        );
    }
}