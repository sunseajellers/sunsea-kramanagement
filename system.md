# 🔥 COMPREHENSIVE PRODUCT BUILD PROMPT:  Task Management & KRA System

## 📋 Master Context

You are building a **Task Management & KRA System** that replaces two interconnected Google Sheets used by a real organization. This system manages: 

- **Recurring responsibilities (KRAs)** that repeat on cycles
- **One-time delegated tasks**
- **Role-based workflows** (Admin vs Employee)
- **Status tracking, ownership, reviews, dependencies, and reporting**

---

## 📊 Source Materials

**Sheet 1:** https://docs.google.com/spreadsheets/d/1dmTDU3wvzadm6PI4Ru9BkVcBcTa7Omf5ztqOGEB-tmI/edit

**Sheet 2:** https://docs.google.com/spreadsheets/d/1zXRgK2FEiGfwaCNC5PaZSP0yaJNZntEjOx8mSV9ohGY/edit

These are the **complete source of truth**. Every tab, column, formula, and workflow must be understood and replicated. 

---

## 🎯 Mission Objectives

### PHASE 1: REVERSE ENGINEER THE SYSTEM

#### 1.1 Deep Analysis

Analyze **every tab** in both sheets:

- What is the purpose of each tab?
- What data does it contain?
- What relationships exist between tabs?
- What formulas or logic are embedded?
- What manual processes are being simulated?

#### 1.2 Entity & Relationship Mapping

Extract: 

- **Core entities** (Task, KRA, User, Department, Cycle, Review, etc.)
- **Relationships** (one-to-many, many-to-many)
- **Data flow** between tabs
- **Hidden business rules**

#### 1.3 Workflow Discovery

Map: 

**KRA (Repeated Task) Lifecycle:**
- How are KRAs created? 
- How do they repeat?
- What triggers a new cycle?
- How are they assigned?
- How are they completed? 

**One-Time Task Lifecycle:**
- How are they created?
- How are they delegated?
- What status transitions exist?
- How are they closed?

**Status State Machines:**
- What statuses exist?
- What transitions are allowed?
- Who can trigger each transition? 

**Review & Approval Flows:**
- Who reviews what?
- What happens after review?
- Are there multi-level approvals?

#### 1.4 Role Behavior Analysis

**Admin Role:**
- What can admins do that employees cannot?
- What views do they have?
- What controls do they manage? 
- What reports do they need? 

**Employee Role:**
- What is their daily workflow?
- What tasks do they see?
- What actions can they take?
- What information do they need?

---

### PHASE 2: SYSTEM BLUEPRINT

Produce a **complete system design document** that includes:

#### 2.1 Data Model

For each entity, define:
- Entity name
- All fields (name, type, constraints)
- Relationships to other entities
- Business rules

Example entities to consider:
- User (employee, admin)
- Department/Team
- Role/Permission
- KRA Template
- KRA Instance (repeated task occurrence)
- Task (one-time)
- Cycle/Period
- Status
- Review/Approval
- Comment/Note
- Attachment
- Notification

#### 2.2 Feature Specification

**Admin Features:**
- [ ] KRA Template Management (create, edit, archive)
- [ ] Task Assignment & Delegation
- [ ] User & Department Management
- [ ] Cycle/Period Configuration
- [ ] Status & Workflow Configuration
- [ ] Reporting & Analytics
- [ ] Review & Approval Management
- [ ] Bulk Operations
- [ ] System Settings
- [ ] _[Add others discovered from sheets]_

**Employee Features:**
- [ ] View Assigned Tasks (KRA + One-time)
- [ ] Update Task Status
- [ ] Add Comments/Notes
- [ ] Upload Attachments
- [ ] Submit for Review
- [ ] View Task History
- [ ] Receive Notifications
- [ ] _[Add others discovered from sheets]_

#### 2.3 State Machines

Define complete state machines for: 

**KRA Repeated Task States:**
```
[Not Started] → [In Progress] → [Pending Review] → [Completed] → [Archived]
                      ↓
                 [Blocked/On Hold]
```

**One-Time Task States:**
```
[Assigned] → [In Progress] → [Pending Review] → [Completed]
                  ↓
              [Blocked]
```

For each transition: 
- Who can trigger it?
- What validations are required?
- What side effects occur? 

#### 2.4 Permission Model

