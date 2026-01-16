# Application Replication Plan: From Sheets to SaaS

**Timeline**: Phase 1 Complete, Phase 2 Planned  
**Version**: 1.0.0  
**Status**: Implementation In Progress  

---

## Overview

This document provides a step-by-step roadmap to fully replace the spreadsheet system with a feature-complete, production-ready SaaS application. It maps every spreadsheet capability to application features and defines implementation milestones.

---

## Phase 1: Sheet Parity (Foundation - CURRENT)

### Goal
Recreate 100% of spreadsheet functionality in the app. No feature loss.

### Deliverables

#### 1.1 KRA Management (Repeating Responsibilities)

**Spreadsheet Feature**: KRA Library Tab  
**App Status**: ✅ COMPLETE

```
Spreadsheet columns          →    App Implementation
─────────────────────────────────────────────────────
KRA ID                       →    kraNumber (auto-generated)
Title                        →    kra.title
Description                 →    kra.description
Target (e.g., "5 sales/day") →    kra.target
Type (Daily/Weekly/Monthly)  →    kra.type enum
Priority                     →    kra.priority enum
Assigned Users               →    kra.assignedTo[]
Assigned Teams               →    kra.teamIds[]
Created Date                 →    kra.createdAt
Active Status               →    KRATemplate.isActive
```

**Implementation Details**:

**Database Schema**:
```typescript
// KRA Collection
{
  id: string                    // Firestore doc ID
  kraNumber: string             // Auto-generated K-001, K-002, etc.
  title: string                 // Required, max 200 chars
  description: string           // Required, min 10 chars
  target?: string               // Optional, max 500 chars
  type: 'daily'|'weekly'|'monthly'|'fortnightly'
  priority: 'low'|'medium'|'high'|'critical'
  assignedTo: string[]          // User UIDs
  teamIds?: string[]            // Team IDs
  status: 'not_started'|'in_progress'|'completed'|'cancelled'|'on_hold'
  progress: number              // 0-100
  startDate: Date
  endDate: Date
  createdBy: string             // Admin UID
  attachments?: string[]        // File URLs
  kpiIds?: string[]             // Linked KPIs
  createdAt: Date
  updatedAt: Date
}

// KRATemplate Collection (for automation)
{
  id: string
  title: string
  description: string
  target?: string
  type: 'daily'|'weekly'|'monthly'
  priority: string
  assignedTo: string[]
  teamIds?: string[]
  isActive: boolean             // Master on/off switch
  lastGenerated?: Date          // Track last generation
  createdBy: string
  createdAt: Date
  updatedAt: Date
}
```

**UI Components**:
- `KRAForm`: Create/Edit KRA
- `KRAList`: Display all KRAs with filters (status, type, assignee)
- `KRACalendar`: Calendar view of recurring KRAs
- `KRADetailModal`: View KRA details, edit, link to KPIs

**API Endpoints**:
```
POST   /api/kras                    Create new KRA
GET    /api/kras?userId={id}        Get user's KRAs
GET    /api/kras?teamId={id}        Get team's KRAs
GET    /api/kras/{id}               Get single KRA
PUT    /api/kras/{id}               Update KRA
DELETE /api/kras/{id}               Delete KRA (only if not active)
POST   /api/kras/bulk               Bulk operations
```

**Automation**:
```
Cron Job: Daily @ 12:00 AM (UTC)
├─ Query all active KRA templates
├─ For each template:
│  ├─ Check if holiday or weekend (skip if daily)
│  ├─ Check lastGenerated date
│  ├─ If generation needed:
│  │  ├─ Create new KRA instance
│  │  ├─ Set status = 'not_started'
│  │  ├─ Calculate endDate based on type
│  │  └─ Notify assigned users
│  └─ Update template.lastGenerated
└─ Log results in activity feed
```

**Validation Rules**:
- Title: 3-200 characters, not empty
- Description: 10-2000 characters
- Type: Must be one of enum values
- Priority: Must be one of enum values
- assignedTo: At least 1 user required
- startDate: Cannot be in the past (at creation)
- endDate: Must be >= startDate
- Target: Max 500 chars, optional

---

#### 1.2 Task Delegation (One-Time Assignments)

**Spreadsheet Feature**: Task Delegations Tab  
**App Status**: ✅ COMPLETE

