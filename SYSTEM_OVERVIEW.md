# 🔥 System Overview: JewelMatrix Task Management Platform

**Date**: January 16, 2026  
**Status**: Phase 1 - Sheet Parity (In Development)  
**Version**: 1.0.0  

---

## Executive Summary

JewelMatrix is a **hybrid task management platform** that replaces a two-sheet spreadsheet system with a modern, intelligent, real-time application. It manages:

1. **Key Result Areas (KRAs)** - Recurring responsibilities (daily/weekly/monthly)
2. **Delegated Tasks** - One-time assignments with tracking
3. **Performance Scoring** - Real-time KPI aggregation and team metrics
4. **Status Updates** - Centralized logging of employee progress
5. **Role-Based Workflows** - Admin controls + Employee dashboards

The system transforms manual spreadsheet operations into **automated, audited, real-time workflows**.

---

## What the Spreadsheet System Is

### Sheet 1: MBA 2.0 (Operational Core)
**Purpose**: Define organizational tasks and track daily progress

**Key Tabs** (inferred from application):
- **KRA Library**: Template definitions for recurring tasks (Daily/Weekly/Monthly)
  - Each KRA has: Title, Description, Priority, Type, Target, Assigned Users/Teams
  - Supports recurring generation on schedules

- **Task Delegations**: One-time task assignments
  - Task ID, Title, Description, Priority, Due Date, Assigned To, Status
  - Tracks revision requests and target date changes

- **Daily Updates**: Employee progress log
  - Date, Employee, Task/KRA, Status, Remarks, Revision Date
  - Central "spoke" where all work is reported

- **Active Task List**: Real-time view of all pending work
  - Filters by employee, team, status, priority
  - Shows progression toward completion

### Sheet 2: MIS CONSOLIDATED (Intelligence Hub)
**Purpose**: Measure team and individual performance

**Key Metrics** (inferred from analytics service):
- **Speed**: % of tasks completed on-time
- **Quality**: % of tasks requiring revision (negative metric)
- **Dedication**: % of daily updates submitted (engagement metric)
- **Delay**: % of tasks finished late (negative metric)
- **Accuracy**: KRA compliance and adherence

**Real-Time Scorecards**:
- Individual leaderboards (by employee)
- Team comparisons
- Department summaries
- Trend analysis (30-day, 90-day, YTD)

---

## End-to-End Workflow

### 1. Admin Sets Up KRA Templates (Weekly/Monthly)

```
Admin → Create KRA Template
  ├─ Title, Description, Priority
  ├─ Type: Daily/Weekly/Monthly
  ├─ Assign to Users or Teams
  └─ Set Active = true

Schedule:
  → Daily: Generate every working day
  → Weekly: Generate on Monday (or configured day)
  → Monthly: Generate on 1st (or configured day)
```

### 2. KRA Automation Engine

```
Cron Job (Daily @ 12:00 AM)
  → Check all active KRA templates
  → Skip if holiday/Sunday
  → Generate new KRA instance
    ├─ Copy template data
    ├─ Set Status = "not_started"
    ├─ Calculate end date (based on type)
    └─ Assign to users/teams

Result: New KRA appears in employee dashboards
```

### 3. Employee Receives Tasks

**Dashboard View**:
- My KRAs (repeating) - Today's, This Week's, This Month's
- My Delegated Tasks (one-time) - Assigned to me, by me
- My Updates (log) - Recent status updates from me

**Status Transitions**:
```
not_started → in_progress → pending_review → completed
                                    ↓
                           revision_requested (loops back to in_progress)
```

### 4. Daily Update Flow

Employee logs progress:
```
Task/KRA → Status Update
  ├─ Current Status: In Progress, Blocked, Delayed, etc.
  ├─ Remarks: What's done, what's pending
  ├─ Revision Date: If delayed, new target date
  └─ Attachments: Evidence, notes, files

Stored in: TaskUpdate/TaskUpdateEntry collection
Timeline: Immutable audit log
```

### 5. Admin Reviews & Manages

**Admin Dashboard**:
- Live team performance scorecard
- Individual KPI metrics
- Revision requests queue
- Historical MIS reports
- Holiday/weekend calendar
- KRA template library
- User/Team management

**Actions**:
- Approve/reject task completions
- Request revisions
- Adjust target dates
- Generate reports
- Export MIS data
- Manage KRA schedules

### 6. Scoring Engine (Real-Time Aggregation)

