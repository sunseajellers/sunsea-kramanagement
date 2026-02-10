// src/app/admin/layout.tsx
'use client';

import { PermissionGuard } from '@/components/guards/PermissionGuard';
import UnifiedHeader from '@/components/layout/UnifiedHeader';
import { ReactNode } from 'react';

export default function AdminRootLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <PermissionGuard module="admin" action="view">
            <div className="min-h-screen bg-slate-50/50">
                <UnifiedHeader mode="admin" showAdminControls={true} />
                <main className="pt-24 pb-12 admin-container">
                    {children}
                </main>
            </div>
        </PermissionGuard>
    );
}
