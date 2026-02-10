// src/app/admin/layout.tsx
'use client';

import { PermissionGuard } from '@/components/guards/PermissionGuard';
import { ReactNode } from 'react';

export default function AdminRootLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <PermissionGuard module="admin" action="view">
            {children}
        </PermissionGuard>
    );
}
