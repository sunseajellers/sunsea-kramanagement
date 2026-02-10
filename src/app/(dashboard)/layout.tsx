// src/app/(dashboard)/layout.tsx
'use client';

import UnifiedHeader from '@/components/layout/UnifiedHeader';
import { ReactNode } from 'react';

export default function DashboardRoutesLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50/50">
            <UnifiedHeader mode="dashboard" />
            <main className="pt-24 pb-12">
                {children}
            </main>
        </div>
    );
}
