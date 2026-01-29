# 💎 JewelMatrix: Enterprise Internal Management System

**Authorize Source of Truth (v1.0.0)**

JewelMatrix is a high-performance, internal "Digital Operating System" designed to synchronize enterprise strategy with tactical execution. It serves as the single source of truth for staff accountability, performance tracking, and institutional knowledge management.

---

## 1️⃣ Product Overview

### What is JewelMatrix?
JewelMatrix is a comprehensive SaaS-style internal platform that replaces fragmented spreadsheets and legacy HR tools. It unifies high-level Objectives (OKRs), measurable performance targets (KPIs), daily Task management, and internal Support (Helpdesk) into a single, cohesive environment.

### Who is it for?
*   **Management & Admins**: To delegate work, set strategic goals, and monitor real-time organizational health through automated scoring and reports.
*   **Employees (Internal Staff)**: To manage daily tasks, track personal performance, resolve internal tickets, and access the company knowledge base.

### Core Problems Solved
*   **The Execution Gap**: Strategies (OKRs) often fail because they aren't linked to daily tasks. JewelMatrix bridges this link.
*   **Subjective Performance Reviews**: Eliminates bias by using an automated, real-time Scoring Engine.
*   **Fragmented Knowledge**: Prevents repetitive questions by converting support tickets into permanent Learning Hub articles.
*   **Hidden Bottlenecks**: High-visibility overdue logic ensures task blockers are identified immediately.

---

## 2️⃣ Feature Inventory (A–Z)

### 👥 Roles & Access Control
*   **Hybrid RBAC**: System-defined roles (`admin`, `manager`, `employee`) combined with custom permission capabilities.
*   **Granular Permissions**: Modules have specific `access`, `create`, `edit`, and `delete` toggles.

### 🏢 Departments & Employees
*   **Employee IDs**: Auto-generated sequential IDs (e.g., `EMP-0001`).
*   **Full Profiles**: Includes joining dates, reporting structures, departments, and emergency contacts.
*   **Manager Linking**: Every employee is linked to a reporting manager for task and OKR approval flows.

### ✅ Tasks & Delegation
*   **Multi-State Lifecycle**: 10 status states including `not_started`, `revision_requested`, and `overdue`.
*   **Delegation Flow**: Managers can assign tasks to individuals; employees can request extensions or status updates.
*   **Automated Verification**: Completed tasks can require manager verification before moving to final 'Completed' status.

### 🎫 Helpdesk / Tickets
*   **Ticket Numbers**: Auto-generated (e.g., `TKT-1001`).
*   **Categorization**: It Support, HR Helpdesk, IT, Accounts, Stationery, etc.
*   **Resolution Pipeline**: Multi-solution support per ticket with requester acceptance flows.

### 📈 KPIs & OKRs
*   **OKRs**: Objectives with binary or numeric Key Results. Linked directly to Tasks.
*   **KPIs**: Weekly pulse tracking for repeated metrics (e.g., "Daily Sales Volume"). Planned vs. Actual tracking.
*   **Strategy Matching**: Every Task can be optionally tagged to a KRA (Key Result Area).

### 🏆 Scoring & Performance
*   **Automated Scoring**: Every task completion generates a score (0-100) based on priority and timeliness.
*   **Personal Dashboard**: Employees see their "Mission Control" with sorted overdue, today, and upcoming tasks.

### 📚 Learning Hub
*   **Article Types**: SOPs, FAQs, Guides, and Videos.
*   **Helpfulness Feedback**: Staff can vote on articles, highlighting the most effective internal guides.
*   **Ticket Conversion**: One-click promotion of ticket solutions into permanent SOPs.

---

## 3️⃣ User Journeys

### 🛠 Admin Journey
1.  **Identity Setup**: Create Departments and define Custom Roles.
2.  **Staff Onboarding**: Register Employees and assign them to Departments/Managers.
3.  **Strategy Deployment**: Set Yearly/Quarterly OKRs for the company.
4.  **Operational Monitoring**: Access Management Reports to see the weighted score of every department.

### 🏃 Employee Journey
1.  **Mission Start**: Log in to the "Command Center" (Dashboard) to see tasks prioritized by urgency.
2.  **Execution**: Complete tasks and provide "Proof of Work" (links or descriptions).
3.  **Support**: Open IT/HR tickets for any blockers.
4.  **Progress**: Review personal Scores and OKR progress to prepare for performance reviews.