```
Spreadsheet columns          →    App Implementation
─────────────────────────────────────────────────────
Task ID                      →    taskNumber (auto-generated)
Title                        →    task.title
Description                 →    task.description
Priority                    →    task.priority enum
Due Date                    →    task.dueDate
Assigned To                 →    task.assignedTo[]
Assigned By                 →    task.assignedBy (admin UID)
Status                      →    task.status enum
Target Date (if revised)    →    task.finalTargetDate
Progress                    →    task.progress (0-100)
Attachments                 →    task.attachments[]
Revisions Count             →    task.revisionCount
```

**Database Schema**:
```typescript
// Task Collection
{
  id: string
  taskNumber: string              // Auto-generated T-001, T-002
  title: string                   // Required, max 200 chars
  description: string             // Required, min 10 chars
  kraId?: string                  // Optional link to parent KRA
  priority: 'low'|'medium'|'high'|'critical'
  status: 'not_started'|'assigned'|'in_progress'|'blocked'|
          'completed'|'cancelled'|'on_hold'|'pending_review'|
          'revision_requested'
  assignedTo: string[]            // User UIDs
  assignedBy: string              // Admin/Manager UID
  teamId?: string                 // Team this task belongs to
  dueDate: Date
  finalTargetDate?: Date          // If revised/extended
  progress: number                // 0-100
  revisionCount?: number          // How many times revised
  lastRevisionId?: string         // Last revision task ID
  kpiScore?: number               // 0-100, for scoring
  category?: string               // Task type/category
  attachments?: string[]          // File URLs
  createdAt: Date
  updatedAt: Date
}
```

**UI Components**:
- `TaskForm`: Create/Edit task, set assignees, dates
- `TaskCard`: Summary card showing task status, due date, assignee
- `TaskDetailModal`: Full task view, history, revisions
- `TaskBoardView`: Kanban board by status
- `TaskCalendarView`: Calendar view of due dates
- `TaskList`: Filterable list (status, priority, assignee, due date)

**API Endpoints**:
```
POST   /api/tasks                   Create new task
GET    /api/tasks?userId={id}       Get user's tasks (assigned to or by)
GET    /api/tasks?teamId={id}       Get team's tasks
GET    /api/tasks?status=pending     Filter by status
GET    /api/tasks/{id}              Get single task
PUT    /api/tasks/{id}              Update task
DELETE /api/tasks/{id}              Delete task (soft delete)
POST   /api/tasks/{id}/revision      Request revision
```

**Validation Rules**:
- Title: 3-200 characters
- Description: 10-2000 characters
- Priority: Required, one of enum
- assignedTo: At least 1 user
- dueDate: Required, must be >= today
- status: Only assignedBy can set initial status
- finalTargetDate: Must be >= dueDate
- attachments: Max 10 files, max 100MB total

---

#### 1.3 Daily Updates (The Central Spoke)

**Spreadsheet Feature**: Daily Updates Form + Tasks Update Sheet  
**App Status**: ✅ COMPLETE

```
Spreadsheet columns          →    App Implementation
─────────────────────────────────────────────────────
Date                        →    taskUpdate.timestamp
Employee                    →    taskUpdate.userId
Task/KRA ID                 →    taskUpdate.taskId
Status Update               →    taskUpdate.statusUpdate
Remarks                     →    taskUpdate.remarks
Revision Date (if delayed)  →    taskUpdate.revisionDate
Is KRA? (flag)             →    taskUpdate.isKRA
```

**Database Schema**:
```typescript
// TaskUpdate Collection (Immutable Audit Log)
{
  id: string                    // Firestore doc ID
  taskId: string                // Link to Task or KRA
  taskTitle: string             // Denormalized for display
  userId: string                // Employee who submitted
  userName: string              // Denormalized
  statusUpdate: string          // Status description (e.g., "Complete", "Blocked")
  revisionDate?: Date           // If requesting extension
  remarks?: string              // Progress notes, max 2000 chars
  isKRA: boolean                // Flag: is this for a KRA or Task?
  timestamp: Date               // When submitted (server-set)
  
  // Immutable: Never edited/deleted after creation
}
```

**UI Components**:
- `TaskUpdateForm`: Simple form with task selector, status dropdown, remarks textarea
- `TaskUpdateHistory`: Timeline of all updates for a task
- `DailyUpdateFeed`: Show recent updates from team
- `UpdateNotifications`: Alert when revision requested

