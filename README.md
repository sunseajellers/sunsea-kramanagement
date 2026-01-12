# JewelMatrix - KRA & Task Management Platform

> **A comprehensive Key Result Area (KRA) Management and Task Delegation Platform for modern teams**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6-orange)](https://firebase.google.com/)

---

## 🎯 Overview

JewelMatrix is a full-stack performance management platform designed for teams and organizations. It enables goal setting through KRAs, task delegation with priority tracking, automated performance scoring, and comprehensive analytics dashboards.

---

## ✨ Features

### Core Functionality
- **KRA Management** — Create, assign, and track Key Result Areas with daily, weekly, or monthly cadences
- **Task Delegation** — Assign tasks with priority levels (low, medium, high, critical), due dates, and KRA linkage
- **Performance Scoring** — Automated weekly reports with configurable multi-factor scoring algorithms
- **Team Collaboration** — Team-based assignments with shared progress visibility
- **Revision Workflow** — Request and resolve task revisions with full audit history

### Admin Panel
- **User Management** — Create, activate/deactivate users, toggle admin privileges
- **Team Management** — Organize users into teams with managers
- **Analytics Dashboard** — Real-time charts and KPIs for task status, priorities, and performance
- **Reports Generation** — Weekly MIS reports with detailed score breakdowns
- **System Health** — Monitor database, authentication, and storage health
- **Notification System** — Configurable notification rules and templates
- **KRA Scheduler** — Automate recurring KRA assignments

---

## 🏗️ Tech Stack

| Category              | Technology           | Purpose                               |
| --------------------- | -------------------- | ------------------------------------- |
| **Framework**         | Next.js 16           | React framework with App Router       |
| **UI Library**        | React 19             | UI components with concurrent features|
| **Language**          | TypeScript 5.4       | Type-safe JavaScript                  |
| **Styling**           | Tailwind CSS 3.4     | Utility-first CSS                     |
| **Components**        | shadcn/ui + Radix    | Accessible UI primitives              |
| **Database**          | Firebase Firestore   | NoSQL document database               |
| **Authentication**    | Firebase Auth        | User authentication & sessions        |
| **Storage**           | Firebase Storage     | File attachments & assets             |
| **Server SDK**        | Firebase Admin       | Server-side operations                |
| **Visualization**     | Recharts             | Charts & analytics dashboards         |
| **Validation**        | Zod                  | Schema validation                     |
| **Date Handling**     | date-fns             | Date manipulation & formatting        |

---

## 🔐 Security Model

JewelMatrix uses a simplified authorization model based on an `isAdmin` flag.

| Role | Access Level |
|------|--------------|
| **Admin** (`isAdmin: true`) | Full access to admin panel (`/admin/*`), all API routes, user management |
| **User** (`isAdmin: false`) | Access to assigned tasks, own KRAs, and personal reports |

### Server-side Protection
Admin-only API routes use the `withAdmin` middleware (`src/lib/authMiddleware.ts`), which verifies the user's admin status in Firestore using the Firebase Admin SDK.

### Client-side Protection  
The `AdminLayout` component (`src/components/AdminLayout.tsx`) wraps all admin routes and redirects non-admin users.

### Firestore Rules
Security rules (`firestore.rules`) enforce:
- Users can only read their own document (admins can read all)
- Only admins can create/update/delete tasks, KRAs, teams, and templates
- Users cannot modify their own `isAdmin`, `roleIds`, or `isActive` fields

---

## 📂 Project Structure

```
.
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── admin/            # Admin-only endpoints
│   │   │   ├── analytics/        # Analytics & metrics
│   │   │   ├── dashboard/        # Dashboard data
│   │   │   ├── kras/             # KRA CRUD operations
│   │   │   ├── reports/          # Report generation
│   │   │   ├── scoring/          # Performance scoring
│   │   │   ├── tasks/            # Task CRUD operations
│   │   │   ├── team/             # Team management
│   │   │   └── users/            # User management
│   │   ├── admin/                # Admin Dashboard Pages
│   │   │   ├── analytics/        # Analytics visualizations
│   │   │   ├── employee-updates/ # Task update tracking
│   │   │   ├── kra-scheduler/    # KRA automation
│   │   │   ├── notifications/    # Notification management
│   │   │   ├── performance/      # Performance parameters
│   │   │   ├── reports/          # Report viewer
│   │   │   ├── scoring/          # Scoring configuration
│   │   │   ├── system/           # System health
│   │   │   ├── team-hub/         # Team collaboration
│   │   │   ├── teams/            # Team management
│   │   │   └── users/            # User management
│   │   ├── signup/               # User registration
│   │   └── page.tsx              # Login page
│   ├── components/
│   │   ├── AdminLayout.tsx       # Admin wrapper with navigation
│   │   ├── common/               # Shared components
│   │   │   ├── EmptyState.tsx    # Empty data placeholders
│   │   │   ├── ErrorBoundary.tsx # Error handling
│   │   │   ├── Modal.tsx         # Modal dialogs
│   │   │   ├── ProtectedRoute.tsx# Route protection
│   │   │   └── Skeletons.tsx     # Loading states
│   │   ├── features/             # Feature-specific components
│   │   │   ├── analytics/        # Charts & dashboards
│   │   │   ├── kras/             # KRA components
│   │   │   ├── tasks/            # Task components
│   │   │   └── users/            # User components
│   │   ├── layout/               # Layout components
│   │   └── ui/                   # shadcn/ui primitives (22 components)
│   ├── contexts/
│   │   └── AuthContext.tsx       # Authentication state management
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Service layer & utilities
│   │   ├── server/               # Server-only (Firebase Admin)
│   │   ├── adminService.ts       # Admin operations
│   │   ├── analyticsService.ts   # Analytics & metrics
│   │   ├── authMiddleware.ts     # API route protection
│   │   ├── authService.ts        # Authentication
│   │   ├── firebase.ts           # Firebase client config
│   │   ├── firebase-admin.ts     # Firebase Admin config
│   │   ├── kraService.ts         # KRA operations
│   │   ├── notificationService.ts# Notifications
│   │   ├── performanceService.ts # Performance tracking
│   │   ├── reportService.ts      # Report generation
│   │   ├── scoringService.ts     # Performance scoring
│   │   ├── taskService.ts        # Task operations
│   │   ├── teamService.ts        # Team operations
│   │   ├── userService.ts        # User operations
│   │   └── validation.ts         # Input validation
│   └── types/
│       └── index.ts              # TypeScript type definitions
├── public/                       # Static assets
├── firestore.rules               # Firestore security rules
├── firebase.json                 # Firebase configuration
├── tailwind.config.js            # Tailwind configuration
└── package.json
```

---

## 📊 Data Models

### Core Entities

| Entity | Description |
|--------|-------------|
| **User** | Team members with roles, teams, and admin status |
| **Team** | Groups of users with a manager |
| **Task** | Assignable work items with priority, status, and due dates |
| **KRA** | Key Result Areas with targets and timeframes |
| **KPI** | Key Performance Indicators linked to KRAs |
| **WeeklyReport** | Automated performance summaries |

### Task Statuses
`not_started` → `assigned` → `in_progress` → `pending_review` → `completed`

Additional states: `blocked`, `on_hold`, `cancelled`, `revision_requested`

### Priority Levels
`low` | `medium` | `high` | `critical`

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Firebase project with Firestore, Authentication, and Storage enabled

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sunseajwellers
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK (for server-side operations)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

### 4. Deploy Firestore Rules

```bash
npx firebase deploy --only firestore:rules
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👤 Creating an Admin User

1. Create a user through the login/signup flow
2. Go to Firebase Console → Firestore Database
3. Find the user's document in the `users` collection
4. Set the `isAdmin` field to `true`

Alternatively, an existing admin can toggle admin status in the User Management panel.

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm test` | Run tests with Jest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

---

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `firebase.json` | Firebase project configuration |
| `firestore.rules` | Firestore security rules |
| `firestore.indexes.json` | Firestore composite indexes |
| `tailwind.config.js` | Tailwind CSS configuration |
| `components.json` | shadcn/ui configuration |
| `tsconfig.json` | TypeScript configuration |

---

## 📦 Key Dependencies

### Production
- **next** (16.0.10) — React framework
- **react** (19.2.3) — UI library
- **firebase** (12.6.0) — Client SDK
- **firebase-admin** (13.6.0) — Server SDK
- **@radix-ui/*** — Accessible UI primitives
- **recharts** (3.4.1) — Data visualization
- **zod** (4.1.13) — Schema validation
- **date-fns** (4.1.0) — Date utilities
- **lucide-react** (0.561.0) — Icons

### Development
- **typescript** (5.4.0) — Type checking
- **jest** (30.2.0) — Testing framework
- **@testing-library/react** — React testing utilities
- **eslint-config-next** — Linting rules

---

## 🏛️ Architecture Decisions

1. **App Router** — Uses Next.js 16 App Router for file-based routing and server components
2. **Service Layer** — Business logic isolated in `lib/` services for reusability
3. **Client Components** — Interactive UI uses `'use client'` directive
4. **Firebase Admin** — Server-side operations use Admin SDK for security
5. **shadcn/ui** — Copy-paste components for full customization
6. **Firestore Rules** — Security enforced at database level, not just client

---

## 📄 License

Private — All rights reserved.
