# Feature Matrix: Admin vs Employee Capabilities

**Version**: 1.0.0  
**Updated**: January 16, 2026  

---

## Quick Reference

| Feature | Admin | Manager | Employee |
|---------|-------|---------|----------|
| Create KRA Templates | ✅ | ❌ | ❌ |
| Create Tasks | ✅ | ✅ | ❌ |
| View All Tasks | ✅ | ✅ (Team) | My Own |
| View All KRAs | ✅ | ✅ (Team) | My Own |
| Submit Status Updates | ✅ | ✅ | ✅ |
| View Scorecards | ✅ | ✅ (Team) | My Own |
| Request Revisions | ✅ | ✅ (Team) | ❌ |
| Approve Tasks | ✅ | ✅ (Team) | ❌ |
| Manage Users | ✅ | ❌ | ❌ |
| Manage Teams | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | My Own |
| Export Data | ✅ | ✅ (Team) | ❌ |
| Delete Tasks | ✅ | ❌ | ❌ |
| Configure Holidays | ✅ | ❌ | ❌ |

---

## Detailed Feature Matrix

### 1. KRA Management

| Feature | Admin | Manager | Employee | Details |
|---------|-------|---------|----------|---------|
| **View KRA Library** | ✅ All | ❌ | ❌ | Admin sees all templates |
| **Create KRA Template** | ✅ | ❌ | ❌ | Only admin can define repeating tasks |
| **Edit KRA Template** | ✅ | ❌ | ❌ | Can change title, description, type |
| **Activate/Deactivate KRA** | ✅ | ❌ | ❌ | Controls whether it generates automatically |
| **Delete KRA Template** | ✅ | ❌ | ❌ | Only if no instances exist |
| **View Active KRAs (My Work)** | ✅ | ✅ | ✅ | KRAs assigned to self |
| **View Team KRAs** | ✅ All | ✅ Own Team | ❌ | Manager sees team's KRAs |
| **Update KRA Status** | ✅ | ✅ | ✅ (Own) | Change status, mark complete |
| **Request KRA Revision** | ✅ | ✅ | ❌ | Admin/Manager can request re-work |
| **View KRA History** | ✅ All | ✅ Team | My Own | See past KRA instances |

---

### 2. Task Management

| Feature | Admin | Manager | Employee | Details |
|---------|-------|---------|----------|---------|
| **Create Task** | ✅ | ✅ | ❌ | Delegate one-time work |
| **Edit Task** | ✅ (All) | ✅ (Own) | ❌ | Creator can edit before start |
| **Delete Task** | ✅ | ❌ | ❌ | Soft delete, archived |
| **Assign Task** | ✅ | ✅ | ❌ | Must specify assignees |
| **Reassign Task** | ✅ | ✅ | ❌ | Change who it's assigned to |
| **Link to KRA** | ✅ | ✅ | ❌ | Associate task with parent KRA |
| **View All Tasks** | ✅ | ✅ (Team) | My Own | Filter by status, priority |
| **Update Status** | ✅ | ✅ | ✅ (Assigned) | Mark progress, complete |
| **Set Priority** | ✅ | ✅ | ❌ | Only creator can set |
| **Set Due Date** | ✅ | ✅ | ❌ | Only creator can set |
| **Request Revision** | ✅ | ✅ | ❌ | Ask employee to rework |
| **Approve Completion** | ✅ | ✅ | ❌ | Mark task as officially done |
| **View Task History** | ✅ All | ✅ Team | My Own | See all updates submitted |

---

### 3. Status Updates (The Central Spoke)

| Feature | Admin | Manager | Employee | Details |
|---------|-------|---------|----------|---------|
| **Submit Daily Update** | ✅ | ✅ | ✅ | Log progress on task/KRA |
| **View My Updates** | ✅ | ✅ | ✅ | See own submission history |
| **View Team Updates** | ✅ All | ✅ Own Team | ❌ | See team's daily activity |
| **Edit Update** | ❌ | ❌ | ❌ | Immutable (audit trail) |
| **Delete Update** | ❌ | ❌ | ❌ | Immutable (audit trail) |
| **Mark as Revision Needed** | ✅ | ✅ | ❌ | Flag that more work needed |
| **Set Revision Deadline** | ✅ | ✅ | ❌ | When to resubmit |
| **View Revision Queue** | ✅ All | ✅ Team | ❌ | See pending rework |

---

### 4. Performance Scoring