**API Endpoints**:
```
POST   /api/tasks/updates                Create new update
GET    /api/tasks/updates?taskId={id}    Get all updates for task
GET    /api/tasks/updates?userId={id}    Get all updates by user
GET    /api/tasks/updates?week={week}    Get weekly updates
```

**Key Features**:
- **Immutable**: Updates can never be edited/deleted (audit trail)
- **Denormalization**: Store taskTitle so updates work even if task deleted
- **Real-time scoring**: Each update recalculates user's metrics
- **Notifications**: Admin/Manager alerted when revision requested

**Validation Rules**:
- taskId: Must exist and be assigned to submitter
- statusUpdate: Required, max 100 chars
- remarks: Optional, max 2000 chars
- revisionDate: If provided, must be >= today
- Only assigned users can submit updates

---

#### 1.4 Status Transitions (State Machine)

**Spreadsheet Feature**: Status column + Manual transitions  
**App Status**: ✅ COMPLETE

**KRA Status Transitions**:
```
not_started
    ↓
in_progress
    ↓
pending_review (when marked complete)
    ↓
completed (if approved by admin)
    ↘ (if revisions needed)
      revision_requested → in_progress (loops)
    
Can also transition to:
on_hold (manual pause)
cancelled (manual cancellation)
```

**Task Status Transitions**:
```
not_started
    ↓
assigned (when delegated)
    ↓
in_progress (employee starts work)
    ↓
blocked (if blocked, can return to in_progress)
    ↓
pending_review (when marked complete)
    ↓
completed (if approved)
    ↘ (if revisions needed)
      revision_requested → in_progress (loops)

Exits:
on_hold → in_progress (resume)
cancelled (terminal)
```

**Implementation**:
```typescript
// src/lib/businessRules.ts
class TaskStateMachine {
  static canTransition(from: TaskStatus, to: TaskStatus, role: UserRole): boolean {
    const rules = {
      'not_started': ['assigned', 'in_progress', 'on_hold', 'cancelled'],
      'assigned': ['in_progress', 'on_hold', 'cancelled'],
      'in_progress': ['blocked', 'pending_review', 'on_hold', 'cancelled'],
      'blocked': ['in_progress', 'on_hold', 'cancelled'],
      'pending_review': ['completed', 'revision_requested'],
      'revision_requested': ['in_progress', 'cancelled'],
      'on_hold': ['in_progress', 'cancelled'],
      'completed': [], // Terminal
      'cancelled': []  // Terminal
    };
    
    // Admins can do more; employees have limits
    return rules[from]?.includes(to) ?? false;
  }
}
```

---

#### 1.5 Admin Dashboard

**Spreadsheet Feature**: MIS CONSOLIDATED sheet + Summary tabs  
**App Status**: ✅ COMPLETE

**Dashboard Sections**:

1. **Live Scorecard** (Top Priority)
   - Real-time KPI metrics for all users
   - Columns: Name, Speed (%), Quality (%), Dedication (%), Delay (%), Overall Score
   - Sortable, filterable
   - Color coding: Green (good), Yellow (warning), Red (critical)

2. **Task Summary**
   - Total tasks: Created, In Progress, Pending Review, Completed, Overdue
   - By priority distribution (pie chart)
   - By status distribution (bar chart)

3. **KRA Performance**
   - Active KRAs: Count, by type
   - Completion rate
   - Overdue KRAs
   - Template activity

4. **Activity Feed**
   - Recent task updates
   - Status changes
   - Revisions requested
   - New KRAs generated

5. **Team Health**
   - Team metrics overview
   - Manager assignments
   - Workload distribution

**UI Implementation**:
```typescript
// src/components/features/admin/AdminDashboard.tsx
interface DashboardData {
  scorecard: {
    speed: number;
    quality: number;
    dedication: number;
    delay: number;
    overallScore: number;
  }[];
  taskSummary: TaskStats;
  kraSummary: KRAStats;
  activityFeed: ActivityLog[];
  teamHealth: TeamMetrics[];
}
```

**API Endpoints**:
```
GET /api/admin/dashboard              Get all dashboard data
GET /api/analytics/scorecard           Get real-time scorecard
GET /api/analytics/team-metrics        Get team health
GET /api/analytics/task-summary        Get task stats
GET /api/analytics/kra-summary         Get KRA stats
GET /api/analytics/activity-feed       Get activity log
```

---

#### 1.6 Employee Dashboard

**Spreadsheet Feature**: Active Task List + Personal view  
**App Status**: ✅ COMPLETE

**Dashboard Sections**:

1. **My KRAs (Repeating Work)**
   - Today's KRAs
   - This Week's KRAs
   - This Month's KRAs
   - Filter by type, status
   - Quick update buttons

2. **My Tasks (One-Time)**
   - Assigned to me (by others)
   - Created by me
   - Status filters
   - Due date sorting

3. **My Updates (Log)**
   - Recent updates I've submitted
   - Pending revisions
   - Revision deadline reminders
   - Timeline view

4. **My Performance**
   - My current scores (Speed, Quality, Dedication, Delay)
   - Trend (7-day, 30-day)
   - Comparison to team average
   - Highlighted warnings

5. **Quick Actions**
   - Submit daily update (modal)
   - Create new task
   - View pending tasks

**API Endpoints**:
```
GET /api/dashboard/user/{userId}      Get user's dashboard
GET /api/tasks/me                      Get my tasks
GET /api/kras/me                       Get my KRAs
GET /api/analytics/me                  Get my scores
GET /api/tasks/updates/me              Get my update history
```

---

#### 1.7 Holiday & Working Day Management

**Spreadsheet Feature**: Holiday Calendar tab  
**App Status**: ✅ COMPLETE

**Features**:
- Define holidays (national, company, team-specific)
- Define weekends (usually Sat/Sun, customizable)
- Exclude holidays from KRA generation
- Alert employees of non-working days

**Database Schema**:
```typescript
// Holiday Collection
{
  id: string
  date: Date
  title: string            // e.g., "New Year's Day"
  type: 'national'|'company'|'team'
  teamId?: string         // If team-specific
  createdBy: string
  createdAt: Date
}

// WorkingDayConfig Collection
{
  id: string
  organization: string
  weekdaysOff: number[]   // [6, 0] = Sat, Sun (0=Sunday)
  createdAt: Date
}
```

**Service Methods**:
```typescript
// src/lib/holidayService.ts
async function isWorkingDay(date: Date): Promise<boolean>
async function addHoliday(holiday: Holiday): Promise<void>
async function getHolidaysInRange(start: Date, end: Date): Promise<Holiday[]>
async function skipToNextWorkingDay(date: Date): Promise<Date>
```

---

#### 1.8 User & Team Management

**Spreadsheet Feature**: User list + Team assignments  
**App Status**: ✅ COMPLETE

**Features**:
- Create users (with email validation)
- Assign to teams
- Set roles (Admin, Manager, Employee)
- Bulk import from CSV
- Deactivate users (soft delete)

**Database Schema**:
```typescript
// User Collection
{
  id: string              // Firebase UID
  email: string
  name: string
  phone?: string
  department?: string
  teamId?: string
  role: 'admin'|'manager'|'employee'
  
  // Metadata
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

// Team Collection
{
  id: string
  name: string
  department?: string
  managerId: string       // Manager UID
  members: string[]       // User UIDs
  createdAt: Date
  updatedAt: Date
}
```

---

#### 1.9 Revision Request System

**Spreadsheet Feature**: Revision tracking in Task Delegations  
**App Status**: ✅ COMPLETE

**Flow**:
```
Admin reviews completed task
    ↓
Approves → Status = completed (archive)
    OR
Rejects → Status = revision_requested (reopen)
    ↓
Employee notified
    ↓
Employee updates remarks
    ↓
Re-submits with new deadline
    ↓
Loop until approved
```

**API Endpoint**:
```
POST /api/tasks/{id}/request-revision
  Body: {
    reason: string
    newDueDate?: Date
  }
```

---

### Phase 1 Completion Checklist

- [x] KRA creation, read, update, delete
- [x] Task delegation workflow
- [x] Daily update form and logging
- [x] Status transitions
- [x] Admin dashboard (real-time metrics)
- [x] Employee dashboard (my tasks/KRAs)
- [x] Holiday calendar
- [x] User & team management
- [x] Revision request system
- [x] Basic role-based access control
- [x] Basic scoring service (Speed, Quality, Dedication, Delay)
- [x] Activity logging
- [x] Real-time notifications
- [x] Mobile responsive UI
- [x] TypeScript strict mode
- [x] Error handling and validation
- [x] Unit tests for core logic

**Phase 1 Status**: ✅ COMPLETE

---

## Phase 2: System Improvements (Better than Sheets)

### Goal
Remove spreadsheet limitations and add smart automation.

### Key Improvements

