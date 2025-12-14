// Type definitions for JewelMatrix (KRA Management System)

export type UserRole = 'admin' | 'manager' | 'employee'

export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type KRAType = 'daily' | 'weekly' | 'monthly'

export type KRAStatus = 'not_started' | 'in_progress' | 'completed'

export type TaskStatus = 'assigned' | 'in_progress' | 'blocked' | 'completed'

export type NotificationType =
    | 'task_assigned'
    | 'task_updated'
    | 'comment_added'
    | 'due_date_reminder'
    | 'overdue'
    | 'report_ready'
    | 'reassignment'

// Header Configuration Types
export interface HeaderNavigationItem {
    name: string
    href: string
    roles: UserRole[]
}

export interface HeaderConfig {
    logo: string
    title: string
    navigation: HeaderNavigationItem[]
    theme: 'default' | 'indian' | 'corporate'
}

// RBAC Types
export interface Role {
    id: string
    name: string
    description: string
    isSystem?: boolean // System roles cannot be deleted
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

export interface Permission {
    id: string
    name: string
    description: string
    module: string // e.g., 'dashboard', 'users', 'tasks'
    action: string // e.g., 'view', 'create', 'edit', 'delete'
    isSystem?: boolean // System permissions cannot be deleted
    createdAt: Date
    updatedAt: Date
}

export interface RolePermission {
    id: string
    roleId: string
    permissionId: string
    createdAt: Date
}

export interface UserRoleAssignment {
    id: string
    userId: string
    roleId: string
    assignedBy: string
    assignedAt: Date
}

// Legacy Permission Types (for backward compatibility)
export type LegacyPermission =
    | 'view_dashboard'
    | 'view_tasks'
    | 'create_tasks'
    | 'update_tasks'
    | 'delete_tasks'
    | 'assign_tasks'
    | 'view_kras'
    | 'create_kras'
    | 'update_kras'
    | 'delete_kras'
    | 'assign_kras'
    | 'view_teams'
    | 'manage_teams'
    | 'view_reports'
    | 'generate_reports'
    | 'view_analytics'
    | 'manage_analytics'
    | 'view_notifications'
    | 'manage_notifications'
    | 'manage_users'
    | 'manage_roles'
    | 'manage_scoring'
    | 'system_admin'

// Role Permissions Configuration (Legacy)
export interface RolePermissions {
    role: UserRole
    permissions: LegacyPermission[]
    description: string
}

// User Interface
export interface User {
    id: string
    fullName: string
    email: string
    roleIds: string[] // RBAC role IDs
    avatar?: string
    teamId?: string
    isActive?: boolean // Whether user account is active
    lastLogin?: Date // Last login timestamp
    createdAt: Date
    updatedAt: Date
}

// Team Interface
export interface Team {
    id: string
    name: string
    description?: string
    managerId: string
    memberIds: string[]
    parentId?: string // For hierarchical team structure
    isActive?: boolean // Whether team is active
    createdAt: Date
    updatedAt: Date
}

// KRA Interface
export interface KRA {
    id: string
    title: string
    description: string
    target?: string // e.g., "Increase sales by 20%"
    type: KRAType
    priority: Priority
    assignedTo: string[] // User IDs
    teamIds?: string[] // Team IDs for team-wide assignments
    createdBy: string
    status: KRAStatus
    startDate: Date
    endDate: Date
    attachments?: string[]
    createdAt: Date
    updatedAt: Date
}

// Task Interface
export interface Task {
    id: string
    title: string
    description: string
    kraId?: string // Optional link to KRA
    priority: Priority
    status: TaskStatus
    assignedTo: string[]
    assignedBy: string
    dueDate: Date
    attachments?: string[]
    checklist: ChecklistItem[]
    comments: Comment[]
    activityLog: ActivityLog[]
    createdAt: Date
    updatedAt: Date
}

// Checklist Item Interface
export interface ChecklistItem {
    id: string
    text: string
    completed: boolean
    completedBy?: string
    completedAt?: Date
}

// Comment Interface
export interface Comment {
    id: string
    userId: string
    userName: string
    userAvatar?: string
    text: string
    createdAt: Date
}

// Activity Log Interface
export interface ActivityLog {
    id: string
    userId: string
    userName: string
    action: string
    details: string
    timestamp: Date
}

// Weekly Report Interface
export interface WeeklyReport {
    id: string
    weekStartDate: Date
    weekEndDate: Date
    userId: string
    userName: string
    tasksAssigned: number
    tasksCompleted: number
    onTimeCompletion: number
    onTimePercentage: number
    krasCovered: string[]
    taskDelays: number
    score: number
    breakdown: ScoreBreakdown
    generatedAt: Date
}

// Score Breakdown Interface
export interface ScoreBreakdown {
    completionScore: number
    timelinessScore: number
    qualityScore: number
    kraAlignmentScore: number
    totalScore: number
}

// Notification Interface
export interface Notification {
    id: string
    userId: string
    type: NotificationType
    title: string
    message: string
    link?: string
    read: boolean
    createdAt: Date
}

// Notification Rule Interface (Admin Management)
export interface NotificationRule {
    id: string
    name: string
    description: string
    type: NotificationType
    conditions: {
        trigger: string
        threshold?: number
        filters?: any
    }
    template: {
        title: string
        message: string
        priority: Priority
    }
    recipients: {
        roles: string[]
        teams?: string[]
        users?: string[]
    }
    schedule: {
        enabled: boolean
        frequency?: 'immediate' | 'daily' | 'weekly'
        time?: string
    }
    isActive: boolean
    createdBy: string
    createdAt: Date
    updatedAt: Date
}

// Dashboard Stats Interface
export interface DashboardStats {
    totalTasks: number
    completedTasks: number
    pendingTasks: number
    overdueTasks: number
    activeKRAs: number
    completionRate: number
    weeklyScore: number
}

// Task Stats Interface
export interface TaskStats {
    total: number
    completed: number
    inProgress: number
    pending: number
    overdue: number
}

// Filter Options
export interface FilterOptions {
    priority?: Priority[]
    status?: (KRAStatus | TaskStatus)[]
    assignedTo?: string[]
    dateRange?: {
        start: Date
        end: Date
    }
    search?: string
}

// Task View Types
export type TaskView = 'list' | 'board' | 'calendar'

// Scoring Configuration (Admin adjustable)
export interface ScoringConfig {
    id: string
    completionWeight: number // 0-100
    timelinessWeight: number // 0-100
    qualityWeight: number // 0-100
    kraAlignmentWeight: number // 0-100
    updatedAt: Date
    updatedBy: string
}

// Team Weekly Report
export interface TeamWeeklyReport {
    id: string
    teamId: string
    teamName: string
    weekStartDate: Date
    weekEndDate: Date
    memberReports: WeeklyReport[]
    teamStats: {
        totalTasksAssigned: number
        totalTasksCompleted: number
        averageScore: number
        onTimePercentage: number
    }
    generatedAt: Date
}