| Feature | Admin | Manager | Employee | Details |
|---------|-------|---------|----------|---------|
| **View Org Scorecard** | ✅ | ❌ | ❌ | All employees ranked |
| **View Team Scorecard** | ✅ | ✅ | ❌ | Team members ranked |
| **View My Scores** | ✅ | ✅ | ✅ | Speed, Quality, Dedication, Delay |
| **View Score Breakdown** | ✅ | ✅ | ✅ | How scores are calculated |
| **View Trending Scores** | ✅ | ✅ | ✅ | 7-day, 30-day trends |
| **Compare to Team Average** | ✅ | ✅ | ✅ | See if above/below team |
| **View Historical Scores** | ✅ | ✅ | Limited | Past 3 months |
| **Download Score Report** | ✅ | ✅ | ❌ | Export as CSV/PDF |

---

### 5. Reporting & Analytics

| Feature | Admin | Manager | Employee | Details |
|---------|-------|---------|----------|---------|
| **View MIS Consolidated** | ✅ | ❌ | ❌ | Master scorecard |
| **View Team Report** | ✅ | ✅ | ❌ | Team summary |
| **View Weekly Report** | ✅ All | ✅ Team | My Own | KPI tracking by week |
| **View Monthly Report** | ✅ All | ✅ Team | My Own | Monthly summary |
| **View Trend Analysis** | ✅ | ✅ | ✅ | Charts, forecasting |
| **Generate Custom Report** | ✅ | Limited | ❌ | Specify metrics |
| **Schedule Email Reports** | ✅ | ✅ | ❌ | Automatic delivery |
| **Export to Excel** | ✅ | ✅ (Team) | ❌ | Bulk download |

---

### 6. System Administration

| Feature | Admin | Manager | Employee | Details |
|---------|-------|---------|----------|---------|
| **Create User** | ✅ | ❌ | ❌ | Add new employee |
| **Assign User Role** | ✅ | ❌ | ❌ | Set admin/manager/employee |
| **Deactivate User** | ✅ | ❌ | ❌ | Disable login |
| **Create Team** | ✅ | ❌ | ❌ | Group employees |
| **Assign Team Manager** | ✅ | ❌ | ❌ | Set manager for team |
| **Add User to Team** | ✅ | ❌ | ❌ | Membership |
| **Define Holidays** | ✅ | ❌ | ❌ | Configure off-days |
| **Set Working Days** | ✅ | ❌ | ❌ | Weekday/weekend config |
| **Configure KRA Schedule** | ✅ | ❌ | ❌ | Gen frequency, times |
| **View Activity Log** | ✅ | ❌ | ❌ | System audit trail |
| **Manage Permissions** | ✅ | ❌ | ❌ | RBAC configuration |
| **View System Health** | ✅ | ❌ | ❌ | Uptime, errors, stats |

---

### 7. Notifications & Alerts

| Feature | Admin | Manager | Employee | Details |
|---------|-------|---------|----------|---------|
| **Task Assigned Alert** | ✅ | ✅ | ✅ | When task delegated to you |
| **KRA Due Soon Alert** | ✅ | ✅ | ✅ | 2 days before due |
| **Task Overdue Alert** | ✅ | ✅ | ✅ | When past due date |
| **Revision Request Alert** | ✅ | ✅ | ✅ | When work needs redo |
| **Completion Review Alert** | ✅ | ✅ | ❌ | When task ready for approval |
| **Team Update Digest** | ✅ | ✅ | ❌ | Daily summary of team activity |
| **Performance Threshold Alert** | ✅ | ✅ | ✅ | Score drops below target |
| **Customize Notification Settings** | ✅ | ✅ | ✅ | Choose what alerts to receive |

---

### 8. Data Privacy & Visibility

| Feature | Admin | Manager | Employee | Details |
|---------|-------|---------|----------|---------|
| **View All User Data** | ✅ | ❌ | ❌ | Complete visibility |
| **View Team Member Data** | ✅ | ✅ | ❌ | Manager sees team |
| **View Own Profile** | ✅ | ✅ | ✅ | Name, email, team |
| **Edit Own Profile** | ✅ | ✅ | ✅ | Update personal info |
| **Anonymized Leaderboard** | ✅ | ✅ | ✅ | Rankings visible |
| **Full Name Visibility** | ✅ | ✅ | ✅ | See who's who |
| **Contact Directory** | ✅ | ✅ | Limited | Phone, email access |

---

### 9. Data Export & Integration