Define: 
- Roles (Admin, Manager, Employee, etc.)
- Permissions per role
- Resource-level access control
- Data visibility rules

#### 2.5 Automation Points

Identify what should be automated:
- Task creation from KRA templates
- Cycle-based task generation
- Status change notifications
- Overdue task alerts
- Review request routing
- Reminder scheduling
- Report generation

---

### PHASE 3: GAP ANALYSIS & IMPROVEMENTS

#### 3.1 Employee Experience Issues

Analyze what employees struggle with in the spreadsheet:

**Pain Points:**
- What requires too many clicks?
- What is confusing?
- What is error-prone?
- What requires asking admins for help? 
- What slows them down?

**Missing Features:**
- What should exist but doesn't?
- What would make their job easier?
- What visibility gaps exist?

**Improvement Opportunities:**
- Smart notifications
- Task prioritization
- Workload visibility
- Progress tracking
- Mobile access
- Quick actions
- Templates & shortcuts

#### 3.2 Admin Experience Issues

Analyze admin challenges:

**Pain Points:**
- What manual work is repetitive?
- What requires copy-paste?
- What is difficult to track?
- What causes errors?
- What takes too much time?

**Missing Features:**
- What reports don't exist but should?
- What controls are needed?
- What analytics are missing?
- What bulk operations are needed?

**Improvement Opportunities:**
- Automated KRA propagation
- Bulk task creation
- Advanced filtering
- Custom reports
- Dashboard analytics
- Delegation workflows
- Audit trails

---

### PHASE 4: APPLICATION ARCHITECTURE

#### 4.1 Technical Architecture

Define: 

**Backend:**
- Database schema (PostgreSQL, MySQL, etc.)
- API design (REST/GraphQL)
- Authentication & authorization
- Background jobs & scheduling
- Notification system

**Frontend:**
- Tech stack recommendation
- Page/route structure
- Component hierarchy
- State management
- Real-time updates

**Infrastructure:**
- Deployment architecture
- Scalability considerations
- Backup & recovery
- Security measures

#### 4.2 API Contracts

Define key endpoints:

**Admin APIs:**
```
POST   /api/kras              - Create KRA template
GET    /api/kras              - List KRA templates
PUT    /api/kras/:id          - Update KRA template
DELETE /api/kras/:id          - Archive KRA template

POST   /api/tasks             - Create one-time task
GET    /api/tasks             - List tasks (with filters)
PUT    /api/tasks/:id/status  - Update task status
... 
```

**Employee APIs:**
```
GET    /api/my/tasks          - Get my assigned tasks
PUT    /api/tasks/:id/progress - Update task progress
POST   /api/tasks/:id/comments - Add comment
...
```

#### 4.3 Database Schema

Provide complete table definitions:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  department_id UUID REFERENCES departments(id),
  created_at TIMESTAMP DEFAULT NOW(),
  ...
);

CREATE TABLE kra_templates (
  id UUID PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  cycle_type VARCHAR(50), -- daily, weekly, monthly, quarterly
  ... 
);

