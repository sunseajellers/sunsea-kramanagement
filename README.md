# JewelMatrix - Enterprise KRA & Task Management Platform

> **A scalable, data-driven replication of the MBA 2.0 Task Management & MIS System.**

[![Next.js](https://img.shields.io/badge/Next.js-16.0.10-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6-orange)](https://firebase.google.com/)

---

## 🏗️ System Architecture

JewelsMatrix operates on a **Hub-and-Spoke** logic, mirroring the original Google Sheets ecosystem but enhanced with modern web reliability.

### 1. The Operational Core (Inputs)
Replaces the "MBA 2.0 Sheet".
-   **KRA Engine**: Automatically spawns recurring tasks (Daily/Weekly) based on active KRA definitions.
-   **Task Delegation**: One-time task assignment with strict priority and due dates.
-   **Daily Update Form**: A centralized "Spoke" for employees to log progress (Done/Pending/Remarks) against their assigned work.

### 2. The Intelligence Hub (Outputs)
Replaces the "MIS CONSOLIDATED Sheet".
-   **Scoring Service**: Real-time aggregation of performance data.
-   **MIS Scorecard**: A live leaderboard calculating:
    -   **Speed**: % On-Time
    -   **Quality**: % Revisions
    -   **Dedication**: % Work Not Done (Negative KPI)
    -   **Delay**: % Late Completion (Negative KPI)

---

## 📚 Documentation & Deliverables

As per the Architect's Review, the following key documents define the system:

*   **[System Overview](./.gemini/antigravity/brain/d1254fd8-73e2-4b29-8e34-f35a02796e4f/system_overview.md)**: Deep dive into the "Why" and "How" of the system migration.
*   **[Feature Matrix: Admin vs Employee](./.gemini/antigravity/brain/d1254fd8-73e2-4b29-8e34-f35a02796e4f/feature_matrix.md)**: Breakdown of permissions and role-based capabilities.
*   **[System Comparison](./.gemini/antigravity/brain/d1254fd8-73e2-4b29-8e34-f35a02796e4f/system_comparison.md)**: Explicit mapping of Spreadsheet Tabs vs. Application Modules.
*   **[Walkthrough](./.gemini/antigravity/brain/d1254fd8-73e2-4b29-8e34-f35a02796e4f/walkthrough.md)**: Visual guide to the new UI and implemented features.

---

## 🚀 Transition Status (Phase 4 Complete)

We have successfully replicated the core "Input -> Process -> Output" loop of the spreadsheets and achieved functional parity.

| Spreadsheet Component | Application Equivalent | Status |
| :--- | :--- | :--- |
| **MBA 2.0 / Tasks** | `Task` Collection & Dashboard | ✅ Live |
| **MBA 2.0 / KRAs** | `KRA` Collection & Auto-Generator | ✅ Live |
| **Employee Update Tabs** | `TaskUpdateForm` Component | ✅ Live |
| **Gemtre MIS / Score** | `MISScorecard` & `ScoringService` | ✅ Live |
| **KRA Frequency** | Fortnightly Cadence Logic | ✅ Live (Phase 4) |
| **Task References** | Atomic numbering (`T-0001`) | ✅ Live (Phase 4) |

---

## 🛠️ Tech Stack & Key Decisions

*   **Frontend**: Next.js 16 (App Router) + Tailwind CSS + shadcn/ui (Glassmorphism Design).
*   **Backend**: Firebase Admin SDK (Server Actions) for secure, privileged logic.
*   **Database**: Firestore (NoSQL) for flexible schema adaptation.
*   **Security**: RBAC (Admin/Employee) enforced via Middleware and Rules.

---

## 📦 quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local

# 3. Run development server
npm run dev
```

**Admin Access**:
-   **Login**: `dotdefence.info@gmail.com`
-   **Pass**: `12345678`

---

## 🔮 Future Roadmap (Phase 5: Scale)

1.  **Mobile App**: PWA or Native wrapper for field staff.
2.  **Whatsapp Integration**: Status updates via chat bot.
3.  **Advanced Analytics**: Trend analysis and predictive scoring.
