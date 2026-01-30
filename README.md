# 💎 JewelMatrix: Enterprise Digital Operating System

**Version 2.1.0 | Status: Production Ready | Last Updated: January 2026**

JewelMatrix is a high-performance, enterprise-grade **Digital Operating System (DOS)** designed to synchronize organizational strategy with daily tactical execution. It acts as a central nervous system for modern organizations, unifying **OKRs (Strategy)**, **Tasks (Execution)**, **Support (Operations)**, and **Performance (Measurement)** into a single, cohesive, and premium-designed platform.

---

## 🏗️ 1. System Architecture & Technology Stack

JewelMatrix is built as a robust, serverless application utilizing the latest industry standards for speed, security, and developer productivity.

### 🎨 Frontend Layer
*   **Framework**: **Next.js 15 (App Router)** utilizing React Server Components (RSC) for optimal performance.
*   **UI System**: **Radix UI** primitives powered by **Shadcn/UI**, ensuring accessible, standardized, and premium-feel components.
*   **Styling**: **Tailwind CSS** implementing a "Deep Jewel" enterprise design language with glassmorphism and smooth transitions.
*   **Icons**: **Lucide React** for consistent, high-quality iconography.
*   **Visualization**: **Recharts** for real-time analytics, trend detection, and performance tracking.

### ☁️ Backend & Infrastructure
*   **Cloud Provider**: **Firebase (Serverless Architecture)**.
*   **Database**: **Firestore (NoSQL)** optimized for low-latency read operations and real-time synchronization.
*   **Authentication**: **Firebase Auth** with role-based custom claims.
*   **Server-Side Logic**: **Next.js API Routes** executing via the **Firebase Admin SDK** to ensure secure, rule-bypassing administrative operations.
*   **Storage**: **Firebase Cloud Storage** for task attachments, user profiles, and SOP documents.

### 🧠 Intelligence Layer
*   **Background Services**: Located in `src/lib/server`, these handle heavy lifting like:
    *   **Chronic Overdue Detection**: Pattern analysis to identify habitual delayers.
    *   **Risk Prediction**: AI-driven task risk assessment based on velocity.
    *   **Score Recalculation**: Automated weekly performance score aggregation.

---

## 🛡️ 2. Security & Governance

JewelMatrix implements a **Zero-Trust Security Model** at the data layer while allowing flexibility for administrative oversight.

### Access Control (RBAC)
*   **Administrator**: Full system lifecycle management, user provisioning, and organizational health visibility.
*   **Manager**: Departmental oversight, task delegation, performance review rights, and objective planning.
*   **Employee**: Personal workspace focus, task execution, ticket raising, and personal OKR tracking.

### Security Implementation
*   **Firestore Rules**: Rigorous `firestore.rules` preventing unauthorized cross-tenant or cross-user data access.
*   **Server-Side Execution**: Sensitive operations (password resets, performance edits, user creation) are strictly handled by server-side services (`adminAuth`, `adminDb`) to prevent client-side tampering.
*   **Audit Logging**: Every administrative action is captured in `admin_logs` with a permanent timestamp and user trace.

---

## 🗺️ 3. Domain Model

The system operates on an interconnected graph of entities that link strategy to execution.

### ✅ Execution Layer
*   **Tasks**: Atomic work units with 10-state life cycles (`assigned` ➔ `in_progress` ➔ `pending_verification` ➔ `completed`).
*   **Checklists**: Granular sub-tasks with independent completion tracking.
*   **Revisions**: Quality control mechanism allowing managers to reject work with mandatory feedback.

### 🎯 Strategy Layer (OKRs)
*   **Objectives**: High-level qualitative goals (e.g., "Scale Infrastructure to 1M Users").
*   **Key Results (KRs)**: Quantifiable metrics linked to objectives (e.g., "Achieve 99.99% Uptime").
*   **KRAs (Key Result Areas)**: Job-specific domains of responsibility assigned to employees.
*   **KPIs**: Recurring weekly metrics tracking performance against KRA targets.

### 🏢 Organizational Layer
*   **Departments**: Structural units for budget and high-level reporting.
*   **Teams**: Agile groups where daily tactical coordination happens.
*   **User Profiles**: Rich data including employee IDs, reporting hierarchies, and performance history.

---

## 📈 4. The Performance Scoring Engine

The heart of JewelMatrix is its objective, real-time performance algorithm (`enhancedScoringService.ts`).

1.  **Weighted Intensity**: Tasks carry points based on Priority (Critical = 4x weight).
2.  **Timeliness Decay**: Scores diminish linearly for every hour a task remains overdue.
3.  **Quality Factor**: Revisions by managers apply a fixed percentage penalty to the task's final score.
4.  **Consistency Bonus**: Employees maintaining 90%+ velocity over multiple weeks receive cumulative health bonuses.

---

## 🚀 5. Feature Inventory

### 🖥️ Mission Control (Dashboard)
*   **Personalization**: Context-aware greeting and task priority lists.
*   **Quick Actions**: Standardized forms for "Assign New Task", "Add New Person", and "Create Objective".
*   **Status Cards**: Real-time counters for pending work, overdue tasks, and tickets.

### 🎟️ Ticket System (Operational Desk)
*   Internal service desk for HR, IT, and Administrative requests.
*   Private comment threads and status tracking.
*   One-click "Resolve to Article" for Knowledge Base expansion.

### 📚 Learning Hub & SOPs
*   Standard Operating Procedures (SOPs) repository.
*   Collaborative Wiki-style articles with categorization.
*   "Helpful" feedback loop to curate high-impact internal documentation.

### 👥 People Management
*   Full user CRUD with reporting lines configuration.
*   Team composition management.
*   Departmental health monitoring for admins.

---

## 🧑‍💻 6. Developer Guide

### Environment Setup
1.  **Node.js**: Use version 20.x or higher.
2.  **Environment Variables**: Populate `.env.local` using `.env.example`.
    *   `NEXT_PUBLIC_FIREBASE_*`: For client-side SDK.
    *   `FIREBASE_PRIVATE_KEY` & `FIREBASE_CLIENT_EMAIL`: For Admin SDK.
3.  **Setup Command**:
    ```bash
    npm install
    npm run dev
    ```

### Standards & Quality
*   **TypeScript**: Strict mode enabled. No unused variables/imports.
*   **Component Architecture**: Use components from `src/components/ui` for all forms and interactive elements to maintain consistency.
*   **API Pattern**: All new API routes should use `withAuth` or `withAdmin` middleware from `@/lib/authMiddleware`.

### Deployment
*   **Hosting**: Designed for Vercel or similar edge environments.
*   **Firestore Rules Deployment**:
    ```bash
    firebase deploy --only firestore:rules
    ```

---

*© 2026 JewelMatrix. Standardizing Organizational Excellence.*