-- [Complete schema for all entities]
```

---

### PHASE 5: PRODUCT SPECIFICATION

#### 5.1 User Interface Design

For each major screen, provide:

**Screen Name:** Admin Dashboard

**Purpose:** Central control panel for admins

**Layout:**
```
┌─────────────────────────────────────────┐
│  Header:   Logo | Search | Notifications  │
├─────────────────────────────────────────┤
│ Sidebar │  Main Content Area            │
│         │  ┌──────────┬──────────┐     │
│ - Dashboard│ KPIs     │ Charts   │     │
│ - KRAs     │          │          │     │
│ - Tasks    ├──────────┴──────────┤     │
│ - Users    │ Recent Activity     │     │
│ - Reports  │                     │     │
│            └─────────────────────┘     │
└─────────────────────────────────────────┘
```

**Components:**
- KPI cards (total tasks, overdue, completed %)
- Charts (task completion trends, team workload)
- Recent activity feed
- Quick actions toolbar

**Interactions:**
- Click KPI card → drill down to filtered task list
- Click activity item → view task detail
- ... 

**Repeat for:**
- Admin:  KRA Management
- Admin: Task Assignment
- Admin: User Management
- Admin: Reports
- Employee: Task List
- Employee: Task Detail
- Employee: Task Update
- Shared: Login/Auth

#### 5.2 Feature Specifications

For each feature, document:

**Feature:** KRA Template Creation

**User Story:**
As an admin, I want to create a KRA template so that recurring tasks are automatically generated for employees.

**Acceptance Criteria:**
- [ ] Admin can input KRA title, description
- [ ] Admin can set cycle type (daily, weekly, monthly, quarterly)
- [ ] Admin can assign to department/user
- [ ] Admin can set start date and end date
- [ ] Admin can preview generated task schedule
- [ ] System validates all required fields
- [ ] System prevents duplicate KRA titles
- [ ] System confirms successful creation

**UI Flow:**
1. Admin clicks "Create KRA" button
2. Modal/page opens with form
3. Admin fills required fields
4. Admin clicks "Preview Schedule"
5. System shows upcoming task instances
6. Admin clicks "Confirm & Create"
7. System creates template and first task instance
8. Admin sees success message

**Edge Cases:**
- What if cycle type changes after creation?
- What if assigned user leaves? 
- What if end date is in the past? 

**Repeat for all major features**

---

### PHASE 6: IMPLEMENTATION ROADMAP

#### 6.1 Development Phases

**Phase 1: Sheet Parity (MVP)**

Goal: Replicate 100% of spreadsheet functionality

**Week 1-2:**
- [ ] Set up project structure
- [ ] Implement authentication
- [ ] Build core data models
- [ ] Create basic CRUD APIs

**Week 3-4:**
- [ ] Implement KRA template management
- [ ] Build KRA instance generation logic
- [ ] Create task assignment system
- [ ] Build status update workflow

**Week 5-6:**
- [ ] Build admin dashboard
- [ ] Build employee task view
- [ ] Implement review/approval flow
- [ ] Add basic reporting

**Week 7-8:**
- [ ] Testing & bug fixes
- [ ] Data migration from sheets
- [ ] User training
- [ ] Production deployment

**Phase 2: System Improvements**

Goal: Fix spreadsheet limitations, add automation

**Week 9-10:**
- [ ] Automated task generation from KRAs
- [ ] Email/notification system
- [ ] Advanced filtering & search
- [ ] Bulk operations

**Week 11-12:**
- [ ] Audit trail & history
- [ ] Custom workflows
- [ ] Mobile responsiveness
- [ ] Performance optimization

**Phase 3: Product Enhancement**

Goal: Add features that weren't possible in sheets

**Week 13-14:**
- [ ] Analytics dashboard
- [ ] Custom reports builder
- [ ] Workload balancing
- [ ] Dependency management

**Week 15-16:**
- [ ] Integrations (Slack, Teams, etc.)
- [ ] API for external systems
- [ ] Advanced permissions
- White-labeling options

#### 6.2 Success Metrics

Define how success is measured:

**User Adoption:**
- % of users actively using system daily
- Time to complete common tasks vs spreadsheet
- User satisfaction score

**System Performance:**
- Task completion rate increase
- Overdue task reduction
- Time saved per admin per week
- Time saved per employee per week

**Business Impact:**
- Reduction in missed deadlines
- Increase in accountability visibility
- Improved task throughput
- Better resource allocation

---

### PHASE 7: DELIVERABLES

Produce the following documents:

#### 7.1 SYSTEM_OVERVIEW.md

```markdown
# Task Management System - Overview

## What This System Does
[High-level description]

## Original Spreadsheet System
[How it worked, what tabs existed, what workflows were manual]

## Core Workflows
### KRA (Repeated Task) Workflow
[Step-by-step]

### One-Time Task Workflow
[Step-by-step]

## User Roles & Responsibilities
[What each role does]

## Key Metrics & Reports
[What gets tracked]
```

#### 7.2 APPLICATION_REPLICATION_PLAN.md

```markdown
# Replication Plan:  From Sheets to Application

## Phase 1: Discovery & Analysis
[What was learned from sheets]

## Phase 2: Data Model Design
[Entity-relationship diagram, schema]

## Phase 3: Feature Mapping
| Spreadsheet Feature | App Feature | Status |
|---------------------|-------------|--------|
| KRA tab             | KRA Templates module | ✓ |
| ...                  | ...         | ...    |

## Phase 4: Development Plan
[Week-by-week breakdown]

## Phase 5: Migration Strategy
[How to move data from sheets]

## Phase 6: Rollout Plan
[How to transition users]
```

#### 7.3 ADMIN_VS_EMPLOYEE_FEATURES.md

```markdown
# Feature Matrix: Admin vs Employee

