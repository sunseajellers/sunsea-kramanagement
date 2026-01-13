# JewelMatrix - KRA & Task Management Platform

> **A comprehensive Key Result Area (KRA) Management and Task Delegation Platform for modern teams**

[![Next.js](https://img.shields.io/badge/Next.js-16.0.10-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6-orange)](https://firebase.google.com/)

---

## 🎯 Overview

JewelMatrix is a full-stack performance management platform designed for teams and organizations. It enables goal setting through KRAs, task delegation with priority tracking, automated performance scoring, and comprehensive analytics dashboards.

---

## 🚀 Production Readiness Status

| Category | Status | Progress |
|----------|--------|----------|
| **Admin UI/UX** | ✅ Complete | 100% |
| **User Authentication** | ✅ Complete | 100% |
| **Team Management** | ✅ Complete | 100% |
| **User Management** | ✅ Complete | 100% |
| **Analytics Dashboard** | ✅ Complete | 100% |
| **System Health Monitoring** | ✅ Complete | 100% |
| **Scoring Configuration** | ✅ Complete | 100% |
| **Reports Generation** | ✅ Complete | 100% |
| **Task Management Core** | ✅ Complete | 100% |
| **KRA Management** | ⚠️ Partial | 80% |
| **Employee Dashboard** | 🔄 In Progress | 60% |
| **Mobile Responsiveness** | ⚠️ Partial | 70% |

**Overall Production Readiness: ~85%**

---

## 🎨 UI Design System (v2.0)

The admin interface implements a **scroll-free, viewport-constrained design system** with 665 lines of custom CSS:

### Design Principles
- **100vh Layout**: Every page fits within the viewport height without vertical scrolling
- **Header Height**: 72px (responsive: 64px on smaller screens, 76px on 1920×1080)
- **Overflow Control**: Main content uses `overflow: hidden` with internal `.scroll-panel` for controlled scrolling
- **Pagination**: Tables use 6-8 items per page instead of scrolling
- **Tabs**: Complex content organized with tabbed navigation (Analytics)

### CSS Architecture
```css
.admin-root     { height: 100vh; display: flex; flex-direction: column; }
.admin-header   { height: var(--header-height); flex-shrink: 0; }
.admin-content  { flex: 1; overflow: hidden; }
.page-container { height: 100%; padding: 20px 24px; display: flex; flex-direction: column; }
.page-grid      { flex: 1; display: grid; overflow: hidden; min-height: 0; }
```

### Component Library
| Component | Description |
|-----------|-------------|
| `.glass-card` | Glassmorphism card with backdrop blur and soft shadows |
| `.stat-card` | Compact metric display with icon boxes |
| `.module-card` | Hover-effect cards with gradient accent line |
| `.data-table` | Compact table with sticky headers |
| `.badge-*` | Status badges (success, warning, danger, info, neutral) |
| `.empty-state` | Visually engaging empty data placeholders |
| `.tabs-container` | Modern tabbed navigation |

### Responsive Breakpoints
| Resolution | Header | Padding | Gap |
|------------|--------|---------|-----|
| 1366×768 | 64px | 16px 20px | 16px |
| 1440×900 | 72px | 24px 28px | 20px |
| 1920×1080 | 76px | 28px 32px | 24px |

---

## ✨ Features

### Core Functionality
- **KRA Management** — Create, assign, and track Key Result Areas with daily, weekly, or monthly cadences
- **Task Delegation** — Assign tasks with priority levels (low, medium, high, critical), due dates, and KRA linkage
- **Performance Scoring** — Automated weekly reports with configurable multi-factor scoring algorithms
- **Team Collaboration** — Team-based assignments with shared progress visibility
- **Revision Workflow** — Request and resolve task revisions with full audit history

### Admin Panel (10 Modules)

| Module | Route | Features |
|--------|-------|----------|
| **Dashboard** | `/admin` | System overview, stats cards, quick access modules, live insights charts |
| **Users** | `/admin/users` | Paginated user list, search/filter, create user, toggle admin/active status |
| **Teams** | `/admin/teams` | Card-based team grid, bulk actions, CRUD with manager assignment |
| **Team Hub** | `/admin/team-hub` | Employee task overview, open/overdue/completed metrics, quick actions |
| **Analytics** | `/admin/analytics` | Tabbed interface (Overview/Teams/Reports), responsive charts, KPI metrics |
| **Reports** | `/admin/reports` | Weekly report generator, team selector, PDF/JSON export |
| **Scoring** | `/admin/scoring` | Visual weight sliders, real-time validation, weight distribution bar |
| **System** | `/admin/system` | Service health cards, resource inventory, maintenance mode, backup controls |
| **Performance** | `/admin/performance` | Performance parameter configuration |
| **KRA Scheduler** | `/admin/kra-scheduler` | KRA automation and scheduling |

---

## 🏗️ Tech Stack

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 16.0.10 | React framework with App Router |
| **UI Library** | React | 19.2.3 | UI components with concurrent features |
| **Language** | TypeScript | 5.4.0 | Type-safe JavaScript |
| **Styling** | Tailwind CSS | 3.4.0 | Utility-first CSS |
| **Components** | shadcn/ui + Radix | — | Accessible UI primitives |
| **Forms** | React Hook Form | 7.71.0 | Form validation and handling |
| **Database** | Firebase Firestore | 12.6.0 | NoSQL document database |
| **Authentication** | Firebase Auth | 12.6.0 | User authentication & sessions |
| **Auth Framework** | NextAuth.js | 5.0.0-beta | OAuth & credentials provider |
| **Storage** | Firebase Storage | 12.6.0 | File attachments & assets |
| **Server SDK** | Firebase Admin | 13.6.0 | Server-side operations |
| **Visualization** | Recharts | 3.6.0 | Charts & analytics dashboards |
| **Validation** | Zod | 4.3.5 | Schema validation |
| **Date Handling** | date-fns | 4.1.0 | Date manipulation & formatting |
| **Sanitization** | DOMPurify | 3.3.0 | XSS protection |
| **Icons** | Lucide React | 0.561.0 | Icon components |
| **Notifications** | Sonner | 2.0.7 | Toast notifications |

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

### Firestore Security Rules (20+ Collections)

| Collection | Read | Write |
|------------|------|-------|
| `users` | Owner or Admin | Owner (limited) or Admin |
| `tasks` | Authenticated | Admin only |
| `kras` | Authenticated | Admin only |
| `teams` | Authenticated | Admin only |
| `taskTemplates` | Authenticated | Admin only |
| `kraTemplates` | Authenticated | Admin only |
| `performanceParameters` | Authenticated | Admin only |
| `weeklyReports` | Authenticated | Authenticated |
| `taskUpdates` | Authenticated | Create: Auth, Edit: Admin |
| `kpis` | Authenticated | Authenticated |
| `scoringConfig` | Authenticated | Admin only |
| `notifications` | Authenticated | Authenticated |
| `reminders` | Authenticated | Authenticated |
| `admin_logs` | Admin only | Authenticated (create) |
| `config` | Authenticated | Admin only |

---

## 📂 Project Structure

```
.
├── src/
│   ├── app/                          # Next.js App Router (29 files)
│   │   ├── api/                      # API Routes (9 modules)
│   │   │   ├── analytics/            # Analytics & metrics (3 endpoints)
│   │   │   ├── cron/                 # Scheduled tasks
│   │   │   ├── dashboard/            # Dashboard data
│   │   │   ├── kras/                 # KRA CRUD operations
│   │   │   ├── reports/              # Report generation
│   │   │   ├── scoring/              # Performance scoring (2 endpoints)
│   │   │   ├── tasks/                # Task CRUD operations
│   │   │   ├── team/                 # Team management
│   │   │   └── users/                # User management
│   │   ├── admin/                    # Admin Dashboard Pages (10 pages)
│   │   │   ├── analytics/            # Analytics visualizations
│   │   │   ├── employee-updates/     # Task update tracking
│   │   │   ├── kra-scheduler/        # KRA automation
│   │   │   ├── performance/          # Performance parameters
│   │   │   ├── reports/              # Report viewer
│   │   │   ├── scoring/              # Scoring configuration
│   │   │   ├── system/               # System health
│   │   │   ├── team-hub/             # Team collaboration
│   │   │   ├── teams/                # Team management
│   │   │   └── users/                # User management
│   │   ├── actions/                  # Server actions
│   │   ├── signup/                   # User registration
│   │   ├── globals.css               # Design system (665 lines)
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Login page
│   ├── components/                   # React Components (57 files)
│   │   ├── AdminLayout.tsx           # Admin wrapper with navigation
│   │   ├── common/                   # Shared components (6 files)
│   │   ├── features/                 # Feature-specific components
│   │   │   ├── analytics/            # 5 components
│   │   │   ├── kras/                 # 5 components
│   │   │   ├── tasks/                # 13 components
│   │   │   └── users/                # 2 components
│   │   ├── layout/                   # Layout components (2 files)
│   │   └── ui/                       # shadcn/ui primitives (22 components)
│   ├── contexts/
│   │   └── AuthContext.tsx           # Authentication state management
│   ├── hooks/                        # Custom React hooks (1 file)
│   ├── lib/                          # Service layer (27 files + server/)
│   │   ├── server/                   # Server-only services (3 files)
│   │   ├── adminService.ts           # Admin operations
│   │   ├── analyticsService.ts       # Analytics & metrics (552 lines)
│   │   ├── apiClient.ts              # API client wrapper
│   │   ├── authMiddleware.ts         # API route protection
│   │   ├── authService.ts            # Auth utilities
│   │   ├── bulkTaskService.ts        # Bulk task operations
│   │   ├── businessRules.ts          # Business logic rules
│   │   ├── exportService.ts          # Data export utilities
│   │   ├── firebase.ts               # Firebase client config
│   │   ├── firebase-admin.ts         # Firebase Admin config
│   │   ├── headerService.ts          # Header configuration
│   │   ├── kpiService.ts             # KPI operations
│   │   ├── kraAutomation.ts          # KRA scheduling automation
│   │   ├── kraService.ts             # KRA operations
│   │   ├── performanceService.ts     # Performance tracking
│   │   ├── reminderService.ts        # Reminder management
│   │   ├── reportService.ts          # Report generation
│   │   ├── revisionService.ts        # Task revision workflow
│   │   ├── sanitize.ts               # Input sanitization
│   │   ├── scoringService.ts         # Performance scoring
│   │   ├── taskService.ts            # Task operations
│   │   ├── taskUpdateService.ts      # Task status updates
│   │   ├── teamService.ts            # Team operations
│   │   ├── templateService.ts        # Template management
│   │   ├── userService.ts            # User operations
│   │   ├── utils.ts                  # Utility functions
│   │   └── validation.ts             # Schema validation
│   └── types/
│       └── index.ts                  # TypeScript types (429 lines)
├── public/                           # Static assets
├── firestore.rules                   # Firestore security rules (195 lines)
├── firestore.indexes.json            # Firestore composite indexes
├── firebase.json                     # Firebase configuration
├── tailwind.config.js                # Tailwind configuration
├── components.json                   # shadcn/ui configuration
└── package.json                      # Dependencies
```

---

## 📊 Data Models

### Core Entities (29 Types)

| Entity | Description |
|--------|-------------|
| **User** | Team members with roles, teams, and admin status |
| **Team** | Groups of users with a manager and hierarchical structure |
| **Task** | Assignable work items with priority, status, due dates, and KRA linkage |
| **TaskUpdate** | Employee status updates (replicates "Tasks Update" sheets) |
| **TaskRevision** | Revision requests with resolution tracking |
| **TaskTemplate** | Reusable task configurations |
| **BulkTaskOperation** | Tracking for bulk task creation operations |
| **KRA** | Key Result Areas with targets and timeframes |
| **KPI** | Key Performance Indicators with weekly tracking |
| **PerformanceParameter** | Scoring criteria with weights |
| **PerformanceScore** | Individual task/KRA scores |
| **MISReport** | Aggregated performance data |
| **WeeklyReport** | Automated performance summaries |
| **ChecklistItem** | Subtask checklist items (subcollection) |
| **Comment** | Task comments (subcollection) |
| **ActivityLog** | Task activity history (subcollection) |

### RBAC Types
| Type | Description |
|------|-------------|
| **Role** | System and custom role definitions |
| **Permission** | Granular permission definitions |
| **UserRoleAssignment** | User-to-role mapping |

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
cd jewelmatrix
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
| `firestore.rules` | Firestore security rules (195 lines) |
| `firestore.indexes.json` | Firestore composite indexes |
| `tailwind.config.js` | Tailwind CSS configuration |
| `components.json` | shadcn/ui configuration |
| `tsconfig.json` | TypeScript configuration |

---

## 📦 Key Dependencies

### Production
| Package | Version | Purpose |
|---------|---------|---------|
| **next** | 16.0.10 | React framework |
| **react** | 19.2.3 | UI library |
| **firebase** | 12.6.0 | Client SDK |
| **firebase-admin** | 13.6.0 | Server SDK |
| **next-auth** | 5.0.0-beta.30 | Authentication framework |
| **react-hook-form** | 7.71.0 | Form handling |
| **@radix-ui/*** | Various | Accessible UI primitives |
| **recharts** | 3.6.0 | Data visualization |
| **zod** | 4.3.5 | Schema validation |
| **date-fns** | 4.1.0 | Date utilities |
| **lucide-react** | 0.561.0 | Icons |
| **sonner** | 2.0.7 | Toast notifications |
| **dompurify** | 3.3.0 | XSS protection |

### Development
| Package | Version | Purpose |
|---------|---------|---------|
| **typescript** | 5.4.0 | Type checking |
| **jest** | 30.2.0 | Testing framework |
| **@testing-library/react** | 16.3.0 | React testing utilities |
| **eslint-config-next** | 16.0.3 | Linting rules |

---

## 🏛️ Architecture Decisions

1. **App Router** — Uses Next.js 16 App Router for file-based routing and server components
2. **Service Layer** — Business logic isolated in `lib/` services (27 files) for reusability
3. **Client Components** — Interactive UI uses `'use client'` directive
4. **Firebase Admin** — Server-side operations use Admin SDK for security
5. **shadcn/ui** — Copy-paste components for full customization
6. **Firestore Rules** — Security enforced at database level, not just client
7. **Scroll-Free UI** — All admin pages constrained to viewport height
8. **Type Safety** — Comprehensive 429-line type definitions

---

## 📋 Remaining Features for Full Production

### High Priority
- [ ] **Employee Dashboard** — User-facing task/KRA view (currently admin-only)
- [ ] **KRA Templates** — Reusable KRA definitions for quick assignment
- [ ] **Bulk Task Import** — CSV/Excel import for tasks

### Medium Priority
- [ ] **Email Notifications** — Automated email reminders for deadlines
- [ ] **Mobile App** — React Native companion app
- [ ] **Advanced Reporting** — PDF export with charts, scheduled email reports
- [ ] **Audit Logs** — Detailed activity logs for compliance

### Nice to Have
- [ ] **Dark Mode** — Theme toggle for admin panel
- [ ] **Localization** — Multi-language support
- [ ] **API Documentation** — Swagger/OpenAPI spec for integrations
- [ ] **Webhook Support** — External integrations

---

## 📄 License

Private — All rights reserved.

---

## 📞 Support

For questions or issues, contact the development team.

**Last Updated**: January 2026
