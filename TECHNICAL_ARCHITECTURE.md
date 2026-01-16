# Technical Architecture & Data Schema

**Version**: 1.0.0  
**Status**: Phase 1 Complete  
**Last Updated**: January 16, 2026  

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Complete Data Schema](#complete-data-schema)
3. [API Contracts](#api-contracts)
4. [State Machines](#state-machines)
5. [Permission Model](#permission-model)
6. [Automation Flows](#automation-flows)

---

## System Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENT (Next.js + React)              │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Employee Dashboard │ Admin Dashboard │ Manager   │   │
│  │     (My KRAs)      │  (All Metrics)  │ Dashboard │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────────────┐   ┌──────▼───────────────────┐
│   API ROUTES           │   │  SERVER ACTIONS          │
│  (/api/tasks,          │   │  (Privileged Server     │
│   /api/kras,           │   │   Logic, no client      │
│   /api/analytics)      │   │   params exposed)       │
└───────┬────────────────┘   └──────┬───────────────────┘
        │                           │
        └──────────────┬────────────┘
                       │
        ┌──────────────▼──────────────┐
        │   FIREBASE ADMIN SDK        │
        │   (Server-side only)        │
        ├──────────────────────────┐  │
        │ Firestore Rules (RBAC)   │  │
        │ Cloud Functions (Cron)   │  │
        │ Authentication           │  │
        └──────────────┬───────────┘  │
                       │              │
        ┌──────────────▼──────────────┐
        │   FIRESTORE DATABASE       │
        │  ┌──────────────────────┐  │
        │  │ Collections:         │  │
        │  │ - users              │  │
        │  │ - teams              │  │
        │  │ - kras               │  │
        │  │ - kraTemplates       │  │
        │  │ - tasks              │  │
        │  │ - taskUpdates        │  │
        │  │ - weeklyReports      │  │
        │  │ - holidays           │  │
        │  │ - auditLogs          │  │
        │  └──────────────────────┘  │
        └────────────────────────────┘
```

### Layer Architecture

#### 1. Presentation Layer (Client)
- Next.js App Router with TypeScript
- React components (functional, hooks-based)
- shadcn/ui components (Tailwind CSS)
- Real-time listeners (Firebase SDK)
- Form validation (React Hook Form)
- State management (Context API + React hooks)

#### 2. Business Logic Layer (Server)
- Next.js API routes (`/app/api/*`)
- Server Actions (for mutations)
- Firebase Admin SDK (privileged operations)
- Custom business rules (validation, state machines)
- Task automation (Cron jobs)
- Real-time scoring calculations

#### 3. Data Access Layer
- Firestore queries (optimized with indexes)
- Firebase Auth (user management)
- Security rules (enforce RBAC)
- Transactions (for atomic operations)
- Batch writes (for bulk operations)

#### 4. Database Layer
- Firestore (NoSQL, real-time)
- Document-based collections
- Sub-collections for related data
- Indexes for performance

---

## Complete Data Schema

### User Collection

```typescript
// /users/{userId}
interface User {
  // Authentication
  id: string;                    // Firebase UID (document ID)
  email: string;                 // Unique email
  passwordHash?: string;         // Only if custom auth
  
  // Profile
  name: string;
  phone?: string;
  department?: string;
  avatar?: string;               // Profile image URL
  
  // Organization
  teamId?: string;               // Reference to team
  role: 'admin' | 'manager' | 'employee';
  
  // Activity
  lastLogin?: Date;
  lastUpdated?: Date;
  isActive: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
// - Single field: email (for login)
// - Single field: teamId (for team queries)
// - Single field: role (for role queries)
```

### Team Collection

```typescript
// /teams/{teamId}
interface Team {
  id: string;                    // Firestore doc ID
  name: string;                  // Team name
  department?: string;           // Department name
  managerId: string;             // User ID of manager
  memberIds: string[];           // Array of member User IDs
  createdBy: string;             // Admin who created
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
// - Single field: managerId (find teams by manager)
// - Single field: department (group by department)
```

### KRA Template Collection

```typescript
// /kraTemplates/{templateId}
interface KRATemplate {
  id: string;
  title: string;                 // e.g., "Daily Standup"
  description: string;
  target?: string;               // e.g., "Report 5 leads"
  
  // Scheduling
  type: 'daily' | 'weekly' | 'fortnightly' | 'monthly';
  priority: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  lastGenerated?: Date;          // When last instance created
  
  // Assignment
  assignedTo: string[];          // User IDs
  teamIds?: string[];            // Team IDs
  
  // Metadata
  createdBy: string;             // Admin UID
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
// - Composite: (isActive, type)
// - Single field: createdBy
// - Single field: lastGenerated (for cron job)
```

### KRA Instance Collection

```typescript
// /kras/{kraId}
interface KRA {
  id: string;                    // Firestore doc ID
  kraNumber: string;             // Auto-incremented: K-001, K-002
  
  // Content (copied from template)
  title: string;
  description: string;
  target?: string;
  
  // Type & Priority
  type: 'daily' | 'weekly' | 'fortnightly' | 'monthly';
  priority: 'low' | 'medium' | 'high' | 'critical';
  
  // Assignment
  assignedTo: string[];          // User IDs
  teamIds?: string[];            // Team IDs
  
  // Status & Progress
  status: 'not_started' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  progress: number;              // 0-100
  
  // Dates
  startDate: Date;
  endDate: Date;
  
  // Related Data
  attachments?: string[];        // File URLs
  kpiIds?: string[];             // Linked KPI IDs
  
  // Audit
  createdBy: string;             // Admin or system
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
// - Composite: (assignedTo, status)
// - Composite: (teamIds, status)
// - Composite: (type, startDate)
// - Single field: status
```

### Task Collection

```typescript
// /tasks/{taskId}
interface Task {
  id: string;                    // Firestore doc ID
  taskNumber: string;            // Auto-incremented: T-001, T-002
  
  // Content
  title: string;
  description: string;
  category?: string;             // Task type/category
  
  // Relationship
  kraId?: string;                // Optional parent KRA
  
  // Priority & Dates
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: Date;
  finalTargetDate?: Date;        // If revised
  
  // Assignment
  assignedTo: string[];          // User IDs
  assignedBy: string;            // Manager/Admin UID
  teamId?: string;
  
  // Status & Progress
  status: 'not_started' | 'assigned' | 'in_progress' | 'blocked' | 
          'completed' | 'cancelled' | 'on_hold' | 'pending_review' | 
          'revision_requested';
  progress: number;              // 0-100
  
  // Revisions
  revisionCount?: number;        // How many times revised
  lastRevisionId?: string;       // Reference to revision request
  
  // Scoring
  kpiScore?: number;             // Performance score 0-100
  
  // Attachments
  attachments?: string[];        // File URLs
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
// - Composite: (assignedTo, status)
// - Composite: (assignedBy, status)
// - Composite: (teamId, status)
// - Composite: (status, dueDate)
// - Single field: status
```

### Task Update Collection (Immutable Log)

```typescript
// /taskUpdates/{updateId}
interface TaskUpdate {
  id: string;                    // Firestore doc ID
  
  // Task Reference
  taskId: string;                // Reference to Task or KRA
  taskTitle: string;             // Denormalized for querying
  
  // User Info
  userId: string;                // Employee who submitted
  userName: string;              // Denormalized
  
  // Update Content
  statusUpdate: string;          // Current status description
  remarks?: string;              // Progress notes (max 2000 chars)
  
  // Extensions
  revisionDate?: Date;           // If requesting deadline extension
  
  // Metadata
  isKRA: boolean;                // Was this for a KRA or Task?
  timestamp: Date;               // Server-set (immutable)
  
  // IMPORTANT: NEVER modify or delete this document
  // It's an immutable audit log
}

// Indexes
// - Composite: (taskId, timestamp)
// - Composite: (userId, timestamp)
// - Single field: taskId
// - Single field: userId
```

### Weekly Report Collection

```typescript
// /weeklyReports/{reportId}
interface WeeklyReport {
  id: string;
  userId: string;                // Employee ID
  employeeName: string;
  week: number;                  // ISO week number
  year: number;
  
  // Metrics
  metrics: {
    speed: number;               // % on-time (0-100)
    quality: number;             // % no-revision (0-100)
    dedication: number;          // % days with activity (0-100)
    delay: number;               // % completed late (0-100)
    overallScore: number;        // Weighted: (speed + quality + dedication - delay) / 3
  };
  
  // Breakdown (for transparency)
  breakdown: {
    totalTasks: number;
    completedOnTime: number;
    completedLate: number;
    completedWithRevision: number;
    completedClean: number;
    daysWithUpdate: number;
    daysInWeek: number;
  };
  
  // Audit
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
// - Composite: (userId, week, year)
// - Single field: userId
```

### Holiday Collection

```typescript
// /holidays/{holidayId}
interface Holiday {
  id: string;
  date: Date;
  title: string;                 // e.g., "New Year's Day"
  type: 'national' | 'company' | 'team';
  teamId?: string;               // If team-specific
  
  // Audit
  createdBy: string;
  createdAt: Date;
}

// Indexes
// - Composite: (date, type)
// - Single field: date
```

### Audit Log Collection

```typescript
// /auditLogs/{logId}
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;                // Who did it?
  
  // Action
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'REQUEST_REVISION';
  resourceType: 'TASK' | 'KRA' | 'USER' | 'TEAM' | 'HOLIDAY';
  resourceId: string;            // What?
  
  // Changes
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  
  // Context
  reason?: string;               // Why? (e.g., "Quality issue")
  ipAddress?: string;
  userAgent?: string;
}

// Indexes
// - Composite: (resourceType, resourceId)
// - Single field: userId
// - Single field: timestamp
```

---

## API Contracts

### Authentication Endpoints

```typescript
// POST /api/auth/login
Request: { email: string; password: string }
Response: { token: string; user: User }

// POST /api/auth/logout
Request: {}
Response: { success: boolean }

// POST /api/auth/refresh-token
Request: { refreshToken: string }
Response: { token: string }

// GET /api/auth/me
Response: { user: User }
```

### KRA Endpoints

```typescript
// GET /api/kras
Query: { userId?: string; teamId?: string; status?: string }
Response: { kras: KRA[] }

// POST /api/kras
Body: { title, description, type, priority, assignedTo, teamIds }
Response: { id: string; kra: KRA }

// GET /api/kras/{id}
Response: { kra: KRA }

// PUT /api/kras/{id}
Body: { fields to update }
Response: { kra: KRA }

// DELETE /api/kras/{id}
Response: { success: boolean }

// POST /api/kras/bulk
Body: { ids: string[]; action: 'activate' | 'deactivate' | 'delete' }
Response: { success: number; failed: number }
```

### Task Endpoints

```typescript
// GET /api/tasks
Query: { userId?, status?, priority?, teamId? }
Response: { tasks: Task[] }

// POST /api/tasks
Body: { title, description, priority, assignedTo, dueDate, kraId? }
Response: { id: string; task: Task }

// GET /api/tasks/{id}
Response: { task: Task; updates: TaskUpdate[] }

// PUT /api/tasks/{id}
Body: { fields to update }
Response: { task: Task }

// DELETE /api/tasks/{id}
Response: { success: boolean }

// POST /api/tasks/{id}/request-revision
Body: { reason: string; newDueDate: Date; notes?: string }
Response: { success: boolean }

// POST /api/tasks/{id}/approve
Response: { success: boolean }

// POST /api/tasks/bulk
Body: { ids: string[]; action: 'assign' | 'delete' | 'update' }
Response: { success: number; failed: number }
```

### Task Update Endpoints

```typescript
// POST /api/tasks/updates
Body: { taskId, statusUpdate, remarks?, revisionDate? }
Response: { id: string; update: TaskUpdate }

// GET /api/tasks/updates?taskId={id}
Response: { updates: TaskUpdate[] }

// GET /api/tasks/updates?userId={id}
Response: { updates: TaskUpdate[] }

// GET /api/tasks/updates?week={week}&year={year}&userId={id}
Response: { updates: TaskUpdate[] }
```

### Analytics Endpoints

```typescript
// GET /api/analytics/scorecard
Response: { users: Array<{ name, speed, quality, dedication, delay, overall }> }

// GET /api/analytics/me
Response: { speed, quality, dedication, delay, overall, trend: [] }

// GET /api/analytics/team?teamId={id}
Response: { team: Team; metrics: {} }

// GET /api/analytics/dashboard
Response: {
  scorecard: [],
  taskSummary: {},
  kraSummary: {},
  activityFeed: [],
  teamHealth: []
}
```

---

## State Machines

### KRA State Machine

```
┌─────────────────────────────────────────────────────────┐
│                     KRA STATES                          │
└─────────────────────────────────────────────────────────┘

             ┌──────────────────────┐
             │     not_started      │
             └──────────┬───────────┘
                        │ (Employee starts work)
                        ↓
             ┌──────────────────────┐
             │     in_progress      │
             └──────────┬───────────┘
                        │ (Employee marks done)
                        ↓
             ┌──────────────────────┐
             │   pending_review     │
             └──────────┬───────────┘
                        │
         ┌──────────────┴──────────────┐
         │                             │
         ↓ (Admin approves)            ↓ (Admin rejects)
┌──────────────────────┐     ┌──────────────────────┐
│     completed        │     │ revision_requested   │
│     (terminal)       │     └──────────┬───────────┘
└──────────────────────┘                │
                                        ↓ (Employee redo)
                                    back to in_progress


Manual Transitions (admin only):
- not_started → on_hold
- in_progress → on_hold
- on_hold → in_progress
- Any state → cancelled
```

### Task State Machine

```
┌─────────────────────────────────────────────────────────┐
│                    TASK STATES                          │
└─────────────────────────────────────────────────────────┘

         ┌──────────────────────┐
         │     not_started      │
         └──────────┬───────────┘
                    │ (Admin creates → assigned)
                    ↓
         ┌──────────────────────┐
         │      assigned        │
         └──────────┬───────────┘
                    │ (Employee starts)
                    ↓
         ┌──────────────────────┐
         │     in_progress      │
         └──────┬───────┬───────┘
                │       │
                │ (blocked)
                ↓       │
    ┌──────────────┐   │
    │   blocked    │   │
    │ (manual)     │←──┘
    └──────┬───────┘
           │ (resume)
           │
           ↓ (employee marks done)
         ┌──────────────────────┐
         │   pending_review     │
         └──────────┬───────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ↓ (approve)           ↓ (reject)
┌──────────────────────┐     ┌──────────────────────┐
│     completed        │     │ revision_requested   │
│     (terminal)       │     └──────────┬───────────┘
└──────────────────────┘                │
                                        ↓ (redo)
                                    back to in_progress


Manual (admin/manager):
- Any → on_hold
- on_hold → in_progress
- Any → cancelled
```

---

## Permission Model

### Firestore Security Rules

```javascript
// firestore.rules (simplified)

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users: Only own profile + admin sees all
    match /users/{userId} {
      allow read: if request.auth.uid == userId || isAdmin();
      allow write: if request.auth.uid == userId || isAdmin();
    }
    
    // Teams: Read team data if member, write if admin
    match /teams/{teamId} {
      allow read: if isTeamMember(teamId) || isAdmin();
      allow write: if isAdmin();
    }
    
    // KRAs: Read if assigned, write if admin
    match /kras/{kraId} {
      allow read: if isAssigned(kraId) || isAdmin() || isTeamManager(kraId);
      allow write: if isAdmin();
    }
    
    // Tasks: Similar to KRAs
    match /tasks/{taskId} {
      allow read: if isAssigned(taskId) || isAdmin() || isTeamManager(taskId);
      allow write: if isAdmin() || (isManager() && isOwnTask(taskId));
    }
    
    // TaskUpdates: Create only, never delete
    match /taskUpdates/{updateId} {
      allow create: if isEmployee() && request.auth.uid == request.resource.data.userId;
      allow read: if isAdmin() || isTeamManager() || isOwner(resource);
      allow update: if false;
      allow delete: if false;
    }
    
    // Helper functions
    function isAdmin() {
      return getUserRole() == 'admin';
    }
    
    function isManager() {
      return getUserRole() == 'manager';
    }
    
    function isEmployee() {
      return getUserRole() == 'employee';
    }
    
    function getUserRole() {
      return getUserDoc().data.role;
    }
    
    function getUserDoc() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid));
    }
  }
}
```

---

## Automation Flows

### KRA Generation Cron Job

```typescript
// Trigger: Daily @ 12:00 AM UTC
// Location: Cloud Functions (or external service)

async function generateScheduledKRAs() {
  const templates = await getActiveKRATemplates();
  let generated = 0, skipped = 0;
  
  for (const template of templates) {
    const today = new Date();
    
    // Check if should generate
    if (!shouldGenerateKRA(template, today)) {
      skipped++;
      continue;
    }
    
    // Create KRA from template
    const kra = {
      ...template,
      status: 'not_started',
      progress: 0,
      startDate: today,
      endDate: calculateEndDate(template.type, today),
      createdBy: 'system',
      createdAt: today,
    };
    
    const kraRef = await admin.firestore().collection('kras').add(kra);
    
    // Notify users
    for (const userId of template.assignedTo) {
      await sendNotification(userId, {
        type: 'KRA_ASSIGNED',
        kraId: kraRef.id,
        kraTitle: template.title,
      });
    }
    
    // Update template
    await template.ref.update({ lastGenerated: today });
    
    generated++;
  }
  
  console.log(`Generated: ${generated}, Skipped: ${skipped}`);
}

function shouldGenerateKRA(template, today) {
  // Skip if not active
  if (!template.isActive) return false;
  
  // Skip if already generated today
  if (isSameDay(template.lastGenerated, today)) return false;
  
  // Skip non-working days for daily KRAs
  if (template.type === 'daily') {
    if (isWeekend(today) || isHoliday(today)) return false;
  }
  
  return true;
}
```

### Real-Time Scoring Recalculation

```typescript
// Trigger: Every TaskUpdate creation
// Location: Cloud Function or Server Action

async function onTaskUpdateCreated(update: TaskUpdate) {
  const userId = update.userId;
  
  // Recalculate user's scores
  const scores = await calculateUserScores(userId);
  
  // Update leaderboard
  await updateLeaderboard(userId, scores);
  
  // Check thresholds and send alerts
  if (scores.speed < 60) {
    await sendAlert(userId, {
      type: 'LOW_SPEED',
      value: scores.speed,
      target: 75,
    });
  }
  
  // Publish real-time event
  await publishEvent('SCORECARD_UPDATED', {
    userId,
    scores,
    timestamp: new Date(),
  });
}

async function calculateUserScores(userId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // Get all updates in last 30 days
  const updates = await db.collection('taskUpdates')
    .where('userId', '==', userId)
    .where('timestamp', '>=', thirtyDaysAgo)
    .get();
  
  // Get all tasks/KRAs
  const taskIds = new Set(updates.docs.map(u => u.data().taskId));
  const allItems = await Promise.all(
    Array.from(taskIds).map(id => getTaskOrKRA(id))
  );
  
  // Calculate metrics
  const onTime = allItems.filter(t => t.completedDate <= t.dueDate).length;
  const total = allItems.length;
  const speed = total > 0 ? (onTime / total) * 100 : 0;
  
  const noRevision = allItems.filter(t => (t.revisionCount || 0) === 0).length;
  const quality = total > 0 ? (noRevision / total) * 100 : 0;
  
  const daysWorking = getUniqueDays(updates.docs.map(u => u.data().timestamp));
  const dedication = (daysWorking / 30) * 100;
  
  const late = allItems.filter(t => t.completedDate > t.dueDate).length;
  const delay = total > 0 ? (late / total) * 100 : 0;
  
  const overall = (speed + quality + dedication - delay) / 3;
  
  return { speed, quality, dedication, delay, overall };
}
```

---

## Performance Considerations

### Firestore Indexes

Create these composite indexes for optimal performance:

1. `taskUpdates`: (taskId, timestamp DESC)
2. `taskUpdates`: (userId, timestamp DESC)
3. `tasks`: (assignedTo, status)
4. `tasks`: (teamId, status)
5. `kras`: (assignedTo, status)
6. `kras`: (type, startDate)
7. `weeklyReports`: (userId, week, year)

### Query Optimization

- Always filter by indexed fields first
- Limit results (e.g., `limit(100)`)
- Use pagination for large datasets
- Cache frequently accessed data (user profile, leaderboard)

### Scaling Limits

- Single user: Can handle 10,000+ tasks/KRAs
- Single organization (100 users): Scorecard updates in < 1 second
- Concurrent users: 10,000+ simultaneous connections

---

**Document Owner**: Engineering Team  
**Last Updated**: January 16, 2026  
**Next Review**: January 30, 2026