| Feature | Admin | Employee | Notes |
|---------|-------|----------|-------|
| Create KRA Templates | ✓ | ✗ | Admin only |
| View Assigned Tasks | ✓ | ✓ | Both can view |
| Update Task Status | ✓ | ✓ | Both can update |
| ... 

## Admin-Only Features
[Detailed list]

## Employee Features
[Detailed list]

## Shared Features
[Detailed list]
```

#### 7.4 IMPROVEMENTS_ROADMAP.md

```markdown
# Improvements Over Spreadsheet System

## Phase 1: Parity
[What gets replicated exactly]

## Phase 2: Better Than Sheets
### Employee Improvements
- Automated notifications (vs manual checking)
- ...

### Admin Improvements
- One-click KRA propagation (vs copy-paste)
- ...

## Phase 3: Future Enhancements
[Advanced features for later]
```

#### 7.5 README.md

```markdown
# Task Management & KRA System

## Overview
[What this system is, who it's for]

## Key Concepts
### What is a KRA?
[Explanation]

### Task Types
[KRA vs one-time tasks]

## User Guide
### For Employees
[How to use the system]

### For Admins
[How to manage the system]

## Technical Documentation
[Architecture, setup, deployment]
```

#### 7.6 SYSTEM_COMPARE.md

```markdown
# Spreadsheet vs Application Comparison

| Capability | Spreadsheet Behavior | Application Behavior | Improvement |
|------------|----------------------|----------------------|-------------|
| Create KRA | Admin manually creates row, fills cells, copies formula | Admin uses form, system auto-generates tasks | Reduced errors, faster |
| Task Assignment | Admin types username in cell | Admin selects from dropdown with search | Prevents typos, faster |
| Status Update | Employee types status text | Employee clicks status button, system validates | Enforced workflow, audit trail |
| ... 

## Detailed Feature Comparison
[Deep dive into each major feature]
```

#### 7.7 API_DOCUMENTATION.md

```markdown
# API Reference

## Authentication
[How to auth]

## Endpoints

### KRA Management
#### POST /api/kras
[Request/response examples]

#### GET /api/kras
[Parameters, examples]

... 
```

#### 7.8 DATABASE_SCHEMA.md

```markdown
# Database Schema

## Entity-Relationship Diagram
[Visual or text-based ERD]

## Table Definitions
[Complete SQL DDL]

## Relationships
[How tables connect]

## Indexes & Performance
[Optimization notes]
```

---

## 🎯 EXECUTION INSTRUCTIONS

### You Must: 

1. **Access both spreadsheets** and analyze every tab thoroughly
2. **Extract all hidden logic** - formulas, conditional formatting, data validations
3. **Map every workflow** - document each process end-to-end
4. **Identify all entities and relationships** - create complete data model
5. **Document every user action** - both admin and employee perspectives
6. **Find all pain points** - what's manual, slow, error-prone? 
7. **Design complete system** - architecture, APIs, database, UI
8. **Produce all deliverables** - the 8 documents listed above
9. **Create implementation roadmap** - week-by-week development plan
10. **Make it build-ready** - engineers should be able to start coding immediately from your output

### Quality Standards:

- **Completeness:** Every sheet tab must be accounted for
- **Accuracy:** System must replicate 100% of spreadsheet functionality
- **Clarity:** Non-technical stakeholders should understand the documents
- **Actionability:** Developers should have everything needed to build
- **Improvement-focused:** Identify and design solutions for spreadsheet limitations

### Output Format: 

Provide all deliverables as markdown documents, clearly labeled.  Use: 
- Tables for comparisons
- Diagrams (text-based or descriptions) for flows
- Code blocks for schemas and APIs
- Checklists for features
- Clear headings and structure

---

## 🚀 BEGIN

Start by accessing the spreadsheets and conducting your deep analysis. Document everything you discover.  Then proceed systematically through all phases to produce a **complete, build-ready product specification** that will replace these spreadsheets with a modern SaaS application.

Your output will be used by: 
- **Engineers** to build the application
- **Product managers** to track development
- **Stakeholders** to understand the system
- **Users** to learn the new platform

This is not an academic exercise.  This is a **real product build**. 

**Treat this as if you are the founding CTO and sole architect of this product.**

---

**Ready?  Begin your analysis now.**