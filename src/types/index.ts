// HYBRID RBAC MODEL - System roles + Custom roles
// System roles are predefined and can't be deleted
// Custom roles can be created by admins

// System roles - hardcoded, always exist
export type SystemRole = 'admin' | 'manager' | 'employee'

// All role names - can be system or custom (string for custom roles from DB)
export type RoleName = SystemRole | string

// Legacy alias for backwards compatibility
export type UserRole = SystemRole

// COMMON TYPES
export type Priority = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'not_started' | 'assigned' | 'in_progress' | 'blocked' | 'completed' | 'cancelled' | 'on_hold'
export type KRAStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'

// KRA Types
export type KRAType = 'daily' | 'weekly' | 'monthly'

// NOTIFICATION TYPES
export type NotificationType =
    | 'task_assigned'
    | 'task_updated'
    | 'task_overdue'
    | 'kra_assigned'
    | 'kra_updated'
    | 'kra_deadline'
    | 'team_update'
    | 'system_alert'
    | 'performance_alert'
    | 'report_ready';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

// RBAC Types - Supports both system and custom roles
export interface Role {
    id: string
    name: RoleName           // Can be SystemRole or custom string
    description: string
    isSystem: boolean        // true = can't delete, false = custom role
    isActive: boolean
    permissions: string[]    // Embedded permission IDs for simplified lookup
    createdAt: Date
    updatedAt: Date
}

export interface Permission {
    id: string
    name: string  // e.g., 'admin.access', 'tasks.create'
    description: string
    module: string // e.g., 'admin', 'tasks', 'kras'
    action: string // e.g., 'access', 'create', 'edit', 'delete'
    isSystem: boolean
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

// BUSINESS RULES (separate from RBAC)
// These are NOT RBAC permissions - they're business logic
export type BusinessRule =
    | 'owner_can_edit'
    | 'assignee_can_update'
    | 'team_member_can_view'
    | 'manager_can_assign'

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

// Task Interface - STANDARDIZED DATA MODEL
export interface Task {
    id: string
    title: string
    description: string
    kraId?: string // Optional link to KRA
    priority: Priority
    status: TaskStatus
    assignedTo: string[] // User IDs who can work on this task
    assignedBy: string   // User ID who assigned the task
    teamId?: string      // Team this task belongs to
    dueDate: Date
    attachments?: string[] // File URLs
    createdAt: Date
    updatedAt: Date
}

// Task-related data stored in SUBCOLLECTIONS (not embedded)
// /tasks/{taskId}/checklist/{itemId}
export interface ChecklistItem {
    id: string
    taskId: string
    text: string
    completed: boolean
    completedBy?: string
    completedAt?: Date
    createdAt: Date
    updatedAt: Date
}

// /tasks/{taskId}/comments/{commentId}
export interface Comment {
    id: string
    taskId: string
    userId: string
    userName: string
    userAvatar?: string
    text: string
    createdAt: Date
}

// /tasks/{taskId}/activityLog/{logId}
export interface ActivityLog {
    id: string
    taskId: string
    userId: string
    userName: string
    action: string // 'created', 'assigned', 'status_changed', 'commented'
    details: string
    oldValue?: any
    newValue?: any
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

// HEADER CONFIGURATION
export interface NavigationItem {
    name: string
    href: string
    roles: UserRole[]
}

export type HeaderTheme = 'default' | 'indian' | 'corporate'

export interface HeaderConfig {
    logo: string
    title: string
    navigation: NavigationItem[]
    theme: HeaderTheme
}
