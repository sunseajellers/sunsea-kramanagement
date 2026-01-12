# JewelMatrix - KRA Management System

> **A comprehensive Task Delegation & KRA Management Platform for Modern Teams**

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12-orange)](https://firebase.google.com/)

---

## 🎯 Overview

JewelMatrix is a modern, full-stack KRA (Key Result Area) management and task delegation platform. It helps organizations set clear objectives, delegate tasks, monitor progress, and generate automated performance reports.

---

## ✨ Features

-   **KRA Management**: Create and assign goals with different cadences (daily, weekly, monthly).
-   **Task Delegation**: Assign tasks with priority levels, due dates, and link them to KRAs.
-   **Performance Scoring**: Automated weekly reports with a configurable, multi-factor scoring algorithm.
-   **Team Collaboration**: Team-based assignments with shared progress visibility.
-   **Revision Workflow**: Request and resolve task revisions with a full audit history.
-   **Admin Panel**: Comprehensive admin dashboard for user, team, and system management.

---

## 🏗️ Tech Stack

| Category              | Technology          | Purpose                               |
| --------------------- | ------------------- | ------------------------------------- |
| **Framework**         | Next.js 16          | React framework with App Router       |
| **UI Library**        | React 19            | UI components                         |
| **Language**          | TypeScript 5        | Type-safe JavaScript                  |
| **Styling**           | Tailwind CSS 3.4    | Utility-first CSS                     |
| **Database**          | Firebase Firestore  | NoSQL document database               |
| **Authentication**    | Firebase Auth       | User authentication                   |
| **Storage**           | Firebase Storage    | File attachments & assets             |
| **Data Visualization**| Recharts            | Charts & analytics                    |

---

## 🔐 Security Model

JewelMatrix uses a simplified authorization model based on a single `isAdmin` flag.

-   **Admin (`isAdmin: true`)**: Full access to the admin panel (`/dashboard/admin/*`) and all API routes protected by the `withAdmin` middleware.
-   **User (`isAdmin: false` or undefined)**: Access to the main user dashboard (`/dashboard`), their own tasks, KRAs, and reports.

**Server-side Protection:**
Admin-only API routes use the `withAdmin` middleware from `src/lib/authMiddleware.ts`, which verifies the user's `isAdmin` status in Firestore using the Firebase Admin SDK.

**Client-side Protection:**
Admin routes are protected by the `AdminLayout` component (`src/app/dashboard/admin/layout.tsx`), which redirects non-admin users to the main dashboard.

---

## 📂 Project Structure

```
.
├── src/
│   ├── app/                    # Next.js App Router pages & API routes
│   │   ├── api/                # Serverless API endpoints
│   │   │   ├── analytics/
│   │   │   ├── dashboard/
│   │   │   ├── kras/
│   │   │   ├── reports/
│   │   │   ├── scoring/
│   │   │   ├── tasks/
│   │   │   ├── team/
│   │   │   └── users/
│   │   ├── dashboard/          # Protected dashboard pages
│   │   │   ├── admin/          # Admin-only pages (users, teams, system, etc.)
│   │   │   ├── kras/
│   │   │   ├── reports/
│   │   │   └── tasks/
│   │   └── page.tsx            # Login page
│   ├── components/
│   │   ├── common/             # Shared components (ProtectedRoute, etc.)
│   │   ├── features/           # Feature-specific components (tasks, kras, users)
│   │   ├── layout/             # Layout components (Header, Sidebar)
│   │   └── ui/                 # shadcn/ui primitives
│   ├── contexts/
│   │   └── AuthContext.tsx     # Authentication state management
│   └── lib/                    # Service layer & utilities
│       ├── server/             # Server-side services (Firebase Admin SDK)
│       ├── authMiddleware.ts   # API route protection
│       ├── taskService.ts
│       ├── kraService.ts
│       ├── scoringService.ts
│       └── ...                 # Other services
├── firestore.rules             # Firestore Security Rules
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

-   Node.js 18+ and npm
-   A Firebase project (Firestore, Authentication, and Storage enabled)

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

Create a `.env.local` file in the root directory with your Firebase configuration:

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

After creating a user through Firebase Authentication, you need to manually set them as an admin in Firestore.

1.  Go to the Firebase Console -> Firestore Database.
2.  Find the user's document in the `users` collection.
3.  Add or set the `isAdmin` field to `true`.

Alternatively, an existing admin can use the "Toggle Admin" feature in the User Management panel.

---

## 📜 Available Scripts

| Script            | Description                   |
| ----------------- | ----------------------------- |
| `npm run dev`     | Start development server      |
| `npm run build`   | Create production build       |
| `npm start`       | Start production server       |
| `npm run lint`    | Run ESLint                    |
| `npm run typecheck` | Run TypeScript checks       |
| `npm test`        | Run tests with Jest           |
