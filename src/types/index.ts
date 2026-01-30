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
export type TaskStatus = 'not_started' | 'assigned' | 'in_progress' | 'blocked' | 'completed' | 'cancelled' | 'on_hold' | 'pending_review' | 'revision_requested' | 'overdue'
export type KRAStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
export type RevisionStatus = 'pending' | 'resolved' | 'rejected'

// Task Frequencies/Types
export type TaskFrequency = 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'quarterly' | 'yearly' | 'one-time'

// KRA Types
export type KRAType = 'daily' | 'weekly' | 'fortnightly' | 'monthly'

// TICKET TYPES
export type TicketRequestType =
    | 'office_cleaning'
    | 'stationery'
    | 'purchase_request'
    | 'repair_maintenance'
    | 'hr_helpdesk'
    | 'it_support'
    | 'accounts_admin'
    | 'general_query'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface Ticket {
    id: string
    ticketNumber: string      // TKT-001, TKT-002, etc.
    subject: string
    description: string

    // Requester Info
    requesterId: string       // Auto-filled from auth
    requesterName: string
    requesterEmail: string

    // Ticket Details
    requestType: TicketRequestType
    priority: Priority        // Reuse existing type
    departmentId?: string

    // Assignment
    assignedTo?: string       // Support staff user ID
    assignedToName?: string
    assignedAt?: Date

    // Dates
    dueDate: Date
    createdAt: Date
    updatedAt: Date

    // Status
    status: TicketStatus

    // Resolution
    solutions: TicketSolution[]
    resolvedBy?: string
    resolvedByName?: string
    resolvedAt?: Date

    // Metadata
    attachments?: string[]
    tags?: string[]
}

export interface TicketSolution {
    id: string
    ticketId: string
    solutionText: string
    addedBy: string
    addedByName: string
    addedAt: Date
    isAccepted?: boolean      // Did requester accept this solution?
}

export interface TicketComment {
    id: string
    ticketId: string
    userId: string
    userName: string
    text: string
    createdAt: Date
}

export interface TicketStats {
    total: number
    open: number
    inProgress: number
    resolved: number
    closed: number
    avgResolutionTime: number // in hours
}

// ========================================
// OKR (OBJECTIVES & KEY RESULTS) TYPES
// ========================================

export type OKRTimeframe = 'quarterly' | 'yearly'
export type OKRStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type KeyResultType = 'percentage' | 'number' | 'currency' | 'boolean'

export interface Objective {
    id: string
    title: string
    description: string

    // Ownership
    ownerId: string          // User who owns this objective
    ownerName: string
    teamId?: string          // Department/team (optional)
    teamName?: string

    // Timeframe
    timeframe: OKRTimeframe
    startDate: Date
    endDate: Date
    quarter?: number         // 1, 2, 3, or 4 (for quarterly)
    year: number

    // Status
    status: OKRStatus
    progress: number         // 0-100 (calculated from key results)

    // Key Results
    keyResultIds: string[]   // IDs of associated key results
    keyResults?: KeyResult[] // Embedded Key Results (optional)

    // Linkages
    linkedTaskIds?: string[]  // Tasks contributing to this objective
    linkedKPIIds?: string[]   // KPIs measuring this objective

    // Metadata
    createdBy: string
    createdByName: string
    createdAt: Date
    updatedAt: Date
    completedAt?: Date
}

export type KPITargetType = 'employee' | 'department'

export interface KPITemplate {
    id: string
    title: string
    description: string
    frequency: TaskFrequency
    priority: Priority
    targetType: KPITargetType
    assignedTo?: string[]
    departmentId?: string
    isActive: boolean
    lastPulse?: Date
    createdBy: string
    createdAt: Date
    updatedAt: Date
}

export interface KeyResult {
    id: string
    objectiveId: string      // Parent objective

    // Details
    title: string
    description?: string

    // Measurement
    type: KeyResultType
    startValue: number       // Initial value
    targetValue: number      // Goal value
    currentValue: number     // Current progress
    unit?: string            // e.g., '%', '$', 'users', etc.

    // Progress
    progress: number         // 0-100 (calculated)
    status: OKRStatus

    // Linkages
    linkedTaskIds?: string[]  // Tasks contributing to this KR
    linkedKPIIds?: string[]   // KPIs measuring this KR

    // Metadata
    createdAt: Date
    updatedAt: Date
    completedAt?: Date
}

export interface OKRProgress {
    objectiveId: string
    objectiveTitle: string
    progress: number
    keyResults: {
        id: string
        title: string
        progress: number
        currentValue: number
        targetValue: number
    }[]
    tasksCompleted: number
    tasksTotal: number
}

export interface OKRStats {
    total: number
    active: number
    completed: number
    draft: number
    cancelled: number
    avgProgress: number
    onTrack: number          // Progress >= 70%
    atRisk: number           // Progress < 70%
    byTimeframe: {
        quarterly: number
        yearly: number
    }
    byTeam: Record<string, number>
}