#### 2.1 Enhanced Automation
- **Auto-escalation**: Alert manager if task overdue
- **Auto-hold**: Pause KRA generation if employee on leave
- **Smart batching**: Combine multiple updates into single KRA completion
- **Dependency tracking**: Block task until dependent task completes

#### 2.2 Workflow Intelligence
- **Smart suggestions**: AI recommends status based on task description
- **Duplicate detection**: Alert if similar task already exists
- **Auto-categorization**: ML-based task categorization
- **Risk detection**: Flag high-risk tasks (high priority + tight deadline)

#### 2.3 Enhanced Reporting
- **Custom reports**: User can define report templates
- **Scheduled exports**: Email MIS scorecard weekly
- **Trend analysis**: 30/60/90 day trends with forecasting
- **Comparative analysis**: Compare team to department to org

#### 2.4 Collaboration Features
- **Comments**: Add comments to tasks/KRAs
- **Attachments**: Upload evidence/documents
- **Mentions**: Notify team members
- **Activity feed**: Team-wide updates in real-time

#### 2.5 Data Validation & Integrity
- **Constraint enforcement**: Prevent orphaned tasks
- **Validation rules**: Business logic as code
- **Audit trail**: Complete history of changes
- **Data reconciliation**: Detect inconsistencies

#### 2.6 UX Improvements
- **Bulk operations**: Edit multiple tasks at once
- **Drag-and-drop**: Reorder priorities
- **Templates**: Save task templates for reuse
- **Quick filters**: Save and load filter presets
- **Keyboard shortcuts**: Power user features

---

## Phase 3: Full Product (Scalable SaaS)

### Goal
Enterprise-grade features for scaling.

### Key Features

#### 3.1 Advanced Analytics
- **Predictive analytics**: Forecast completion rates
- **Anomaly detection**: Identify unusual patterns
- **Benchmarking**: Compare to industry standards
- **Custom dashboards**: User-configurable metrics

#### 3.2 Workflow Customization
- **Custom fields**: Add org-specific metadata
- **Workflow templates**: Different processes for different task types
- **SLA management**: Define and track service levels
- **Integration hooks**: Trigger external systems on status changes

#### 3.3 Multi-Organization Support
- **Tenancy**: Support multiple orgs on single instance
- **Organization settings**: Branding, workflows, holidays
- **Cross-org reporting**: High-level insights
- **SSO/SAML**: Enterprise authentication

#### 3.4 Mobile & API-First
- **Native mobile apps**: iOS/Android
- **REST API**: Documented, versioned
- **GraphQL API**: Flexible data fetching
- **Webhooks**: Real-time event streaming
- **CLI**: Command-line interface

#### 3.5 Advanced Permissions
- **Granular RBAC**: Role-based access control
- **Field-level permissions**: Control who sees what
- **Delegation**: Assign permissions to others
- **Approval workflows**: Multi-step approvals

#### 3.6 Scalability & Reliability
- **Caching**: Redis for performance
- **Search**: Elasticsearch for fast queries
- **Async jobs**: Background processing
- **High availability**: Multi-region deployment
- **Disaster recovery**: Backup and restore

---

## Implementation Timeline

### Phase 1: 0-6 weeks (CURRENT)
- Week 1-2: Foundation (KRA, Task, Update)
- Week 3-4: Admin & Employee dashboards
- Week 5-6: Scoring, reports, testing

### Phase 2: 6-16 weeks
- Week 7-9: Automation enhancements
- Week 10-12: Collaboration features
- Week 13-16: Advanced reporting

### Phase 3: 16+ weeks
- Week 17-26: Analytics & ML
- Week 27-36: Mobile & API
- Week 37+: Scaling & compliance

---

## Success Metrics

### Phase 1
- [ ] 100% feature parity with spreadsheets
- [ ] No data loss in migration
- [ ] All existing workflows work
- [ ] Admin satisfaction: 4.5/5
- [ ] Employee adoption: 80%+

### Phase 2
- [ ] Task creation time reduced by 50%
- [ ] Update form time reduced by 40%
- [ ] Scorecard calculation time < 1 second
- [ ] User satisfaction: 4.7/5

### Phase 3
- [ ] Mobile app daily active users: 60%+
- [ ] API usage: 100k+ calls/month
- [ ] Uptime: 99.9%+
- [ ] NPS score: 50+

---

**Document Owner**: Engineering Team  
**Last Updated**: January 16, 2026  
**Next Review**: February 13, 2026