```
Input: All TaskUpdate entries + KRA/Task completion data
Processing:
  → Calculate Speed: (Completed On-Time / Total) × 100
  → Calculate Quality: (No Revision Required / Total) × 100
  → Calculate Dedication: (Days with Update / Total Days)
  → Calculate Delay: (Completed Late / Total) × 100

Output: Leaderboard, team metrics, trend charts
Update Frequency: Real-time (updated on every status change)
```

---

## Core Data Model

### Users & Teams
```
User
├─ id (Firebase UID)
├─ email, name, department
├─ role: admin, manager, employee
├─ teamId: Assigned team
├─ createdAt, updatedAt

Team
├─ id
├─ name, department
├─ members: User[]
├─ manager: User ID
├─ createdAt, updatedAt
```

### KRA (Repeating Responsibility)
```
KRA
├─ id, kraNumber (K-001, K-002, etc.)
├─ title, description, target
├─ type: daily, weekly, monthly, fortnightly
├─ priority: low, medium, high, critical
├─ assignedTo: User[] IDs
├─ teamIds: Team[] IDs
├─ status: not_started, in_progress, completed, cancelled, on_hold
├─ progress: 0-100
├─ startDate, endDate
├─ createdBy: Admin User ID
├─ attachments: []
├─ kpiIds: linked KPI[]
├─ createdAt, updatedAt

KRATemplate (for automation)
├─ id, title, description
├─ type: daily, weekly, monthly
├─ priority, assignedTo[], teamIds[]
├─ isActive: boolean
├─ lastGenerated: Date
├─ createdBy, createdAt, updatedAt
```

### Task (One-Time Delegation)
```
Task
├─ id, taskNumber (T-001, T-002, etc.)
├─ title, description
├─ kraId: Optional link to parent KRA
├─ priority: low, medium, high, critical
├─ status: not_started, assigned, in_progress, blocked, 
│         completed, cancelled, on_hold, pending_review, 
│         revision_requested
├─ assignedTo: User[] IDs
├─ assignedBy: Admin/Manager User ID
├─ teamId: Team ID
├─ dueDate, finalTargetDate (if revised)
├─ progress: 0-100
├─ revisionCount, lastRevisionId
├─ kpiScore: 0-100
├─ category: string
├─ attachments: []
├─ createdAt, updatedAt
```

### TaskUpdate (Status Log - The Central Spoke)
```
TaskUpdate
├─ id
├─ taskId: Link to Task or KRA
├─ taskTitle: Denormalized for display
├─ userId: Employee who submitted update
├─ userName: Denormalized
├─ statusUpdate: Current status description
├─ revisionDate: Optional new due date
├─ remarks: Progress notes
├─ isKRA: boolean flag
├─ timestamp: Date

TaskUpdateEntry (identical, stricter type)
├─ (same fields as TaskUpdate)
```

### KPI (Weekly Metrics)
```
KPI
├─ id
├─ kraId: Parent KRA
├─ week: ISO week number
├─ year: Fiscal/Calendar year
├─ target: e.g., "5 leads per day"
├─ actual: e.g., "4.2 leads per day"
├─ achievement: 84%
├─ remarks: string
├─ status: on_track, at_risk, off_track
├─ createdAt, updatedAt
```

### Weekly Report
```
WeeklyReport
├─ id
├─ userId, employeeName
├─ week, year
├─ kpiData: KPI[]
├─ speedScore: 0-100
├─ qualityScore: 0-100
├─ dedicationScore: 0-100
├─ delayScore: 0-100 (inverted: higher is better)
├─ overallScore: Weighted average
├─ remarks: string
├─ submittedAt: Date
```

---

## Role-Based Permissions

### Admin
- Create/Edit/Delete KRA templates
- Create/Edit/Delete tasks (delegate)
- View all dashboards (team, individual, consolidated)
- Approve/reject task completions
- Request revisions
- Manage users and teams
- Configure holidays and working days
- View and export reports
- Access scoring engine

### Manager
- View team dashboard (real-time metrics)
- Assign tasks to team members
- Request revisions from team
- View team's KRA performance
- Limited access to reports
- Cannot modify system-level settings

### Employee
- View my KRAs and tasks
- Submit status updates
- View my progress metrics
- Submit revisions when requested
- View my update history
- Cannot view other employees' full data (privacy)

---

## Key Workflows