// ========================================
// LEARNING HUB TYPES
// ========================================

export type ArticleType = 'article' | 'faq' | 'sop' | 'guide' | 'video'
export type ArticleStatus = 'draft' | 'published' | 'archived'

export interface Article {
    id: string
    title: string
    content: string          // Rich text or markdown
    excerpt?: string         // Short summary

    // Classification
    type: ArticleType
    categoryId: string
    categoryName: string
    tags: string[]

    // Status
    status: ArticleStatus

    // Metadata
    authorId: string
    authorName: string
    createdAt: Date
    updatedAt: Date
    publishedAt?: Date

    // Engagement
    views: number            // Renamed from viewCount to match usage
    helpful: number          // Renamed from helpfulCount to match usage
    viewCount?: number       // Legacy support
    helpfulCount?: number    // Legacy support

    // Files
    attachments?: {
        name: string
        url: string
        type: string         // pdf, video, image
        size: number
    }[]
}

export interface FAQ {
    id: string
    question: string
    answer: string
    categoryId: string
    categoryName: string
    tags: string[]

    // Metadata
    authorId: string
    authorName: string
    createdAt: Date
    updatedAt: Date

    // Engagement
    viewCount: number
    helpfulCount: number

    // Status
    isPublished: boolean
}

export interface Category {
    id: string
    name: string
    description?: string
    icon?: string            // Icon name or emoji
    parentId?: string        // For sub-categories
    order: number            // Display order

    // Stats
    articleCount: number
    faqCount: number

    // Metadata
    createdAt: Date
    updatedAt: Date
}

export interface LearningHubStats {
    totalArticles: number
    totalFAQs: number
    totalViews: number
    mostReadArticles: Article[]
}

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
export type EmployeeType = 'full-time' | 'part-time' | 'contract' | 'intern'

export interface User {
    id: string
    fullName: string
    email: string
    roleIds: string[] // RBAC role IDs (legacy, can be removed)
    avatar?: string
    teamId?: string
    isActive?: boolean // Whether user account is active
    isAdmin?: boolean // Admin access flag
    lastLogin?: Date // Last login timestamp
    createdAt: Date
    updatedAt: Date

    // NEW EMPLOYEE FIELDS (Phase 1 - Week 4)
    employeeId: string          // Unique employee ID (e.g., EMP-001)
    position: string            // Job title/position
    employeeType: EmployeeType  // Employment type
    phone: string               // Contact number
    joiningDate: Date           // Date of joining
    reportingTo?: string        // Manager user ID
    department?: string         // Department name (denormalized for quick access)

    // Optional additional fields
    dateOfBirth?: Date
    address?: string
    emergencyContact?: {
        name: string
        phone: string
        relationship: string
    }
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

// Department Interface
export interface Department {
    id: string
    name: string
    code?: string
    description?: string
    managerId?: string      // Department Head ID
    headName?: string      // Department Head Name
    headEmail?: string     // Department Head Email
    isActive: boolean
    createdAt: Date
    updatedAt: Date
}

// KPI Interface - For weekly tracking within a KRA
export interface KPI {
    id: string
    kraId: string // Parent KRA this KPI belongs to
    userId: string // Employee this KPI is tracking
    userName: string
    name: string // e.g., "% work not done", "% delay in work done"
    benchmark: number // Target percentage or value
    // Weekly tracking
    lastWeekActual: number
    currentWeekPlanned: number
    currentWeekActual: number
    nextWeekTarget: number
    weekStartDate: Date // Start of the current tracking week
    previousWeekCommitment?: string // Notes on what was committed last week
    updatedBy: string
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
    progress: number // Percentage 0-100
    startDate: Date
    endDate: Date
    attachments?: string[]
    kpiIds?: string[] // IDs of KPIs linked to this KRA
    kraNumber?: string // Auto-incremented ID (e.g., K-001)
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
    department?: string  // Department this task belongs to
    dueDate: Date
    finalTargetDate?: Date // Extended deadline (if revised)
    progress: number // Percentage 0-100
    attachments?: string[] // File URLs
    revisionCount?: number // Number of times task has been revised
    lastRevisionId?: string // ID of the most recent revision request
    kpiScore?: number // Performance score (0-100)
    category?: string // Task category
    frequency?: TaskFrequency // Task type/frequency (Phase 1)
    taskNumber?: string // Auto-incremented ID (e.g., T-001)
    createdAt: Date
    updatedAt: Date

    // Overdue & Extension Logic
    delayReason?: string
    requestedExtensionDate?: Date
    extensionStatus?: 'pending' | 'approved' | 'rejected'
    extensionApprovedBy?: string
    extensionApprovedAt?: Date