| Feature | Admin | Manager | Employee | Details |
|---------|-------|---------|----------|---------|
| **Export Tasks (CSV)** | ✅ | ✅ (Team) | ❌ | Bulk download |
| **Export KRAs (CSV)** | ✅ | ✅ (Team) | ❌ | Bulk download |
| **Export Scorecard (PDF)** | ✅ | ✅ (Team) | ❌ | Formatted report |
| **Bulk Import Tasks** | ✅ | ❌ | ❌ | CSV upload |
| **Bulk Import KRAs** | ✅ | ❌ | ❌ | CSV upload |
| **API Access** | ✅ | Limited | Limited | Programmatic access |
| **Webhook Subscriptions** | ✅ | ❌ | ❌ | Real-time events |

---

## Permission Rules

### Admin Permissions
- **Full access**: Can do anything
- **Audits everything**: Can see all changes, all users, all data
- **System control**: Manages users, teams, holidays, schedules

### Manager Permissions
- **Team scope**: Can manage own team only
- **Task assignment**: Can create/assign tasks to team
- **Review authority**: Can approve/request revisions from team
- **Reporting**: Can access team reports
- **Cannot**: Manage other teams, system settings, delete tasks

### Employee Permissions
- **Personal scope**: Can manage own tasks and KRAs
- **Update submission**: Can submit daily updates
- **Limited visibility**: Cannot see other employees' full data (privacy)
- **Cannot**: Create tasks, manage users, view org reports, delete anything

---

## Access Control Implementation

### Firestore Security Rules Pattern
```javascript
// src/firestore.rules

// Users can read their own data
match /users/{userId} {
  allow read: if request.auth.uid == userId || isAdmin();
  allow write: if isAdmin();
}

// Tasks: Admin sees all, Manager sees team, Employee sees own
match /tasks/{taskId} {
  allow read: if isAdmin() || 
              isManagedBy(resource.data.teamId) ||
              isAssigned(resource.data.assignedTo);
  allow write: if isAdmin() || 
               (isManager() && isTeamTask(resource.data.teamId));
}

// KRAs: Similar pattern
match /kras/{kraId} {
  allow read: if isAdmin() || 
              isAssigned(resource.data.assignedTo) ||
              isManagedBy(resource.data.teamIds);
  allow write: if isAdmin();
}

// TaskUpdates: Employees can submit, managers/admins can read
match /taskUpdates/{updateId} {
  allow create: if isEmployee() && isOwner(request.auth.uid);
  allow read: if isAdmin() || 
              isManagedBy(resource.data.teamId) ||
              resource.data.userId == request.auth.uid;
  allow write: if false; // Immutable
  allow delete: if false; // Never delete
}
```

---

## Feature Toggle Matrix

For gradual rollout of features:

```typescript
export const FEATURE_FLAGS = {
  BULK_TASK_IMPORT: { admin: true, manager: false, employee: false },
  BULK_KRA_IMPORT: { admin: true, manager: false, employee: false },
  CUSTOM_REPORTS: { admin: true, manager: true, employee: false },
  TEAM_COLLABORATION: { admin: true, manager: true, employee: true },
  MOBILE_APP: { admin: true, manager: true, employee: true },
  API_ACCESS: { admin: true, manager: false, employee: false },
  WORKFLOW_AUTOMATION: { admin: true, manager: true, employee: false },
};
```

---

## Field-Level Visibility

Some fields should be hidden based on role:

| Field | Admin | Manager | Employee |
|-------|-------|---------|----------|
| `user.password` | ❌ | ❌ | ❌ |
| `user.email` | ✅ | ✅ (Team) | Own Only |
| `user.lastLogin` | ✅ | ✅ (Team) | ❌ |
| `task.assignedBy` | ✅ | ✅ | ✅ |
| `task.dueDate` | ✅ | ✅ | ✅ |
| `kra.priority` | ✅ | ✅ | ✅ |
| `scorecard.speed` | ✅ | ✅ | ✅ |
| `scorecard.quality` | ✅ | ✅ | ✅ |

---

## Audit Trail

All actions logged:

```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;              // Who did it?
  action: 'CREATE'|'UPDATE'|'DELETE'|'APPROVE'|'REJECT';
  resourceType: 'TASK'|'KRA'|'USER'|'TEAM';
  resourceId: string;           // What?
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  reason?: string;             // Why?
}
```

---

**Document Owner**: Product & Security Team  
**Last Updated**: January 16, 2026  
**Next Review**: January 23, 2026