---

## 4️⃣ System Architecture

### Frontend Architecture (Next.js 15)
*   **Routing**: Next.js App Router for server-side optimization and client-side transitions.
*   **State Management**: 
    *   **Global**: Context API (`AuthContext`) for user session and profile.
    *   **Local**: React Hooks (`useState`, `useMemo`) for high-performance UI filtering.
*   **Theming**: Tailwind CSS with a "Glassmorphic" enterprise aesthetic.
*   **Components**: Atomic structure found in `src/components/features/`.

### Backend Architecture (Serverless)
*   **API Layers**: Rest-style endpoints in `src/app/api/` using Next.js Response/NextResponse objects.
*   **Security Middleware**: Custom `withAuth` and `withAdmin` HOCs to verify Firebase JWT tokens.
*   **Service Pattern**: Business logic isolated in `src/lib/server/` or `src/lib/services/`.

### Database Architecture (Firestore NoSQL)
*   **Real-time Synch**: Uses Firestore snapshots for live dashboard updates.
*   **Denormalization Strategy**: Stores redundant data (like `userName` or `taskTitle`) within child documents to minimize expensive multi-document joins during list rendering.
*   **Source of Truth**: Firestore is the primary ledger for all task, ticket, and performance mutations.

---

## 5️⃣ Domain Model (Core Entities)

| Entity | Primary Fields | Lifecycle |
| :--- | :--- | :--- |
| **User** | `fullName`, `employeeId`, `department`, `reportingTo` | `Active` ➔ `Inactive` |
| **Task** | `title`, `priority`, `status`, `dueDate`, `assignedBy` | `Assigned` ➔ `Revision` ➔ `Completed` |
| **Ticket** | `ticketNumber`, `requestType`, `status`, `solutions[]` | `Open` ➔ `Resolved` ➔ `Closed` |
| **Objective**| `title`, `timeframe`, `progress`, `keyResultIds` | `Draft` ➔ `Active` ➔ `Completed` |
| **KPI** | `kraId`, `benchmark`, `plannedValue`, `actualValue` | `Weekly Pulse` |
| **Score** | `userId`, `taskId`, `scoreValue`, `calculatedAt` | `Immutable Log` |

---

## 6️⃣ Business Rules

### The Scoring Algorithm
1.  **Baseline**: Task completion awards 100 points.
2.  **Priority Multiplier**: 
    *   Critical: 4x 
    *   High: 2x 
    *   Medium/Low: 1x
3.  **The Penalty Box**:
    *   **Overdue**: Score degrades linearly for Every day past deadline.
    *   **Revision**: Every `revision_requested` event deducts 15% from the final quality score.

### Task Escalation Logic
*   Any task with `status !== 'completed'` and `now > dueDate` is automatically flagged as `overdue` in the system wide reports.
*   Management receives notifications for "Critical Overdue" items.

---

## 7️⃣ Configuration & Setup

### Requirements
*   Node.js 20+
*   Firebase Project (Auth, Firestore, Storage)

### Environment Variables (.env.local)
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
```

### Local Development
1.  Install: `npm install`
2.  Start: `npm run dev`
3.  Type Check: `npx tsc --noEmit`

---

## 8️⃣ Production Notes

*   **Deployment**: Optimized for Vercel. Static assets are pushed to Firebase Cloud Storage.
*   **Indexing**: Critical Firestore indexes are required for `tasks` collection queries (defined in `firestore.indexes.json`).
*   **Error Handling**: standardized `errorHandler` utility in `src/lib/utils.ts` for consistent API responses.
*   **Security**: `firestore.rules` enforces that employees can ONLY read their own tasks and public articles.

---

## 9️⃣ Known Gaps & Roadmap

### Phase 1 (Complete)
*   [x] Core Task/Ticket/OKR engine.
*   [x] Basic scoring and employee database.
*   [x] High-visibility dashboard.

### Phase 2 (Current)
*   [ ] **AI Insights**: Automated summaries of why tasks are being delayed.
*   [ ] **Detailed Audit Logs**: Tracking Every field-level change per task.

### Phase 3 (Future)
*   [ ] **External Client Access**: Allowing external stakeholders to view ticket progress.
*   [ ] **Payroll Integration**: Linking performance scores directly to bonus calculations.

---

*© 2026 JewelMatrix. All rights reserved.*