    // Verification Fields (Phase 2 & 5)
    verificationStatus?: 'pending' | 'verified' | 'rejected'
    verifiedBy?: string // User ID
    verifiedAt?: Date
    rejectionReason?: string
    proofOfWork?: string // Description of work done
    proofLink?: string   // URL to proof (e.g., Google Drive, Github)
    completedAt?: Date   // Date when task was completed
}

// Task with metadata for display purposes
export interface TaskWithMeta extends Task {
    assignedByName?: string
}

// Task Update Interface - Employee status updates (replicates "Tasks Update" sheets)
// Task Update Entry (matches spreadsheet log structure)
export interface TaskUpdateEntry {
    id: string
    taskId: string           // Link to Task or KRA
    userId: string           // Employee ID
    userName: string
    timestamp: Date
    statusUpdate: string
    revisionDate?: Date      // If delayed
    remarks?: string
    isKRA: boolean          // Whether it was a KRA or delegated task
}

export interface TaskUpdate {
    id: string
    taskId: string
    taskTitle: string // Denormalized for display
    userId: string
    userName: string
    statusUpdate: string // Current status/progress description
    revisionDate?: Date // Requested new due date
    remarks?: string // Additional notes
    timestamp: Date
}

// Task Revision Interface
export interface TaskRevision {
    id: string
    taskId: string
    requestedBy: string // Manager/Admin who requested revision
    requestedByName: string
    requestedAt: Date
    reason: string // Why revision is needed
    status: RevisionStatus
    resolvedBy?: string // Employee who resolved the revision
    resolvedByName?: string
    resolvedAt?: Date
    resolutionNotes?: string // Employee's notes on what was fixed
    rejectedBy?: string // If revision was rejected
    rejectedAt?: Date
    rejectionReason?: string
}

// Task Template Interface - For reusable task configurations
export interface TaskTemplate {
    id: string
    name: string
    description: string
    templateTitle: string // Default title for tasks created from this template
    templateDescription: string // Default description
    priority: Priority
    defaultDueDate?: number // Days from creation
    defaultAssignees?: string[] // Default user IDs
    teamId?: string
    checklist?: string[] // Default checklist items
    tags?: string[]
    createdBy: string
    isPublic: boolean // Can other users use this template?
    usageCount: number // How many times this template has been used
    createdAt: Date
    updatedAt: Date
}

// Bulk Task Operation Interface - For tracking bulk operations
export interface BulkTaskOperation {
    id: string
    name: string
    createdBy: string
    createdByName: string
    taskIds: string[] // IDs of tasks created in this operation
    totalTasks: number
    successfulTasks: number
    failedTasks: number
    status: 'pending' | 'processing' | 'completed' | 'failed'
    errors?: string[] // Error messages for failed tasks
    source: 'csv' | 'template' | 'manual' // How tasks were created
    createdAt: Date
    completedAt?: Date
}

// Performance Parameter Interface - For defining scoring criteria
export interface PerformanceParameter {
    id: string
    name: string
    description: string
    weight: number // Percentage weight (0-100)
    category: 'quality' | 'timeliness' | 'accuracy' | 'completeness' | 'efficiency' | 'custom'
    minScore: number // Minimum score value
    maxScore: number // Maximum score value
    isActive: boolean
    createdBy: string
    createdAt: Date
    updatedAt: Date
}

// Performance Score Interface - For individual task/KRA scores
export interface PerformanceScore {
    id: string
    taskId?: string // Task being scored
    kraId?: string // KRA being scored
    userId: string // User being scored
    userName: string
    parameterId: string // Performance parameter
    parameterName: string
    score: number // Actual score value
    maxScore: number // Maximum possible score
    percentage: number // Score as percentage
    notes?: string // Evaluator notes
    evaluatedBy: string // Who gave the score
    evaluatedByName: string
    evaluatedAt: Date
    period?: string // e.g., "2024-W01" for weekly scores
}

// MIS Report Interface - Aggregated performance data
export interface MISReport {
    id: string
    userId: string
    userName: string
    teamId?: string
    period: string // e.g., "2024-W01", "2024-01"
    periodType: 'daily' | 'weekly' | 'monthly'
    totalTasks: number
    completedTasks: number
    onTimeTasks: number
    delayedTasks: number
    completionRate: number // Percentage
    onTimeRate: number // Percentage
    averageScore: number // Overall average score
    parameterScores: {
        parameterId: string
        parameterName: string
        averageScore: number
        weight: number
    }[]
    weightedScore: number // Final weighted score
    generatedAt: Date
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
    workNotDoneRate: number
    delayRate: number
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

// Dashboard Stats Interface
export interface DashboardStats {
    totalTasks: number
    completedTasks: number
    pendingTasks: number
    overdueTasks: number
    totalKRAs: number
    completedKRAs: number
    activeKRAs?: number
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
    roles: RoleName[]
}

export type HeaderTheme = 'default' | 'indian' | 'corporate'

export interface HeaderConfig {
    logo: string
    title: string
    navigation: NavigationItem[]
    theme: HeaderTheme
}

// Holiday Configuration
export interface Holiday {
    id: string
    name: string
    date: Date
    type: 'public' | 'company' | 'optional'
    description?: string
    createdBy: string
    createdAt: Date
    updatedAt: Date
}
