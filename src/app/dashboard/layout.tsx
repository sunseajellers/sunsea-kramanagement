// src/app/dashboard/layout.tsx
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import UnifiedHeader from '@/components/layout/UnifiedHeader';

export default function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    const { user, loading, hasPermission } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/');
            } else if (!hasPermission('dashboard', 'view')) {
                router.push('/admin'); // Redirect to admin if dashboard view is not permitted
            }
        }
    }, [user, loading, router, hasPermission]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-50/50">
            <UnifiedHeader mode="dashboard" />
            <main className="pt-24">
                {children}
            </main>
        </div>
    );
}