### Workflow 1: KRA Lifecycle
```
Template Created by Admin
        ↓
    Active=true
        ↓
   Scheduler triggers
        ↓
  KRA Instance Generated (status=not_started)
        ↓
  Assigned to User/Team
        ↓
  Employee views in dashboard
        ↓
  Employee submits status update
        ↓
  Status changes → pending_review (if marked complete)
        ↓
  Admin approves or requests revision
        ↓
  If approved → status=completed
  If revision → back to in_progress
        ↓
  New KRA instance generated next cycle
```

### Workflow 2: Task Delegation
```
Admin creates task (Task form)
        ↓
  Status = assigned
        ↓
  Employee receives notification
        ↓
  Employee views task details
        ↓
  Employee begins work → status = in_progress
        ↓
  Employee submits update
        ↓
  Task transitions based on update
        ↓
  If complete → pending_review
        ↓
  Admin reviews/approves
        ↓
  Complete or request revision
```

### Workflow 3: Daily Update & Revision Loop
```
Employee submits daily update
  ├─ Task ID / KRA ID
  ├─ Status: In Progress, Blocked, Delayed, Complete, etc.
  ├─ Remarks: What's done, what's pending
  └─ Revision Date: If delayed
        ↓
Update stored immutably in TaskUpdate collection
        ↓
If status=complete:
  → Task transitions to pending_review
  → Admin gets notification
        ↓
Admin reviews:
  → Approves (status=completed, archive task)
  → Requests revision (status=revision_requested, reopen task)
        ↓
If revision requested:
  → Employee notified
  → Task back to in_progress
  → New revision deadline set
  → Loop continues
```

---

## Automation Points

### 1. KRA Generation (Daily Cron Job)
- Check all active templates
- Skip holidays/weekends
- Generate new instances
- Notify assigned users

### 2. Scoring Aggregation (Real-Time)
- On each TaskUpdate: Recalculate user's metrics
- Update weekly report
- Update leaderboard
- Trigger notifications if thresholds hit

### 3. Revision Request Alerts
- When admin requests revision
- Notify employee
- Set deadline reminder

### 4. Task Overdue Alerts
- Daily check for tasks past due date
- Notify employee + manager
- Mark as "at_risk"

### 5. End-of-Cycle Cleanup
- Archive completed tasks/KRAs
- Lock previous cycle for reporting
- Generate final MIS report

---

## Spreadsheet ↔ App Mapping

| Spreadsheet Feature | App Feature | Status |
|---|---|---|
| KRA Library | KRA Templates + Automation | ✅ Built |
| Task Delegations | Tasks Collection | ✅ Built |
| Daily Updates Form | TaskUpdate Collection | ✅ Built |
| Active Task List | Employee Dashboard | ✅ Built |
| MIS Scorecard | Analytics Service + Admin Dashboard | ✅ Built |
| Leaderboards | Performance Leaderboard Component | ✅ Built |
| Holiday Calendar | Holiday Service | ✅ Built |
| User Management | Admin Panel | ✅ Built |
| Team Management | Team Service + Admin Panel | ✅ Built |
| Revision Tracking | TaskUpdate logs + Revision Service | ✅ Built |

---

## System Constraints & Rules

### Business Rules
1. **KRA Assignment**: At least one user or one team per KRA
2. **Task Assignment**: Requires explicit assignedBy (admin/manager)
3. **Revision Limit**: Max 5 revisions per task (configurable)
4. **Working Days**: Skip holidays/weekends for daily KRAs
5. **Ownership**: Only creator/admin can delete
6. **Visibility**: Employees see only their own + public team data

### Data Integrity
1. TaskUpdates are immutable (never deleted/edited, only read)
2. KRA templates cannot be deleted if active (must deactivate first)
3. Cascading deletes: Deleting task deletes its updates
4. Audit trail: All changes logged with timestamp + user

### Performance Targets
1. Dashboard load time: < 2 seconds
2. Real-time scoring: < 1 second recalc
3. Report generation: < 5 seconds
4. KRA generation cron: < 30 seconds for 1000 users

---

## Next Steps

### Phase 1 (Current): Sheet Parity
- ✅ KRA management (create, read, update, delete)
- ✅ Task delegation
- ✅ Daily update logging
- ✅ Status transitions
- ✅ Admin dashboard
- ✅ Employee dashboard
- ✅ Basic scoring

### Phase 2: System Improvements
- Enhanced automation
- Workflow validations
- Smart defaults
- Guided task creation
- Batch operations

### Phase 3: Full Product
- Advanced analytics
- Custom reports
- Mobile app
- API integrations
- Workflow extensions

---

**Document Owner**: Product Team  
**Last Updated**: January 16, 2026  
**Next Review**: January 23, 2026
